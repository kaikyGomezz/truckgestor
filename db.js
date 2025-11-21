const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('database.db');

db.serialize(() => {
  // Motoristas
  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      active INTEGER DEFAULT 1
    )
  `);

  // Caminhões
  db.run(`
    CREATE TABLE IF NOT EXISTS trucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate TEXT NOT NULL,
      model TEXT,
      year INTEGER,
      active INTEGER DEFAULT 1
    )
  `);

  // Categorias
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  // Gastos
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      truck_id INTEGER,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      invoice_number TEXT,
      supplier TEXT,
      description TEXT,
      FOREIGN KEY(driver_id) REFERENCES drivers(id),
      FOREIGN KEY(truck_id) REFERENCES trucks(id),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    )
  `);

  // Inserir categorias padrão se estiver vazio
  db.get(`SELECT COUNT(*) AS count FROM categories`, (err, row) => {
    if (err) {
      console.error('Erro ao contar categorias:', err);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO categories (name) VALUES (?)`);
      const defaults = [
        'Combustível',
        'Borracheiro',
        'Manutenção',
        'Alimentação',
        'Pedágio',
        'Outros'
      ];
      defaults.forEach(c => stmt.run(c));
      stmt.finalize();
      console.log('Categorias padrão inseridas.');
    }
  });
});

module.exports = db;
