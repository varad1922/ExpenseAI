const express = require('express');
const router = express.Router();
const {
  getBudgets,
  setBudget,
  deleteBudget,
  getBudgetStatus,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { budgetValidator } = require('../validations/validators');

router.use(protect); // Secure all budget routes

router.route('/')
  .get(getBudgets)
  .post(budgetValidator, setBudget);

router.route('/status')
  .get(getBudgetStatus);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
