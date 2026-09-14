/* =========================================================
   Application Controller & Event Interactions
   ========================================================= */

class BudgetApp {
  constructor() {
    this.currentEditItem = null;
    this.currentEditCategory = null;
    this.toastTimer = null;
  }

  init() {
    this.initClock();
    this.initEventListeners();

    // Subscribe to state changes
    window.budgetStore.subscribe((state) => {
      this.handleStateUpdate(state);
    });
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeElem = document.getElementById('iosStatusTime');
      if (timeElem) timeElem.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 10000);
  }

  handleStateUpdate(state) {
    window.uiRenderers.renderSalaryCard(state);
    window.uiRenderers.renderCategorySections(state);
    window.uiRenderers.renderBottomTotal(state);
    window.uiRenderers.renderDistributionTab(state);
    window.uiRenderers.renderAvoidableEvolutionTab(state);
    this.bindSalaryEvents();
  }

  bindSalaryEvents() {
    const btnEdit = document.getElementById('btnEditSalary');
    const displayRow = document.getElementById('salaryDisplayRow');
    const inputWrapper = document.getElementById('salaryInputWrapper');
    const directInput = document.getElementById('salaryDirectInput');
    const btnConfirm = document.getElementById('btnConfirmSalary');
    const trigger = document.getElementById('salaryAmountTrigger');
    const btnClear = document.getElementById('btnClearSalary');

    const showInput = () => {
      if (displayRow && inputWrapper && directInput) {
        displayRow.style.display = 'none';
        inputWrapper.classList.add('active');
        directInput.focus();
        directInput.select();
      }
    };

    const hideInput = () => {
      if (displayRow && inputWrapper) {
        displayRow.style.display = 'flex';
        inputWrapper.classList.remove('active');
      }
    };

    if (btnEdit) btnEdit.onclick = showInput;
    if (trigger) trigger.onclick = showInput;

    if (btnConfirm && directInput) {
      btnConfirm.onclick = () => {
        const val = parseFloat(directInput.value) || 0;
        window.budgetStore.setSalary(val);
        hideInput();
        this.showToast(`Sueldo actualizado a ${window.budgetStore.getState().currency} ${window.uiRenderers.formatMoney(val)}`);
      };
    }

    if (directInput) {
      directInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          btnConfirm.click();
        } else if (e.key === 'Escape') {
          hideInput();
        }
      };
    }

    if (btnClear) {
      btnClear.onclick = () => {
        if (confirm('¿Deseas restablecer el sueldo mensual a cero o reiniciar el presupuesto?')) {
          window.budgetStore.setSalary(0);
          this.showToast('Sueldo restablecido a 0.00');
        }
      };
    }
  }

  // Modals Management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  // Set Modal Percent Helper
  setModalPercent(modalType, percent) {
    const state = window.budgetStore.getState();
    const checkbox = document.getElementById(`${modalType}ItemPercentCheckbox`);
    const percentInput = document.getElementById(`${modalType}ItemPercentValue`);
    const amountInput = document.getElementById(`${modalType}ItemAmountInput`);
    const helperRow = document.getElementById(`${modalType}PercentHelperRow`);
    const preview = document.getElementById(`${modalType}PercentCalcPreview`);

    if (checkbox) checkbox.checked = true;
    if (helperRow) helperRow.style.display = 'block';
    if (percentInput) percentInput.value = percent;

    const calcAmount = (state.salary * percent) / 100;
    if (amountInput) amountInput.value = calcAmount;
    if (preview) preview.textContent = `= ${state.currency} ${window.uiRenderers.formatMoney(calcAmount)}`;
  }

  // Edit Item Modal
  openEditItemModal(categoryId, itemId) {
    const state = window.budgetStore.getState();
    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return;
    const item = cat.items.find(it => it.id === itemId);
    if (!item) return;

    this.currentEditItem = { categoryId, itemId };

    const nameInput = document.getElementById('editItemNameInput');
    const amountInput = document.getElementById('editItemAmountInput');
    const titleElem = document.getElementById('editItemModalTitle');
    const checkbox = document.getElementById('editItemPercentCheckbox');
    const percentInput = document.getElementById('editItemPercentValue');
    const helperRow = document.getElementById('editPercentHelperRow');
    const preview = document.getElementById('editPercentCalcPreview');
    const avoidableCheckbox = document.getElementById('editItemAvoidableCheckbox');

    if (nameInput) nameInput.value = item.name;
    if (amountInput) amountInput.value = item.amount;
    if (titleElem) titleElem.textContent = `Editar en ${cat.title}`;
    if (avoidableCheckbox) avoidableCheckbox.checked = !!item.isAvoidable;

    const isLinked = !!item.isPercentLinked;
    if (checkbox) {
      checkbox.checked = isLinked;
      checkbox.onchange = (e) => {
        if (helperRow) helperRow.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
          const p = parseFloat(percentInput.value) || 10;
          this.setModalPercent('edit', p);
        }
      };
    }

    if (helperRow) helperRow.style.display = isLinked ? 'block' : 'none';
    if (percentInput) {
      percentInput.value = item.percentOfSalary || 10;
      percentInput.oninput = () => {
        const p = parseFloat(percentInput.value) || 0;
        const calcAmount = (state.salary * p) / 100;
        if (amountInput) amountInput.value = calcAmount;
        if (preview) preview.textContent = `= ${state.currency} ${window.uiRenderers.formatMoney(calcAmount)}`;
      };
    }

    if (preview && isLinked) {
      preview.textContent = `= ${state.currency} ${window.uiRenderers.formatMoney(item.amount)}`;
    }

    this.openModal('editItemModal');
    setTimeout(() => nameInput && nameInput.focus(), 100);
  }

  saveEditItem() {
    if (!this.currentEditItem) return;
    const nameInput = document.getElementById('editItemNameInput');
    const amountInput = document.getElementById('editItemAmountInput');
    const checkbox = document.getElementById('editItemPercentCheckbox');
    const percentInput = document.getElementById('editItemPercentValue');
    const avoidableCheckbox = document.getElementById('editItemAvoidableCheckbox');

    const name = nameInput.value.trim();
    const isPercentLinked = checkbox ? checkbox.checked : false;
    const percentOfSalary = isPercentLinked ? (parseFloat(percentInput.value) || 0) : 0;
    const isAvoidable = avoidableCheckbox ? avoidableCheckbox.checked : false;
    const amount = parseFloat(amountInput.value) || 0;

    if (!name) {
      alert('Por favor introduce un nombre para el gasto');
      return;
    }

    window.budgetStore.updateItem(
      this.currentEditItem.categoryId,
      this.currentEditItem.itemId,
      name,
      amount,
      isPercentLinked,
      percentOfSalary,
      isAvoidable
    );
    this.closeModal('editItemModal');
    this.showToast(`Ítem actualizado: "${name}"`);
  }

  // Add Item Modal
  openAddItemModal(categoryId, categoryTitle) {
    const state = window.budgetStore.getState();
    this.currentEditCategory = categoryId;
    const nameInput = document.getElementById('addItemNameInput');
    const amountInput = document.getElementById('addItemAmountInput');
    const titleElem = document.getElementById('addItemModalTitle');
    const checkbox = document.getElementById('addItemPercentCheckbox');
    const percentInput = document.getElementById('addItemPercentValue');
    const helperRow = document.getElementById('addPercentHelperRow');
    const preview = document.getElementById('addPercentCalcPreview');
    const avoidableCheckbox = document.getElementById('addItemAvoidableCheckbox');

    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';
    if (titleElem) titleElem.textContent = `Nuevo Gasto en ${categoryTitle}`;
    if (avoidableCheckbox) avoidableCheckbox.checked = false;

    const isPlanCat = categoryTitle.toLowerCase().includes('planific');
    if (checkbox) {
      checkbox.checked = isPlanCat;
      checkbox.onchange = (e) => {
        if (helperRow) helperRow.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
          const p = parseFloat(percentInput.value) || 10;
          this.setModalPercent('add', p);
        }
      };
    }

    if (helperRow) helperRow.style.display = isPlanCat ? 'block' : 'none';
    if (percentInput) {
      percentInput.value = 10;
      percentInput.oninput = () => {
        const p = parseFloat(percentInput.value) || 0;
        const calcAmount = (state.salary * p) / 100;
        if (amountInput) amountInput.value = calcAmount;
        if (preview) preview.textContent = `= ${state.currency} ${window.uiRenderers.formatMoney(calcAmount)}`;
      };
    }

    if (isPlanCat && amountInput) {
      amountInput.value = (state.salary * 10) / 100;
      if (preview) preview.textContent = `= ${state.currency} ${window.uiRenderers.formatMoney((state.salary * 10) / 100)}`;
    }

    this.openModal('addItemModal');
    setTimeout(() => nameInput && nameInput.focus(), 100);
  }

  saveAddItem() {
    if (!this.currentEditCategory) return;
    const nameInput = document.getElementById('addItemNameInput');
    const amountInput = document.getElementById('addItemAmountInput');
    const checkbox = document.getElementById('addItemPercentCheckbox');
    const percentInput = document.getElementById('addItemPercentValue');
    const avoidableCheckbox = document.getElementById('addItemAvoidableCheckbox');

    const name = nameInput.value.trim();
    const isPercentLinked = checkbox ? checkbox.checked : false;
    const percentOfSalary = isPercentLinked ? (parseFloat(percentInput.value) || 0) : 0;
    const isAvoidable = avoidableCheckbox ? avoidableCheckbox.checked : false;
    const amount = parseFloat(amountInput.value) || 0;

    if (!name) {
      alert('Por favor introduce un nombre para el gasto');
      return;
    }

    window.budgetStore.addItem(
      this.currentEditCategory,
      name,
      amount,
      isPercentLinked,
      percentOfSalary,
      isAvoidable
    );
    this.closeModal('addItemModal');
    this.showToast(`Gasto agregado: "${name}" (${window.budgetStore.getState().currency} ${window.uiRenderers.formatMoney(amount)})`);
  }

  // Edit Category Modal
  openEditCategoryModal(categoryId) {
    const state = window.budgetStore.getState();
    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return;

    this.currentEditCategory = categoryId;
    const titleInput = document.getElementById('editCategoryTitleInput');
    if (titleInput) titleInput.value = cat.title;

    this.openModal('editCategoryModal');
    setTimeout(() => titleInput && titleInput.focus(), 100);
  }

  saveEditCategory() {
    if (!this.currentEditCategory) return;
    const titleInput = document.getElementById('editCategoryTitleInput');
    const title = titleInput.value.trim();

    if (!title) {
      alert('Por favor introduce un título para la categoría');
      return;
    }

    window.budgetStore.updateCategoryTitle(this.currentEditCategory, title);
    this.closeModal('editCategoryModal');
    this.showToast(`Categoría actualizada a "${title}"`);
  }

  // Add Category Modal
  openAddCategoryModal() {
    const titleInput = document.getElementById('addCategoryTitleInput');
    if (titleInput) titleInput.value = '';
    this.openModal('addCategoryModal');
    setTimeout(() => titleInput && titleInput.focus(), 100);
  }

  saveAddCategory() {
    const titleInput = document.getElementById('addCategoryTitleInput');
    const title = titleInput.value.trim();

    if (!title) {
      alert('Por favor introduce un título para la nueva categoría');
      return;
    }

    window.budgetStore.addCategory(title);
    this.closeModal('addCategoryModal');
    this.showToast(`Nueva categoría "${title}" creada`);
  }

  // Delete Actions
  handleDeleteItem(categoryId, itemId, itemName) {
    const row = document.getElementById(`row-${itemId}`);
    if (row) row.classList.add('is-deleting');

    setTimeout(() => {
      window.budgetStore.deleteItem(categoryId, itemId);
      this.showToast(`Eliminado: "${itemName}"`, true);
    }, 200);
  }

  handleDeleteCategory(categoryId, categoryTitle) {
    if (confirm(`¿Estás seguro de eliminar la categoría "${categoryTitle}" y todos sus ítems?`)) {
      window.budgetStore.deleteCategory(categoryId);
      this.showToast(`Categoría "${categoryTitle}" eliminada`);
    }
  }

  undoLastDelete() {
    if (window.budgetStore.undoDeleteItem()) {
      this.showToast('Acción deshecha con éxito');
    }
  }

  // Toast Notification
  showToast(message, showUndo = false) {
    const toast = document.getElementById('appToast');
    const textElem = document.getElementById('toastText');
    const undoBtn = document.getElementById('toastUndoBtn');

    if (!toast || !textElem) return;

    if (this.toastTimer) clearTimeout(this.toastTimer);

    textElem.textContent = message;
    if (undoBtn) undoBtn.style.display = showUndo ? 'inline-block' : 'none';

    toast.classList.add('show');

    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Avoidable Chart Controls
  setAvoidableTimeframe(months, btn) {
    if (window.avoidableChart) {
      window.avoidableChart.setTimeframe(months);
    }
    const container = btn.parentElement;
    if (container) {
      container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  setAvoidableMode(mode, btn) {
    if (window.avoidableChart) {
      window.avoidableChart.setMode(mode);
    }
    const container = btn.parentElement;
    if (container) {
      container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  // Tab View Switcher
  switchTab(tabName) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active-view'));
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));

    const activeView = document.getElementById(`view-${tabName}`);
    const activeBtn = document.getElementById(`tabBtn-${tabName}`);

    if (activeView) activeView.classList.add('active-view');
    if (activeBtn) activeBtn.classList.add('active');

    const state = window.budgetStore.getState();

    if (tabName === 'charts') {
      window.uiRenderers.renderDistributionTab(state);
    } else if (tabName === 'avoidable') {
      window.uiRenderers.renderAvoidableEvolutionTab(state);
    }
  }

  // Export / Copy to Clipboard
  copyBudgetSummary() {
    const state = window.budgetStore.getState();
    let text = `==============================\n`;
    text += `CÓMO ADMINISTRAR UN SUELDO DE ${state.currency} ${window.uiRenderers.formatMoney(state.salary)}\n`;
    text += `Sueldo Mensual: ${state.currency} ${window.uiRenderers.formatMoney(state.salary)}\n`;
    text += `==============================\n\n`;

    state.categories.forEach(cat => {
      text += `${cat.title}\n`;
      cat.items.forEach(it => {
        const flag = it.isAvoidable ? ' [⚡ Evitable]' : '';
        text += `• ${it.name.padEnd(22, '.')}${flag} ${state.currency} ${window.uiRenderers.formatMoney(it.amount)}\n`;
      });
      text += `\n`;
    });

    text += `------------------------------\n`;
    text += `TOTAL .................... ${state.currency} ${window.uiRenderers.formatMoney(state.totalAllocated)}\n`;
    text += `GASTOS EVITABLES ......... ${state.currency} ${window.uiRenderers.formatMoney(state.avoidableTotal)} (${state.avoidablePercentOfSalary}%)\n`;
    text += `POTENCIAL AHORRO ANUAL ... ${state.currency} ${window.uiRenderers.formatMoney(state.annualPotentialSavings)}\n`;
    text += `ESTADO: ${state.remaining === 0 ? 'Equilibrado (100%)' : state.remaining > 0 ? `Restante ${state.currency} ${window.uiRenderers.formatMoney(state.remaining)}` : `Excedido ${state.currency} ${window.uiRenderers.formatMoney(Math.abs(state.remaining))}`}\n`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('¡Resumen copiado al portapapeles!');
    }).catch(() => {
      alert('Resumen:\n\n' + text);
    });
  }

  // View Mode: iPhone vs Laptop
  setViewMode(mode) {
    const workspace = document.getElementById('mainWorkspace');
    const btnIphone = document.getElementById('btnModeIphone');
    const btnLaptop = document.getElementById('btnModeLaptop');

    if (mode === 'laptop') {
      if (workspace) workspace.classList.add('laptop-mode');
      if (btnLaptop) btnLaptop.classList.add('active');
      if (btnIphone) btnIphone.classList.remove('active');
      localStorage.setItem('budget_view_mode', 'laptop');
      this.showToast('Vista adaptada a Laptop / Escritorio');
    } else {
      if (workspace) workspace.classList.remove('laptop-mode');
      if (btnIphone) btnIphone.classList.add('active');
      if (btnLaptop) btnLaptop.classList.remove('active');
      localStorage.setItem('budget_view_mode', 'iphone');
      this.showToast('Vista móvil iPhone 16 Pro');
    }
  }

  initEventListeners() {
    // Restore saved view mode
    const savedMode = localStorage.getItem('budget_view_mode');
    if (savedMode === 'laptop') {
      this.setViewMode('laptop');
    }

    // Backdrop click to close modals
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // Currency Switcher
    const currencySelect = document.getElementById('currencySelector');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        window.budgetStore.setCurrency(e.target.value);
        this.showToast(`Moneda cambiada a ${e.target.value}`);
      });
    }

    // Reset to Default button
    const btnReset = document.getElementById('btnResetBudget');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Restablecer el presupuesto con los valores originales de la imagen?')) {
          window.budgetStore.resetToDefault();
          this.showToast('Presupuesto restablecido a valores originales');
        }
      });
    }
  }
}

window.app = new BudgetApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
