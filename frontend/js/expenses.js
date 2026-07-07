let currentTransPage = 1;
const transLimit = 10;
let currentSortBy = 'date';
let currentSortOrder = 'desc';

async function loadTransactionsList() {
  const search = document.getElementById('transSearchInput').value.trim();
  const category = document.getElementById('transCategoryFilter').value;
  const startDate = document.getElementById('transStartDate').value;
  const endDate = document.getElementById('transEndDate').value;

  const urlParams = new URLSearchParams({
    page: currentTransPage,
    limit: transLimit,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder
  });

  if (search) urlParams.append('search', search);
  if (category) urlParams.append('category', category);
  if (startDate) urlParams.append('startDate', startDate);
  if (endDate) urlParams.append('endDate', endDate);

  try {
    const data = await API.get(`/expenses?${urlParams.toString()}`);
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    if (data.expenses && data.expenses.length > 0) {
      data.expenses.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
          <td><span class="badge" style="background:${ChartManager.colors[e.category] || '#6b7280'}15; color:${ChartManager.colors[e.category] || '#6b7280'};">${e.category}</span></td>
          <td>${e.description || 'No description'}</td>
          <td>${e.paymentMethod}</td>
          <td>${e.isAI_Categorized ? '<span class="badge ai-tagged"><i class="fa-solid fa-sparkles"></i> AI Categorized</span>' : '-'}</td>
          <td class="amount-col expense">-₹${e.amount.toFixed(2)}</td>
          <td>
            <div class="table-actions">
              <button class="icon-btn edit-btn" data-id="${e._id}" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="icon-btn delete delete-btn" data-id="${e._id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      // Hook event listeners to buttons
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          openEditExpenseModal(id);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          deleteExpenseRecord(id);
        });
      });

    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
            No matching expenses found.
          </td>
        </tr>
      `;
    }

    // Pagination info
    document.getElementById('paginationInfo').textContent = `Showing page ${data.currentPage} of ${data.pages || 1} (Total: ${data.total} records)`;
    
    // Disable state on buttons
    document.getElementById('prevPageBtn').disabled = currentTransPage <= 1;
    document.getElementById('nextPageBtn').disabled = currentTransPage >= data.pages;

  } catch (err) {
    console.error('Failed loading transactions:', err.message);
  }
}

// Open modal for editing
async function openEditExpenseModal(id) {
  try {
    // Get transaction details
    const data = await API.get(`/expenses`);
    const exp = data.expenses.find(x => x._id === id);
    if (!exp) return;

    // Set modal headers and values
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense Record';
    document.getElementById('editExpenseId').value = exp._id;
    document.getElementById('expenseAmount').value = exp.amount;
    document.getElementById('expenseCategory').value = exp.category;
    document.getElementById('expenseDate').value = new Date(exp.date).toISOString().split('T')[0];
    document.getElementById('expenseDesc').value = exp.description || '';
    document.getElementById('expensePayment').value = exp.paymentMethod;
    document.getElementById('expenseNotes').value = exp.notes || '';

    // Show modal
    document.getElementById('expenseModal').classList.add('active');
  } catch (err) {
    alert(err.message);
  }
}

// Delete transaction
async function deleteExpenseRecord(id) {
  if (confirm('Are you sure you want to delete this expense record?')) {
    try {
      await API.delete(`/expenses/${id}`);
      loadTransactionsList();
      if (window.refreshDashboard) window.refreshDashboard();
      if (window.refreshNotifications) window.refreshNotifications();
    } catch (err) {
      alert(`Error deleting expense: ${err.message}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const addExpenseForm = document.getElementById('addExpenseForm');
  const expenseModal = document.getElementById('expenseModal');
  
  // Populate category filters dynamically in transactions & report tabs
  const cats = ['Food', 'Shopping', 'Fuel', 'Rent', 'Bills', 'Entertainment', 'Travel', 'Medical', 'Other'];
  const transCat = document.getElementById('transCategoryFilter');
  const reportCat = document.getElementById('reportCategory');

  cats.forEach(cat => {
    const opt1 = document.createElement('option');
    opt1.value = cat;
    opt1.textContent = cat;
    transCat.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = cat;
    opt2.textContent = cat;
    reportCat.appendChild(opt2);
  });

  // Handle Form Submission (Add or Update)
  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editExpenseId').value;
      const amount = document.getElementById('expenseAmount').value;
      const category = document.getElementById('expenseCategory').value;
      const date = document.getElementById('expenseDate').value;
      const description = document.getElementById('expenseDesc').value;
      const paymentMethod = document.getElementById('expensePayment').value;
      const notes = document.getElementById('expenseNotes').value;

      const payload = { amount, category, date, description, paymentMethod, notes };

      try {
        if (id) {
          // Edit Mode
          await API.put(`/expenses/${id}`, payload);
        } else {
          // Add Mode
          await API.post('/expenses', payload);
        }
        expenseModal.classList.remove('active');
        addExpenseForm.reset();
        
        // Refresh views
        loadTransactionsList();
        if (window.refreshDashboard) window.refreshDashboard();
        if (window.refreshNotifications) window.refreshNotifications();
      } catch (err) {
        alert(`Error saving expense: ${err.message}`);
      }
    });
  }

  // Filter Listeners
  document.getElementById('transSearchInput').addEventListener('input', () => {
    currentTransPage = 1;
    loadTransactionsList();
  });
  document.getElementById('transCategoryFilter').addEventListener('change', () => {
    currentTransPage = 1;
    loadTransactionsList();
  });
  document.getElementById('transStartDate').addEventListener('change', () => {
    currentTransPage = 1;
    loadTransactionsList();
  });
  document.getElementById('transEndDate').addEventListener('change', () => {
    currentTransPage = 1;
    loadTransactionsList();
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('transSearchInput').value = '';
    document.getElementById('transCategoryFilter').value = '';
    document.getElementById('transStartDate').value = '';
    document.getElementById('transEndDate').value = '';
    currentTransPage = 1;
    loadTransactionsList();
  });

  // Pagination buttons
  document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentTransPage > 1) {
      currentTransPage--;
      loadTransactionsList();
    }
  });

  document.getElementById('nextPageBtn').addEventListener('click', () => {
    currentTransPage++;
    loadTransactionsList();
  });

  // Sorting
  document.getElementById('sortDate').addEventListener('click', () => {
    currentSortBy = 'date';
    currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    loadTransactionsList();
  });

  document.getElementById('sortAmount').addEventListener('click', () => {
    currentSortBy = 'amount';
    currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    loadTransactionsList();
  });
});
