var mongoose = require('mongoose');
var request = require('request');
var util = require('util');

var DepartmentSchema = new mongoose.Schema({
	department_code: {
		type: String,
		unique: true
	},
	description: String,
	school: {
		type: mongoose.Schema.ObjectId,
		ref: 'SchoolSchema'
	}
});

var Department = mongoose.model('Department', DepartmentSchema);

module.exports = {
	Department: Department
}
