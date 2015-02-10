var mongoose = require("mongoose");

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
		type: ObjectId,
		ref: 'TermSchema'
	},
	sections: [{
		type: ObjectId,
		ref: 'SectionSchema'
	}]
});

var Course = mongoose.model('Course', CourseSchema);

module.exports = {
	Course: Course
}
