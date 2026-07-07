const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get all budgets for a given month and year
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const budgets = await Budget.find({
      user: req.user.id,
      month,
      year,
    });

    res.json({
      success: true,
      month,
      year,
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set or update a category budget
// @route   POST /api/budgets
// @access  Private
exports.setBudget = async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    const query = {
      user: req.user.id,
      category,
      month: parseInt(month),
      year: parseInt(year),
    };

    const update = {
      amount: parseFloat(amount),
    };

    // upsert: true will create the document if it doesn't exist, or update if it does
    const budget = await Budget.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      budget,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget record not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Budget record deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tracking status (budget vs actual expenses) for a specific month
// @route   GET /api/budgets/status
// @access  Private
exports.getBudgetStatus = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get user's budgets
    const budgets = await Budget.find({ user: req.user.id, month, year });

    // Aggregate actual expenses by category
    const actualExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    // Map aggregate actual costs
    const actualMap = {};
    let totalSpentOverall = 0;
    actualExpenses.forEach((exp) => {
      actualMap[exp._id] = exp.totalSpent;
      totalSpentOverall += exp.totalSpent;
    });

    // Merge budget and actual values
    const status = budgets.map((b) => {
      const spent = b.category === 'Total' ? totalSpentOverall : (actualMap[b.category] || 0);
      const remaining = b.amount - spent;
      const usagePercentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      return {
        id: b._id,
        category: b.category,
        budgetLimit: b.amount,
        spent,
        remaining,
        usagePercentage,
        isExceeded: spent > b.amount,
      };
    });

    // Check if total is present, if not add custom total row if there is any budget
    const hasTotalBudget = budgets.some((b) => b.category === 'Total');
    if (!hasTotalBudget && budgets.length > 0) {
      status.push({
        id: null,
        category: 'Total (Calculated)',
        budgetLimit: budgets.filter(b => b.category !== 'Total').reduce((acc, curr) => acc + curr.amount, 0),
        spent: totalSpentOverall,
        remaining: budgets.filter(b => b.category !== 'Total').reduce((acc, curr) => acc + curr.amount, 0) - totalSpentOverall,
        usagePercentage: budgets.filter(b => b.category !== 'Total').reduce((acc, curr) => acc + curr.amount, 0) > 0 
          ? Math.round((totalSpentOverall / budgets.filter(b => b.category !== 'Total').reduce((acc, curr) => acc + curr.amount, 0)) * 100) 
          : 0,
        isExceeded: totalSpentOverall > budgets.filter(b => b.category !== 'Total').reduce((acc, curr) => acc + curr.amount, 0),
      });
    }

    res.json({
      success: true,
      month,
      year,
      totalSpentOverall,
      status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
