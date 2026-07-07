document.addEventListener('DOMContentLoaded', () => {
  // 1. Session verification
  const token = API.getToken();
  const user = API.getUser();

  if (!token || !user) {
    API.clearAuth();
    window.location.href = 'login.html';
    return;
  }

  // Set Profile Name and Role
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'Premium Member';

  // Toggle logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    API.clearAuth();
    window.location.href = 'login.html';
  });

  // 2. Tab Switching
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.dashboard-tab');
  const tabTitle = document.getElementById('tabTitle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');

      // Update Nav active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show target tab body
      tabs.forEach(tab => tab.classList.remove('active'));
      const activeTabEl = document.getElementById(`tab-${targetTab}`);
      if (activeTabEl) {
        activeTabEl.classList.add('active');
      }

      // Update Topbar Title
      tabTitle.textContent = item.querySelector('a').textContent.trim();

      // Trigger specific tab loads
      if (targetTab === 'dashboard') {
        loadDashboardStats();
      } else if (targetTab === 'transactions') {
        loadTransactionsList();
      } else if (targetTab === 'budgets') {
        loadBudgetsList();
      } else if (targetTab === 'ai-hub') {
        loadAIInsights();
      }
    });
  });

  // Shortcut links
  document.getElementById('viewAllTransBtn').addEventListener('click', () => {
    const transTab = document.querySelector('[data-tab="transactions"]');
    if (transTab) transTab.click();
  });

  // 3. Modals Opening & Closing
  const incomeModal = document.getElementById('incomeModal');
  const expenseModal = document.getElementById('expenseModal');
  
  // Close buttons
  document.getElementById('closeIncomeModal').addEventListener('click', () => incomeModal.classList.remove('active'));
  document.getElementById('closeExpenseModal').addEventListener('click', () => expenseModal.classList.remove('active'));
  
  // Open buttons
  document.getElementById('addIncomeBtn').addEventListener('click', () => {
    // Set date to today by default
    document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    incomeModal.classList.add('active');
  });

  document.getElementById('addExpenseBtn').addEventListener('click', () => {
    // Set default fields
    document.getElementById('expenseModalTitle').textContent = 'Add Expense Record';
    document.getElementById('editExpenseId').value = '';
    document.getElementById('addExpenseForm').reset();
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    expenseModal.classList.add('active');
  });

  // Close modals on overlay click
  window.addEventListener('click', (e) => {
    if (e.target === incomeModal) incomeModal.classList.remove('active');
    if (e.target === expenseModal) expenseModal.classList.remove('active');
  });

  // 4. Notifications Drawer
  const notifBell = document.getElementById('notifBell');
  const notifDrawer = document.getElementById('notifDrawer');
  const clearNotifs = document.getElementById('clearNotifs');

  notifBell.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDrawer.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!notifDrawer.contains(e.target) && e.target !== notifBell) {
      notifDrawer.classList.remove('active');
    }
  });

  clearNotifs.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await API.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error('Failed clearing notifications:', err.message);
    }
  });

  // Load Dashboard Aggregate metrics
  async function loadDashboardStats() {
    try {
      // 1. Load Expense summary
      const expenseSum = await API.get('/expenses/summary');
      // 2. Load Income summary
      const incomeSum = await API.get('/income/summary');

      const totalIncome = incomeSum.totalIncome || 0;
      const totalExpense = expenseSum.totalExpense || 0;
      const balance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

      // Update UI cards
      document.getElementById('dashTotalIncome').textContent = `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      document.getElementById('dashTotalExpense').textContent = `₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      
      const balanceEl = document.getElementById('dashBalance');
      balanceEl.textContent = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      if (balance < 0) {
        balanceEl.style.color = 'var(--accent-coral)';
      } else {
        balanceEl.style.color = 'var(--text-primary)';
      }

      document.getElementById('dashSavingsRate').textContent = `${savingsRate >= 0 ? savingsRate : 0}%`;
      document.getElementById('dashSavingsAmount').textContent = `₹${Math.max(0, balance).toLocaleString('en-IN')} saved`;

      // Update Chart
      ChartManager.updateCategoryChart('categoryChart', expenseSum.categoryBreakdown);

      // Load Recent Transactions Table
      loadRecentTransactions();
      
      // Update health score in overview
      loadHealthScoreOverview(totalIncome, totalExpense);

    } catch (err) {
      console.error('Failed loading stats:', err.message);
    }
  }

  // Load recent 5 transactions
  async function loadRecentTransactions() {
    try {
      const data = await API.get('/expenses?limit=5');
      const tbody = document.getElementById('recentTransactionsBody');
      tbody.innerHTML = '';

      if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach(e => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
            <td><span class="badge" style="background:${ChartManager.colors[e.category] || '#6b7280'}15; color:${ChartManager.colors[e.category] || '#6b7280'};">${e.category}</span></td>
            <td>${e.description || 'No description'}</td>
            <td style="color:var(--accent-coral); font-weight:500;">Expense</td>
            <td class="amount-col expense">-₹${e.amount.toFixed(2)}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
              No transactions recorded this month.
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  // Load health score display for dashboard
  async function loadHealthScoreOverview(income, expense) {
    try {
      const data = await API.get('/ai/health-score');
      const score = data.score || 0;
      
      // Conic gradient mapping
      const conic = document.getElementById('healthConic');
      if (conic) {
        conic.style.background = `conic-gradient(var(--accent-gold) 0% ${score}%, rgba(255, 255, 255, 0.05) ${score}% 100%)`;
      }

      document.getElementById('healthScoreText').textContent = score;
      
      let statusText = 'Fair';
      if (score >= 85) statusText = 'Excellent 🌟';
      else if (score >= 70) statusText = 'Healthy 👍';
      else if (score >= 50) statusText = 'Average ⚖️';
      else statusText = 'Needs Attention ⚠️';

      document.getElementById('healthStatusText').textContent = statusText;
    } catch (err) {
      console.error('Failed loading score overview:', err.message);
    }
  }

  // Load notifications from API
  async function loadNotifications() {
    try {
      const data = await API.get('/notifications');
      const list = document.getElementById('notifList');
      const badge = document.getElementById('notifBadge');
      
      const unreadCount = data.notifications.filter(n => !n.isRead).length;

      if (unreadCount > 0) {
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }

      list.innerHTML = '';
      if (data.notifications && data.notifications.length > 0) {
        data.notifications.forEach(n => {
          const item = document.createElement('div');
          item.className = `notification-item ${n.type}`;
          item.innerHTML = `
            <div style="font-weight:600; margin-bottom: 2px;">${n.type === 'budget_exceeded' ? 'Budget Exceeded' : 'Income Alert'}</div>
            <div>${n.message}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">${new Date(n.createdAt).toLocaleTimeString()}</div>
          `;
          
          if (!n.isRead) {
            item.style.background = 'rgba(224, 169, 109, 0.04)';
            item.addEventListener('click', async () => {
              await API.put(`/notifications/${n._id}/read`);
              loadNotifications();
            });
          }
          list.appendChild(item);
        });
      } else {
        list.innerHTML = `<div style="color:var(--text-secondary); font-size:0.8rem; text-align:center; padding: 1rem 0;">No new alerts</div>`;
      }
    } catch (err) {
      console.error('Notif load err:', err.message);
    }
  }

  // Save Income Submission
  const addIncomeForm = document.getElementById('addIncomeForm');
  addIncomeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('incomeAmount').value;
    const category = document.getElementById('incomeCategory').value;
    const date = document.getElementById('incomeDate').value;
    const description = document.getElementById('incomeDesc').value;

    try {
      await API.post('/income', { amount, category, date, description });
      incomeModal.classList.remove('active');
      addIncomeForm.reset();
      loadDashboardStats();
      loadNotifications();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Set global dashboard loads
  loadDashboardStats();
  loadNotifications();
  setInterval(loadNotifications, 30000); // refresh notifs every 30s

  // Expose triggers globally for other modules
  window.refreshDashboard = loadDashboardStats;
  window.refreshNotifications = loadNotifications;
});
