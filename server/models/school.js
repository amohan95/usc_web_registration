var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var async = require('async');
var Department = require('./department').Department;

var SchoolSchema = new mongoose.Schema({
	school_code: {
		type: String,
		unique: true
	},
	description: String,
	departments: [{
		type: mongoose.Schema.ObjectId,
		ref: 'DepartmentSchema'
	}]
});

SchoolSchema.statics.RETRIEVE_URL = 'http://petri.esd.usc.edu/socapi/schools/%s';
SchoolSchema.methods.retrieve = function retrieve(callback) {
	var self = this;
	request({
		url: util.format(School.RETRIEVE_URL, this.school_code),
		json: true
	}, function (error, response, body) {
		self.school_code = body[0].SOC_SCHOOL_CODE;
		self.description = body[0].SOC_SCHOOL_DESCRIPTION;
		self.departments = [];
		async.forEach(body[0].SOC_DEPARTMENT_CODE, function(department, itr_callback) {
			Department.findOne({department_code: department.SOC_DEPARTMENT_CODE}, function(err, dep) {
				if (dep == null) {
					dep = new Department();
				}
				dep.department_code = department.SOC_DEPARTMENT_CODE;
				dep.description = department.SOC_DEPARTMENT_DESCRIPTION;
				dep.school = self;
				dep.save();
				self.departments.push(dep);
				itr_callback();
			});
		}, function() {
			self.save(callback());
		});
	});
};

var School = mongoose.model('School', SchoolSchema);

module.exports = {
	School: School
}
