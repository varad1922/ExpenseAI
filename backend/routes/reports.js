const express = require('express');
const router = express.Router();
const { exportCSV, exportPDF } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all export routes

router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

module.exports = router;
