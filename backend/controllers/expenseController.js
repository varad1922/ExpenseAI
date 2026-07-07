const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

// Helper to check budget overrun
const checkBudgetExceeded = async (userId, category, amountChange, expenseDate) => {
  try {
    const date = new Date(expenseDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Check category specific budget
    const categoryBudget = await Budget.findOne({ user: userId, category, month, year });
    // Check total monthly budget
    const totalBudget = await Budget.findOne({ user: userId, category: 'Total', month, year });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get current total expenses for the category this month
    if (categoryBudget) {
      const categoryExpenses = await Expense.aggregate([
        {
          $match: {
            user: userId,
            category: category,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const currentTotal = (categoryExpenses[0]?.total || 0) + amountChange;
      if (currentTotal > categoryBudget.amount) {
        await Notification.create({
          user: userId,
          message: `Budget Exceeded! You spent ₹${currentTotal.toFixed(2)} on "${category}" this month, which exceeds your set budget of ₹${categoryBudget.amount.toFixed(2)}.`,
          type: 'budget_exceeded'
        });
      }
    }

    // Get overall total expenses this month
    if (totalBudget) {
      const overallExpenses = await Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const currentOverallTotal = (overallExpenses[0]?.total || 0) + amountChange;
      if (currentOverallTotal > totalBudget.amount) {
        await Notification.create({
          user: userId,
          message: `Total Budget Exceeded! Your overall monthly spending of ₹${currentOverallTotal.toFixed(2)} exceeds your set total budget of ₹${totalBudget.amount.toFixed(2)}.`,
          type: 'budget_exceeded'
        });
      }
    }
  } catch (error) {
    console.error('Error checking budget threshold:', error.message);
  }
};

// @desc    Get all expenses with search, filter, sort and pagination
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const {
      search,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query = { user: req.user.id };

    // Search filter (handles category, notes, description)
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include up to the end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Amount filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Sort setup
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with total count
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: expenses.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add an expense
// @route   POST /api/expenses
// @access  Private
exports.addExpense = async (req, res) => {
  try {
    const { amount, category, date, description, paymentMethod, notes, isAI_Categorized } = req.body;

    const expense = await Expense.create({
      user: req.user.id,
      amount: parseFloat(amount),
      category,
      date: date || new Date(),
      description,
      paymentMethod,
      notes,
      isAI_Categorized: isAI_Categorized || false,
    });

    // Check if budget is exceeded asynchronously
    await checkBudgetExceeded(req.user.id, category, parseFloat(amount), expense.date);

    res.status(201).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Edit an expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Verify ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    const originalAmount = expense.amount;
    const originalCategory = expense.category;

    // Apply updates
    const { amount, category, date, description, paymentMethod, notes } = req.body;
    
    expense.amount = amount !== undefined ? parseFloat(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.description = description !== undefined ? description : expense.description;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.notes = notes !== undefined ? notes : expense.notes;

    const updatedExpense = await expense.save();

    // Calculate delta for budget checker
    const amountChange = updatedExpense.amount - (originalCategory === updatedExpense.category ? originalAmount : 0);
    
    await checkBudgetExceeded(req.user.id, updatedExpense.category, amountChange, updatedExpense.date);

    res.json({
      success: true,
      expense: updatedExpense,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Verify ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregate category totals and summaries for current month dashboard
// @route   GET /api/expenses/summary
// @access  Private
exports.getExpenseSummary = async (req, res) => {
  try {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalExpense = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

    res.json({
      success: true,
      month,
      year,
      totalExpense,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
