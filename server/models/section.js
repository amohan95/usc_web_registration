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
	section_id: {
		type: Number,
		unique: true
	},
	section_code: String,
	course_code: String,
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

SectionSchema.statics.getNumericalTime = function(time_string) {
	var s = time_string.split(':');
	return parseInt(s[0]) + Math.round(parseInt(s[1]) / 30) / 2;
};

SectionSchema.methods.getNumericalStart = function() {
	return Section.getNumericalTime(this.begin_time);
};

SectionSchema.methods.getNumericalEnd = function() {
	return Section.getNumericalTime(this.end_time);
};

SectionSchema.methods.conflictsWith = function(blocked) {
	for (var d = 0; d < this.day.length; ++d) {
		if (blocked.hasOwnProperty(this.day[d])) {
			var end = this.getNumericalEnd();
			for (var t = this.getNumericalStart(); t < end; t += 0.5) {
				if (blocked[this.day[d]].hasOwnProperty(t)) {
					return true;
				}
			}
		}
	}
	return false;
}

SectionSchema.methods.setConflict = function(blocked) {
	for (var d = 0; d < this.day.length; ++d) {
		if (!blocked.hasOwnProperty(this.day[d])) {
			blocked[this.day[d]] = {};
		}
		var end = this.getNumericalEnd();
		for (var t = this.getNumericalStart(); t < end; t += 0.5) {
			blocked[this.day[d]][t] = true;
		}
	}
}

SectionSchema.methods.getNumericalSectionCode = function() {
	return parseInt(this.section_code.replace(/[^a-z\d]*$/gi, ''));
};

var DEPARTMENTS_REQUIRING_SECTION_RELATION = {
	'MATH' : ['Lecture',null]
};
SectionSchema.methods.isValidChildOf = function(parent, parent_pool) {
	if (parent.course_code == this.course_code) {
		if (DEPARTMENTS_REQUIRING_SECTION_RELATION.hasOwnProperty(parent.course_code.split('-')[0])) {
			var relation = DEPARTMENTS_REQUIRING_SECTION_RELATION[parent.course_code.split('-')[0]];
			if (parent.type == relation[0] && this.type == relation[1]) {
				var parent_code = parent.getNumericalSectionCode();
				var next_parent_code = 9007199254740992;
				var next_parent = null;
				parent_pool.forEach(function(section) {
					var section_code = section.getNumericalSectionCode();
					if (section_code > parent_code && section_code < next_parent_code) {
						next_parent_code = section_code;
					}
				});
				var this_code = this.getNumericalSectionCode();
				return this_code > parent_code && this_code < next_parent_code;
			} else {
				return true;
			}
		} else {
			return true;
		}
	} else {
		return true;
	}
}

SectionSchema.statics.RETRIEVE_URL = 'http://petri.esd.usc.edu/socapi/sections/%s';

SectionSchema.methods.retrieve = function retrieve(callback) {
	var self = this;
	request({
		url: util.format(Section.RETRIEVE_URL, this.section_id.toString()),
		json: true
	}, function(error, response, body) {
		self.populateFromJSON(body[0], callback, null);
	});
};

SectionSchema.methods.populateFromJSON = function populateFromJSON(json, callback, course) {
	this.section_id = json.SECTION_ID;
	this.section_code = json.SECTION;
	this.course_code = json.SIS_COURSE_ID;
	this.name = json.NAME;
	this.units = json.UNIT_CODE;
	this.type = json.TYPE;
	this.begin_time = json.BEGIN_TIME;
	this.end_time = json.END_TIME;
	this.day = json.DAY || '';
	this.number_registered = json.REGISTERED;
	this.number_seats = json.SEATS;
	this.instructor = json.INSTRUCTOR;
	this.location = json.LOCATION;
	this.add_date = Date.parse(json.ADD_DATE) || null;
	this.cancel_date = Date.parse(json.CANCEL_DATE) || null;
	this.publish = json.PUBLISH_FLAG == 'Y';
	var self = this;
	var load_session = function load_session() {
		if(json.SESSION !== null) {
			var session = new Session();
			session.session_code = json.SESSION;
		  session.retrieveWithoutId(json.TERM_CODE, function() {
				self.session = session;
				self.save(callback);
			});
		} else {
			self.save(callback);
		}
	};
	var load_course = function load_course(term) {
		self.term = term;
		if (course == null) {
			Course.findOne({course_id: json.COURSE_ID}, function(err, c) {
				if (course) {
					self.course = c;
					load_session();
				} else {
					course = new Course();
					self.course = course;
					self.save(course.retrieve(json.TERM_CODE, json.COURSE_ID, load_session));
				}
			});
		} else {
				self.course = course;
				load_session();
		}
	};
	Term.getOrRetrieveByCode(json.TERM_CODE, load_course);
};

var Section = mongoose.model('Section', SectionSchema);

module.exports = {
	Section: Section
}
