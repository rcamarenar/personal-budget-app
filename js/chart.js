/* =========================================================
   Donut Chart & Distribution Visualizer (Canvas Native)
   ========================================================= */

class BudgetChartRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  render(categories, totalAmount, currency) {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = 200;
    const height = 200;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 85;
    const innerRadius = 58;

    if (totalAmount <= 0) {
      // Empty placeholder ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    const gapAngle = categories.length > 1 ? 0.04 : 0;

    categories.forEach(cat => {
      const sliceAngle = (cat.subtotal / totalAmount) * (2 * Math.PI);
      if (sliceAngle <= 0) return;

      const endAngle = startAngle + sliceAngle - gapAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = cat.color || '#38bdf8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset

      startAngle += sliceAngle;
    });
  }
}

window.budgetChart = new BudgetChartRenderer('budgetDonutCanvas');
