const { check, validationResult } = require('express-validator');

// Error handling middleware for validator results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const registerValidator = [
  check('name', 'Name is required').notEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  validateResults,
];

const loginValidator = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists(),
  validateResults,
];

const expenseValidator = [
  check('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
  check('category', 'Category is required').notEmpty().trim(),
  check('date', 'Please provide a valid date').optional().isISO8601(),
  check('paymentMethod', 'Invalid payment method')
    .optional()
    .isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other']),
  validateResults,
];

const incomeValidator = [
  check('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
  check('category', 'Category/Source is required').notEmpty().trim(),
  check('date', 'Please provide a valid date').optional().isISO8601(),
  validateResults,
];

const budgetValidator = [
  check('category', 'Category is required').notEmpty().trim(),
  check('amount', 'Amount must be a positive number or zero').isFloat({ min: 0 }),
  check('month', 'Month must be between 1 and 12').isInt({ min: 1, max: 12 }),
  check('year', 'Year must be a valid 4-digit year').isInt({ min: 2000, max: 2100 }),
  validateResults,
];

module.exports = {
  registerValidator,
  loginValidator,
  expenseValidator,
  incomeValidator,
  budgetValidator,
};
