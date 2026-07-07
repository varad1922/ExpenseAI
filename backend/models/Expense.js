const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  category: {
    type: String,
    required: [true, 'Please add or select a category'],
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash',
  },
  isAI_Categorized: {
    type: Boolean,
    default: false,
  },
  receiptUrl: {
    type: String,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Adding index on User, Date, Category for search performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, amount: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
