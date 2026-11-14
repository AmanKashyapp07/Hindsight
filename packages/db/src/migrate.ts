import fs from 'fs';
import path from 'path';
import { query, closePool } from './pool.js';

async function runMigration() {
  // Support running from repo root or package folder
  const candidatePaths = [
    path.resolve(process.cwd(), 'packages/db/init.sql'),
    path.resolve(process.cwd(), 'init.sql'),
    path.resolve(process.cwd(), '../init.sql'),
  ];

  const initSqlPath = candidatePaths.find((p) => fs.existsSync(p));

  if (!initSqlPath) {
    throw new Error(`Migration file init.sql not found in candidate paths: ${candidatePaths.join(', ')}`);
  }

  console.log(`[Hindsight DB] Executing migration script from: ${initSqlPath}`);
  const sql = fs.readFileSync(initSqlPath, 'utf8');
  await query(sql);
  console.log('[Hindsight DB] Migration applied successfully!');
}

runMigration()
  .catch((err) => {
    console.error('[Hindsight DB] Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
