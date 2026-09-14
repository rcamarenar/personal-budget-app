/* =========================================================
   Express Backend Server for Personal Budget Application
   ========================================================= */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'server', 'data', 'budget.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper: Read Database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(getDefaultData(), null, 2));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return getDefaultData();
  }
}

// Helper: Write Database
function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Default Seed Data
function getDefaultData() {
  return {
    salary: 2500,
    currency: "S/.",
    categories: [
      {
        id: "cat-fijos",
        title: "GASTOS FIJOS",
        themeClass: "category-fijos",
        color: "#38bdf8",
        items: [
          { id: "item-1", name: "Renta", amount: 800, isAvoidable: false },
          { id: "item-2", name: "Agua y luz", amount: 120, isAvoidable: false },
          { id: "item-3", name: "Internet", amount: 60, isAvoidable: false },
          { id: "item-4", name: "Celular", amount: 40, isAvoidable: false }
        ]
      },
      {
        id: "cat-esenciales",
        title: "GASTOS ESENCIALES",
        themeClass: "category-esenciales",
        color: "#fbbf24",
        items: [
          { id: "item-5", name: "Alimentación", amount: 350, isAvoidable: false },
          { id: "item-6", name: "Transporte", amount: 180, isAvoidable: false },
          { id: "item-7", name: "Salud", amount: 100, isAvoidable: false }
        ]
      },
      {
        id: "cat-plan",
        title: "PLANIFICACIÓN",
        themeClass: "category-plan",
        color: "#10b981",
        items: [
          { id: "item-8", name: "Fondo de emergencia", amount: 350, isAvoidable: false },
          { id: "item-9", name: "Inversión", amount: 250, isPercentLinked: true, percentOfSalary: 10, isAvoidable: false },
          { id: "item-10", name: "Ocio / imprevistos", amount: 250, isAvoidable: true }
        ]
      }
    ],
    history: [
      { month: "Ene", totalSpent: 2500, avoidableSpent: 320 },
      { month: "Feb", totalSpent: 2550, avoidableSpent: 300 },
      { month: "Mar", totalSpent: 2480, avoidableSpent: 280 },
      { month: "Abr", totalSpent: 2500, avoidableSpent: 260 },
      { month: "May", totalSpent: 2520, avoidableSpent: 250 },
      { month: "Jun", totalSpent: 2500, avoidableSpent: 250 }
    ]
  };
}

// Helper: Calculate Enriched Budget State
function computeBudgetState(db) {
  let totalAllocated = 0;
  let avoidableTotal = 0;
  const salary = Number(db.salary) || 0;

  const categoryStats = db.categories.map(cat => {
    let catSum = 0;
    let catAvoidable = 0;

    cat.items.forEach(item => {
      // Recalculate percent linked items if needed
      if (item.isPercentLinked && item.percentOfSalary) {
        item.amount = (salary * item.percentOfSalary) / 100;
      }
      const amt = Number(item.amount) || 0;
      catSum += amt;
      if (item.isAvoidable) {
        catAvoidable += amt;
      }
    });

    totalAllocated += catSum;
    avoidableTotal += catAvoidable;

    return {
      id: cat.id,
      title: cat.title,
      color: cat.color,
      subtotal: catSum,
      avoidableSubtotal: catAvoidable,
      itemCount: cat.items.length
    };
  });

  const remaining = salary - totalAllocated;
  const percentAllocated = salary > 0 ? (totalAllocated / salary) * 100 : 0;
  const avoidablePercentOfTotal = totalAllocated > 0 ? (avoidableTotal / totalAllocated) * 100 : 0;
  const avoidablePercentOfSalary = salary > 0 ? (avoidableTotal / salary) * 100 : 0;

  return {
    ...db,
    totalAllocated,
    remaining,
    avoidableTotal,
    avoidablePercentOfTotal: Number(avoidablePercentOfTotal.toFixed(1)),
    avoidablePercentOfSalary: Number(avoidablePercentOfSalary.toFixed(1)),
    annualAvoidableSavings: avoidableTotal * 12,
    sixMonthAvoidableSavings: avoidableTotal * 6,
    percentAllocated: Math.min(percentAllocated, 100),
    rawPercent: percentAllocated,
    status: remaining === 0 ? 'exact' : remaining > 0 ? 'under' : 'over',
    categoryStats
  };
}

/* =========================================================
   REST API ROUTES
   ========================================================= */

// 1. GET /api/budget - Retrieve current budget
app.get('/api/budget', (req, res) => {
  const db = readDB();
  const state = computeBudgetState(db);
  res.json({ success: true, data: state });
});

// 2. PUT /api/budget/salary - Update monthly salary
app.put('/api/budget/salary', (req, res) => {
  const { salary } = req.body;
  if (salary === undefined || isNaN(salary) || salary < 0) {
    return res.status(400).json({ success: false, message: 'Invalid salary amount' });
  }

  const db = readDB();
  db.salary = parseFloat(salary);
  
  // Recalculate percentage linked items with new salary
  db.categories.forEach(cat => {
    cat.items.forEach(it => {
      if (it.isPercentLinked && it.percentOfSalary) {
        it.amount = (db.salary * it.percentOfSalary) / 100;
      }
    });
  });

  writeDB(db);
  const state = computeBudgetState(db);
  res.json({ success: true, data: state, message: 'Salary updated successfully' });
});

// 3. PUT /api/budget/currency - Update currency symbol
app.put('/api/budget/currency', (req, res) => {
  const { currency } = req.body;
  if (!currency) {
    return res.status(400).json({ success: false, message: 'Currency is required' });
  }

  const db = readDB();
  db.currency = currency;
  writeDB(db);
  res.json({ success: true, currency, message: 'Currency updated' });
});

// 4. POST /api/budget/items - Add new item
app.post('/api/budget/items', (req, res) => {
  const { categoryId, name, amount, isPercentLinked, percentOfSalary, isAvoidable } = req.body;
  if (!categoryId || !name) {
    return res.status(400).json({ success: false, message: 'categoryId and name are required' });
  }

  const db = readDB();
  const cat = db.categories.find(c => c.id === categoryId);
  if (!cat) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  let finalAmount = Math.max(0, parseFloat(amount) || 0);
  if (isPercentLinked && percentOfSalary > 0) {
    finalAmount = (db.salary * parseFloat(percentOfSalary)) / 100;
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
  writeDB(db);
  const state = computeBudgetState(db);
  res.status(201).json({ success: true, data: state, item: newItem, message: 'Item created' });
});

// 5. PUT /api/budget/items/:id - Update item
app.put('/api/budget/items/:id', (req, res) => {
  const itemId = req.params.id;
  const { categoryId, name, amount, isPercentLinked, percentOfSalary, isAvoidable } = req.body;

  const db = readDB();
  let found = false;

  db.categories.forEach(cat => {
    const item = cat.items.find(it => it.id === itemId);
    if (item) {
      found = true;
      if (name !== undefined) item.name = name.trim();
      if (isAvoidable !== undefined) item.isAvoidable = !!isAvoidable;
      
      item.isPercentLinked = !!isPercentLinked;
      if (isPercentLinked && percentOfSalary > 0) {
        item.percentOfSalary = parseFloat(percentOfSalary);
        item.amount = (db.salary * item.percentOfSalary) / 100;
      } else {
        item.percentOfSalary = null;
        if (amount !== undefined) item.amount = Math.max(0, parseFloat(amount) || 0);
      }
    }
  });

  if (!found) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  writeDB(db);
  const state = computeBudgetState(db);
  res.json({ success: true, data: state, message: 'Item updated' });
});

// 6. DELETE /api/budget/items/:id - Delete item
app.delete('/api/budget/items/:id', (req, res) => {
  const itemId = req.params.id;
  const db = readDB();
  let deletedItem = null;

  db.categories.forEach(cat => {
    const idx = cat.items.findIndex(it => it.id === itemId);
    if (idx > -1) {
      deletedItem = cat.items.splice(idx, 1)[0];
    }
  });

  if (!deletedItem) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  writeDB(db);
  const state = computeBudgetState(db);
  res.json({ success: true, data: state, deleted: deletedItem, message: 'Item deleted' });
});

// 7. POST /api/budget/categories - Add Category
app.post('/api/budget/categories', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const db = readDB();
  const colors = ['#38bdf8', '#fbbf24', '#10b981', '#a855f7', '#f43f5e', '#06b6d4'];
  const randomColor = colors[db.categories.length % colors.length];

  const newCat = {
    id: 'cat-' + Date.now(),
    title: title.trim().toUpperCase(),
    themeClass: 'category-custom',
    color: randomColor,
    items: []
  };

  db.categories.push(newCat);
  writeDB(db);
  const state = computeBudgetState(db);
  res.status(201).json({ success: true, data: state, category: newCat });
});

// 8. PUT /api/budget/categories/:id - Update Category Title
app.put('/api/budget/categories/:id', (req, res) => {
  const catId = req.params.id;
  const { title } = req.body;

  const db = readDB();
  const cat = db.categories.find(c => c.id === catId);
  if (!cat) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  if (title && title.trim()) cat.title = title.trim().toUpperCase();
  writeDB(db);
  const state = computeBudgetState(db);
  res.json({ success: true, data: state });
});

// 9. DELETE /api/budget/categories/:id - Delete Category
app.delete('/api/budget/categories/:id', (req, res) => {
  const catId = req.params.id;
  const db = readDB();
  const initialLength = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== catId);

  if (db.categories.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  writeDB(db);
  const state = computeBudgetState(db);
  res.json({ success: true, data: state });
});

// 10. GET /api/analytics/avoidable-evolution - Evolution & Projection Curve
app.get('/api/analytics/avoidable-evolution', (req, res) => {
  const db = readDB();
  const state = computeBudgetState(db);
  const currentAvoidable = state.avoidableTotal;

  // Monthly historical & future 6-12 month projection curve
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const currentMonthIdx = 5; // Jun

  const evolutionPoints = [];
  let cumulativeSavingsIfCut = 0;

  for (let i = 0; i < 12; i++) {
    const monthName = months[i];
    let historicalSpent = currentAvoidable;

    if (i < 6 && db.history && db.history[i]) {
      historicalSpent = db.history[i].avoidableSpent;
    }

    cumulativeSavingsIfCut += currentAvoidable;

    evolutionPoints.push({
      month: monthName,
      monthIndex: i,
      isProjected: i >= 6,
      avoidableSpent: historicalSpent,
      cumulativeSavingsIfAvoided: cumulativeSavingsIfCut,
      optimizedSpentIfCut50: Math.round(historicalSpent * 0.5)
    });
  }

  res.json({
    success: true,
    data: {
      currentMonthlyAvoidable: currentAvoidable,
      currency: db.currency,
      annualPotentialSavings: currentAvoidable * 12,
      sixMonthPotentialSavings: currentAvoidable * 6,
      evolutionPoints,
      avoidableItemsList: db.categories.flatMap(cat => 
        cat.items.filter(it => it.isAvoidable).map(it => ({
          id: it.id,
          name: it.name,
          categoryTitle: cat.title,
          amount: it.amount
        }))
      )
    }
  });
});

// 11. POST /api/budget/reset - Reset to defaults
app.post('/api/budget/reset', (req, res) => {
  const defaultData = getDefaultData();
  writeDB(defaultData);
  const state = computeBudgetState(defaultData);
  res.json({ success: true, data: state, message: 'Database reset to default' });
});

// Fallback HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Personal Budget Backend] Running at http://localhost:${PORT}`);
});
