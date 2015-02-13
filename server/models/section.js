var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var Term = require('./term').Term;
var Course = require('./course').Course;
var Session = require('./session').Session;

var SectionSchema = new mongoose.Schema({
	term: {
		type: mongoose.Schema.ObjectId,
		ref: 'Term'
	},
	course: {
		type: mongoose.Schema.ObjectId,
		ref: 'Course'
	},
	name: String,
	section_id: Number,
	section_code: String,
	session: {
		type: mongoose.Schema.ObjectId,
		ref: 'Session'
	},
	units: Number,
	type: String,
	begin_time: String,
	end_time: String,
	day: String,
	number_registered: Number,
	number_seats: Number,
	instructor: String,
	location: String,
	add_date: Date,
	cancel_date: Date,
	publish: Boolean
});

SectionSchema.methods.populateFromJSON = function populateFromJSON(json, callback, course) {
	this.section_id = json.SECTION_ID;
	this.section_code = json.SECTION;
	this.units = json.UNIT_CODE;
	this.type = json.TYPE;
	this.begin_time = json.BEGIN_TIME;
	this.end_time = json.END_TIME;
	this.day = json.DAY;
	this.number_registered = json.REGISTERED;
	this.number_seats = json.SEATS;
	this.instructor = json.INSTRUCTOR;
	this.location = json.LOCATION;
	this.add_date = Date.parse(json.ADD_DATE);
	this.cancel_date = Date.parse(json.CANCEL_DATE);
	this.publish = json.PUBLISH_FLAG == 'Y';
	var self = this;
	var load_session = function load_session() {
		session = new Session();
		session.session_code = json.SESSION;
	  session.retrieveWithoutId(json.TERM_CODE, function() {
			self.session = session;
			self.save(callback);
		});
	};
	var load_course = function load_course() {
		if (course == null) {
			Course.findOne({course_id: json.COURSE_ID}, function(err, c) {
				if (course) {
					self.course = c;
					load_session();
				} else {
					self.course = new Course({course_id: json.COURSE_ID});
					self.course.retrieve(load_session);
				}
			});
		} else {
			self.course = course;
			load_session();
		}
	};
	Term.getOrRetrieveByCode(json.TERM_CODE, load_course);
}

var Section = mongoose.model('Section', SectionSchema);

module.exports = {
	Section: Section
}
