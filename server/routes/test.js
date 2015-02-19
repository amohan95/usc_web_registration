var express = require('express');
var router = express.Router();
var async = require('async');
var Term = require('../models/term').Term;
var Session = require('../models/session').Session;
var School = require('../models/school').School;
var Department = require('../models/department').Department;
var Course = require('../models/course').Course;
var Section = require('../models/section').Section;
var AutoSchedule = require('../lib/auto_schedule');

router.get('/term', function(req, res, next) {
	var t = new Term();
	t.retrieve('20151', function() {
		res.send(t);
	});
});

router.get('/session', function(req, res, next) {
	var s = new Session();
	s.retrieve(27, function() {
		res.send(s);
	});
});

router.get('/school', function(req, res, next) {
	var s = new School();
	s.retrieve('ENGR', function() {
		res.send(s);
	});
});

router.get('/department', function(req, res, next) {
	var d = new Department();
	d.retrieve('CSCI', function() {
		res.send(d);
	});
});

router.get('/course', function(req, res, next) {
	var c = new Course();
	c.retrieve('20151', 2814, function() {
		res.send(c);
	});
});

router.get('/section', function(req, res, next) {
	var s = new Section({section_id: 6780});
	s.retrieve(function() {
		res.send(s);
	});
});

router.get('/autoschedule', function(req, res, next) {
	var semester = '20151';
	var course_ids = [2814, 1404, 7957, 6687];
	var as = new AutoSchedule();
	async.forEach(course_ids, function(course, itr_callback) {
		var c = new Course();
		c.retrieve(semester, course, function() {
			as.addCourse(c);
			itr_callback();
		});
	}, function() {
			as.buildGraph(function() {
				var b = as.buildCombinations({
					'M': {
						12: true,
						12.5: true,
						1: true,
						1.5: true,
						2: true
					},
					'T': {
						11: true
					},
					'H': {
						8: true,
						9: true,
						10: true,
						11: true
					}
					// 	10: true,
					// 	10.5: true,
					// 	11: true,
					// 	11.5: true
					// }
				});
				res.send([b.length]);
			});
	});
});

router.get('/populate_db', function(req, res, next) {
	var populator = new (require('../lib/db_populator').DatabasePopulator)();
	var body = req.query;
	populator.populateTerm(body.term, function(data) {
		res.send(data);
	});
	console.log(populating);
});

module.exports = router;
