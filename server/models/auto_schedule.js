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
	this.courses.push(course);
	this.save(cb);
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

AutoScheduleSchema.methods.addIncludedSection = function(course_id, section_id, cb) {
	if (!this.include.hasOwnProperty(course_id)) {
		this.include[course_id] = {};
	}
	this.include[course_id][section_id] = true;
	this.save(cb);
}

AutoScheduleSchema.methods.removeIncludedSection = function(course_id, section_id, cb) {
	if (this.include.hasOwnProperty(course_id) && this.include[course_id].hasOwnProperty(section_id)) {
		delete this.include[course_id][section_id];
		this.save(cb);
	} else {
		cb();
	}
}

AutoScheduleSchema.methods.addExcludedSection = function(section_id, cb) {
	this.exclude[section_id] = true;
	this.save(cb);
}

AutoScheduleSchema.methods.removeExcludedSection = function(section_id, cb) {
	delete this.exclude[section_id];
	this.save(cb);
}

AutoScheduleSchema.methods.buildGraph = function(callback) {
	this.graph = {};
	var self = this;
	var section_groups = [];
	Course.find({'course_id': { $in: this.courses}}).populate('sections').exec(function(err, courses) {
		self.course_map = {};
		courses.forEach(function(course) {
			self.course_map[course.course_id] = course;
			var sections = {};
			course.sections.forEach(function(section) {
				section.course = course;
				if (sections.hasOwnProperty(section.type)) {
					sections[section.type].push(section);
				} else {
					sections[section.type] = [section];
				}
			});
			for (var key in sections) {
				section_groups.push(sections[key]);
			}
		});
		self.graph['head'] = [];
		for (var i = 0; i < section_groups.length - 1; ++i) {
			for (var j = 0; j < section_groups[i].length; ++j) {
				self.graph[section_groups[i][j]] = [];
				for (var k = 0; k < section_groups[i + 1].length; ++k) {
					self.graph[section_groups[i][j]].push(section_groups[i + 1][k]);
				}
				if (i == 0) {
					self.graph['head'].push(section_groups[i][j]);
				}
			}
		}
		callback();
	});
};

AutoScheduleSchema.methods.buildCombinations = function(blocked) {
	var all_combinations = [];
	for (var i = 0; i < this.graph['head'].length; ++i) {
		this._buildCombinations(this.graph['head'][i], blocked, [], all_combinations);
	}
	return all_combinations;
};

AutoScheduleSchema.methods._buildCombinations = function(current, blocked, combination, combinations) {
	if (current.publish && !this.exclude.hasOwnProperty(current.section_id) &&
			    !current.conflictsWith(blocked) &&
			    (!this.include.hasOwnProperty(current.course.course_id) ||
			    		this.include[current.course.course_id].hasOwnProperty(current.section_id))) {
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
			for (var i = 0; i < this.graph[current].length; ++i) {
				this._buildCombinations(this.graph[current][i], blocked_new, comb, combinations);
			}
		} else {
			combinations.push(combination);
		}
	}
};

var AutoSchedule = mongoose.model('AutoSchedule', AutoScheduleSchema);

module.exports = {
	AutoSchedule: AutoSchedule
}
