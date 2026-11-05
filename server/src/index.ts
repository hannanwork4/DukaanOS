import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
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

const app = express();
const PORT = process.env.PORT || 4000;
const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-business-id', 'x-mcp-secret']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DukaanOS Backend API',
    timestamp: new Date().toISOString()
  });
});

// OpenAPI 3.1 Specification for API documentation
app.get(['/openapi.json', '/api/openapi.json'], (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  res.json(getOpenApiSpec(`${protocol}://${host}`));
});

// Mount Routes
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/business', businessRouter);
app.use('/api/auth', authRouter);

// Initialize DB and start server
async function startServer() {
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

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 DukaanOS Backend Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      console.log(`🏬 Default Business: ${defaultBusinessId}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start DukaanOS server:', err);
    process.exit(1);
  }
}

startServer();

