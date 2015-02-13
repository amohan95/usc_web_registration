var express = require('express');
var router = express.Router();

router.post('/get_user_sections', function(req, res, next) {
  req.db.getUserSections(req.username, req.term, function(data) {
    res.send(data);
  });
});

router.post('/schedule_section', function(req, res, next) {
  req.db.scheduleSection(req.username, req.section_id, function(data) {
    res.send(data);
  });
});

router.post('/unschedule_section', function(req, res, next) {
  req.db.unscheduleSection(req.username, req.section_id, function(data) {
    res.send(data);
  });
});

router.post('/register_sections', function(req, res, next) {
  req.db.registerSections(req.username, req.section_ids, function(data) {
    res.send(data);
  });
});

router.post('/unregister_section', function(req, res, next) {
  req.db.unregisterSections(req.username, req.section_ids, function(data) {
    res.send(data);
  });
});

module.exports = router;
