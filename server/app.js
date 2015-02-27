var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config').Config;
var Token = require('./models/token').Token;

require('mongoose').connect(config.uristring);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) {
      return done({error: err});
    }
    if (!user) {
      return done(null, false, { message: 'Unknown user ' + username });
    }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
  });
}));


passport.use(new BearerStrategy({}, function(token, done) {
  process.nextTick(function () {
    Token.findOne({token: token}).populate('user').exec(function(err, token) {
      if (err) {
        return done({error: err});
      }
      if (!token || Date.now >= token.expiration) {
        return done(null, false);
      }
      return done(null, token.user);
    });
  });
}));

var User = require('./models/user').User;
User.findOne({username: 'admin'}, function(err, user) {
    if (!user) {
      user = new User({username: 'admin', password: 'password'});
      user.save();
    }
});

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'tomthegoatbrady',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/', express.static(__dirname + '/../client/www'));
app.use('/authentication', require('./routes/authentication'));
app.use('/auto_schedule', require('./routes/auto_schedule'));
app.use('/google_cal', require('./routes/export_calendar'));
app.use('/search', require('./routes/execute_query'));
app.use('/storage', require('./routes/user_storage'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});

// error handlers

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      success: false,
      message: err.message,
      error: err
    });
  });
}
else {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      success: false,
      message: err.message,
    });
  });
}

// var populator = new (require('./lib/db_populator').DatabasePopulator)();
// console.log('Populating...');
// populator.populateTerm('20151', function(data) {
//   console.log(data);
// });

module.exports = app;
