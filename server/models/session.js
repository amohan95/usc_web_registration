var mongoose = require("mongoose");

var SessionSchema = new mongoose.Schema({
	session_id: {
		type: Number,
		unique: true
	},
	term: {
		type: ObjectId,
		ref: 'TermSchema'
	}
	session_code: String,
	class_begin_date: Date,
	last_add_drop_date: Date,
	withdraw_with_w_date: Date,
	final_exam_begin_date: Date,
	final_exam_end_date: Date,
	class_end_date: Date,
	stop_date: Date
});

var Session = mongoose.model('Session', SessionSchema);

module.exports = {
	Session: Session
}
