var mongoose = require('mongoose');
var async = require('async');
var Section = require('./section').Section;
var Course = require('./course').Course;

var UserSchema = new mongoose.Schema({
  user_id: {
    type: Number,
  },
  username: {
    type: String,
    unique: true
  },
  scheduled_sections: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  registered_sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }]
});

UserSchema.statics.getUserCourseData = function(user, term_code, callback) {
  var scheduled = [];
  var registered = [];
  var getRegistered = function() {
    if(user.registered_sections.length) {
      async.forEach(user.registered_sections, function(sec_id, itr_callback) {
        Section.findOne({_id: sec_id}, function(err, sec) {
          sec.populate('term', 'term_code').populate('course', function(err, data) {
            if(sec.term.term_code === term_code) {
              registered.push(sec);
            }
            itr_callback();
          });
        });
      }, function(e) {
        callback({registered: registered, scheduled: scheduled, success: true});
      });
    } else {
      callback({registered: registered, scheduled: scheduled, success: true});
    }
  }
  if(user.scheduled_sections.length) {
    async.forEach(user.scheduled_sections, function(sec_id, itr_callback) {
      Section.findOne({_id: sec_id}, function(err, sec) {
        sec.populate('term', 'term_code').populate('course', function(err, data) {
          if(sec.term.term_code === term_code) {
            scheduled.push(sec);
          }
          itr_callback();
        });
      });
    }, function(e) {
      getRegistered();
    });
  } else {
    getRegistered();
  }
}

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}