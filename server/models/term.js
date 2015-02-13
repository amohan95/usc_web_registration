var mongoose = require('mongoose');
var request = require('request');
var util = require('util');

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

TermSchema.statics.RETRIEVE_URL = 'http://petri.esd.usc.edu/socapi/terms/%s';

TermSchema.statics.get_or_retrieve_by_code = function get_or_retrieve_by_code(code, callback) {
  Term.findOne({term_code: code}, function(err, term) {
    if (term) {
      callback(term);
    } else {
      term = new Term({term_code: code});
      term.retrieve(function(){ callback(term) });
    }
  });
};

TermSchema.methods.retrieve = function retrieve(callback) {
  console.log(callback);
  var self = this;
  request({
    url: util.format(Term.RETRIEVE_URL, this.term_code),
    json: true
  }, function (error, response, body) {
    self.term_code = body[0].TERM_CODE;
    self.description = body[0].DESCRIPTION;
    self.pre_reg_start_date = Date.parse(body[0].PRE_REG_START_DATE);
    self.pre_reg_end_date = Date.parse(body[0].PRE_REG_END_DATE);
    self.early_reg_start_date = Date.parse(body[0].EARLY_REG_START_DATE);
    self.early_reg_end_date = Date.parse(body[0].EARLY_REG_END_DATE);
    self.normal_reg_end_date = Date.parse(body[0].NORMAL_REG_END_DATE);
    self.commencement_date = Date.parse(body[0].COMMENCEMENT_DATE);
    self.save(callback);
  });
};

var Term = mongoose.model('Term', TermSchema);

module.exports = {
  Term: Term
}
