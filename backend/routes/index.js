const express = require('express');
const router = express.Router();
const appointmentsRouter = require('./appointments');
const patientsRouter = require('./patients');
const settingsRouter = require('./settings');


// Use appointments routes
router.use('/', appointmentsRouter);
router.use('/patients', patientsRouter);
router.use('/', settingsRouter);

module.exports = router;
