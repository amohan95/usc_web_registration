var express = require('express');
var router = express.Router();
var Term = require('../models/term').Term;
var Session = require('../models/session').Session;
var School = require('../models/school').School;
var Department = require('../models/department').Department;
var Course = require('../models/course').Course;
var Section = require('../models/section').Section;

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

module.exports = router;
