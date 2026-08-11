/**
 * Простой migration runner: применяет .sql файлы из этой папки по порядку
 * имени, отслеживает уже применённые в таблице schema_migrations.
 *
 * Использование: node migrations/run.js  (или npm run migrate)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = __dirname;

async function run() {
  // Те же поля, что и config/database.js (Sequelize) — сознательно не передаём connectionString
  // сюда: `pg.Client` при наличии connectionString игнорирует остальные поля целиком, из-за чего
  // расхождение между DATABASE_URL и DATABASE_NAME/HOST в .env (легко возникает, если один
  // обновили, а другой забыли) тихо подключает миграции не к той базе.
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'proposals',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
  });

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows: applied } = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log('✅ Миграций к применению нет — БД уже актуальна');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`→ Применяю ${file}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ ${file} применена`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Миграция ${file} провалилась: ${err.message}`);
      }
    }

    console.log(`✅ Применено миграций: ${pending.length}`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('❌ Ошибка миграции:', err.message);
  process.exit(1);
});
