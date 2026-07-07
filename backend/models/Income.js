const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
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
    required: [true, 'Please add or select a category/source'],
    default: 'Salary',
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
}, {
  timestamps: true,
});

incomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
