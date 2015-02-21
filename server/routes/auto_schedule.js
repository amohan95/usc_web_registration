var express = require('express');
var passport = require('passport');
var router = express.Router();
var Course = require('../models/course').Course;
var AutoSchedule = require('../lib/auto_schedule');

router.post('/add_course', passport.authenticate('bearer'), function(req, res, next) {
	if (req.session.hasOwnProperty('courses')) {
		req.session.courses.push(req.body.course_id);
	} else {
		req.session.courses = [req.body.course_id];
	}
	res.sendStatus(200);
});

router.post('/add_included_section', passport.authenticate('bearer'), function(req, res, next) {
	if (!req.session.hasOwnProperty('include')) {
		req.session.include = {};
	}
	if (!req.session.include.hasOwnProperty(req.body.course_id)) {
		req.session.include[req.body.course_id] = {};
	}
	req.session.include[course_id][section_id] = true;
	res.sendStatus(200)
});

router.post('/remove_included_section', passport.authenticate('bearer'), function(req, res, next) {
	delete req.session.include[course_id][section_id];
	res.sendStatus(200)
});

router.post('/add_excluded_section', passport.authenticate('bearer'), function(req, res, next) {
	if (!req.session.hasOwnProperty('exclude')) {
		req.session.exclude = {};
	}
	req.session.exclude[req.body.section_id] = true;
	res.sendStatus(200)
});

router.post('/remove_excluded_section', passport.authenticate('bearer'), function(req, res, next) {
	delete req.session.exclude[req.body.section_id];
	res.sendStatus(200)
});

router.get('/build_combinations', passport.authenticate('bearer'), function(req, res, next) {
	var as = new AutoSchedule();
	as.include = req.session.include || {};
	as.exclude = req.session.exclude || {};
	Course.find({
		'course_id': { $in: req.session.courses}
	}, function(err, courses){
		courses.forEach(function(course) {
			as.addCourse(course);
		});
		as.buildGraph(function() {
			req.user.getBlockedTimes(function(blocked) {
				var combinations = as.buildCombinations(blocked);
				res.send({
					courses: as.courses,
					combinations: combinations
				});
			});
		});
	});
});

module.exports = router;
