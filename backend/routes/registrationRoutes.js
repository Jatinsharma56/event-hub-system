const express = require('express');
const router = express.Router();
const { registerForEvent, getRegistrations, markAttendance } = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, registerForEvent)
  .get(protect, getRegistrations);

router.route('/:id/attendance')
  .put(protect, admin, markAttendance);

module.exports = router;
