let myChartInstance = null;

const ChartManager = {
  // Chart category color palette (premium matching accents)
  colors: {
    'Food': '#f59e0b',          // Amber
    'Shopping': '#ec4899',      // Pink
    'Fuel': '#e0a96d',          // Gold Accent
    'Rent': '#3b82f6',          // Blue
    'Bills': '#6366f1',         // Indigo
    'Entertainment': '#8b5cf6', // Purple
    'Travel': '#14b8a6',        // Teal
    'Medical': '#ef4444',       // Red
    'Other': '#6b7280'          // Slate Gray
  },

  updateCategoryChart: (canvasId, data = []) => {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy previous chart instance if exists
    if (myChartInstance) {
      myChartInstance.destroy();
    }

    if (data.length === 0) {
      // Draw empty placeholder text
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('No expenses recorded this month', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    const labels = data.map(item => item._id);
    const amounts = data.map(item => item.total);
    const backgroundColors = labels.map(label => ChartManager.colors[label] || ChartManager.colors['Other']);

    myChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: amounts,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#0b0c13', // Matches panel backgrounds
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f3f4f6',
              font: {
                family: 'Outfit',
                size: 12
              },
              boxWidth: 15,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(18, 20, 32, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            titleFont: {
              family: 'Outfit',
              weight: 'bold'
            },
            bodyFont: {
              family: 'Outfit'
            },
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += '₹' + context.parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                }
                return label;
              }
            }
          }
        },
        cutout: '70%',
      }
    });
  }
};
