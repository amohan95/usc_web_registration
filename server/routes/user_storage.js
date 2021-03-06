var express = require('express');
var passport = require('passport');
var router = express.Router();
var db = new (require('../models/database_model.js').DatabaseModel)();

router.get('/get_user_sections', passport.authenticate('bearer'), function(req, res, next) {
  if(req.query.term === undefined) {
    res.send({success: false});
  } else {
    db.getUserSections(req.user, req.query.term, function(data) {
      res.send(data);
    });
  }
});

router.post('/schedule_section', passport.authenticate('bearer'), function(req, res, next) {
  if(req.body.section_id === undefined) {
    res.send({success: false});
  } else {
    db.scheduleSection(req.user, req.body.section_id, function(data) {
      res.send(data);
    });
  }
});

router.post('/schedule_sections', passport.authenticate('bearer'), function(req, res, next) {
  if(req.body.section_ids === undefined) {
    res.send({success: false});
  } else {
    db.scheduleSections(req.user, req.body.section_ids, function(data) {
      res.send(data);
    });
  }
});

router.post('/unschedule_section', passport.authenticate('bearer'), function(req, res, next) {
  console.log(req.body);
  if(req.body.section_id === undefined) {
    res.send({success: false});
  } else {
    db.unscheduleSection(req.user, req.body.section_id, function(data) {
      res.send(data);
    });
  }
});

router.post('/register_sections', passport.authenticate('bearer'), function(req, res, next) {
  db.registerSections(req.user, function(data) {
    res.send(data);
  });
});

router.post('/unregister_sections', passport.authenticate('bearer'), function(req, res, next) {
  if(req.body.course_code === undefined) {
    res.send({success: false});
  } else {
    db.unregisterSections(req.user, req.body.course_code, function(data) {
      res.send(data);
    });
  }
});

module.exports = router;
