/* =========================================================
   Transactions Manager (Daily & Monthly Ledger)
   ========================================================= */

class TransactionsManager {
  constructor() {
    this.transactions = [];
    this.groupedByDay = [];
    this.listeners = [];
    this.currentMonthFilter = 'all'; // 'all', 'current', or specific 'YYYY-MM'
  }

  async init() {
    await this.fetchTransactions();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getState());
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    const totalSpent = this.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const avoidableSpent = this.transactions.filter(t => t.isAvoidable).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Grouping by Date (Local Day)
    const grouped = {};
    this.transactions.forEach(tx => {
      const d = new Date(tx.date);
      const dayKey = d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          dateLabel: dayKey,
          rawDate: tx.date,
          dayTotal: 0,
          items: []
        };
      }
      grouped[dayKey].dayTotal += Number(tx.amount) || 0;
      grouped[dayKey].items.push(tx);
    });

    return {
      transactions: this.transactions,
      groupedDays: Object.values(grouped),
      totalSpent,
      avoidableSpent,
      totalCount: this.transactions.length
    };
  }

  async fetchTransactions() {
    if (window.BudgetAPI) {
      const res = await window.BudgetAPI.getTransactions();
      if (res && res.transactions) {
        this.transactions = res.transactions;
        localStorage.setItem('budget_transactions_cache', JSON.stringify(this.transactions));
        this.notify();
        return;
      }
    }
    // Fallback to cache if API unreachable
    const cached = localStorage.getItem('budget_transactions_cache');
    if (cached) {
      try {
        this.transactions = JSON.parse(cached);
        this.notify();
      } catch (e) {}
    }
  }

  async addTransaction(txData) {
    const newTx = {
      id: 'tx-' + Date.now(),
      date: txData.date || new Date().toISOString(),
      concept: txData.concept || 'Gasto registrado',
      amount: Math.max(0, parseFloat(txData.amount) || 0),
      categoryTitle: txData.categoryTitle || 'GASTOS ESENCIALES',
      itemName: txData.itemName || txData.concept,
      paymentMethod: txData.paymentMethod || 'Yape',
      isAvoidable: !!txData.isAvoidable,
      source: txData.source || 'manual',
      notes: txData.notes || ''
    };

    this.transactions.unshift(newTx);
    localStorage.setItem('budget_transactions_cache', JSON.stringify(this.transactions));
    this.notify();

    if (window.BudgetAPI) {
      await window.BudgetAPI.createTransaction(newTx);
    }
    return newTx;
  }

  async updateTransaction(txId, updatedData) {
    const idx = this.transactions.findIndex(t => String(t.id) === String(txId));
    if (idx !== -1) {
      this.transactions[idx] = {
        ...this.transactions[idx],
        ...updatedData,
        amount: Math.max(0, parseFloat(updatedData.amount !== undefined ? updatedData.amount : this.transactions[idx].amount) || 0)
      };
      localStorage.setItem('budget_transactions_cache', JSON.stringify(this.transactions));
      this.notify();

      if (window.BudgetAPI) {
        await window.BudgetAPI.updateTransaction(txId, this.transactions[idx]);
      }
    }
  }

  async deleteTransaction(txId) {
    this.transactions = this.transactions.filter(t => String(t.id) !== String(txId));
    localStorage.setItem('budget_transactions_cache', JSON.stringify(this.transactions));
    this.notify();

    if (window.BudgetAPI) {
      await window.BudgetAPI.deleteTransaction(txId);
    }
  }

  async clearAllTransactions() {
    this.transactions = [];
    localStorage.setItem('budget_transactions_cache', JSON.stringify([]));
    this.notify();

    if (window.BudgetAPI) {
      await window.BudgetAPI.clearAllTransactions();
    }
  }
}

window.txStore = new TransactionsManager();
