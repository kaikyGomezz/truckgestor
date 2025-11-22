// server.js - API única para gestão de frota (protótipo)

const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir o front-end estático
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ===== LOGIN =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const match = await bcrypt.compare(password, user.password_hash).catch(() => false);
    if (!match) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Protótipo: só confirma login, sem JWT
    res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// ===================== MOTORISTAS =====================
app.get('/api/drivers', (req, res) => {
  db.all('SELECT * FROM drivers ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar motoristas', err);
      return res.status(500).json({ error: 'Erro ao listar motoristas' });
    }
    res.json(rows);
  });
});

app.post('/api/drivers', (req, res) => {
  const { name, phone, cnh, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  db.run(
    `INSERT INTO drivers (name, phone, cnh, status) VALUES (?,?,?,?)`,
    [name, phone || null, cnh || null, status || 'ativo'],
    function (err) {
      if (err) {
        console.error('Erro ao inserir motorista', err);
        return res.status(500).json({ error: 'Erro ao salvar motorista' });
      }
      res.json({ id: this.lastID, name, phone, cnh, status: status || 'ativo' });
    }
  );
});

// ===================== CAVALOS (TRUCKS) =====================
app.get('/api/trucks', (req, res) => {
  db.all('SELECT * FROM trucks ORDER BY plate', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar caminhões', err);
      return res.status(500).json({ error: 'Erro ao listar caminhões' });
    }
    res.json(rows);
  });
});

app.post('/api/trucks', (req, res) => {
  const { plate, model, year, odometer, status } = req.body;
  if (!plate) return res.status(400).json({ error: 'Placa é obrigatória' });

  db.run(
    `INSERT INTO trucks (plate, model, year, odometer, status) VALUES (?,?,?,?,?)`,
    [plate, model || null, year || null, odometer || null, status || 'ativo'],
    function (err) {
      if (err) {
        console.error('Erro ao inserir caminhão', err);
        return res.status(500).json({ error: 'Erro ao salvar caminhão' });
      }
      res.json({
        id: this.lastID,
        plate,
        model,
        year,
        odometer,
        status: status || 'ativo',
      });
    }
  );
});

// ===================== CARRETAS (TRAILERS) =====================
app.get('/api/trailers', (req, res) => {
  db.all('SELECT * FROM trailers ORDER BY plate', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar carretas', err);
      return res.status(500).json({ error: 'Erro ao listar carretas' });
    }
    res.json(rows);
  });
});

app.post('/api/trailers', (req, res) => {
  const { plate, type, year, status } = req.body;
  if (!plate) return res.status(400).json({ error: 'Placa é obrigatória' });

  db.run(
    `INSERT INTO trailers (plate, type, year, status) VALUES (?,?,?,?)`,
    [plate, type || null, year || null, status || 'ativa'],
    function (err) {
      if (err) {
        console.error('Erro ao inserir carreta', err);
        return res.status(500).json({ error: 'Erro ao salvar carreta' });
      }
      res.json({
        id: this.lastID,
        plate,
        type,
        year,
        status: status || 'ativa',
      });
    }
  );
});

// ===================== PNEUS (TIRES) =====================
app.get('/api/tires', (req, res) => {
  db.all('SELECT * FROM tires ORDER BY code', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar pneus', err);
      return res.status(500).json({ error: 'Erro ao listar pneus' });
    }
    res.json(rows);
  });
});

app.post('/api/tires', (req, res) => {
  const { code, brand, model, purchase_date, purchase_value, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Código do pneu é obrigatório' });

  db.run(
    `
    INSERT INTO tires (code, brand, model, purchase_date, purchase_value, state)
    VALUES (?,?,?,?,?,?)
  `,
    [
      code,
      brand || null,
      model || null,
      purchase_date || null,
      purchase_value || null,
      state || 'estoque',
    ],
    function (err) {
      if (err) {
        console.error('Erro ao inserir pneu', err);
        return res.status(500).json({ error: 'Erro ao salvar pneu' });
      }
      res.json({
        id: this.lastID,
        code,
        brand,
        model,
        purchase_date,
        purchase_value,
        state: state || 'estoque',
      });
    }
  );
});

// ===================== INSTALAÇÃO DE PNEUS =====================
app.get('/api/tires/installations', (req, res) => {
  const { tire_id, vehicle_type, vehicle_id } = req.query;
  const params = [];
  let sql = `
    SELECT ti.*
    FROM tire_installations ti
    WHERE 1=1
  `;

  if (tire_id) {
    sql += ' AND ti.tire_id = ?';
    params.push(tire_id);
  }
  if (vehicle_type && vehicle_id) {
    sql += ' AND ti.vehicle_type = ? AND ti.vehicle_id = ?';
    params.push(vehicle_type, vehicle_id);
  }

  sql += ' ORDER BY ti.installed_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao listar instalações de pneus', err);
      return res.status(500).json({ error: 'Erro ao listar instalações' });
    }
    res.json(rows);
  });
});

app.post('/api/tires/installations', (req, res) => {
  const {
    tire_id,
    vehicle_type,
    vehicle_id,
    position,
    installed_at,
    removed_at,
    installed_odometer,
    removed_odometer,
  } = req.body;

  if (!tire_id || !vehicle_type || !vehicle_id || !installed_at) {
    return res
      .status(400)
      .json({ error: 'tire_id, vehicle_type, vehicle_id e installed_at são obrigatórios' });
  }

  db.run(
    `
    INSERT INTO tire_installations
      (tire_id, vehicle_type, vehicle_id, position, installed_at, removed_at, installed_odometer, removed_odometer)
    VALUES (?,?,?,?,?,?,?,?)
  `,
    [
      tire_id,
      vehicle_type,
      vehicle_id,
      position || null,
      installed_at,
      removed_at || null,
      installed_odometer || null,
      removed_odometer || null,
    ],
    function (err) {
      if (err) {
        console.error('Erro ao registrar instalação de pneu', err);
        return res.status(500).json({ error: 'Erro ao salvar instalação de pneu' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// ===================== RECAPAGENS =====================
app.get('/api/tires/retreads', (req, res) => {
  const { tire_id } = req.query;
  const params = [];
  let sql = `SELECT tr.* FROM tire_retreads tr WHERE 1=1`;

  if (tire_id) {
    sql += ' AND tr.tire_id = ?';
    params.push(tire_id);
  }

  sql += ' ORDER BY tr.date DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao listar recapagens', err);
      return res.status(500).json({ error: 'Erro ao listar recapagens' });
    }
    res.json(rows);
  });
});

app.post('/api/tires/retreads', (req, res) => {
  const { tire_id, date, value, notes } = req.body;
  if (!tire_id || !date || !value) {
    return res.status(400).json({ error: 'tire_id, date e value são obrigatórios' });
  }

  db.run(
    `
    INSERT INTO tire_retreads (tire_id, date, value, notes)
    VALUES (?,?,?,?)
  `,
    [tire_id, date, value, notes || null],
    function (err) {
      if (err) {
        console.error('Erro ao inserir recapagem', err);
        return res.status(500).json({ error: 'Erro ao salvar recapagem' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// ===================== CATEGORIAS =====================
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM expense_categories ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar categorias', err);
      return res.status(500).json({ error: 'Erro ao listar categorias' });
    }
    res.json(rows);
  });
});

// ===================== EXPENSES (GASTOS) =====================
app.post('/api/expenses', (req, res) => {
  const {
    driver_id,
    truck_id,
    trailer_id,
    tire_id,
    category_id,
    date,
    value,
    invoice_number,
    supplier,
    odometer,
    attachment_url,
    description,
  } = req.body;

  if (!category_id || !date || value == null) {
    return res.status(400).json({ error: 'Categoria, data e valor são obrigatórios' });
  }

  db.run(
    `
    INSERT INTO expenses
      (driver_id, truck_id, trailer_id, tire_id, category_id, date, value, invoice_number, supplier, odometer, attachment_url, description)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `,
    [
      driver_id || null,
      truck_id || null,
      trailer_id || null,
      tire_id || null,
      category_id,
      date,
      value,
      invoice_number || null,
      supplier || null,
      odometer || null,
      attachment_url || null,
      description || null,
    ],
    function (err) {
      if (err) {
        console.error('Erro ao inserir gasto', err);
        return res.status(500).json({ error: 'Erro ao salvar gasto' });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/expenses', (req, res) => {
  const {
    driver_id,
    truck_id,
    trailer_id,
    tire_id,
    category_id,
    start_date,
    end_date,
  } = req.query;

  const params = [];
  let sql = `
    SELECT e.*, 
           d.name AS driver_name,
           t.plate AS truck_plate,
           tr.plate AS trailer_plate,
           c.name AS category_name,
           ti.code AS tire_code
    FROM expenses e
    LEFT JOIN drivers d ON e.driver_id = d.id
    LEFT JOIN trucks t ON e.truck_id = t.id
    LEFT JOIN trailers tr ON e.trailer_id = tr.id
    LEFT JOIN expense_categories c ON e.category_id = c.id
    LEFT JOIN tires ti ON e.tire_id = ti.id
    WHERE 1=1
  `;

  if (driver_id) {
    sql += ' AND e.driver_id = ?';
    params.push(driver_id);
  }
  if (truck_id) {
    sql += ' AND e.truck_id = ?';
    params.push(truck_id);
  }
  if (trailer_id) {
    sql += ' AND e.trailer_id = ?';
    params.push(trailer_id);
  }
  if (tire_id) {
    sql += ' AND e.tire_id = ?';
    params.push(tire_id);
  }
  if (category_id) {
    sql += ' AND e.category_id = ?';
    params.push(category_id);
  }
  if (start_date) {
    sql += ' AND e.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND e.date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY e.date DESC, e.id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao listar gastos', err);
      return res.status(500).json({ error: 'Erro ao listar gastos' });
    }

    const total = rows.reduce((sum, e) => sum + (e.value || 0), 0);

    // total por motorista
    const totalByDriverMap = {};
    rows.forEach((e) => {
      if (!e.driver_id || !e.driver_name) return;
      if (!totalByDriverMap[e.driver_id]) {
        totalByDriverMap[e.driver_id] = { driver_id: e.driver_id, driver_name: e.driver_name, total: 0 };
      }
      totalByDriverMap[e.driver_id].total += e.value || 0;
    });

    const totalByDriver = Object.values(totalByDriverMap);

    res.json({ expenses: rows, total, totalByDriver });
  });
});

// Export CSV simples
app.get('/api/expenses/export', (req, res) => {
  const {
    driver_id,
    truck_id,
    trailer_id,
    tire_id,
    category_id,
    start_date,
    end_date,
  } = req.query;

  const params = [];
  let sql = `
    SELECT e.*, 
           d.name AS driver_name,
           t.plate AS truck_plate,
           tr.plate AS trailer_plate,
           c.name AS category_name,
           ti.code AS tire_code
    FROM expenses e
    LEFT JOIN drivers d ON e.driver_id = d.id
    LEFT JOIN trucks t ON e.truck_id = t.id
    LEFT JOIN trailers tr ON e.trailer_id = tr.id
    LEFT JOIN expense_categories c ON e.category_id = c.id
    LEFT JOIN tires ti ON e.tire_id = ti.id
    WHERE 1=1
  `;

  if (driver_id) {
    sql += ' AND e.driver_id = ?';
    params.push(driver_id);
  }
  if (truck_id) {
    sql += ' AND e.truck_id = ?';
    params.push(truck_id);
  }
  if (trailer_id) {
    sql += ' AND e.trailer_id = ?';
    params.push(trailer_id);
  }
  if (tire_id) {
    sql += ' AND e.tire_id = ?';
    params.push(tire_id);
  }
  if (category_id) {
    sql += ' AND e.category_id = ?';
    params.push(category_id);
  }
  if (start_date) {
    sql += ' AND e.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND e.date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY e.date DESC, e.id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao exportar gastos', err);
      return res.status(500).json({ error: 'Erro ao exportar gastos' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.csv"');

    const header = [
      'Data',
      'Motorista',
      'Cavalo',
      'Carreta',
      'Pneu',
      'Categoria',
      'Valor',
      'Nota Fiscal',
      'Fornecedor',
      'Odômetro',
      'Descrição',
    ];

    res.write(header.join(';') + '\n');

    rows.forEach((e) => {
      const line = [
        e.date || '',
        e.driver_name || '',
        e.truck_plate || '',
        e.trailer_plate || '',
        e.tire_code || '',
        e.category_name || '',
        (e.value != null ? e.value.toFixed(2) : '').replace('.', ','),
        e.invoice_number || '',
        e.supplier || '',
        e.odometer != null ? e.odometer : '',
        (e.description || '').replace(/\r?\n/g, ' '),
      ];
      res.write(line.join(';') + '\n');
    });

    res.end();
  });
});

// ===================== DASHBOARD =====================
app.get('/api/dashboard', (req, res) => {
  const sqlTotalMonth = `
    SELECT 
      strftime('%Y-%m', date) AS ym,
      SUM(value) AS total,
      COUNT(*) AS count
    FROM expenses
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `;

  const sqlTopDriver = `
    SELECT d.name AS driver_name, SUM(e.value) AS total
    FROM expenses e
    JOIN drivers d ON e.driver_id = d.id
    WHERE strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now')
    GROUP BY e.driver_id
    ORDER BY total DESC
    LIMIT 1
  `;

  db.get(sqlTotalMonth, [], (err, rowMonth) => {
    if (err) {
      console.error('Erro ao buscar total do mês', err);
      return res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }

    db.get(sqlTopDriver, [], (err2, rowTop) => {
      if (err2) {
        console.error('Erro ao buscar top driver', err2);
        return res.status(500).json({ error: 'Erro ao carregar dashboard' });
      }

      const now = new Date();
      const monthLabel = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

      res.json({
        month: monthLabel,
        totalMonth: rowMonth?.total || 0,
        countMonth: rowMonth?.count || 0,
        topDriver: rowTop
          ? { name: rowTop.driver_name, total: rowTop.total }
          : null,
      });
    });
  });
});

// ===================== ROTA CATCH-ALL PARA SPA SIMPLES =====================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`🚚 Server rodando em http://localhost:${PORT}`);
});
