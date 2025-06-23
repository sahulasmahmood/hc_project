const express = require('express');
const router = express.Router();
const appointmentsRouter = require('./appointments');
const patientsRouter = require('./patients');

// Use appointments routes
router.use('/', appointmentsRouter);
router.use('/patients', patientsRouter);

module.exports = router;
