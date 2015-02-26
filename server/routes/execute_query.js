var express = require('express');
var router = express.Router();
var passport = require('passport');
var Query = require('../search/query').Query;

router.post('/execute_query', passport.authenticate('bearer'), function(req, res, next) {
  var body = req.body;
  if(body.query_string === undefined || body.term === undefined || body.parameters === undefined) {
    res.send({success: false});
  } else {
    var query = new Query();
    query.executeQuery(body.query_string, body.term, req.user.username, body.parameters, function(data) {
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

router.post('/get_sections_for_course', passport.authenticate('bearer'), function(req, res, next) {
  if(req.body.course_id === undefined) {
    res.send({success: false});
  } else {
    var query = new Query();
    query.getSectionsForCourse(req.body.course_id, req.user.username, function(data) {
      res.send(data);
    });
  }
});

module.exports = router;