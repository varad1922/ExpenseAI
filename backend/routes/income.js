const express = require('express');
const router = express.Router();
const {
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { incomeValidator } = require('../validations/validators');

router.use(protect); // Secure all income routes

router.route('/')
  .get(getIncomes)
  .post(incomeValidator, addIncome);

router.route('/summary')
  .get(getIncomeSummary);

router.route('/:id')
  .put(incomeValidator, updateIncome)
  .delete(deleteIncome);

module.exports = router;
