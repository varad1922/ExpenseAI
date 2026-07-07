const Income = require('../models/Income');
const Notification = require('../models/Notification');

// @desc    Get all incomes with search, filter, sort and pagination
// @route   GET /api/income
// @access  Private
exports.getIncomes = async (req, res) => {
  try {
    const {
      search,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user.id };

    // Search filter
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Sort setup
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count
    const total = await Income.countDocuments(query);
    const incomes = await Income.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: incomes.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      incomes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add an income
// @route   POST /api/income
// @access  Private
exports.addIncome = async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    const income = await Income.create({
      user: req.user.id,
      amount: parseFloat(amount),
      category: category || 'Salary',
      date: date || new Date(),
      description,
    });

    // Notify if category is Salary or Investments
    if (category.toLowerCase() === 'salary' || category.toLowerCase() === 'investments') {
      await Notification.create({
        user: req.user.id,
        message: `Income Alert: You received a payment of ₹${parseFloat(amount).toFixed(2)} under category "${category}".`,
        type: 'salary_received'
      });
    }

    res.status(201).json({
      success: true,
      income,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Edit an income
// @route   PUT /api/income/:id
// @access  Private
exports.updateIncome = async (req, res) => {
  try {
    let income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    // Verify ownership
    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    const { amount, category, date, description } = req.body;

    income.amount = amount !== undefined ? parseFloat(amount) : income.amount;
    income.category = category || income.category;
    income.date = date || income.date;
    income.description = description !== undefined ? description : income.description;

    const updatedIncome = await income.save();

    res.json({
      success: true,
      income: updatedIncome,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an income
// @route   DELETE /api/income/:id
// @access  Private
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    // Verify ownership
    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await income.deleteOne();

    res.json({
      success: true,
      message: 'Income record removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregate income totals and monthly details
// @route   GET /api/income/summary
// @access  Private
exports.getIncomeSummary = async (req, res) => {
  try {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sourceBreakdown = await Income.aggregate([
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

    const totalIncome = sourceBreakdown.reduce((sum, item) => sum + item.total, 0);

    res.json({
      success: true,
      month,
      year,
      totalIncome,
      sourceBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
