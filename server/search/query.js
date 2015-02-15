var mongoose = require('mongoose');
var Section = require('../models/section').Section;
var Course = require('../models/course').Course;
var Term = require('../models/term').Term;
var User = require('../models/user').User;

var params = ['course_code', 'course_title', 'description', 'instructor', 'section_code', 'section_id'];

function Query() { }

Query.prototype.executeQuery = function(query_string, parameters, callback) {
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
      case 'section_id': {
        var re = new RegExp('^\d*');
        if(re.test(query_string)) {
          if(!queries.sections) {
            queries.sections = Section.find();
          }
          queries.sections.or({section_id: new RegExp('^\d' + query_string + '*')}); 
        }
        break;
      }
    }
  }
  if(parameters.none === true) {
    params.forEach(function(param, index, arr) {
      addQuery(param);
    });
  } else {
    for(var param in parameters) {
      if(parameters.hasOwnProperty(param) && parameters.param === true) {
        addQuery(param);
      }
    }
  }
  this.executeSearch(queries, callback);
}

Query.prototype.executeSearch = function(queries, callback) {
  var courses = [];
  var sections = [];
  queries.courses.exec(function(err, docs) {
    docs.forEach(function(course) {
      courses.push(course);
    });
  });
  queries.sections.exec(function(err, docs) {
    docs.forEach(function(section) {
      sections.push(section);
    });
  })
  callback({courses: courses, sections: sections});
}

module.exports = {
  Query: Query
}