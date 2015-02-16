var express = require('express');
var router = express.Router();
var Query = require('../search/query').Query;

router.get('/execute_query', function(req, res, next) {
  var query = new Query();
  query.executeQuery(req.query_string, req.term, req.parameters, function(data) {
    res.send(data);
  })
});

module.exports = router;