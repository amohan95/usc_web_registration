var express = require('express');
var router = express.Router();
var db = new (require('../models/database_model.js').DatabaseModel)();

router.post('/get_user_sections', function(req, res, next) {
  var body = req.body;
  if(body.username === undefined || body.term === undefined) {
    res.send({success: false});
  } else {
    db.getUserSections(body.username, body.term, function(data) {
      res.send(data);
    });
  }
});

router.post('/schedule_section', function(req, res, next) {
  var body = req.body;
  if(body.username === undefined || body.section_id === undefined) {
    res.send({success: false});
  } else {
    db.scheduleSection(body.username, body.section_id, function(data) {
      res.send(data);
    });
  }
});

router.post('/unschedule_section', function(req, res, next) {
  var body = req.body;
  if(body.username === undefined || body.section_id === undefined) {
    res.send({success: false});
  } else {
    db.unscheduleSection(body.username, body.section_id, function(data) {
      res.send(data);
    });
  }
});

router.post('/register_sections', function(req, res, next) {
  var body = req.body;
  if(body.username === undefined || body.section_ids === undefined) {
    res.send({success: false});
  } else {
    db.registerSections(body.username, body.section_ids, function(data) {
      res.send(data);
    });
  }
});

router.post('/unregister_sections', function(req, res, next) {
  var body = req.body;
  if(body.username === undefined || body.section_ids === undefined) {
    res.send({success: false});
  } else {
    db.unregisterSections(body.username, body.section_ids, function(data) {
      res.send(data);
    });
  }
});

module.exports = router;
