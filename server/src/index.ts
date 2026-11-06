import { app, ensureDbInit } from './app.js';

const PORT = process.env.PORT || 4000;
const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';

async function startServer() {
  await ensureDbInit();

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 DukaanOS Backend Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
    console.log(`🏬 Default Business: ${defaultBusinessId}`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('[Startup Fatal Error]', err);
  process.exit(1);
});

export default app;
