var mongoose = require('mongoose');
var async = require('async');
var Course = require('../models/course').Course;
var Section = require('../models/section').Section;

var AutoScheduleSchema = new mongoose.Schema({
	courses: [Number],
	include: {
		type: Object,
		default: {}
	},
	exclude: {
		type: Object,
		default: {}
	}
});

AutoScheduleSchema.methods.addCourse = function(course, cb) {
	if (this.courses.indexOf(course) == -1) {
		this.courses.push(course);
		this.save(cb);
	} else {
		cb();
	}
}

AutoScheduleSchema.methods.removeCourse = function(course, cb) {
	var i = this.courses.indexOf(course);
	if (i > -1) {
		this.courses.splice(i, 1);
		delete this.graph;
		this.save(cb);
	} else {
		cb();
	}
}

AutoScheduleSchema.methods.addIncludedSection = function(section_id, cb) {
	var self = this;
	Section.findOne({section_id: section_id}).populate('course course_id').exec(function(err, section) {
		if (!self.include.hasOwnProperty(section.course.course_id)) {
			self.include[section.course.course_id] = {};
		}
		self.include[section.course.course_id][section.type] = section.section_id;
		self.markModified('include');
		self.save(cb);
	});
}

AutoScheduleSchema.methods.removeIncludedSection = function(section_id, cb) {
	var self = this;
	Section.findOne({section_id: section_id}).populate('course course_id').exec(function(err, section) {
		if (self.include.hasOwnProperty(section.course.course_id) && self.include[section.course.course_id].hasOwnProperty(section.type) &&
			  self.include[section.course.course_id][section.type] == section.section_id) {
			delete self.include[section.course.course_id][section.section_id];
			self.markModified('include');
			self.save(cb);
		} else {
			cb();
		}
	});
}

AutoScheduleSchema.methods.addExcludedSection = function(section_id, cb) {
	this.exclude[section_id] = true;
	this.markModified('exclude');
	this.save(cb);
}

AutoScheduleSchema.methods.removeExcludedSection = function(section_id, cb) {
	delete this.exclude[section_id];
	this.markModified('exclude');
	this.save(cb);
}

AutoScheduleSchema.methods.buildGraph = function(callback) {
	this.graph = {};
	var self = this;
	var section_groups = [];
	Course.find({'course_id': { $in: this.courses}}).populate({path: 'sections', options: {sort: 'section_code'}}).exec(function(err, courses) {
		self.section_map = {};
		self.course_map = {};
		courses.forEach(function(course) {
			self.course_map[course.course_code] = course;
			var sections = {};
			course.sections.forEach(function(section) {
				self.section_map[section.section_id] = section;
				section.course = course;
				if (sections.hasOwnProperty(section.type)) {
					sections[section.type].push(section);
				} else {
					sections[section.type] = [section];
				}
			});
			if (sections.hasOwnProperty('Lecture')) {
				section_groups.push(sections['Lecture']);
				delete sections['Lecture'];
			}
			if (sections.hasOwnProperty(null)) {
				section_groups.push(sections[null]);
				delete sections[null];
			}
			for (var key in sections) {
				section_groups.push(sections[key]);
			}
		});
		self.graph['head'] = [];
		for (var i = 0; i < section_groups.length - 1; ++i) {
			for (var j = 0; j < section_groups[i].length; ++j) {
				self.graph[section_groups[i][j]] = [];
				for (var k = 0; k < section_groups[i + 1].length; ++k) {
					if (section_groups[i + 1][k].isValidChildOf(section_groups[i][j], section_groups[i])) {
						self.graph[section_groups[i][j]].push(section_groups[i + 1][k]);
					}
				}
				if (i == 0) {
					self.graph['head'].push(section_groups[i][j]);
				}
			}
		}
		callback();
	});
};

AutoScheduleSchema.methods.buildCombinations = function(blocked, max_combinations) {
	var combinations = [];
	var all_possible = true;
	for (var i = 0; i < this.graph['head'].length; ++i) {
		all_possible = all_possible && this._buildCombinations(this.graph['head'][i], blocked, [], combinations, max_combinations);
	}
	return {
		section_map: this.section_map || {},
		course_map: this.course_map || {},
		combinations: combinations,
		all_possible: all_possible
	};
};

AutoScheduleSchema.methods._buildCombinations = function(current, blocked, combination, combinations, max_combinations) {
	if (current.publish && !this.exclude[current.section_id] &&
			    !current.conflictsWith(blocked) &&
			    (this.include[this.course_map[current.course_code].course_id] === undefined || this.include[this.course_map[current.course_code].course_id][current.type] === undefined ||
			    	this.include[this.course_map[current.course_code].course_id][current.type] == current.section_id)) {
		var comb = combination.slice();
		comb.push(current.section_id);
		if (this.graph.hasOwnProperty(current)) {
			var blocked_new = {};
			for (var k in blocked) {
				blocked_new[k] = {};
				for (var l in blocked[k]) {
					blocked_new[k][l] = blocked[k][l];
				}
			}
			current.setConflict(blocked_new);
			var ret = true;
			for (var i = 0; i < this.graph[current].length; ++i) {
				ret = ret && this._buildCombinations(this.graph[current][i], blocked_new, comb, combinations, max_combinations);
			}
			return ret;
		} else {
			if (combinations.length < max_combinations) {
				combinations.push(comb);
				return true;
			} else {
				return false;
			}
		}
	} else {
		return true;
	}
};

var AutoSchedule = mongoose.model('AutoSchedule', AutoScheduleSchema);

module.exports = {
	AutoSchedule: AutoSchedule
}
