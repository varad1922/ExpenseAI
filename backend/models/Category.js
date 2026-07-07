const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: [true, 'Please specify category type (expense or income)'],
  },
  color: {
    type: String,
    default: '#3b82f6', // Hex color representation for charts
  },
  icon: {
    type: String,
    default: 'fa-tag', // FontAwesome icon class
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null indicates it's a system default category
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Ensure a user cannot have duplicate categories with the same name and type
categorySchema.index({ name: 1, type: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
