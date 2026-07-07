document.addEventListener('DOMContentLoaded', () => {
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  const triggerDownload = (blob, defaultFilename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getQueryString = () => {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const category = document.getElementById('reportCategory').value;

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (category) params.append('category', category);

    return params.toString() ? `?${params.toString()}` : '';
  };

  // Export CSV Action
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      exportCsvBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Building...';
      exportCsvBtn.disabled = true;

      try {
        const query = getQueryString();
        const blob = await API.get(`/reports/export/csv${query}`);
        
        triggerDownload(blob, `ExpenseAI_Statement_${Date.now()}.csv`);
      } catch (err) {
        alert(`Failed to export CSV Statement: ${err.message}`);
      } finally {
        exportCsvBtn.innerHTML = '<i class="fa-solid fa-file-csv"></i> Download CSV';
        exportCsvBtn.disabled = false;
      }
    });
  }

  // Export PDF Action
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', async () => {
      exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Printing...';
      exportPdfBtn.disabled = true;

      try {
        const query = getQueryString();
        const blob = await API.get(`/reports/export/pdf${query}`);
        
        triggerDownload(blob, `ExpenseAI_Statement_${Date.now()}.pdf`);
      } catch (err) {
        alert(`Failed to export PDF Statement: ${err.message}`);
      } finally {
        exportPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF';
        exportPdfBtn.disabled = false;
      }
    });
  }
});
