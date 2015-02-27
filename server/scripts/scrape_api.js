var DatabasePopulator = require('../lib/db_populator').DatabasePopulator;
var config = require('./config').Config;

require('mongoose').connect(config.uristring);

var populator = new DatabasePopulator();
console.log('Populating...');
populator.populateTerm('20151', function(data) {
	console.log(data);
});
