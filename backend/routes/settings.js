const express = require('express');
const router = express.Router();
const {
  getAppointmentSettings,
  saveAppointmentSettings,
} = require('../controllers/settings/appointmentSettings/appointmentSettings');
const {
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
} = require('../controllers/settings/emailConfiguration/emailConfiguration');

// GET email config
router.get('/email-configuration', getEmailConfig);
// POST/PUT email config
router.post('/email-configuration', updateEmailConfig);
// PUT for test email
router.put('/email-configuration', testEmailConfig);
router.get('/appointment-settings', getAppointmentSettings);
router.post('/appointment-settings', saveAppointmentSettings);

module.exports = router;