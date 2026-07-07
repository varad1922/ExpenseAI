const aiService = require('../services/aiService');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const AIHistory = require('../models/AIHistory');

// Helper to compile current month stats for the logged-in user
const getFinancialContext = async (user) => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Get total income
  const incomes = await Income.find({ user: user._id, date: { $gte: startOfMonth, $lte: endOfMonth } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // 2. Get total expenses
  const expenses = await Expense.find({ user: user._id, date: { $gte: startOfMonth, $lte: endOfMonth } });
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Get budgets status
  const budgets = await Budget.find({ user: user._id, month, year });
  const actualMap = {};
  expenses.forEach((e) => {
    actualMap[e.category] = (actualMap[e.category] || 0) + e.amount;
  });

  let exceededBudgetsCount = 0;
  const budgetsStatus = budgets.map((b) => {
    const spent = b.category === 'Total' ? totalExpense : (actualMap[b.category] || 0);
    const exceeded = spent > b.amount;
    if (exceeded) exceededBudgetsCount++;

    return {
      category: b.category,
      budgetLimit: b.amount,
      spent,
      isExceeded: exceeded,
    };
  });

  // 4. Get recent expenses (last 20)
  const recentExpenses = await Expense.find({ user: user._id })
    .sort({ date: -1 })
    .limit(20)
    .select('amount category date description');

  return {
    userName: user.name,
    totalIncome,
    totalExpense,
    exceededBudgetsCount,
    budgetsStatus,
    recentExpenses,
  };
};

// @desc    Perform AI Spending Analysis
// @route   POST /api/ai/analyze
// @access  Private
exports.getSpendingAnalysis = async (req, res) => {
  try {
    const context = await getFinancialContext(req.user);
    const expenses = await Expense.find({ user: req.user._id });

    const result = await aiService.analyzeSpendingAndSuggest(expenses, context.totalIncome);

    // Save to history
    await AIHistory.create({
      user: req.user._id,
      promptType: 'spending_analysis',
      inputData: { expensesCount: expenses.length, totalIncome: context.totalIncome },
      outputResult: result,
    });

    res.json({
      success: true,
      analysis: result.analysisText,
      suggestions: result.savingsSuggestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a recommended budget split based on Salary
// @route   POST /api/ai/generate-budget
// @access  Private
exports.generateBudget = async (req, res) => {
  try {
    const { salary } = req.body;

    if (!salary || isNaN(salary) || salary <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid positive salary amount' });
    }

    const recommendations = await aiService.generateBudgetRecommendations(parseFloat(salary));

    await AIHistory.create({
      user: req.user._id,
      promptType: 'budget_generator',
      inputData: { salary: parseFloat(salary) },
      outputResult: recommendations,
    });

    res.json({
      success: true,
      salary: parseFloat(salary),
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Financial Health Score
// @route   GET /api/ai/health-score
// @access  Private
exports.getFinancialHealthScore = async (req, res) => {
  try {
    const context = await getFinancialContext(req.user);

    const result = await aiService.calculateFinancialHealthScore(
      context.totalIncome,
      context.totalExpense,
      context.budgetsStatus
    );

    await AIHistory.create({
      user: req.user._id,
      promptType: 'health_score',
      inputData: { income: context.totalIncome, expense: context.totalExpense },
      outputResult: result,
    });

    res.json({
      success: true,
      score: result.score,
      strengths: result.strengths,
      improvements: result.improvements,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Scan uploaded receipt image and automatically create an expense
// @route   POST /api/ai/scan-receipt
// @access  Private
exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a receipt image' });
    }

    const filePath = req.file.path;
    const result = await aiService.scanReceiptImage(filePath);

    // Automatically create an expense based on receipt details
    const expense = await Expense.create({
      user: req.user._id,
      amount: parseFloat(result.amount),
      category: result.suggestedCategory,
      date: result.date ? new Date(result.date) : new Date(),
      description: `Receipt Upload: ${result.storeName}`,
      notes: `Extracted items:\n${result.items?.map(i => `- ${i.name}: ₹${i.cost}`).join('\n') || 'None'}`,
      isAI_Categorized: true,
      receiptUrl: `/uploads/${req.file.filename}`, // Relative path for frontend serving
    });

    await AIHistory.create({
      user: req.user._id,
      promptType: 'receipt_scan',
      inputData: { filename: req.file.filename },
      outputResult: { scanResult: result, expenseCreatedId: expense._id },
    });

    res.status(201).json({
      success: true,
      message: 'Receipt scanned and expense created automatically!',
      extractedData: result,
      expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Financial Chatbot conversation endpoint
// @route   POST /api/ai/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const context = await getFinancialContext(req.user);

    // Get response from service
    const reply = await aiService.chatFinancialAdvisor(message, history, context);

    await AIHistory.create({
      user: req.user._id,
      promptType: 'chat',
      inputData: { message, historyLength: history.length },
      outputResult: { reply },
    });

    res.json({
      success: true,
      reply,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
