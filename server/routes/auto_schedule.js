var express = require('express');
var passport = require('passport');
var router = express.Router();
var Course = require('../models/course').Course;
var AutoSchedule = require('../models/auto_schedule').AutoSchedule;

var populateAutoSchedule = function (req, res, next) {
	req.user.populate('auto_schedule', function(err, user) {
		user.populate('scheduled_sections', function(err, user_) {
			if (user.auto_schedule) {
				// user.auto_schedule.courses = [];
				// user.auto_schedule.save(next);
				next();
			} else {
				var auto_schedule = new AutoSchedule();
				auto_schedule.save(function(){
					user.auto_schedule = auto_schedule;
					user.save(next);
				});
			}
		});
	});
};

router.post('/add_course', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addCourse(req.body.course_id, function() {
		res.send({success: true});
	});
});

router.post('/remove_course', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeCourse(req.body.course_id, function() {
		res.send({success: true});
	});
});

router.post('/add_included_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addIncludedSection(req.body.section_id, function() {
		res.send({success: true});
	});
});

router.post('/remove_included_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeIncludedSection(req.body.section_id, function() {
		res.send({success: true});
	});
});

router.post('/add_excluded_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.addExcludedSection(req.body.section_id, function() {
		res.send({success: true});
	});
});

router.post('/remove_excluded_section', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.removeExcludedSection(req.body.section_id, function() {
		res.send({success: true});
	});
});

router.get('/build_combinations', passport.authenticate('bearer'),  populateAutoSchedule, function(req, res, next) {
	req.user.auto_schedule.buildGraph(function() {
		req.user.getBlockedTimes(function(blocked) {
			res.send(req.user.auto_schedule.buildCombinations(blocked, 100));
		});
	});
});

module.exports = router;
