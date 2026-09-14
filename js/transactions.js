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
        this.notify();
      }
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
    this.notify();

    if (window.BudgetAPI) {
      await window.BudgetAPI.createTransaction(newTx);
    }
    return newTx;
  }

  async updateTransaction(txId, updatedData) {
    const idx = this.transactions.findIndex(t => t.id === txId);
    if (idx !== -1) {
      this.transactions[idx] = {
        ...this.transactions[idx],
        ...updatedData,
        amount: Math.max(0, parseFloat(updatedData.amount !== undefined ? updatedData.amount : this.transactions[idx].amount) || 0)
      };
      this.notify();

      if (window.BudgetAPI) {
        await window.BudgetAPI.updateTransaction(txId, this.transactions[idx]);
      }
    }
  }

  async deleteTransaction(txId) {
    this.transactions = this.transactions.filter(t => t.id !== txId);
    this.notify();

    if (window.BudgetAPI) {
      await window.BudgetAPI.deleteTransaction(txId);
    }
  }
}

window.txStore = new TransactionsManager();
