var mongoose = require('mongoose');
var Section = require('./section').Section;
var Session = require('./session').Session;
var Term = require('./term').Term;
var User = require('./user').User;

function DatabaseModel() { }

DatabaseModel.prototype.getUserSections = function getUserSections(username, term_code, callback) {
  var getSections = function(user) {
    User.getUserCourseData(user, term_code, function(data) {
      callback(data);
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
          getSections(user);
        }
      });
    }
    else {
      getSections(user);
    }
  });
}

DatabaseModel.prototype.scheduleSection = function(username, section_id, callback) {
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

DatabaseModel.prototype.unscheduleSection = function(username, section_id, callback) {
  User.findOne({ username: username }).populate('scheduled_sections').exec(function(err, user) {
    user.scheduled_sections.forEach(function(section, index, arr) {
      if(section.section_id === section_id) {
        user.scheduled_sections.splice(index, 1);
        user.save(callback({sucess: true}));
        return;
      }
      if(index === arr.length - 1) {
        callback({success: false});
      }
    });
  });
}

DatabaseModel.prototype.registerSections = function(username, section_ids, callback) {
  User.findOne({ username: username }).populate('scheduled_sections').exec(function(err, user) {
    user.scheduled_sections.forEach(function(section, index, arr) {
      if(section_ids.indexOf(section.section_id) >= 0) {
        user.registered_sections.push(user.scheduled_sections.splice(index, 1)[0]);
      }
    });
    user.save(callback({success: true}));
  });
}

DatabaseModel.prototype.unregisterSections = function(username, section_ids, callback) {
  User.findOne({ username: username }).populate('registered_sections').exec(function(err, user) {
    user.registered_sections.forEach(function(section, index, arr) {
      if(section_ids.indexOf(section.section_id) >= 0) {
        user.scheduled_sections.push(user.registered_sections.splice(index, 1)[0]);
      }
    });
    user.save(callback({success: true}));
  });
}

module.exports = DatabaseModel;