function Config() { }

Config.uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL ||
                        'mongodb://localhost/web_reg_data';

Config.port = process.env.PORT || 8000;

module.exports = {
  Config: Config
}