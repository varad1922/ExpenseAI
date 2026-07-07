const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../backend/models/User');
const Income = require('../backend/models/Income');
const Expense = require('../backend/models/Expense');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Database Connected Successfully');
    const users = await User.find();
    console.log('Total Users:', users.length);
    for (const u of users) {
      const inc = await Income.find({ user: u._id });
      const exp = await Expense.find({ user: u._id });
      console.log(`User: ${u.name} | Email: ${u.email} | ID: ${u._id}`);
      console.log(`  Incomes: count=${inc.length}, sum=${inc.reduce((s, i) => s + i.amount, 0)}`);
      console.log(`  Expenses: count=${exp.length}, sum=${exp.reduce((s, e) => s + e.amount, 0)}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
