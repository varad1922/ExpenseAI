const Expense = require('../models/Expense');
const Income = require('../models/Income');
const PDFDocument = require('pdfkit');

// @desc    Export Expenses and Incomes as a CSV file
// @route   GET /api/reports/export/csv
// @access  Private
exports.exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const filter = { user: req.user.id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    const incomes = await Income.find(filter).sort({ date: -1 });

    // Combine both incomes and expenses
    const records = [];
    expenses.forEach(e => {
      records.push({
        date: e.date.toISOString().split('T')[0],
        type: 'Expense',
        category: e.category,
        amount: e.amount,
        description: e.description || '',
        paymentMethod: e.paymentMethod || '',
      });
    });

    incomes.forEach(i => {
      records.push({
        date: i.date.toISOString().split('T')[0],
        type: 'Income',
        category: i.category,
        amount: i.amount,
        description: i.description || '',
        paymentMethod: 'Bank Transfer', // Default for income
      });
    });

    // Sort combined records by date descending
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Construct CSV String
    let csvContent = 'Date,Type,Category,Amount (INR),Description,Payment Method\n';
    records.forEach(r => {
      // Escape descriptions or entries containing commas
      const desc = r.description.replace(/"/g, '""');
      const cat = r.category.replace(/"/g, '""');
      csvContent += `"${r.date}","${r.type}","${cat}",${r.amount},"${desc}","${r.paymentMethod}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ExpenseAI_Report_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Expenses and Incomes as a styled PDF report
// @route   GET /api/reports/export/pdf
// @access  Private
exports.exportPDF = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const filter = { user: req.user.id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    const incomes = await Income.find(filter).sort({ date: -1 });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Create a PDF Document
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ExpenseAI_Report_${Date.now()}.pdf`);

    doc.pipe(res);

    // Document Header / Title
    doc.fillColor('#0f172a').fontSize(24).text('ExpenseAI Statement', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Summary Card styling
    doc.rect(50, 110, 500, 70).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(12).text('FINANCIAL SUMMARY', 65, 120, { bold: true });
    doc.fontSize(10).fillColor('#475569');
    doc.text(`Total Income: INR ${totalIncome.toFixed(2)}`, 65, 140);
    doc.text(`Total Expenses: INR ${totalExpense.toFixed(2)}`, 230, 140);
    
    if (netBalance >= 0) {
      doc.fillColor('#16a34a').text(`Net Savings: INR ${netBalance.toFixed(2)}`, 390, 140);
    } else {
      doc.fillColor('#dc2626').text(`Net Deficit: INR ${Math.abs(netBalance).toFixed(2)}`, 390, 140);
    }
    doc.moveDown(3);

    // Add table of transactions
    doc.fillColor('#0f172a').fontSize(14).text('Transaction History', 50, 200);
    doc.moveDown(0.5);

    // Table Header
    let y = 220;
    doc.fillColor('#0f172a').fontSize(10);
    doc.text('Date', 50, y, { bold: true });
    doc.text('Type', 130, y, { bold: true });
    doc.text('Category', 200, y, { bold: true });
    doc.text('Amount', 320, y, { bold: true });
    doc.text('Description', 400, y, { bold: true });

    // Draw separator line
    doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#cbd5e1');
    y += 25;

    // Combine & Sort records
    const records = [];
    expenses.forEach(e => {
      records.push({
        date: e.date.toISOString().split('T')[0],
        type: 'Expense',
        category: e.category,
        amount: `-INR ${e.amount.toFixed(2)}`,
        color: '#dc2626',
        description: e.description || '-',
      });
    });

    incomes.forEach(i => {
      records.push({
        date: i.date.toISOString().split('T')[0],
        type: 'Income',
        category: i.category,
        amount: `+INR ${i.amount.toFixed(2)}`,
        color: '#16a34a',
        description: i.description || '-',
      });
    });

    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Print records
    records.forEach(r => {
      if (y > 700) {
        doc.addPage();
        y = 50; // reset y coordinate on new page
      }

      doc.fillColor('#475569');
      doc.text(r.date, 50, y);
      doc.text(r.type, 130, y);
      doc.text(r.category, 200, y);
      
      // Color code amount
      doc.fillColor(r.color).text(r.amount, 320, y);
      
      doc.fillColor('#475569').text(r.description.length > 25 ? `${r.description.substring(0, 22)}...` : r.description, 400, y);

      y += 20;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
