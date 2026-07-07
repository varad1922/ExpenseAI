const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve static upload folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend assets statically from the root if deployed or needed
app.use(express.static(path.join(__dirname, '../frontend')));

// Route Files
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/income');
const budgetRoutes = require('./routes/budgets');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const reportRoutes = require('./routes/reports');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

// SPA Fallback for dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/login.html'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
