let chatHistory = [];

async function loadAIInsights() {
  const insightsText = document.getElementById('aiInsightsText');
  const suggestionsList = document.getElementById('aiSuggestionsList');

  insightsText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing transaction behaviors...';
  suggestionsList.innerHTML = '';

  try {
    const data = await API.post('/ai/analyze');
    
    // Set summary
    insightsText.textContent = data.analysis;

    // Set suggestions
    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach(tip => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.gap = '0.5rem';
        li.style.fontSize = '0.9rem';
        li.style.color = 'var(--text-secondary)';
        li.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent-gold); margin-top: 3px; font-size:0.8rem;"></i> <span>${tip}</span>`;
        suggestionsList.appendChild(li);
      });
    } else {
      suggestionsList.innerHTML = '<li style="color:var(--text-muted); font-size:0.85rem;">No recommendations generated yet. Try adding more transactions.</li>';
    }
  } catch (err) {
    insightsText.textContent = 'Failed gathering monthly AI insights.';
    console.error(err.message);
  }
}

// Open and load financial health report details
async function openHealthScoreModal() {
  const healthModal = document.getElementById('healthModal');
  const strengthsList = document.getElementById('healthStrengthsList');
  const improvementsList = document.getElementById('healthImprovementsList');
  
  strengthsList.innerHTML = '<li>Loading...</li>';
  improvementsList.innerHTML = '<li>Loading...</li>';
  
  healthModal.classList.add('active');

  try {
    const data = await API.get('/ai/health-score');
    
    // Set score conics
    const score = data.score || 0;
    document.getElementById('modalHealthScoreText').textContent = score;
    document.getElementById('modalHealthConic').style.background = `conic-gradient(var(--accent-gold) 0% ${score}%, rgba(255, 255, 255, 0.05) ${score}% 100%)`;

    let statusText = 'Fair Health';
    if (score === 0) statusText = 'No Transaction Data ⚠️';
    else if (score >= 85) statusText = 'Excellent Financial Standing 🌟';
    else if (score >= 70) statusText = 'Good Balance 👍';
    else if (score >= 50) statusText = 'Average Balance ⚖️';
    else statusText = 'Critical Deficit ⚠️';

    document.getElementById('modalHealthStatus').textContent = statusText;

    // Strengths
    strengthsList.innerHTML = '';
    data.strengths.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      strengthsList.appendChild(li);
    });

    // Improvements
    improvementsList.innerHTML = '';
    data.improvements.forEach(imp => {
      const li = document.createElement('li');
      li.textContent = imp;
      improvementsList.appendChild(li);
    });

  } catch (err) {
    strengthsList.innerHTML = '<li>Failed to load details</li>';
    improvementsList.innerHTML = '<li>Failed to load details</li>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Modal triggers
  const healthModal = document.getElementById('healthModal');
  document.getElementById('healthScoreTrigger').addEventListener('click', openHealthScoreModal);
  document.getElementById('closeHealthModal').addEventListener('click', () => healthModal.classList.remove('active'));
  
  window.addEventListener('click', (e) => {
    if (e.target === healthModal) healthModal.classList.remove('active');
  });

  // Insights Refresh
  document.getElementById('refreshInsightsBtn').addEventListener('click', loadAIInsights);

  // Chatbot Operations
  const chatMessages = document.getElementById('chatMessages');
  const chatInputField = document.getElementById('chatInputField');
  const sendChatBtn = document.getElementById('sendChatBtn');

  const appendChatMessage = (sender, message) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = message;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll down
  };

  const sendUserMessage = async (message) => {
    if (!message || message.trim() === '') return;

    appendChatMessage('user', message);
    chatInputField.value = '';

    // Create temporary typing bubble
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble assistant';
    typingBubble.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> Thinking...';
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const data = await API.post('/ai/chat', { message, history: chatHistory });
      
      // Remove typing bubble
      chatMessages.removeChild(typingBubble);

      appendChatMessage('assistant', data.reply);
      
      // Update local history
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'assistant', content: data.reply });

    } catch (err) {
      chatMessages.removeChild(typingBubble);
      appendChatMessage('assistant', `Sorry, I encountered an error: ${err.message}`);
    }
  };

  // Keyboard and button click triggers
  sendChatBtn.addEventListener('click', () => {
    sendUserMessage(chatInputField.value.trim());
  });

  chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendUserMessage(chatInputField.value.trim());
    }
  });

  // Suggestion chips triggers
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      sendUserMessage(query);
    });
  });

  // Receipt Scanner Operations
  const uploadDropzone = document.getElementById('uploadDropzone');
  const receiptFileInput = document.getElementById('receiptFileInput');
  const receiptResultBox = document.getElementById('receiptResult');

  uploadDropzone.addEventListener('click', () => {
    receiptFileInput.click();
  });

  receiptFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleReceiptUpload(file);
  });

  // Drag and drop events
  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'var(--accent-gold)';
    uploadDropzone.style.background = 'rgba(224, 169, 109, 0.04)';
  });

  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    uploadDropzone.style.background = 'transparent';
  });

  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    uploadDropzone.style.background = 'transparent';
    
    const file = e.dataTransfer.files[0];
    if (file) handleReceiptUpload(file);
  });

  async function handleReceiptUpload(file) {
    // Validate type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      alert('Error: Please select a valid PNG or JPEG image receipt.');
      return;
    }

    receiptResultBox.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing image & extracting bills via AI Vision...';
    receiptResultBox.className = '';
    receiptResultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const data = await API.post('/ai/scan-receipt', formData);

      // Display successfully parsed bill
      let resultHtml = `
        <div style="color:var(--accent-emerald); font-weight:600; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
          <i class="fa-solid fa-circle-check"></i> Billing Extracted & Recorded!
        </div>
        <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.85rem; color:var(--text-secondary);">
          <div>Merchant: <strong>${data.extractedData.storeName}</strong></div>
          <div>Total Amount: <strong>₹${data.extractedData.amount.toFixed(2)}</strong></div>
          <div>Category Tag: <strong>${data.extractedData.suggestedCategory}</strong></div>
          <div>Billing Items:</div>
          <ul style="padding-left:1.25rem;">
            ${data.extractedData.items?.map(i => `<li>${i.name} - ₹${i.cost}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
      `;
      
      receiptResultBox.innerHTML = resultHtml;
      
      // Update global systems
      if (window.refreshDashboard) window.refreshDashboard();
      if (window.refreshNotifications) window.refreshNotifications();

    } catch (err) {
      receiptResultBox.innerHTML = `
        <div style="color:var(--accent-coral); font-weight:600; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> Upload parsing failed
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">${err.message}</div>
      `;
    }
  }
});
