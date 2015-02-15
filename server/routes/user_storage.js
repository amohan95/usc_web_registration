var express = require('express');
var router = express.Router();
var dbModel = require('../models/database_model.js');
var db = new dbModel();

var TEST_USER = 'Ananth';
var TEST_SECTION = 6780;


router.get('/get_user_sections', function(req, res, next) {
  db.getUserSections(TEST_USER, '20143', function(data) {
    res.send(data);
  });
  // db.getUserSections(req.username, req.term, function(data) {
  //   res.send(data);
  // });
});

router.get('/schedule_section', function(req, res, next) {
  db.scheduleSection(TEST_USER, TEST_SECTION, function(data) {
    res.send(data);
  });
  // db.scheduleSection(req.username, req.section_id, function(data) {
  //   res.send(data);
  // });
});

router.get('/unschedule_section', function(req, res, next) {
  db.unscheduleSection(TEST_USER, TEST_SECTION, function(data) {
    res.send(data);
  });
  // db.unscheduleSection(req.username, req.section_id, function(data) {
  //   res.send(data);
  // });
});

router.get('/register_sections', function(req, res, next) {
  db.registerSections(TEST_USER, [TEST_SECTION], function(data) {
    res.send(data);
  });
  // db.registerSections(req.username, req.section_ids, function(data) {
  //   res.send(data);
  // });
});

router.get('/unregister_sections', function(req, res, next) {
  db.unregisterSections(TEST_USER, [TEST_SECTION], function(data) {
    res.send(data);
  });
  // db.unregisterSections(req.username, req.section_ids, function(data) {
  //   res.send(data);
  // });
});

module.exports = router;
