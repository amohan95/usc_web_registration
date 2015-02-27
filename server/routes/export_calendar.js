var express = require('express');
var google_cal = require('google-calendar');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var router = express.Router();
var config = require('../config').Config;
var User = require('../models/user').User;

passport.use(new GoogleStrategy({
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  callbackURL: "http://localhost/google_cal/callback",
  scope: 'https://www.googleapis.com/auth/calendar'
}, function(accessToken, refreshToken, profile, done) {
  profile.gcal_access_token = accessToken;
  return done(null, profile);
}));

router.get('/', passport.authenticate('google', {session: true}));

router.get('/callback', passport.authenticate('google', {session: true}), function(req, res) {
  console.log(req.session.gcal_access_token);
  req.session.gcal_access_token = req.user.gcal_access_token;
  res.redirect('/');
});

router.post('/export_calendar', passport.authenticate('bearer'), function(req, res, next) {
  if(!req.session.gcal_access_token) {
    return res.redirect('/auth');
  } else {
    var access_token = req.session.gcal_access_token;
    google_cal(access_token).calendarList.list(function(err, data) {
      if(err) return res.send(500, err);
      return res.send(data);
    });
  }
});

module.exports = router;