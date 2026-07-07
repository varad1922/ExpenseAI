const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  promptType: {
    type: String,
    required: true,
    enum: [
      'spending_analysis',
      'saving_suggestions',
      'budget_generator',
      'health_score',
      'monthly_summary',
      'receipt_scan',
      'chat'
    ],
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  outputResult: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

aiHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIHistory', aiHistorySchema);
