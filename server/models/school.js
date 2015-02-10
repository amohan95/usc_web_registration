var mongoose = require("mongoose");

var SchoolSchema = new mongoose.Schema({
	school_code: {
		type: String,
		unique: true
	},
	description: String
	departments: [{
		type: ObjectId,
		ref: 'DepartmentSchema'
	}]
});

var School = mongoose.model('School', SchoolSchema);

module.exports = {
	School: School
}
