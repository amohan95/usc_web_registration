var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  user_id: {
    type: Number,
  },
  username: {
    type: String,
    unique: true
  },
  scheduled_sections: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Section'
  }],
  registered_sections: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Section'
  }]
});

UserSchema.statics.getUserCourseData = function(username, callback) {
  this.findOne({ username: username }, function(err, user) {
    console.log(user);
    if(user.registered_sections.length) {
      User.findOne(user).populate('registered_sections')
          .populate('registered_sections.term', 'term_code')
          .populate('registered_sections.course')
          .exec(function(err, data) {
            user.registered_sections = data.registered_sections;
      });
    }
    if(user.scheduled_sections.length) {
      User.findOne(user).populate('scheduled_sections')
          .populate('scheduled_sections.term', 'term_code')
          .populate('registered_sections.course')
          .exec(function(err, data) {
            user.scheduled_sections = data.scheduled_sections;
      });
    }
    console.log(user);
    callback(user);
  });
}

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}