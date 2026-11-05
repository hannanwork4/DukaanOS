import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerTools } from './tools.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const MCP_PORT = process.env.MCP_PORT || 4001;
const MCP_SECRET = process.env.MCP_SECRET || 'dukaanos_secret_key_change_in_production';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mcp-secret', 'x-business-id']
}));

// Map of active SSE transports by sessionId
const activeTransports: Map<string, SSEServerTransport> = new Map();

// Helper to create and configure MCP server instance
function createDukaanMcpServer() {
  const server = new McpServer({
    name: 'DukaanOS-MCP',
    version: '1.0.0'
  });
  registerTools(server);
  return server;
}

// Health & Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    server: 'DukaanOS MCP Server',
    version: '1.0.0',
    transport: 'Streamable HTTP / SSE',
    sse_endpoint: `http://localhost:${MCP_PORT}/sse`,
    messages_endpoint: `http://localhost:${MCP_PORT}/messages`,
    documentation: 'Connect Claude Desktop or remote Claude client using SSE transport',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', active_sessions: activeTransports.size });
});

// SSE endpoint: Claude connects here
app.get('/sse', async (req, res) => {
  console.log('[MCP] New incoming SSE connection request from Claude client');

  // Verify MCP secret if configured and supplied via query or header
  const authHeader = req.headers['authorization'] || req.headers['x-mcp-secret'] || req.query.secret;
  if (process.env.REQUIRE_MCP_AUTH === 'true' && authHeader !== MCP_SECRET && authHeader !== `Bearer ${MCP_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized MCP access. Valid secret required.' });
    return;
  }

  try {
    const server = createDukaanMcpServer();
    const transport = new SSEServerTransport('/messages', res);
    
    const sessionId = transport.sessionId;
    activeTransports.set(sessionId, transport);
    console.log(`[MCP] Established SSE session: ${sessionId}`);

    res.on('close', () => {
      console.log(`[MCP] Closed SSE session: ${sessionId}`);
      activeTransports.delete(sessionId);
    });

    await server.connect(transport);
  } catch (err) {
    console.error('[MCP] Failed to connect SSE transport:', err);
    if (!res.headersSent) {
      res.status(500).send('Failed to initialize SSE connection');
    }
  }
});

// Messages endpoint: Claude posts JSON-RPC messages here
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: `Session not found: ${sessionId}` });
    return;
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (err: any) {
    console.error(`[MCP] Error handling message for session ${sessionId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(MCP_PORT, () => {
  console.log(`=========================================`);
  console.log(`🤖 DukaanOS MCP Server running on port ${MCP_PORT}`);
  console.log(`🌐 Streamable HTTP / SSE Endpoint: http://localhost:${MCP_PORT}/sse`);
  console.log(`📩 Messages Endpoint: http://localhost:${MCP_PORT}/messages`);
  console.log(`🛠️ 18 Business Management Tools Registered`);
  console.log(`=========================================`);
});

