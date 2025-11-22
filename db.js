// db.js — Versão completa com todas as tabelas do sistema de frota

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Executa múltiplos comandos em sequência
function runMigrations() {
  db.serialize(() => {

    console.log('🗃️ Criando tabelas...');

    // ============================
    // USERS
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cria / atualiza usuário admin padrão (senha: 123456)
    db.run(`
      INSERT OR REPLACE INTO users (id, username, password_hash, role)
      VALUES (
        1,
        'admin',
        '$2b$12$R7ogaE4EkUMfrLdUrYiKM.lksb8xeXivhOYEp70kB/ZmvAMzKguBO',
        'admin'
      );
    `);


    // ============================
    // DRIVERS
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        cnh TEXT,
        status TEXT NOT NULL DEFAULT 'ativo',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);


    // ============================
    // TRUCKS (CAVALOS)
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL UNIQUE,
        model TEXT,
        year INTEGER,
        odometer INTEGER,
        status TEXT NOT NULL DEFAULT 'ativo',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);


    // ============================
    // TRAILERS (CARRETAS)
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS trailers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL UNIQUE,
        type TEXT,
        year INTEGER,
        status TEXT NOT NULL DEFAULT 'ativa',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);


    // ============================
    // TIRES (PNEUS)
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS tires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        brand TEXT,
        model TEXT,
        purchase_date TEXT,
        purchase_value REAL,
        state TEXT NOT NULL DEFAULT 'estoque',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);


    // ============================
    // TIRE INSTALLATIONS
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS tire_installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tire_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,      -- 'cavalo' ou 'carreta'
        vehicle_id INTEGER NOT NULL,
        position TEXT,
        installed_at TEXT NOT NULL,
        removed_at TEXT,
        installed_odometer INTEGER,
        removed_odometer INTEGER,

        FOREIGN KEY(tire_id) REFERENCES tires(id)
      );
    `);


    // ============================
    // TIRE RETREADS (RECAPAGENS)
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS tire_retreads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tire_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        notes TEXT,

        FOREIGN KEY(tire_id) REFERENCES tires(id)
      );
    `);


    // ============================
    // EXPENSE CATEGORIES
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        kind TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insere categorias padrão
    const categories = [
      'Combustível',
      'Manutenção cavalo',
      'Manutenção carreta',
      'Pneus',
      'Pedágio',
      'Alimentação',
      'Documentação / Licenciamento',
      'Seguro',
      'AdBlue / ARLA',
      'Multas',
      'Outros'
    ];

    categories.forEach(cat => {
      db.run(`INSERT OR IGNORE INTO expense_categories (name) VALUES (?);`, [cat]);
    });


    // ============================
    // EXPENSES (GASTOS)
    // ============================
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER,
        truck_id INTEGER,
        trailer_id INTEGER,
        tire_id INTEGER,
        category_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        invoice_number TEXT,
        supplier TEXT,
        odometer INTEGER,
        attachment_url TEXT,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(driver_id) REFERENCES drivers(id),
        FOREIGN KEY(truck_id) REFERENCES trucks(id),
        FOREIGN KEY(trailer_id) REFERENCES trailers(id),
        FOREIGN KEY(tire_id) REFERENCES tires(id),
        FOREIGN KEY(category_id) REFERENCES expense_categories(id)
      );
    `);


    console.log("📑 Criando índices...");

    // Índices para melhorar os relatórios
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_truck ON expenses(truck_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_trailer ON expenses(trailer_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_driver ON expenses(driver_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_tire ON expenses(tire_id);`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_tire_installations_tire ON tire_installations(tire_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_tire_installations_vehicle ON tire_installations(vehicle_type, vehicle_id);`);

    console.log('✅ Tabelas e índices criados com sucesso!');
  });
}

runMigrations();

module.exports = db;
