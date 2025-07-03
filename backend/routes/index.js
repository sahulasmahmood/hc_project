const express = require('express');
const router = express.Router();
const appointmentsRouter = require('./appointments');
const patientsRouter = require('./patients');
const settingsRouter = require('./settings');
const hospitalSettingsRouter = require('./hospitalSettings');
const emergencyRouter = require('./emergency');
// Use appointments routes
router.use('/', appointmentsRouter);
router.use('/patients', patientsRouter);
router.use('/', settingsRouter);
router.use('/', hospitalSettingsRouter);
router.use('/emergency', emergencyRouter);

module.exports = router;
