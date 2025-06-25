const express = require('express');
const router = express.Router();
const {
  getAppointmentSettings,
  saveAppointmentSettings,
} = require('../controllers/settings/appointmentSettings/appointmentSettings');

router.get('/appointment-settings', getAppointmentSettings);
router.post('/appointment-settings', saveAppointmentSettings);

module.exports = router;