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
	t.term_code = '20151';
	t.retrieve(function() {
		res.send(t);
	});
});

router.get('/session', function(req, res, next) {
	var s = new Session();
	s.session_id = 27;
	s.retrieve(function() {
		res.send(s);
	});
});

router.get('/school', function(req, res, next) {
	var s = new School();
	s.school_code = 'LAS';
	s.retrieve(function() {
		res.send(s);
	});
});

router.get('/department', function(req, res, next) {
	var d = new Department();
	d.department_code = 'CSCI';
	d.retrieve(function() {
		res.send(d);
	});
});

router.get('/course', function(req, res, next) {
	var t = new Term({term_code: '20151'});
	t.retrieve(function() {
		var c = new Course({course_id: 2814});
		c.retrieve(t, function() {
			res.send(c);
		});
	});
});

router.get('/section', function(req, res, next) {
	var s = new Section({section_id: 6780});
	s.retrieve(function() {
		res.send(s);
	});
});

module.exports = router;
