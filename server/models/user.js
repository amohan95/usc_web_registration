var mongoose = require('mongoose');
var async = require('async');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var $ = require('jquery-deferred');
var Section = require('./section').Section;
var Course = require('./course').Course;
var AutoSchedule = require('./auto_schedule').AutoSchedule;

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    unique: true,
    required: true
  },
  token: {
    type: String
  },
  scheduled_sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  registered_sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  auto_schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoSchedule'
  }
});

UserSchema.methods.getBlockedTimes = function(callback) {
  var self = this;
  this.populate('registered_sections').populate('scheduled_sections', function(err, doc) {
    var blocked = {};
    doc.registered_sections.forEach(function(section) {
      section.setConflict(blocked);
    });
    doc.scheduled_sections.forEach(function(section) {
      section.setConflict(blocked);
    });
    callback(blocked);
  });
}

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

UserSchema.methods.hasSection = function(section_id, callback) {
  var self = this;
  self.populate('scheduled_sections')
      .populate('registered_sections', function(err, data) {
    var defSched = $.Deferred();
    var defReg = $.Deferred();
    var checkScheduled = function() {
      if(!self.scheduled_sections.length) {
        defSched.resolve();
      }
      self.scheduled_sections.forEach(function(section, index, arr) {
        if(section_id === section.section_id) {
          defSched.reject();
        }
        if(index === arr.length - 1) {
          defSched.resolve();
        }
      });
      return defSched.promise();
    }
    var checkRegistered = function() {
      if(!self.registered_sections.length) {
        defReg.resolve();
      }
      self.registered_sections.forEach(function(section, index, arr) {
        if(section_id === section.section_id) {
          defReg.reject();
        }
        if(index === arr.length - 1) {
          defReg.resolve();
        }
      });
      return defReg.promise();
    }
    $.when(checkScheduled(), checkRegistered()).then(function() { callback(false); },
      function() { callback(true); });
  });
}

var SALT_WORK_FACTOR = 10;
UserSchema.pre('save', function(next) {
  var user = this;
  if(!user.isModified('password')) return next();
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if(err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if(err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.generateBearerToken = function(cb) {
  this.token = crypto.randomBytes(32).toString('base64');
  this.save(cb);
}

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}
