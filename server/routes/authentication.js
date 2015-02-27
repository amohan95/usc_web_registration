var express = require('express');
var passport = require('passport');
var Token = require('../models/token').Token;
var router = express.Router();

router.post('/login', passport.authenticate('local'), function(req, res, next) {
	var token = new Token();
	token.user = req.user;
	token.generateBearerToken(function() {
		res.send({sucess: true, bearer_token: token.token});
	});
});

router.post('/logout', passport.authenticate('bearer'), function(req, res, next) {
	Token.findOne({user: req.user}).sort({day: -1}).exec(function(err, token) {
		token.expiration = Date.now;
		token.save(function() {
			res.send({success: true});
		});
	});
});

router.post('/set_registration_id', passport.authenticate('bearer'), function(req, res, next) {
	if (req.body.registration_id === undefined) {
		res.send({success: false});
	} else {
		req.user.registration_id = req.body.registration_id;
		req.user.save(function() {
			res.send({success: true});
		});
	}
});

module.exports = router;
