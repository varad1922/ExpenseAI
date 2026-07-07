const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Please specify category or "Total" for monthly budget'],
    default: 'Total', // 'Total' represents the total overall budget
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please specify budget amount'],
    min: [0, 'Budget amount cannot be negative'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
  },
}, {
  timestamps: true,
});

// Ensure a user has only one budget limit per category/total per month/year
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
