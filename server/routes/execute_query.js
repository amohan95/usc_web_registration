var express = require('express');
var router = express.Router();
var Query = require('../search/query').Query;

router.post('/execute_query', function(req, res, next) {
  var body = req.body;
  if(body.query_string === undefined || body.term === undefined || body.parameters === undefined) {
    res.send({success: false});
  } else {
    var query = new Query();
    query.executeQuery(body.query_string, body.term, body.parameters, function(data) {
      res.send(data);
    });
  }
});

router.get('/execute_query', function(req, res, next) {
  var body = req.query;
  if(body.query_string === undefined || body.term === undefined || body.parameters === undefined) {
    res.send({success: false});
  } else {
    var query = new Query();
    query.executeQuery(body.query_string, body.term, body.parameters, function(data) {
      res.send(data);
    });
  }
});

module.exports = router;