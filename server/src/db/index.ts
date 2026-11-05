import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDatabase } from './interface.js';
import { LocalStore } from './localStore.js';
import { SupabaseStore } from './supabaseStore.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

let dbInstance: IDatabase;

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
const useLocalDb = process.env.USE_LOCAL_DB === 'true';

if (!useLocalDb && supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && !supabaseKey.includes('your-supabase')) {
  console.log(`[Database] Connecting to Supabase at: ${supabaseUrl}`);
  dbInstance = new SupabaseStore(supabaseUrl, supabaseKey);
} else {
  console.log('[Database] Using high-performance persistent LocalStore (SQLite/JSON engine)');
  dbInstance = new LocalStore();
}

export const db = dbInstance;
export * from './interface.js';

