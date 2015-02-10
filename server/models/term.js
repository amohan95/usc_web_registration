var mongoose = require("mongoose");

var TermSchema = new mongoose.Schema({
  term_code: {
		type: String,
		unique: true
	},
  description: String,
	pre_reg_start_date: Date,
	pre_reg_end_date: Date,
	early_reg_start_date: Date,
	early_reg_end_date: Date,
	normal_reg_end_date: Date,
	commencement_date: Date
});

var Term = mongoose.model('Term', TermSchema);

module.exports = {
  Term: Term
}
