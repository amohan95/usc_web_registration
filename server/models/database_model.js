var mongoose = require('mongoose');
var Section = require('./section').Section;
var Session = require('./session').Session;
var Term = require('./term').Term;
var User = require('./user').User;

function DatabaseModel() { }

DatabaseModel.prototype.getUserSections = function getUserSections(user, term_code, callback) {
  User.getUserCourseData(user, term_code, function(data) {
    callback(data);
  });
}

DatabaseModel.prototype.scheduleSection = function(user, section_id, callback) {
  Section.findOne({section_id: section_id}, function(err, section) {
    user.hasSection(section.section_id, function(has) {
      if(!has) {
        user.scheduled_sections.push(section);
        user.save(callback({success: true}));
      } else {
        callback({success: false});
      }
    });
  });
}

DatabaseModel.prototype.scheduleSections = function(user, section_ids, callback) {
  Section.find({section_id: {$in: section_ids}}, function(err, sections) {
    var new_sections = sections.filter(function(i) {return user.scheduled_sections.indexOf(i) < 0;});
    user.scheduled_sections = user.scheduled_sections.concat(new_sections);
    user.save(callback({success: new_sections.length > 0}));
  });
}

DatabaseModel.prototype.registerSections = function(user, section_ids, callback) {
  user.populate('scheduled_sections', function(err, user) {
    var rejected_sections = [];
    for(var i = user.scheduled_sections.length - 1; i >= 0; --i) {
      if(section_ids.indexOf(user.scheduled_sections[i].section_id) >= 0) {
        var section = user.scheduled_sections[i];
        if(section.number_registered < section.number_seats) {
          user.scheduled_sections.splice(i, 1);
          section.number_registered++;
          section.save(function() {
            user.registered_sections.push(section);
          });
        } else {
          rejected_sections.push(section);
        }
      }
    }
    user.save(callback({success: true, rejected: rejected_sections}));
  });
}

DatabaseModel.prototype.unscheduleSection = function(user, section_id, callback) {
  var removed = false;
  for (var i = 0; i < user.scheduled_sections.length; ++i) {
    if(user.scheduled_sections[i].section_id == section_id) {
      user.scheduled_sections.splice(i, 1);
      removed = true
      break;
    }
  }
  user.save(callback({success: removed}));
}

DatabaseModel.prototype.registerSections = function(user, section_ids, callback) {
  for(var i = user.scheduled_sections.length - 1; i >= 0; --i) {
    if(section_ids.indexOf(user.scheduled_sections[i].section_id) >= 0) {
      user.registered_sections.push(user.scheduled_sections.splice(i, 1)[0]);
    }
  }
  user.save(callback({success: true}));
}

DatabaseModel.prototype.unregisterSections = function(user, section_ids, callback) {
  for (var i = user.registered_sections.length - 1; i >= 0; --i) {
    if(section_ids.indexOf(user.registered_sections[i].section_id) >= 0) {
      user.scheduled_sections.push(user.registered_sections.splice(i, 1)[0]);
    }
  }
  user.save(callback({success: true}));
}

module.exports = {
  DatabaseModel: DatabaseModel
};
