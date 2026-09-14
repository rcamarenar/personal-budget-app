/* =========================================================
   Frontend REST API Client for Express Backend
   ========================================================= */

const API_BASE = '/api';

const BudgetAPI = {
  async getBudget() {
    try {
      const res = await fetch(`${API_BASE}/budget`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend API offline or unreachable, using local fallback', err);
      return null;
    }
  },

  async updateSalary(salary) {
    try {
      const res = await fetch(`${API_BASE}/budget/salary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary })
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error updateSalary', err);
      return null;
    }
  },

  async updateCurrency(currency) {
    try {
      await fetch(`${API_BASE}/budget/currency`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency })
      });
    } catch (err) {
      console.warn('API error updateCurrency', err);
    }
  },

  async addItem(itemData) {
    try {
      const res = await fetch(`${API_BASE}/budget/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error addItem', err);
      return null;
    }
  },

  async updateItem(itemId, itemData) {
    try {
      const res = await fetch(`${API_BASE}/budget/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error updateItem', err);
      return null;
    }
  },

  async deleteItem(itemId) {
    try {
      const res = await fetch(`${API_BASE}/budget/items/${itemId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error deleteItem', err);
      return null;
    }
  },

  async addCategory(title) {
    try {
      const res = await fetch(`${API_BASE}/budget/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error addCategory', err);
      return null;
    }
  },

  async updateCategory(categoryId, title) {
    try {
      const res = await fetch(`${API_BASE}/budget/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error updateCategory', err);
      return null;
    }
  },

  async deleteCategory(categoryId) {
    try {
      const res = await fetch(`${API_BASE}/budget/categories/${categoryId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error deleteCategory', err);
      return null;
    }
  },

  async getAvoidableEvolution() {
    try {
      const res = await fetch(`${API_BASE}/analytics/avoidable-evolution`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error getAvoidableEvolution', err);
      return null;
    }
  },

  async resetBudget() {
    try {
      const res = await fetch(`${API_BASE}/budget/reset`, {
        method: 'POST'
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error resetBudget', err);
      return null;
    }
  },

  // Transactions Endpoints
  async getTransactions() {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error getTransactions', err);
      return null;
    }
  },

  async createTransaction(txData) {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error createTransaction', err);
      return null;
    }
  },

  async deleteTransaction(txId) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${txId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('API error deleteTransaction', err);
      return null;
    }
  },

  // Scan Receipt / Screenshot OCR
  async scanReceipt(payload) {
    try {
      const res = await fetch(`${API_BASE}/transactions/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('API error scanReceipt', err);
      return null;
    }
  },

  // WhatsApp Webhook Simulation
  async sendWhatsAppMessage(message) {
    try {
      const res = await fetch(`${API_BASE}/webhook/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, senderName: 'Tú' })
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('API error sendWhatsAppMessage', err);
      return null;
    }
  }
};

window.BudgetAPI = BudgetAPI;
