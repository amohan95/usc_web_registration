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

  User.findOne({username: username}, function(err, user) {
    if(user == null) {
      user = new User({ username: username });
      user.save(function(err, u) {
        if(err) {
          callback({success: false});
        } else {
          getSections(user);
        }
      });
    } else {
      getSections(user);
    }
  });
}

DatabaseModel.prototype.scheduleSection = function(username, section_id, callback) {
  Section.findOne({section_id: section_id}, function(err, section) {
    User.findOne({username: username}, function(e, user) {
      if(user === null || section === null) {
        callback({success: false});
        return;
      }
      user.hasSection(section.section_id, function(has) {
        if(!has) {
          user.scheduled_sections.push(section);
          user.save(callback({success: true}));
        } else {
          callback({success: false});
        }
      });
    });
  });
}

DatabaseModel.prototype.unscheduleSection = function(username, section_id, callback) {
  User.findOne({username: username}).populate('scheduled_sections').exec(function(err, user) {
    var removed = false;
    for (var i = 0; i < user.scheduled_sections.length; ++i) {
      if(user.scheduled_sections[i].section_id == section_id) {
        user.scheduled_sections.splice(i, 1);
        removed = true
        break;
      }
    }
    user.save(callback({success: removed}));
  });
}

DatabaseModel.prototype.registerSections = function(username, section_ids, callback) {
  User.findOne({username: username}).populate('scheduled_sections').exec(function(err, user) {
    for(var i = user.scheduled_sections.length - 1; i >= 0; --i) {
      if(section_ids.indexOf(user.scheduled_sections[i].section_id) >= 0) {
        user.registered_sections.push(user.scheduled_sections.splice(i, 1)[0]);
      }
    }
    user.save(callback({success: true}));
  });
}

DatabaseModel.prototype.unregisterSections = function(username, section_ids, callback) {
  User.findOne({username: username}).populate('registered_sections').exec(function(err, user) {
    for (var i = user.registered_sections.length - 1; i >= 0; --i) {
      if(section_ids.indexOf(user.registered_sections[i].section_id) >= 0) {
        user.scheduled_sections.push(user.registered_sections.splice(i, 1)[0]);
      }
    }
    user.save(callback({success: true}));
  });
}

module.exports = {
  DatabaseModel: DatabaseModel
};