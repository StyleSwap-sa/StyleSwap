#!/usr/bin/env node
/**
 * Database migration script for Render deployment
 * This script runs the database migrations using drizzle-kit
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Migration] Starting database migration...');

// Run drizzle-kit migrate
const migrate = spawn('pnpm', ['exec', 'drizzle-kit', 'migrate'], {
  cwd: dirname(__dirname),
  stdio: 'inherit',
  shell: true,
});

migrate.on('close', (code) => {
  if (code === 0) {
    console.log('[Migration] ✓ Database migration completed successfully');
    process.exit(0);
  } else {
    console.error('[Migration] ✗ Database migration failed with code:', code);
    process.exit(code);
  }
});

migrate.on('error', (error) => {
  console.error('[Migration] ✗ Failed to start migration:', error);
  process.exit(1);
});
