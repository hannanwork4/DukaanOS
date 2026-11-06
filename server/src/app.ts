import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import productsRouter from './routes/products.js';
import suppliersRouter from './routes/suppliers.js';
import purchasesRouter from './routes/purchases.js';
import salesRouter from './routes/sales.js';
import expensesRouter from './routes/expenses.js';
import ledgerRouter from './routes/ledger.js';
import insightsRouter from './routes/insights.js';
import businessRouter from './routes/business.js';
import authRouter from './routes/auth.js';
import { db } from './db/index.js';
import { getOpenApiSpec } from './openapi.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const app = express();
const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-business-id', 'x-mcp-secret']
}));

app.use(express.json());

// Lazy self-healing DB initialization
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInit() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const existing = await db.getBusiness(defaultBusinessId);
        if (!existing) {
          console.log(`[Init] Seeding initial Kirana store data for: ${defaultBusinessId}`);
          await db.seedInitialData(defaultBusinessId);
        }

        // Ensure official demo credentials (hannan@volopay.co / Hannan_Volopay) are always available
        const demoEmail = 'hannan@volopay.co';
        const demoUser = await db.getUserByEmail(demoEmail);
        if (!demoUser) {
          const crypto = await import('node:crypto');
          const hash = crypto.createHash('sha256').update('Hannan_Volopay_dukaanos_salt_2026').digest('hex');
          await db.createUser({
            id: 'u-volopay-hannan-demo',
            email: demoEmail,
            password_hash: hash,
            business_id: defaultBusinessId,
            name: 'Abdul Hannan',
            phone: '9848022338',
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log(`[Init] Seeded permanent demo credentials: ${demoEmail}`);
        }
      } catch (err) {
        console.error('[DB Init Error]', err);
      } finally {
        isInitialized = true;
      }
    })();
  }
  await initPromise;
}

// Middleware to ensure DB and demo user exist before handling requests
app.use(async (req, res, next) => {
  await ensureDbInit();
  next();
});

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'DukaanOS Backend API',
    timestamp: new Date().toISOString()
  });
});

// OpenAPI 3.1 Specification for API documentation
app.get(['/openapi.json', '/api/openapi.json'], (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:4000';
  res.json(getOpenApiSpec(`${protocol}://${host}`));
});

// Mount Routes both with and without /api prefix for flexibility in local & serverless environments
const routers = [
  { path: 'products', router: productsRouter },
  { path: 'suppliers', router: suppliersRouter },
  { path: 'purchases', router: purchasesRouter },
  { path: 'sales', router: salesRouter },
  { path: 'expenses', router: expensesRouter },
  { path: 'ledger', router: ledgerRouter },
  { path: 'insights', router: insightsRouter },
  { path: 'business', router: businessRouter },
  { path: 'auth', router: authRouter }
];

for (const { path: routePath, router } of routers) {
  app.use(`/api/${routePath}`, router);
  app.use(`/${routePath}`, router);
}

// Serve Frontend client build in production or when client/dist exists
const clientDistCandidates = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'public')
];
const activeClientDist = clientDistCandidates.find(p => fs.existsSync(p));

if (activeClientDist) {
  app.use(express.static(activeClientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/openapi.json') {
      return next();
    }
    res.sendFile(path.join(activeClientDist, 'index.html'));
  });
}

export default app;
