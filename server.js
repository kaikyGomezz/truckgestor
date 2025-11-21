const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend
app.use(express.static(path.join(__dirname, 'public')));

// ===== LOGIN MOCK =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '123456') {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Credenciais inválidas' });
});

// ===== DRIVERS =====
app.get('/api/drivers', (req, res) => {
  db.all(`SELECT * FROM drivers ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar motoristas' });
    res.json(rows);
  });
});

app.post('/api/drivers', (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  db.run(
    `INSERT INTO drivers (name, phone, active) VALUES (?, ?, 1)`,
    [name, phone || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar motorista' });
      res.status(201).json({ id: this.lastID, name, phone, active: 1 });
    }
  );
});

// ===== TRUCKS =====
app.get('/api/trucks', (req, res) => {
  db.all(`SELECT * FROM trucks ORDER BY plate ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar caminhões' });
    res.json(rows);
  });
});

app.post('/api/trucks', (req, res) => {
  const { plate, model, year } = req.body;
  if (!plate) {
    return res.status(400).json({ error: 'Placa é obrigatória' });
  }
  db.run(
    `INSERT INTO trucks (plate, model, year, active) VALUES (?, ?, ?, 1)`,
    [plate, model || null, year || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar caminhão' });
      res.status(201).json({
        id: this.lastID,
        plate,
        model: model || null,
        year: year || null,
        active: 1
      });
    }
  );
});

// ===== CATEGORIES =====
app.get('/api/categories', (req, res) => {
  db.all(`SELECT * FROM categories ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar categorias' });
    res.json(rows);
  });
});

// ===== EXPENSES (LISTAR COM FILTROS) =====
app.get('/api/expenses', (req, res) => {
  const { driver_id, truck_id, category_id, start_date, end_date } = req.query;

  const where = [];
  const params = [];

  if (driver_id) {
    where.push('e.driver_id = ?');
    params.push(driver_id);
  }
  if (truck_id) {
    where.push('e.truck_id = ?');
    params.push(truck_id);
  }
  if (category_id) {
    where.push('e.category_id = ?');
    params.push(category_id);
  }
  if (start_date) {
    where.push('e.date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    where.push('e.date <= ?');
    params.push(end_date);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const sql = `
    SELECT
      e.id,
      e.date,
      e.value,
      e.invoice_number,
      e.supplier,
      e.description,
      d.name AS driver_name,
      t.plate AS truck_plate,
      c.name AS category_name,
      e.driver_id,
      e.truck_id,
      e.category_id
    FROM expenses e
    JOIN drivers d ON d.id = e.driver_id
    LEFT JOIN trucks t ON t.id = e.truck_id
    JOIN categories c ON c.id = e.category_id
    ${whereClause}
    ORDER BY e.date ASC, e.id ASC
  `;

  const totalSql = `
    SELECT IFNULL(SUM(e.value), 0) AS total
    FROM expenses e
    ${whereClause}
  `;

  const totalByDriverSql = `
    SELECT d.name AS driver_name, IFNULL(SUM(e.value), 0) AS total
    FROM expenses e
    JOIN drivers d ON d.id = e.driver_id
    ${whereClause}
    GROUP BY e.driver_id
    ORDER BY driver_name ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar gastos' });

    db.get(totalSql, params, (err2, totalRow) => {
      if (err2) return res.status(500).json({ error: 'Erro ao calcular total' });

      db.all(totalByDriverSql, params, (err3, totalByDriver) => {
        if (err3) return res.status(500).json({ error: 'Erro ao calcular total por motorista' });

        res.json({
          expenses: rows,
          total: totalRow.total || 0,
          totalByDriver
        });
      });
    });
  });
});

// ===== EXPENSES (CRIAR) =====
app.post('/api/expenses', (req, res) => {
  const {
    driver_id,
    truck_id,
    category_id,
    date,
    value,
    invoice_number,
    supplier,
    description
  } = req.body;

  if (!driver_id || !category_id || !date || value == null) {
    return res.status(400).json({
      error: 'Motorista, categoria, data e valor são obrigatórios'
    });
  }

  db.run(
    `
    INSERT INTO expenses
      (driver_id, truck_id, category_id, date, value, invoice_number, supplier, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      driver_id,
      truck_id || null,
      category_id,
      date,
      value,
      invoice_number || null,
      supplier || null,
      description || null
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao salvar gasto' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// ===== DASHBOARD (RESUMO) =====
app.get('/api/dashboard', (req, res) => {
  const today = new Date();
  const year = today.getFullYear();
  const monthNumber = today.getMonth() + 1;
  const month = String(monthNumber).padStart(2, '0');
  const startOfMonth = `${year}-${month}-01`;
  const endOfMonth = `${year}-${month}-31`;

  const totalMonthSql = `
    SELECT IFNULL(SUM(value), 0) AS total
    FROM expenses
    WHERE date BETWEEN ? AND ?;
  `;

  const countMonthSql = `
    SELECT COUNT(*) AS count
    FROM expenses
    WHERE date BETWEEN ? AND ?;
  `;

  const topDriverSql = `
    SELECT d.name AS driver_name, IFNULL(SUM(e.value), 0) AS total
    FROM expenses e
    JOIN drivers d ON d.id = e.driver_id
    WHERE e.date BETWEEN ? AND ?
    GROUP BY e.driver_id
    ORDER BY total DESC
    LIMIT 1;
  `;

  db.get(totalMonthSql, [startOfMonth, endOfMonth], (err, totalRow) => {
    if (err) return res.status(500).json({ error: 'Erro ao calcular total do mês' });

    db.get(countMonthSql, [startOfMonth, endOfMonth], (err2, countRow) => {
      if (err2) return res.status(500).json({ error: 'Erro ao calcular quantidade de gastos' });

      db.get(topDriverSql, [startOfMonth, endOfMonth], (err3, topRow) => {
        if (err3) return res.status(500).json({ error: 'Erro ao calcular top motorista' });

        res.json({
          month: `${month}/${year}`,
          totalMonth: totalRow.total || 0,
          countMonth: countRow.count || 0,
          topDriver: topRow
            ? {
                name: topRow.driver_name,
                total: topRow.total || 0
              }
            : null
        });
      });
    });
  });
});

// ===== EXPORTAR CSV =====
app.get('/api/expenses/export', (req, res) => {
  const { driver_id, truck_id, category_id, start_date, end_date } = req.query;

  const where = [];
  const params = [];

  if (driver_id) {
    where.push('e.driver_id = ?');
    params.push(driver_id);
  }
  if (truck_id) {
    where.push('e.truck_id = ?');
    params.push(truck_id);
  }
  if (category_id) {
    where.push('e.category_id = ?');
    params.push(category_id);
  }
  if (start_date) {
    where.push('e.date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    where.push('e.date <= ?');
    params.push(end_date);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const sql = `
    SELECT
      e.date,
      d.name AS driver_name,
      t.plate AS truck_plate,
      c.name AS category_name,
      e.value,
      e.invoice_number,
      e.supplier,
      e.description
    FROM expenses e
    JOIN drivers d ON d.id = e.driver_id
    LEFT JOIN trucks t ON t.id = e.truck_id
    JOIN categories c ON c.id = e.category_id
    ${whereClause}
    ORDER BY e.date ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao exportar gastos' });
    }

    const header = [
      'Data',
      'Motorista',
      'Caminhao',
      'Categoria',
      'Valor',
      'NotaFiscal',
      'Fornecedor',
      'Observacoes'
    ];

    const lines = rows.map(r => [
      r.date,
      r.driver_name,
      r.truck_plate || '',
      r.category_name,
      r.value != null ? r.value.toString().replace('.', ',') : '',
      r.invoice_number || '',
      r.supplier || '',
      (r.description || '').replace(/\r?\n/g, ' ')
    ]);

    const csv = [header, ...lines]
      .map(cols => cols.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.csv"');
    res.send(csv);
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
