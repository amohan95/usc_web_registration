var async = require('async');
var Course = require('../models/course').Course;

var AutoSchedule = function() {
	this.courses = {};
	this.graph = {};
	this.include = {};
	this.exclude = {};
}

AutoSchedule.prototype.addCourse = function(course) {
	this.courses[course.course_id] = course;
}

AutoSchedule.prototype.addIncludedSection = function(course_id, section_id) {
	if (!this.include.hasOwnProperty(course_id)) {
		this.include[course_id] = {};
	}
	this.include[course_id][section_id] = true;
}

AutoSchedule.prototype.removeIncludedSection = function(course_id, section_id) {
	delete this.include[course_id][section_id];
}

AutoSchedule.prototype.addExcludedSection = function(section_id) {
	this.exclude[section_id] = true;
}

AutoSchedule.prototype.removeExcludedSection = function(section_id) {
	delete this.exclude[section_id];
}

AutoSchedule.prototype.buildGraph = function(callback) {
	var self = this;
	var section_groups = [];
	async.forEach(Object.keys(this.courses), function(key, itr_callback) {
		Course.populate(self.courses[key], 'sections', function(err, course) {
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
			itr_callback();
		});
	}, function() {
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

AutoSchedule.prototype.buildCombinations = function(blocked) {
	var all_combinations = [];
	for (var i = 0; i < this.graph['head'].length; ++i) {
		this._buildCombinations(this.graph['head'][i], blocked, [], all_combinations);
	}
	return all_combinations;
};

AutoSchedule.prototype._buildCombinations = function(current, blocked, combination, combinations) {
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

module.exports = AutoSchedule;
