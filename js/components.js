/* =========================================================
   UI Component Renderers & Helpers (with Avoidable Evolution)
   ========================================================= */

// Number formatter with comma separators
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

// Render SVG Icons
const Icons = {
  pen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  wallet: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  bolt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
};

// Render the Salary Header Card
function renderSalaryCard(state) {
  const container = document.getElementById('salaryHeaderContainer');
  if (!container) return;

  const isUnder = state.status === 'under';
  const isOver = state.status === 'over';

  let statusBadgeClass = 'badge-remaining';
  let statusText = 'Ingresa tu sueldo';
  let fillClass = 'fill-under';

  if (state.salary > 0) {
    if (isUnder) {
      statusBadgeClass = 'badge-remaining';
      statusText = `Resta: ${state.currency} ${formatMoney(state.remaining)}`;
      fillClass = 'fill-under';
    } else if (isOver) {
      statusBadgeClass = 'badge-over';
      statusText = `Excedido: ${state.currency} ${formatMoney(Math.abs(state.remaining))}`;
      fillClass = 'fill-over';
    } else {
      statusBadgeClass = 'badge-balanced';
      statusText = '100% Asignado';
      fillClass = 'fill-exact';
    }
  }

  const salaryDisplayHtml = state.salary > 0
    ? `<span class="salary-currency">${state.currency}</span><span class="salary-value">${formatMoney(state.salary)}</span>`
    : `<span class="salary-currency">${state.currency}</span><span class="salary-value" style="opacity: 0.85;">0.00</span> <span style="font-size: 11px; color: var(--accent-blue); margin-left: 6px; font-weight: 600;">(Toca para ingresar)</span>`;

  container.innerHTML = `
    <div class="salary-header-box animate-pop-in">
      <div class="salary-box-top">
        <div class="salary-label">
          ${Icons.wallet}
          <span>Sueldo Mensual a Administrar</span>
        </div>
        <div class="salary-box-actions">
          <button class="btn-action-icon btn-action-pen" id="btnEditSalary" title="Editar Sueldo">
            ${Icons.pen}
          </button>
          <button class="btn-action-icon btn-action-trash" id="btnClearSalary" title="Limpiar / Restablecer">
            ${Icons.trash}
          </button>
        </div>
      </div>

      <div class="salary-amount-row" id="salaryDisplayRow">
        <div class="salary-amount-display" id="salaryAmountTrigger" title="Clic para ingresar sueldo">
          ${salaryDisplayHtml}
        </div>
      </div>

      <div class="salary-inline-input-wrapper" id="salaryInputWrapper">
        <input type="number" step="any" class="salary-inline-input" id="salaryDirectInput" value="${state.salary || ''}" placeholder="Ej. 2500" />
        <button class="salary-confirm-btn" id="btnConfirmSalary">
          ${Icons.check} Guardar
        </button>
      </div>

      <div class="salary-progress-wrapper">
        <div class="salary-progress-bar-bg">
          <div class="salary-progress-fill ${fillClass}" style="width: ${state.percentAllocated || 0}%"></div>
        </div>
        <div class="salary-meta-info">
          <span class="salary-assigned-text">Asignado: ${state.currency} ${formatMoney(state.totalAllocated)} (${(state.rawPercent || 0).toFixed(0)}%)</span>
          <span class="salary-badge-status ${statusBadgeClass}">
            ${statusText}
          </span>
        </div>
      </div>
    </div>
  `;
}

// Render the Budget Category Sections & Dotted Leader Items
function renderCategorySections(state) {
  const container = document.getElementById('budgetSectionsContainer');
  if (!container) return;

  if (state.categories.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p>No hay categorías activas.</p>
        <button class="btn-primary" style="margin-top: 10px;" onclick="window.app.openAddCategoryModal()">+ Crear Categoría</button>
      </div>
    `;
    return;
  }

  let html = '';

  state.categories.forEach(category => {
    const subtotal = category.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    let itemsHtml = '';
    if (category.items.length === 0) {
      itemsHtml = `
        <div style="text-align: center; padding: 12px 10px; font-size: 11.5px; color: var(--text-dim); background: rgba(0,0,0,0.12); border-radius: var(--radius-sm); margin-bottom: 6px;">
          Sin gastos añadidos en esta categoría
        </div>
      `;
    } else {
      category.items.forEach(item => {
        const percentBadge = item.isPercentLinked && item.percentOfSalary 
          ? `<span class="item-percent-pill" title="Calculado como ${item.percentOfSalary}% del sueldo mensual">${item.percentOfSalary}%</span>` 
          : '';

        const avoidableBadge = item.isAvoidable 
          ? `<span class="item-avoidable-pill" title="Gasto prescindible / reducible">⚡ Evitable</span>`
          : '';

        itemsHtml += `
          <div class="budget-item-row interactive-tap" id="row-${item.id}">
            <div class="item-left">
              <span class="item-bullet ${item.isAvoidable ? 'bullet-avoidable' : ''}"></span>
              <span class="item-name-text" onclick="window.app.openEditItemModal('${category.id}', '${item.id}')" title="Clic para editar">${item.name}</span>
              ${percentBadge}
              ${avoidableBadge}
            </div>

            <!-- Dotted Leader Line (Notebook replication) -->
            <div class="item-dotted-leader"></div>

            <div class="item-right">
              <span class="item-amount-badge" onclick="window.app.openEditItemModal('${category.id}', '${item.id}')" title="Clic para editar">${state.currency} ${formatMoney(item.amount)}</span>
              <button class="item-action-btn item-btn-edit" onclick="window.app.openEditItemModal('${category.id}', '${item.id}')" title="Editar ítem">
                ${Icons.pen}
              </button>
              <button class="item-action-btn item-btn-delete" onclick="window.app.handleDeleteItem('${category.id}', '${item.id}', '${item.name}')" title="Eliminar ítem">
                ${Icons.trash}
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `
      <div class="budget-section-card ${category.themeClass} animate-slide-up" id="sec-${category.id}">
        <div class="section-header-row">
          <div class="section-title-group">
            <span class="section-bullet-tag" style="background-color: ${category.color || '#38bdf8'}"></span>
            <span class="section-title-text" onclick="window.app.openEditCategoryModal('${category.id}')" title="Clic para renombrar">${category.title}</span>
          </div>
          <div class="section-header-actions">
            <span class="section-subtotal-badge">${state.currency} ${formatMoney(subtotal)}</span>
            <button class="item-action-btn item-btn-edit" onclick="window.app.openEditCategoryModal('${category.id}')" title="Editar título">
              ${Icons.pen}
            </button>
            <button class="item-action-btn item-btn-delete" onclick="window.app.handleDeleteCategory('${category.id}', '${category.title}')" title="Eliminar categoría">
              ${Icons.trash}
            </button>
          </div>
        </div>

        <div class="section-items-container">
          ${itemsHtml}
        </div>

        <button class="btn-add-item-row" onclick="window.app.openAddItemModal('${category.id}', '${category.title}')">
          ${Icons.plus} Agregar ítem
        </button>
      </div>
    `;
  });

  // Global Add Category button
  html += `
    <button class="btn-add-section-global" onclick="window.app.openAddCategoryModal()">
      ${Icons.plus} Nueva Categoría de Presupuesto
    </button>
  `;

  container.innerHTML = html;
}

// Render the Sticky Bottom Total Bar
function renderBottomTotal(state) {
  const container = document.getElementById('bottomTotalContainer');
  if (!container) return;

  const totalItemsCount = state.categories.reduce((acc, cat) => acc + cat.items.length, 0);

  container.innerHTML = `
    <div class="total-summary-card">
      <div class="total-left">
        <span class="total-badge-label">TOTAL</span>
        <span class="total-count-pill">${totalItemsCount} ítems</span>
      </div>
      <div class="total-right">
        <span class="total-currency">${state.currency}</span>
        <span class="total-amount-value">${formatMoney(state.totalAllocated)}</span>
      </div>
    </div>
  `;
}

// Render the Distribution Breakdown Tab
function renderDistributionTab(state) {
  const chartWrapper = document.getElementById('chartStatsContainer');
  if (!chartWrapper) return;

  const centerVal = document.getElementById('chartCenterValue');
  if (centerVal) {
    centerVal.textContent = `${state.currency} ${formatMoney(state.totalAllocated)}`;
  }

  if (window.budgetChart) {
    window.budgetChart.render(state.categoryStats, state.totalAllocated, state.currency);
  }

  let legendHtml = '';
  state.categoryStats.forEach(stat => {
    legendHtml += `
      <div class="legend-item-card">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="legend-color-dot" style="background: ${stat.color}; box-shadow: 0 0 6px ${stat.color};"></span>
          <span class="legend-name">${stat.title}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${stat.percentage}%</span>
          <span class="legend-stat">${state.currency} ${formatMoney(stat.subtotal)}</span>
        </div>
      </div>
    `;
  });

  chartWrapper.innerHTML = legendHtml;
}

// Render Avoidable Expenses Evolution View
async function renderAvoidableEvolutionTab(state) {
  const container = document.getElementById('avoidableStatsCards');
  const itemsContainer = document.getElementById('avoidableItemsListContainer');

  if (container) {
    container.innerHTML = `
      <div class="avoidable-metric-card highlight-metric">
        <div class="metric-label">Gasto Evitable Mensual</div>
        <div class="metric-val text-red">${state.currency} ${formatMoney(state.avoidableTotal)}</div>
        <div class="metric-sub">${state.avoidablePercentOfSalary}% de tu sueldo mensual</div>
      </div>

      <div class="avoidable-metric-card">
        <div class="metric-label">Ahorro Potencial Anual</div>
        <div class="metric-val text-green">${state.currency} ${formatMoney(state.annualPotentialSavings)}</div>
        <div class="metric-sub">Si eliminas/reduces estos gastos</div>
      </div>
    `;
  }

  // Fetch evolution curve from Backend or calculate locally
  let evolutionData = null;
  if (window.BudgetAPI) {
    evolutionData = await window.BudgetAPI.getAvoidableEvolution();
  }

  if (!evolutionData) {
    // Local fallback calculation
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const currentAvoidable = state.avoidableTotal;
    const evolutionPoints = [];
    let cum = 0;
    for (let i = 0; i < 12; i++) {
      cum += currentAvoidable;
      evolutionPoints.push({
        month: months[i],
        monthIndex: i,
        avoidableSpent: currentAvoidable,
        cumulativeSavingsIfAvoided: cum
      });
    }
    evolutionData = {
      currentMonthlyAvoidable: currentAvoidable,
      currency: state.currency,
      annualPotentialSavings: currentAvoidable * 12,
      sixMonthPotentialSavings: currentAvoidable * 6,
      evolutionPoints
    };
  }

  if (window.avoidableChart) {
    window.avoidableChart.setData(evolutionData);
  }

  // Render list of avoidable items
  if (itemsContainer) {
    const avoidableItems = [];
    state.categories.forEach(cat => {
      cat.items.forEach(it => {
        if (it.isAvoidable) {
          avoidableItems.push({ ...it, categoryTitle: cat.title, categoryId: cat.id });
        }
      });
    });

    if (avoidableItems.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; padding: 14px; font-size: 12px; color: var(--text-dim);">
          No tienes gastos marcados como evitables. Puedes activar la casilla "⚡ Evitable" al editar cualquier gasto.
        </div>
      `;
    } else {
      let itemsHtml = '';
      avoidableItems.forEach(item => {
        itemsHtml += `
          <div class="avoidable-item-row">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--accent-red); font-size: 11px;">⚡</span>
              <div>
                <div style="font-size: 13px; font-weight: 600; color: var(--white-pure);">${item.name}</div>
                <div style="font-size: 10.5px; color: var(--text-muted);">${item.categoryTitle}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-red);">${state.currency} ${formatMoney(item.amount)} / mes</div>
              <div style="font-size: 10px; color: var(--accent-green-light); font-weight: 600;">Ahorro: ${state.currency} ${formatMoney(item.amount * 12)} / año</div>
            </div>
          </div>
        `;
      });
      itemsContainer.innerHTML = itemsHtml;
    }
  }
}

// Render the Dynamic Summary Tab
function renderSummaryTab(state) {
  const container = document.getElementById('summaryViewContainer');
  if (!container) return;

  let categoriesHtml = '';
  state.categoryStats.forEach(cat => {
    categoriesHtml += `
      <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span style="font-size: 13px; font-weight: 700; color: ${cat.color};">${cat.title} (${cat.percentage}%)</span>
          <span style="font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--white-pure);">${state.currency} ${formatMoney(cat.subtotal)}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${cat.itemCount} gastos registrados</div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="chart-card animate-slide-up">
      <h3 style="font-size: 15px; margin-bottom: 6px; color: var(--white-pure);">Regla del Presupuesto</h3>
      <p style="font-size: 12px; color: var(--text-dim); line-height: 1.5; margin-bottom: 14px;">
        Estructura calculada sobre el sueldo mensual administrado de <strong style="color: var(--accent-blue);">${state.currency} ${formatMoney(state.salary)}</strong>.
      </p>

      <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 12px 14px; text-align: left; margin-bottom: 14px; border: 1px solid var(--border-subtle);">
        ${categoriesHtml}
      </div>

      <button class="btn-primary" style="width: 100%; margin-bottom: 8px;" onclick="window.app.copyBudgetSummary()">
        📋 Copiar Resumen Formateado
      </button>
    </div>
  `;
}

// Render the Historical Daily & Monthly Transactions Ledger
// Render the Historical Daily & Monthly Transactions Ledger
function renderHistoryTab(budgetState, txState) {
  const container = document.getElementById('historyViewContainer');
  if (!container) return;

  const currency = budgetState.currency || 'S/.';
  const salary = Number(budgetState.salary) || 0;
  const totalSpent = txState ? txState.totalSpent : 0;
  const avoidableSpent = txState ? txState.avoidableSpent : 0;
  const count = txState ? txState.totalCount : 0;
  const groupedDays = txState ? txState.groupedDays : [];

  const spentPercent = salary > 0 ? (totalSpent / salary) * 100 : 0;
  const remaining = salary - totalSpent;
  const isNearLimit = spentPercent >= 80 && spentPercent < 100;
  const isExceeded = spentPercent >= 100;

  // Alert Banner Card
  let alertBannerHtml = '';
  if (isExceeded) {
    alertBannerHtml = `
      <div class="budget-alert-card alert-danger animate-pulse-border">
        <div class="alert-icon">🚨</div>
        <div class="alert-content">
          <div class="alert-title">¡Presupuesto Mensual Excedido!</div>
          <div class="alert-desc">
            Has consumido <strong>${currency} ${formatMoney(totalSpent)}</strong> (${Math.round(spentPercent)}%), superando tu presupuesto por <strong style="color: #fca5a5;">${currency} ${formatMoney(Math.abs(remaining))}</strong>.
            ${avoidableSpent > 0 ? `<div style="margin-top: 4px; font-size: 11px; opacity: 0.95;">💡 Tip: Tienes <strong>${currency} ${formatMoney(avoidableSpent)}</strong> en gastos evitables que puedes recortar.</div>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (isNearLimit) {
    alertBannerHtml = `
      <div class="budget-alert-card alert-warning animate-pulse-border">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">¡Atención! Presupuesto al ${Math.round(spentPercent)}%</div>
          <div class="alert-desc">
            Has consumido <strong>${currency} ${formatMoney(totalSpent)}</strong> de tu límite mensual. Te quedan <strong style="color: #fef08a;">${currency} ${formatMoney(remaining)}</strong> disponibles.
          </div>
        </div>
      </div>
    `;
  } else if (salary > 0 && totalSpent > 0) {
    alertBannerHtml = `
      <div class="budget-alert-card alert-safe">
        <div class="alert-icon">🟢</div>
        <div class="alert-content">
          <div class="alert-title">Presupuesto en Rango Saludable</div>
          <div class="alert-desc">
            Has consumido el <strong>${Math.round(spentPercent)}%</strong> (${currency} ${formatMoney(totalSpent)}). Saldo disponible: <strong style="color: var(--accent-green-light);">${currency} ${formatMoney(remaining)}</strong>.
          </div>
        </div>
      </div>
    `;
  }

  let daysHtml = '';
  if (groupedDays.length === 0) {
    daysHtml = `
      <div style="text-align: center; padding: 30px 16px; color: var(--text-dim);">
        <p style="font-size: 13px; margin-bottom: 8px;">No hay gastos registrados en el historial.</p>
        <button class="btn-primary" onclick="window.app.openAddTxModal()">+ Registrar Primer Gasto</button>
      </div>
    `;
  } else {
    groupedDays.forEach(group => {
      let itemsHtml = '';
      group.items.forEach(tx => {
        let methodClass = 'badge-method-yape';
        if (tx.paymentMethod === 'Plin') methodClass = 'badge-method-plin';
        if (tx.paymentMethod === 'Tarjeta') methodClass = 'badge-method-card';
        if (tx.paymentMethod === 'Transferencia') methodClass = 'badge-method-bank';
        if (tx.paymentMethod === 'WhatsApp') methodClass = 'badge-method-wa';

        const avoidableTag = tx.isAvoidable 
          ? `<span class="item-avoidable-pill" style="margin-left: 4px;">⚡ Evitable</span>` 
          : '';

        itemsHtml += `
          <div class="tx-card-row" id="tx-row-${tx.id}">
            <div class="tx-left">
              <div class="tx-concept-line">
                <span class="tx-concept-text" onclick="window.app.openEditTxModal('${tx.id}')" title="Clic para editar">${tx.concept}</span>
                ${avoidableTag}
              </div>
              <div class="tx-meta-line">
                <span class="tx-method-pill ${methodClass}">${tx.paymentMethod}</span>
                <span class="tx-category-name">${tx.categoryTitle}</span>
              </div>
            </div>
            <div class="tx-right">
              <span class="tx-amount-text">-${currency} ${formatMoney(tx.amount)}</span>
              <div class="tx-action-buttons">
                <button type="button" class="tx-btn-action tx-btn-edit" onclick="event.stopPropagation(); window.app.openEditTxModal('${tx.id}')" title="Editar gasto">
                  ${Icons.pen}
                </button>
                <button type="button" class="tx-btn-action tx-btn-delete" onclick="event.stopPropagation(); window.app.handleDeleteTx('${tx.id}')" title="Eliminar registro">
                  ${Icons.trash}
                </button>
              </div>
            </div>
          </div>
        `;
      });

      daysHtml += `
        <div class="history-day-group animate-slide-up">
          <div class="history-day-header">
            <span class="day-label">${group.dateLabel}</span>
            <span class="day-subtotal">Total: ${currency} ${formatMoney(group.dayTotal)}</span>
          </div>
          <div class="history-day-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = `
    <!-- Top Action Buttons -->
    <div class="history-quick-actions">
      <button class="btn-action-tile" onclick="window.app.openAddTxModal()">
        <span class="tile-icon">${Icons.plus}</span>
        <span>Nuevo Gasto</span>
      </button>
      <button class="btn-action-tile tile-scanner" onclick="window.app.openReceiptScannerModal()">
        <span class="tile-icon">📸</span>
        <span>Escanear Screenshot</span>
      </button>
      <button class="btn-action-tile tile-whatsapp" onclick="window.app.openWhatsAppAssistantModal()">
        <span class="tile-icon">💬</span>
        <span>WhatsApp</span>
      </button>
      <button class="btn-action-tile tile-clear" onclick="window.app.handleClearAllTransactions()" title="Vaciar historial a cero">
        <span class="tile-icon">${Icons.trash}</span>
        <span>Vaciar a 0</span>
      </button>
    </div>

    <!-- Alert Banner (Overrun / Warning) -->
    ${alertBannerHtml}

    <!-- History Summary Metrics -->
    <div class="history-summary-cards">
      <div class="history-metric-card">
        <div class="metric-title">Gasto Real Registrado</div>
        <div class="metric-value ${isExceeded ? 'text-red' : isNearLimit ? 'text-amber' : 'text-green'}">${currency} ${formatMoney(totalSpent)}</div>
        <div class="metric-detail">${count} consumos este mes</div>
      </div>
      <div class="history-metric-card">
        <div class="metric-title">Presupuesto Mensual</div>
        <div class="metric-value text-blue">${currency} ${formatMoney(salary)}</div>
        <div class="metric-detail">${remaining >= 0 ? `Restante: ${currency} ${formatMoney(remaining)}` : `Excedido: ${currency} ${formatMoney(Math.abs(remaining))}`}</div>
      </div>
    </div>

    <!-- Monthly Budget Progress Bar -->
    <div class="history-budget-progress-box">
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; color: var(--text-dim); font-weight: 600;">
        <span>Consumido: <strong style="color: ${isExceeded ? 'var(--accent-red)' : isNearLimit ? '#f59e0b' : 'var(--accent-green-light)'};">${Math.round(spentPercent)}%</strong></span>
        <span>Límite: ${currency} ${formatMoney(salary)}</span>
      </div>
      <div class="history-progress-track">
        <div class="history-progress-fill ${isExceeded ? 'progress-exceeded' : isNearLimit ? 'progress-warning' : 'progress-safe'}" style="width: ${Math.min(spentPercent, 100)}%;"></div>
      </div>
    </div>

    <!-- Timeline Days List -->
    <div class="history-timeline-list">
      ${daysHtml}
    </div>
  `;
}

window.uiRenderers = {
  renderSalaryCard,
  renderCategorySections,
  renderBottomTotal,
  renderDistributionTab,
  renderAvoidableEvolutionTab,
  renderSummaryTab,
  renderHistoryTab,
  formatMoney
};
