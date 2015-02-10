var DB_ADDR = 'mongodb://localhost/user_courses';

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
 
var db = new require('./models/database_model.js')(DB_ADDR);

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(function(req, res, next) {
  req.db = db;
  next();
});

app.use('/add_section', require('./routes/add_section'));
app.use('/remove_section', require('./routes/remove_section'));
app.use('/schedule_sections', require('./routes/schedule_sections'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Listening at http://%s:%s', host, port)
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

module.exports = app;
