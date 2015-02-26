var mongoose = require('mongoose');
var crypto = require('crypto');
var User = require('./user').User;

var TokenSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	expiration: {
		type: Date,
		default: function() {
      return new Date(Date.now.valueOf() + 2*24*60*60*1000);
    }
	},
	token: {
		type: String
	}
});

TokenSchema.methods.generateBearerToken = function(cb) {
	this.token = crypto.randomBytes(32).toString('base64');
	this.save(cb);
}

var Token = mongoose.model('Token', TokenSchema);

module.exports = {
	Token: Token
}
