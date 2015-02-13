var mongoose = require('mongoose');
var request = require('request');
var util = require('util');
var async = require('async');
var Term = require('./term').Term;

var SessionSchema = new mongoose.Schema({
	session_id: {
		type: Number,
		unique: true
	},
	term: {
		type: mongoose.Schema.ObjectId,
		ref: 'Term'
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
SessionSchema.methods.retrieve = function retrieve(session_id, callback) {
	var self = this;
	request({
		url: util.format(Session.RETRIEVE_URL, session_id.toString()),
		json: true
	}, function (error, response, body) {
		self.populateFromJSON(body[0], callback);
	});
};

SessionSchema.methods.retrieveWithoutId = function retrieveWithoutId(term, callback) {
	if (this.session_code) {
		var self = this;
		request({
			url: util.format(Session.RETRIEVE_URL, ''),
			json: true
		}, function (error, response, body) {
			async.forEach(body, function(session, itr_callback) {
				if (session.TERM_CODE == term && session.RNR_SESSION_CODE == self.session_code) {
					self.populateFromJSON(session, itr_callback);
				} else {
					itr_callback();
				}
			}, function() {
				callback();
			});
		});
	}
}

SessionSchema.methods.populateFromJSON = function populateFromJSON(json, callback) {
	var self = this;
	self.session_id = json.RNR_SESSION_ID
	self.session_code = json.RNR_SESSION_CODE;
	self.class_begin_date = Date.parse(json.CLASS_BEGIN_DATE);
	self.last_add_drop_date = Date.parse(json.LAST_ADD_DROP_DATE);
	self.withdraw_with_w_date = Date.parse(json.WITHDRAW_W_W_DATE);
	self.final_exam_begin_date = Date.parse(json.FINAL_EXAM_BEGIN_DATE) || null;
	self.final_exam_end_date = Date.parse(json.FINAL_EXAM_END_DATE);
	self.class_end_date = Date.parse(json.CLASS_END_DATE);
	self.stop_date = Date.parse(json.STOP_DATE);
	var term_loaded = function(term) {
		self.term = term;
		self.save(callback);
	};
	Term.getOrRetrieveByCode(json.TERM_CODE, term_loaded);
}

var Session = mongoose.model('Session', SessionSchema);

module.exports = {
	Session: Session
}
