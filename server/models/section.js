var mongoose = require("mongoose");

var SectionSchema = new mongoose.Schema({
	term: {
		type: ObjectId,
		ref: 'TermSchema'
	},
	course: {
		type: ObjectId,
		ref: 'CourseSchema'
	},
	name: String,
	section_code: String,
	session: {
		type: ObjectId,
		ref: 'SessionSchema'
	},
	units: Number,
	type: String,
	begin_time: String,
	end_time: String,
	day: String,
	number_registered: Number,
	number_seats: Number,
	instructor: String,
	location: String
});

var Section = mongoose.model('Section', SectionSchema);

module.exports = {
	Section: Section
}
