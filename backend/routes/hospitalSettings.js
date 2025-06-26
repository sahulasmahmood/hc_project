const express = require('express');
const router = express.Router();
const {
  getHospitalSettings,
  saveHospitalSettings,
} = require('../controllers/settings/hospitalSettings/hospitalSettings');

router.get('/hospital-settings', getHospitalSettings);
router.post('/hospital-settings', saveHospitalSettings);

module.exports = router;