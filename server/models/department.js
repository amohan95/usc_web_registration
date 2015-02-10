var mongoose = require("mongoose");

var DepartmentSchema = new mongoose.Schema({
	department_code: {
		type: String,
		unique: true
	},
	description: String,
	school: {
		type: ObjectId,
		ref: 'SchoolSchema'
	}
});

var Department = mongoose.model('Department', DepartmentSchema);

module.exports = {
	Department: Department
}
