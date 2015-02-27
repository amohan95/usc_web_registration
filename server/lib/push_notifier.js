var gcm = require('node-gcm');
var Config = require('../config').Config;

var GCMSender = new gcm.Sender(Config.GOOGLE_API_KEY);

var PushNotifier = {};

PushNotifier.sendPushNotification = function(title, description, reg_ids, cb) {
	var message = new gcm.Message();
	message.addData('message', description);
	message.addData('title', title);
	message.addData('msgcnt','3');
	GCMSender.send(message, reg_ids, cb);
};

module.exports = {
	PushNotifier: PushNotifier
}
