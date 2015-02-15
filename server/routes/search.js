var express = require('express');
var router = express.Router();
var Query = require('../search/query').Query;

router.get('/execute_query', function(req, res, next) {
  var query = new Query();
  // var parameters = {course_code: true, course_title: true};
  var parameters = {none: true};
  query.executeQuery('appropriate attit', parameters, function(data) {
    res.send(data);
  })
});

module.exports = router;