const express = require('express');
const router = express.Router();
const {
  getSpendingAnalysis,
  generateBudget,
  getFinancialHealthScore,
  scanReceipt,
  chat,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // Secure all AI endpoints

router.post('/analyze', getSpendingAnalysis);
router.post('/generate-budget', generateBudget);
router.get('/health-score', getFinancialHealthScore);
router.post('/scan-receipt', upload.single('receipt'), scanReceipt);
router.post('/chat', chat);

module.exports = router;
