const express = require('express');
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { expenseValidator } = require('../validations/validators');

router.use(protect); // Secure all expense routes

router.route('/')
  .get(getExpenses)
  .post(expenseValidator, addExpense);

router.route('/summary')
  .get(getExpenseSummary);

router.route('/:id')
  .put(expenseValidator, updateExpense)
  .delete(deleteExpense);

module.exports = router;
