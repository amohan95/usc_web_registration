var config = require('../config').Config;

require('mongoose').connect(config.uristring);

var User = require('../models/user').User;
User.findOne({username: 'admin'}).populate('scheduled_sections').exec(function(err, user) {
  user.scheduled_sections[0].notifyUsersWithScheduledSection();
});
