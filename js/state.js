/* =========================================================
   Reactive Budget State Management (with Backend Sync & Avoidable Tagging)
   ========================================================= */

const STORAGE_KEY = 'antigravity_personal_budget_v1';

const DEFAULT_BUDGET_DATA = {
  salary: 2500,
  currency: 'S/.',
  categories: [
    {
      id: 'cat-fijos',
      title: 'GASTOS FIJOS',
      themeClass: 'category-fijos',
      color: '#38bdf8',
      items: [
        { id: 'item-1', name: 'Renta', amount: 800, isAvoidable: false },
        { id: 'item-2', name: 'Agua y luz', amount: 120, isAvoidable: false },
        { id: 'item-3', name: 'Internet', amount: 60, isAvoidable: false },
        { id: 'item-4', name: 'Celular', amount: 40, isAvoidable: false }
      ]
    },
    {
      id: 'cat-esenciales',
      title: 'GASTOS ESENCIALES',
      themeClass: 'category-esenciales',
      color: '#fbbf24',
      items: [
        { id: 'item-5', name: 'Alimentación', amount: 350, isAvoidable: false },
        { id: 'item-6', name: 'Transporte', amount: 180, isAvoidable: false },
        { id: 'item-7', name: 'Salud', amount: 100, isAvoidable: false }
      ]
    },
    {
      id: 'cat-plan',
      title: 'PLANIFICACIÓN',
      themeClass: 'category-plan',
      color: '#10b981',
      items: [
        { id: 'item-8', name: 'Fondo de emergencia', amount: 350, isAvoidable: false },
        { id: 'item-9', name: 'Inversión', amount: 250, isPercentLinked: true, percentOfSalary: 10, isAvoidable: false },
        { id: 'item-10', name: 'Ocio / imprevistos', amount: 250, isAvoidable: true }
      ]
    }
  ]
};

class BudgetStateManager {
  constructor() {
    this.listeners = [];
    this.lastDeletedItem = null;
    this.loadState();
    this.syncWithBackend();
  }

  async syncWithBackend() {
    if (window.BudgetAPI) {
      const serverState = await window.BudgetAPI.getBudget();
      if (serverState && serverState.categories) {
        this.state = {
          salary: serverState.salary,
          currency: serverState.currency,
          categories: serverState.categories
        };
        this.recalculatePercentageItems();
        this.saveState(false);
      }
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);
        this.recalculatePercentageItems();
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_BUDGET_DATA));
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_BUDGET_DATA));
    }
  }

  recalculatePercentageItems() {
    const salary = Number(this.state.salary) || 0;
    this.state.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.name.toLowerCase().includes('inversión') || item.name.toLowerCase().includes('inversion')) {
          if (item.isPercentLinked === undefined) {
            item.isPercentLinked = true;
            item.percentOfSalary = 10;
          }
        }
        if (item.name.toLowerCase().includes('ocio') || item.name.toLowerCase().includes('imprevisto')) {
          if (item.isAvoidable === undefined) {
            item.isAvoidable = true;
          }
        }

        if (item.isPercentLinked && item.percentOfSalary) {
          item.amount = (salary * item.percentOfSalary) / 100;
        }
      });
    });
  }

  saveState(syncRemote = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getState());
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach(fn => fn(currentState));
  }

  getState() {
    let totalAllocated = 0;
    let avoidableTotal = 0;
    const salary = Number(this.state.salary) || 0;

    const categoryStats = this.state.categories.map(cat => {
      let subtotal = 0;
      let avoidableSubtotal = 0;
      cat.items.forEach(it => {
        const amt = Number(it.amount) || 0;
        subtotal += amt;
        if (it.isAvoidable) avoidableSubtotal += amt;
      });
      totalAllocated += subtotal;
      avoidableTotal += avoidableSubtotal;
      return {
        id: cat.id,
        title: cat.title,
        color: cat.color,
        subtotal,
        avoidableSubtotal,
        percentage: totalAllocated > 0 ? Number(((subtotal / totalAllocated) * 100).toFixed(1)) : 0,
        itemCount: cat.items.length
      };
    });

    const remaining = salary - totalAllocated;
    const percentAllocated = salary > 0 ? (totalAllocated / salary) * 100 : 0;
    const avoidablePercentOfSalary = salary > 0 ? (avoidableTotal / salary) * 100 : 0;

    let status = 'exact';
    if (remaining > 0) status = 'under';
    if (remaining < 0) status = 'over';

    return {
      ...this.state,
      totalAllocated,
      remaining,
      avoidableTotal,
      avoidablePercentOfSalary: Number(avoidablePercentOfSalary.toFixed(1)),
      annualPotentialSavings: avoidableTotal * 12,
      sixMonthPotentialSavings: avoidableTotal * 6,
      percentAllocated: Math.min(percentAllocated, 100),
      rawPercent: percentAllocated,
      status,
      categoryStats
    };
  }

  // Actions
  setSalary(newAmount) {
    const num = Math.max(0, parseFloat(newAmount) || 0);
    this.state.salary = num;
    this.recalculatePercentageItems();
    this.saveState();

    if (window.BudgetAPI) {
      window.BudgetAPI.updateSalary(num);
    }
  }

  clearSalary() {
    this.state.salary = 0;
    this.recalculatePercentageItems();
    this.saveState();

    if (window.BudgetAPI) {
      window.BudgetAPI.updateSalary(0);
    }
  }

  setCurrency(curr) {
    this.state.currency = curr;
    this.saveState();
    if (window.BudgetAPI) {
      window.BudgetAPI.updateCurrency(curr);
    }
  }

  updateCategoryTitle(categoryId, newTitle) {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (cat && newTitle.trim()) {
      cat.title = newTitle.trim().toUpperCase();
      this.saveState();

      if (window.BudgetAPI) {
        window.BudgetAPI.updateCategory(categoryId, cat.title);
      }
    }
  }

  addCategory(title) {
    if (!title.trim()) return;
    const newId = 'cat-' + Date.now();
    const colors = ['#38bdf8', '#fbbf24', '#10b981', '#a855f7', '#f43f5e', '#06b6d4'];
    const randomColor = colors[this.state.categories.length % colors.length];

    const newCat = {
      id: newId,
      title: title.trim().toUpperCase(),
      themeClass: 'category-custom',
      color: randomColor,
      items: []
    };
    this.state.categories.push(newCat);
    this.saveState();

    if (window.BudgetAPI) {
      window.BudgetAPI.addCategory(title.trim().toUpperCase());
    }
  }

  deleteCategory(categoryId) {
    this.state.categories = this.state.categories.filter(c => c.id !== categoryId);
    this.saveState();

    if (window.BudgetAPI) {
      window.BudgetAPI.deleteCategory(categoryId);
    }
  }

  addItem(categoryId, name, amount, isPercentLinked = false, percentOfSalary = 0, isAvoidable = false) {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (cat && name.trim()) {
      let finalAmount = Math.max(0, parseFloat(amount) || 0);
      if (isPercentLinked && percentOfSalary > 0) {
        finalAmount = (this.state.salary * percentOfSalary) / 100;
      }

      const newItem = {
        id: 'item-' + Date.now(),
        name: name.trim(),
        amount: finalAmount,
        isPercentLinked: !!isPercentLinked,
        percentOfSalary: isPercentLinked ? parseFloat(percentOfSalary) : null,
        isAvoidable: !!isAvoidable
      };
      cat.items.push(newItem);
      this.saveState();

      if (window.BudgetAPI) {
        window.BudgetAPI.addItem({
          categoryId,
          name: name.trim(),
          amount: finalAmount,
          isPercentLinked: !!isPercentLinked,
          percentOfSalary,
          isAvoidable: !!isAvoidable
        });
      }
    }
  }

  updateItem(categoryId, itemId, newName, newAmount, isPercentLinked = false, percentOfSalary = 0, isAvoidable = false) {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (cat) {
      const item = cat.items.find(it => it.id === itemId);
      if (item) {
        if (newName !== undefined && newName.trim()) item.name = newName.trim();
        item.isAvoidable = !!isAvoidable;
        item.isPercentLinked = !!isPercentLinked;

        if (isPercentLinked && percentOfSalary > 0) {
          item.percentOfSalary = parseFloat(percentOfSalary);
          item.amount = (this.state.salary * item.percentOfSalary) / 100;
        } else {
          item.percentOfSalary = null;
          if (newAmount !== undefined) item.amount = Math.max(0, parseFloat(newAmount) || 0);
        }
        this.saveState();

        if (window.BudgetAPI) {
          window.BudgetAPI.updateItem(itemId, {
            categoryId,
            name: item.name,
            amount: item.amount,
            isPercentLinked: item.isPercentLinked,
            percentOfSalary: item.percentOfSalary,
            isAvoidable: item.isAvoidable
          });
        }
      }
    }
  }

  deleteItem(categoryId, itemId) {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (cat) {
      const itemIndex = cat.items.findIndex(it => it.id === itemId);
      if (itemIndex > -1) {
        const [deleted] = cat.items.splice(itemIndex, 1);
        this.lastDeletedItem = {
          categoryId,
          item: deleted,
          index: itemIndex
        };
        this.saveState();

        if (window.BudgetAPI) {
          window.BudgetAPI.deleteItem(itemId);
        }
        return deleted;
      }
    }
    return null;
  }

  undoDeleteItem() {
    if (this.lastDeletedItem) {
      const { categoryId, item, index } = this.lastDeletedItem;
      const cat = this.state.categories.find(c => c.id === categoryId);
      if (cat) {
        cat.items.splice(index, 0, item);
        this.lastDeletedItem = null;
        this.saveState();

        if (window.BudgetAPI) {
          window.BudgetAPI.addItem({
            categoryId,
            name: item.name,
            amount: item.amount,
            isPercentLinked: item.isPercentLinked,
            percentOfSalary: item.percentOfSalary,
            isAvoidable: item.isAvoidable
          });
        }
        return true;
      }
    }
    return false;
  }

  async resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_BUDGET_DATA));
    this.saveState();
    if (window.BudgetAPI) {
      await window.BudgetAPI.resetBudget();
    }
  }
}

window.budgetStore = new BudgetStateManager();
