var DatabasePopulator = require('../lib/db_populator').DatabasePopulator;

var populator = new DatabasePopulator();
console.log('Populating...');
populator.populateTerm('20151', function(data) {
	console.log(data);
});
