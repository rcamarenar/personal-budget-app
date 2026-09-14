/* =========================================================
   Avoidable Expenses Evolution & Savings Chart (Canvas Native)
   ========================================================= */

class AvoidableEvolutionChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.timeframe = 12; // Default 12 months
    this.chartMode = 'savings'; // 'savings' (cumulative) or 'evolution' (monthly)
    this.currentData = null;
  }

  setData(analyticsData) {
    this.currentData = analyticsData;
    this.render();
  }

  setTimeframe(months) {
    this.timeframe = months;
    this.render();
  }

  setMode(mode) {
    this.chartMode = mode;
    this.render();
  }

  render() {
    if (!this.canvas || !this.ctx || !this.currentData) return;

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = 180;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const points = this.currentData.evolutionPoints.slice(0, this.timeframe);
    if (!points || points.length === 0) return;

    const padding = { top: 20, right: 20, bottom: 30, left: 38 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine values based on mode
    const isSavings = this.chartMode === 'savings';
    const values = points.map(p => isSavings ? p.cumulativeSavingsIfAvoided : p.avoidableSpent);
    const maxVal = Math.max(...values, isSavings ? 1000 : 300) * 1.15;
    const minVal = 0;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const valLabel = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(valLabel >= 1000 ? `${(valLabel/1000).toFixed(1)}k` : valLabel, padding.left - 6, y + 3);
    }

    // Coordinates calculation
    const coords = points.map((p, idx) => {
      const x = padding.left + (chartW / (points.length - 1)) * idx;
      const yVal = isSavings ? p.cumulativeSavingsIfAvoided : p.avoidableSpent;
      const y = padding.top + chartH - (yVal / maxVal) * chartH;
      return { x, y, point: p, val: yVal };
    });

    // Draw Gradient Area for Savings
    if (isSavings) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.beginPath();
      ctx.moveTo(coords[0].x, padding.top + chartH);
      coords.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.lineTo(coords[coords.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    } else {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(coords[0].x, padding.top + chartH);
      coords.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.lineTo(coords[coords.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw Main Curve Line
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isSavings ? '#10b981' : '#ef4444';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    coords.forEach((c, idx) => {
      if (idx === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();

    // Draw Points & X labels
    coords.forEach((c, idx) => {
      // Point glow & circle
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isSavings ? '#34d399' : '#f87171';
      ctx.shadowColor = isSavings ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset

      ctx.beginPath();
      ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Month Label on X axis (Show alternating if tight)
      if (this.timeframe <= 6 || idx % 2 === 0 || idx === coords.length - 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.point.month, c.x, padding.top + chartH + 16);
      }
    });
  }
}

window.avoidableChart = new AvoidableEvolutionChart('avoidableEvolutionCanvas');
