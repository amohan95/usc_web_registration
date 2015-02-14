var mongoose = require('mongoose');
var Section = require('./section').Section;
var Session = require('./session').Session;
var Term = require('./term').Term;
var User = require('./user').User;

function DatabaseModel() { }

DatabaseModel.prototype.getUserSections = function getUserSections(username, term, callback) {
  var get_sections = function(username) {
    User.getUserCourseData(username, function(user) {
      var registered = [];
      for (var i = 0; i < user.registered_sections.length; ++i) {
        if(user.registered_sections[i].term.term_code === term) {
          registered.push(user.registered_sections[i]);
        }
      }
      var scheduled = [];
      for(var i = 0; i < user.scheduled_sections.length; ++i) {
        if(user.scheduled_sections[i].term.term_code === term) {
          scheduled.push(user.scheduled_sections[i]);
        }
      }
      callback({ registered: registered, scheduled: scheduled, success: true });
    });
  };

  User.findOne({ username: username }, function(err, user) {
    if(user == null) {
      user = new User({ username: username });
      user.save(function(err, u) {
        if(err) {
          console.log('ERROR: ' + err);
        }
        else {
          get_sections(username);
        }
      });
    }
    else {
      get_sections(username);
    }
  });
}

DatabaseModel.prototype.scheduleSection = function (username, section_id, callback) {
  Section.findOne({ section_id: section_id }, function(err, section) {
    if(section == null) {
      section = new Section({section_id: section_id});
      section.retrieve(function() {
        User.findOne({ username: username }, function(err, user) {
          user.scheduled_sections.push(section);
          user.save(callback({ success: true }));          
        });
      });
    }
    else {
      User.findOne({ username: username }, function(err, user) {
        user.scheduled_sections.push(section);
        user.scheduled_section = section;
        user.save(callback({ success: true }));
      });
    }
  });
}

DatabaseModel.prototype.unscheduleSection = function (username, section_id, callback) {
  User.findOne({ username: username }).populate('scheduled_sections')
      .exec(function(err, user) {
        for (var i = 0; i < user.scheduled_sections.length; ++i) {
          if(user.scheduled_sections[i].section_id === section_id) {
            user.scheduled_sections.splice(i, 1);
            break;
          }
        }
        user.save(callback({ success: true }));
      });
}

DatabaseModel.prototype.registerSections = function (username, section_ids, callback) {
  User.findOne({ username: username }).populate('scheduled_sections')
      .exec(function(err, user) {
        for (var i = user.scheduled_sections.length - 1; i >= 0; i--) {
          if(section_ids.indexOf(user.scheduled_sections[i].section_id) >= 0) {
            user.registered_sections.push(user.scheduled_sections.splice(i, 1)[0]);
          }
        }
        user.save(callback({ success: true }));
      });
}

DatabaseModel.prototype.unregisterSections = function (username, section_ids, callback) {
  User.findOne({ username: username }).populate('registered_sections')
      .exec(function(err, user) {
        for (var i = user.registered_sections.length - 1; i >= 0; --i) {
          if(section_ids.indexOf(user.registered_sections[i].section_id) >= 0) {
            user.scheduled_sections.push(user.registered_sections.splice(i, 1)[0]);
          }
        }
        user.save(callback({ success: true }));
      });
}

module.exports = DatabaseModel;