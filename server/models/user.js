var mongoose = require('mongoose');
var async = require('async');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var Section = require('./section').Section;
var Course = require('./course').Course;

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
  }]
});

UserSchema.methods.getBlockedTimes = function(callback) {
  this.populate('registered_sections', function(err, self) {
    var blocked = {};
    self.scheduled_sections.forEach(function(section) {
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
