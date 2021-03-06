var async = require('async');
var request = require('request');
var util = require('util');
var Course = require('../models/course').Course;
var Section = require('../models/section').Section;
var Term = require('../models/term').Term;

var DatabasePopulator = function DatabasePopulator() { }

DatabasePopulator.prototype.populateTerm = function(term_code, callback) {
  var RETRIEVE_URL = 'http://petri.esd.usc.edu/socAPI/Courses/%s/ALL'
  var updated = 0;
  var created = 0;
  Term.getOrRetrieveByCode(term_code, function() {
    request({
      url: util.format(RETRIEVE_URL, term_code),
      json: true
    }, function (error, response, body) {
      async.forEach(body, function(course_json, itr_callback) {
        Course.findOne({course_id: course_json.COURSE_ID}, function(err, course) {
          if(course) {
            ++updated;
          } else {
            ++created;
            course = new Course();
          }
          course.populateFromJSON(course_json, term_code, function() {
            itr_callback();
          });
        });
      }, function() {
        callback({success: true, created: created, updated: updated});
      });
    });
  });
}

module.exports = {
  DatabasePopulator: DatabasePopulator
}
