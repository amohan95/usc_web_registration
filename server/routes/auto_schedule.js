var express = require('express');
var passport = require('passport');
var router = express.Router();
var Course = require('../models/course').Course;
var AutoSchedule = require('../models/auto_schedule').AutoSchedule;

var populateAutoSchedule = function (req, res, next) {
	req.user.populate('auto_schedule', function(err, user) {
		if (user.auto_schedule) {
			next();
		} else {
			var auto_schedule = new AutoSchedule();
			auto_schedule.save(function(){
				user.auto_schedule = auto_schedule;
				user.save(next);
			});
		}
	});
};

router.post('/add_course', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addCourse(req.body.course_id, function() {
		res.sendStatus(200);
	});
});

router.post('/remove_course', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeCourse(req.body.course_id, function() {
		res.sendStatus(200);
	});
});

router.post('/add_included_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addIncludedSection(req.body.course_id, req.body.section_id, function() {
		res.sendStatus(200);
	});
});

router.post('/remove_included_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeIncludedSection(req.body.course_id, req.body.section_id, function() {
		res.sendStatus(200);
	});
});

router.post('/add_excluded_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addExcludedSection(req.body.section_id, function() {
		res.sendStatus(200);
	});
});

router.post('/remove_excluded_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeExcludedSection(req.body.section_id, function() {
		res.sendStatus(200);
	});
});

router.get('/build_combinations', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.buildGraph(function() {
		req.user.getBlockedTimes(function(blocked) {
			var combinations = req.user.auto_schedule.buildCombinations(blocked);
			res.send({
				courses: req.user.auto_schedule.course_map || {},
				combinations: combinations
			});
		});
	});
});

module.exports = router;
