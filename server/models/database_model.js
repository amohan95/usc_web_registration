function DatabaseModel(db_addr) {
  this.mongo_db = require('mongoose').connect(db_addr);
}

DatabaseModel.add_section = function(userId, section) {
  
};

DatabaseModel.remove_section = function(userId, section) {

}

DatabaseModel.schedule_sections = function(userId, sections) {

}

module.exports = DatabaseModel;