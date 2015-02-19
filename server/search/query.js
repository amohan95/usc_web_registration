var mongoose = require('mongoose');
var $ = require('jquery-deferred');
var Section = require('../models/section').Section;
var Course = require('../models/course').Course;
var Term = require('../models/term').Term;
var User = require('../models/user').User;

var params = ['course_code', 'course_title', 'description', 'instructor', 'section_code'];

function Query() { }

Query.prototype.executeQuery = function(query_string, term, parameters, callback) {
  var queries = {};
  var addQuery = function(param) {
    switch(param) {
      case 'course_code': {
        if(!queries.courses) {
          queries.courses = Course.find();
        }
        queries.courses.or({course_code: new RegExp('^' + query_string, 'i')});
        break;
      }
      case 'course_title': {
        if(!queries.courses) {
          queries.courses = Course.find();
        }
        queries.courses.or({title: new RegExp(query_string, 'i')});
        break;
      }
      case 'description': {
        if(!queries.courses) {
          queries.courses = Course.find();
        }
        queries.courses.or({description: new RegExp(query_string, 'i')});
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
    allParams().then(this.executeSearch(queries, term, callback));    
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
    selectParams().then(this.executeSearch(queries, term, callback));
  }
}

Query.prototype.executeSearch = function(queries, term, callback) {
  var coursesDef = $.Deferred();
  var sectionsDef = $.Deferred();
  var coursesQuery = function() {
    var courses = [];
    if(queries.courses === undefined) {
      coursesDef.resolve(courses);
    } else {
      queries.courses.populate('effective_term', 'term_code -_id').exec(function(err, docs) {
        docs.forEach(function(course) {
          if(course.effective_term !== null && course.effective_term.term_code === term) {
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
      queries.sections.populate('term', 'term_code -_id').exec(function(err, docs) {
        docs.forEach(function(section) {
          if(section.term !== null && section.term.term_code === term) sections.push(section);
        });
        sectionsDef.resolve(sections);
      });
    }
    return sectionsDef.promise();
  }
  $.when(coursesQuery(), sectionsQuery()).done(function(courses, sections) {
    callback({courses: courses, sections: sections})
  });
}

module.exports = {
  Query: Query
}