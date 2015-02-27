var mongoose = require('mongoose');
var async = require('async');
var $ = require('jquery-deferred');
var Section = require('../models/section').Section;
var Course = require('../models/course').Course;
var Term = require('../models/term').Term;
var User = require('../models/user').User;

var params = ['course_code', 'course_title', 'description', 'diversity', 'instructor', 'section_code'];

function Query() { }

Query.prototype.executeQuery = function(query_string, term, username, parameters, callback) {
  var queries = {};
  var self = this;
  User.findOne({username: username}, function(err, user) {
    if(user === null) {
      callback({success: false});
    } else {
      var addQuery = function(param) {
        switch(param) {
          case 'course_code': {
            if(!queries.courses) {
              queries.courses = Course.find().sort('course_code');
            }
            queries.courses.or({course_code: new RegExp('^' + query_string + '|^' +
                                                        query_string.replace(' ','-'), 'i')});
            break;
          }
          case 'course_title': {
            if(!queries.courses) {
              queries.courses = Course.find().sort('course_code');
            }
            queries.courses.or({title: new RegExp(query_string, 'i')});
            break;
          }
          case 'description': {
            if(!queries.courses) {
              queries.courses = Course.find().sort('course_code');
            }
            queries.courses.or({description: new RegExp(query_string, 'i')});
            break;
          }
          case 'diversity': {
            if(!queries.courses) {
              queries.courses = Course.find().sort('course_code');
            }
            queries.courses.and({diversity: true});
            break;
          }
          case 'instructor': {
            if(!queries.sections) {
              queries.sections = Section.find();
            }
            var tokens = query_string.split(' ');
            var exps = [];
            tokens.forEach(function(token) {
              exps.push({instructor: new RegExp(token, 'i')});
            });
            queries.sections.or({$and: exps});
            break;
          }
          case 'section_code': {
            if(!queries.sections) {
              queries.sections = Section.find();
            }
            queries.sections.or({section_code: new RegExp('^' + query_string, 'i')});
            break;
          }
        }
      }
      var def = $.Deferred();
      if(typeof(parameters.default) !== undefined && parameters.default) {
        var allParams = function() {
          params.forEach(function(param, index, arr) {
            addQuery(param);
          });
          def.resolve();
          return def.promise();
        }
        allParams().then(self.executeSearch(queries, term, user, callback));    
      } else {
        var selectParams = function() {
          for(var param in parameters) {
            if(parameters.hasOwnProperty(param) && parameters[param]) {
              addQuery(param);
            }
          }
          def.resolve();
          return def.promise();
        }
        selectParams().then(self.executeSearch(queries, term, user, callback));
      }
    }
  });
}

Query.prototype.executeSearch = function(queries, term, user, callback) {
  var coursesDef = $.Deferred();
  var sectionsDef = $.Deferred();
  var self = this;
  var coursesQuery = function() {
    var courses = [];
    if(queries.courses === undefined) {
      coursesDef.resolve(courses);
    } else {
      queries.courses.populate('effective_term', 'term_code -_id')
      .populate('sections', 'publish').exec(function(err, docs) {
        docs.forEach(function(course) {
          if(course.effective_term !== null && course.effective_term.term_code === term
             && course.checkIfPublish()) {
            courses.push(course);
          }
        });
        coursesDef.resolve(courses);
      });
    }
    return coursesDef.promise();
  }
  var sectionsQuery = function() {
    var sections = [];
    if(queries.sections === undefined) {
      sectionsDef.resolve(sections);
    } else {
      queries.sections.populate('term', 'term_code -_id').populate('course')
      .exec(function(err, docs) {
        self.checkAndAddSections(docs, user, term, function(sections) {
          sectionsDef.resolve(sections);
        });
      });
    }
    return sectionsDef.promise();
  }
  $.when(coursesQuery(), sectionsQuery()).done(function(courses, sections) {
    callback({courses: courses, sections: sections, success: true});
  });
}

Query.prototype.getSectionsForCourse = function(course_id, username, callback) {
  var sections = [];
  var self = this;
  User.findOne({username: username}).populate('registered_sections scheduled_sections')
    .exec(function(err, user) {
    Course.findOne({course_id: course_id}).populate('sections')
    .exec(function(err, doc) {
      self.checkAndAddSections(doc.sections, user, null, function(sections) {
        callback({sections: sections, success: true});
      });
    });
  });
}

Query.prototype.checkAndAddSections = function(sections, user, term, callback) {
  var res = [];
  async.forEach(sections, function(section, itr_callback) {
    if(section.publish && (term === null || section.term.term_code === term)) {
      user.hasSection(section.section_id, function(has) {
        if(!has) {
          user.getBlockedTimes(function(blocked) {
            var secObj = section.toObject();
            if(section.conflictsWith(blocked)) {
              secObj.conflict = true;
            }
            res.push(secObj);
            itr_callback();
          });
        } else {
          itr_callback();
        }
      });
    } else {
      itr_callback();
    }
  }, function() {
    callback(res);
  });
}

module.exports = {
  Query: Query
}