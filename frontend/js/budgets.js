let aiBudgetSplits = null;

async function loadBudgetsList() {
  const month = document.getElementById('budgetMonth').value;
  const year = document.getElementById('budgetYear').value;

  try {
    const data = await API.get(`/budgets/status?month=${month}&year=${year}`);
    const container = document.getElementById('budgetStatusList');
    container.innerHTML = '';

    if (data.status && data.status.length > 0) {
      data.status.forEach(b => {
        const div = document.createElement('div');
        div.className = 'budget-bar-group';
        
        let colorClass = '';
        if (b.isExceeded) {
          colorClass = 'exceeded';
        } else if (b.usagePercentage > 80) {
          colorClass = 'warning';
        }

        const barWidth = Math.min(100, b.usagePercentage);

        div.innerHTML = `
          <div class="budget-bar-label">
            <span><strong>${b.category}</strong> (${b.usagePercentage}%)</span>
            <span>Spent: ₹${b.spent.toLocaleString('en-IN')} / Limit: ₹${b.budgetLimit.toLocaleString('en-IN')}</span>
          </div>
          <div class="budget-bar-track">
            <div class="budget-bar-fill ${colorClass}" style="width: ${barWidth}%"></div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between;">
            <span>${b.isExceeded ? '⚠️ Limit exceeded!' : `₹${Math.max(0, b.remaining).toLocaleString('en-IN')} remaining`}</span>
            ${b.id ? `<a href="#" class="delete-budget-link" data-id="${b.id}" style="color:var(--text-muted); text-decoration:none;">Remove</a>` : ''}
          </div>
        `;
        container.appendChild(div);
      });

      // Hook up links to remove budget targets
      document.querySelectorAll('.delete-budget-link').forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = link.getAttribute('data-id');
          if (confirm('Delete this budget limit?')) {
            try {
              await API.delete(`/budgets/${id}`);
              loadBudgetsList();
              if (window.refreshDashboard) window.refreshDashboard();
            } catch (err) {
              alert(err.message);
            }
          }
        });
      });

    } else {
      container.innerHTML = `<div style="color:var(--text-secondary); text-align:center; padding: 2rem 0;">No active budget limits created for this month.</div>`;
    }
  } catch (err) {
    console.error('Failed loading budgets:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Set current month/year defaults
  const today = new Date();
  document.getElementById('budgetMonth').value = today.getMonth() + 1;
  document.getElementById('budgetYear').value = today.getFullYear();

  const setBudgetForm = document.getElementById('setBudgetForm');
  const generateAIBudgetBtn = document.getElementById('generateAIBudgetBtn');
  const aiRecommendationsBox = document.getElementById('aiBudgetRecommendations');

  // Load budgets on dropdown change
  document.getElementById('budgetMonth').addEventListener('change', loadBudgetsList);
  document.getElementById('budgetYear').addEventListener('change', loadBudgetsList);

  // Set Budget limit submission
  if (setBudgetForm) {
    setBudgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = document.getElementById('budgetCategory').value;
      const amount = document.getElementById('budgetAmount').value;
      const month = document.getElementById('budgetMonth').value;
      const year = document.getElementById('budgetYear').value;

      try {
        await API.post('/budgets', { category, amount, month, year });
        document.getElementById('budgetAmount').value = '';
        loadBudgetsList();
        if (window.refreshDashboard) window.refreshDashboard();
        if (window.refreshNotifications) window.refreshNotifications();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Trigger AI budget splitting generator
  if (generateAIBudgetBtn) {
    generateAIBudgetBtn.addEventListener('click', async () => {
      const salary = document.getElementById('aiSalaryInput').value;
      if (!salary || salary <= 0) {
        alert('Please enter a valid monthly salary first!');
        return;
      }

      generateAIBudgetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

      try {
        const data = await API.post('/ai/generate-budget', { salary });
        aiBudgetSplits = data.recommendations;
        
        let listHtml = '<h4 style="font-size:0.95rem; margin-bottom: 0.75rem; font-weight:600;">Recommended Category Targets:</h4>';
        listHtml += '<div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom: 1rem;">';
        
        Object.entries(aiBudgetSplits).forEach(([cat, amt]) => {
          listHtml += `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-secondary);">
              <span>${cat}</span>
              <span><strong>₹${amt.toLocaleString('en-IN')}</strong></span>
            </div>
          `;
        });
        
        listHtml += '</div>';
        listHtml += '<button type="button" class="action-btn primary" id="applyAIBudgetsBtn" style="width:100%; justify-content:center; font-size:0.85rem; padding:0.5rem;">Apply Recommendations</button>';
        
        aiRecommendationsBox.innerHTML = listHtml;
        aiRecommendationsBox.style.display = 'block';

        // Bind Apply button listener
        document.getElementById('applyAIBudgetsBtn').addEventListener('click', applyAIBudgetRecommendations);

      } catch (err) {
        alert(`Failed generating budget: ${err.message}`);
      } finally {
        generateAIBudgetBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent-indigo);"></i> Recommend Split';
      }
    });
  }

  // Sequential batch upload of AI recommendations
  async function applyAIBudgetRecommendations() {
    if (!aiBudgetSplits) return;

    const month = document.getElementById('budgetMonth').value;
    const year = document.getElementById('budgetYear').value;

    const applyBtn = document.getElementById('applyAIBudgetsBtn');
    applyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying targets...';
    applyBtn.disabled = true;

    try {
      // Loop recommendations and post targets
      const promises = Object.entries(aiBudgetSplits).map(([category, amount]) => {
        return API.post('/budgets', { category, amount, month, year });
      });

      await Promise.all(promises);

      // Hide recommendation widget and refresh active list
      aiRecommendationsBox.style.display = 'none';
      document.getElementById('aiSalaryInput').value = '';
      aiBudgetSplits = null;
      loadBudgetsList();
      if (window.refreshDashboard) window.refreshDashboard();
      
      alert('AI budget recommendations applied successfully!');
    } catch (err) {
      alert(`Error applying recommended targets: ${err.message}`);
    }
  }
});
