var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var Term = require('./term').Term;

var SessionSchema = new mongoose.Schema({
	session_id: {
		type: Number,
		unique: true
	},
	term: {
		type: mongoose.Schema.ObjectId,
		ref: 'TermSchema'
	},
	session_code: String,
	class_begin_date: Date,
	last_add_drop_date: Date,
	withdraw_with_w_date: Date,
	final_exam_begin_date: Date,
	final_exam_end_date: Date,
	class_end_date: Date,
	stop_date: Date
});

SessionSchema.statics.RETRIEVE_URL = 'http://petri.esd.usc.edu/socapi/sessions/%s';
SessionSchema.methods.retrieve = function retrieve(callback) {
	var self = this;
	request({
		url: util.format(Session.RETRIEVE_URL, this.session_id.toString()),
		json: true
	}, function (error, response, body) {
		self.populateFromJSON(body[0], callback);
	});
};

SessionSchema.methods.retrieveWithoutId = function retrieveWithoutId(callback) {
	if (this.session_code) {
		var self = this;
		request({
			url: util.format(Session.RETRIEVE_URL, ''),
			json: true
		}, function (error, response, body) {
			async.forEach(body, function(session, itr_callback) {
				if (session.TERM_CODE == self.term.term_code && session.RNR_SESSION_CODE == self.session_code) {

				} else {
					itr_callback();
				}
			});
		});
	}
}

SessionSchema.methods.populateFromJSON = function populateFromJSON(json, callback, term) {
	self.session_id = json.RNR_SESSION_ID
	self.session_code = json.RNR_SESSION_CODE;
	self.class_begin_date = Date.parse(json.CLASS_BEGIN_DATE);
	self.last_add_drop_date = Date.parse(json.LAST_ADD_DROP_DATE);
	self.withdraw_with_w_date = Date.parse(json.WITHDRAW_W_W_DATE);
	self.final_exam_begin_date = Date.parse(json.FINAL_EXAM_BEGIN_DATE) || null;
	self.final_exam_end_date = Date.parse(json.FINAL_EXAM_END_DATE);
	self.class_end_date = Date.parse(json.CLASS_END_DATE);
	self.stop_date = Date.parse(json.STOP_DATE);
	if (term == null) {
		Term.findOne({term_code: json.TERM_CODE}, function(err, t) {
			if (t) {
				self.term = t;
				self.save(callback());
			} else {
				self.term = new Term({term_code: json.TERM_CODE});
				self.term.retrieve(self.save(callback()));
			}
		});
	} else {
		self.term = term;
		self.save(callback());
	}
}

var Session = mongoose.model('Session', SessionSchema);

module.exports = {
	Session: Session
}
