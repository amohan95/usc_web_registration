var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var async = require('async');
var Term = require('./term').Term;

var CourseSchema = new mongoose.Schema({
	course_id: {
		type: Number,
		unique: true
	},
	course_code: String,
	title: String,
	min_units: Number,
	max_units: Number,
	total_max_units: Number,
	description: String,
	diversity: Boolean,
	term_code: Number,
	effective_term: {
		type: mongoose.Schema.ObjectId,
		ref: 'Term'
	},
	sections: [{
		type: mongoose.Schema.ObjectId,
		ref: 'Section'
	}]
});

CourseSchema.statics.RETRIEVE_URL = 'http://petri.esd.usc.edu/socapi/courses/%s/%s';
CourseSchema.methods.retrieve = function retrieve(term_code, course_id, callback) {
	var Section = require('./section').Section;
	var self = this;
	request({
		url: util.format(Course.RETRIEVE_URL, term_code, course_id.toString()),
		json: true
	}, function (error, response, body) {
		self.course_id = body.COURSE_ID;
		self.course_code = body.SIS_COURSE_ID;
		self.title = body.TITLE;
		self.min_units = body.MIN_UNITS;
		self.max_units = body.MAX_UNITS;
		self.total_max_units = body.TOTAL_MAX_UNITS;
		self.description = body.DESCRIPTION;
		self.diversity = body.DIVERSITY_FLAG == 'Y';
		self.sections = [];
		var load_sections = function(term) {
			self.effective_term = term;
			self.save(function() {
				async.forEach(body.V_SOC_SECTION, function(section, itr_callback) {
					Section.findOne({section_id: section.SECTION_ID}, function(err, sec) {
						var done = function() {
							self.sections.push(sec);
							itr_callback();
						}
						if (sec == null) {
							sec = new Section();
							sec.populateFromJSON(section, done, self);
						}
						else {
							self.sections.push(sec);
							itr_callback();
						}
					});
				}, function() {
					self.save(callback);
				});
			});
		}
		Term.getOrRetrieveByCode(term_code, load_sections);
	});
};

var Course = mongoose.model('Course', CourseSchema);

module.exports = {
	Course: Course
}
