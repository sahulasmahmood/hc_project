const express = require('express');
const router = express.Router();
const appointmentsRouter = require('./appointments');
const patientsRouter = require('./patients');
const settingsRouter = require('./settings');
const hospitalSettingsRouter = require('./hospitalSettings');

// Use appointments routes
router.use('/', appointmentsRouter);
router.use('/patients', patientsRouter);
router.use('/', settingsRouter);
router.use('/', hospitalSettingsRouter);

module.exports = router;
