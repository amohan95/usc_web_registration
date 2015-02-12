var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var async = require('async');
var Term = require('./term').Term;
var Section = require('./section').Section;

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
CourseSchema.methods.retrieve = function retrieve(term, callback) {
	this.effective_term = term;
	var self = this;
	request({
		url: util.format(Course.RETRIEVE_URL, term.term_code, this.course_id.toString()),
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
		var load_sections = function(term) {
			self.term = term;
			self.save(function() {
				async.forEach(body.V_SOC_SECTION, function(section, itr_callback) {
					Section.findOne({section_id: section.SECTION_ID}, function(err, sec) {
						if (sec == null) {
							sec = new Section();
						}
						var done = function() {
							self.sections.push(sec);
							itr_callback();
						}
						sec.populateFromJSON(section, done, self);
					});
				}, function() {
					self.save(callback);
				});
			});
		}
		Term.get_or_retrieve_by_code(body.EFFECTIVE_TERM_CODE, load_sections);
	});
};

var Course = mongoose.model('Course', CourseSchema);

module.exports = {
	Course: Course
}
