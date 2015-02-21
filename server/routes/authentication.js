var express = require('express');
var passport = require('passport');
var router = express.Router();

router.post('/login', passport.authenticate('local'), function(req, res, next) {
	req.user.generateBearerToken(function() {
		res.send({sucess: true, bearer_token: req.user.token});
	});
});

router.post('/logout', passport.authenticate('local'), function(req, res, next) {
	req.user.token = null;
	req.user.save(function() {
		res.send({success: true});
	});
});

module.exports = router;
