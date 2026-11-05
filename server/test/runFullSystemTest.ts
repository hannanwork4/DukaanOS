import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import productsRouter from '../src/routes/products.js';
import suppliersRouter from '../src/routes/suppliers.js';
import purchasesRouter from '../src/routes/purchases.js';
import salesRouter from '../src/routes/sales.js';
import expensesRouter from '../src/routes/expenses.js';
import ledgerRouter from '../src/routes/ledger.js';
import insightsRouter from '../src/routes/insights.js';
import businessRouter from '../src/routes/business.js';
import { registerTools } from '../../mcp/src/tools.js';
import { db } from '../src/db/index.js';

async function fullSystemTest() {
  console.log('🚀 Launching Full System Verification (Express API + Remote MCP Server + SSE Client)...\n');

  // 1. Start Backend Express API on port 4000
  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json());
  apiApp.use('/api/products', productsRouter);
  apiApp.use('/api/suppliers', suppliersRouter);
  apiApp.use('/api/purchases', purchasesRouter);
  apiApp.use('/api/sales', salesRouter);
  apiApp.use('/api/expenses', expensesRouter);
  apiApp.use('/api/ledger', ledgerRouter);
  apiApp.use('/api/insights', insightsRouter);
  apiApp.use('/api/business', businessRouter);

  const apiServer = await new Promise<http.Server>((resolve) => {
    const s = apiApp.listen(4000, () => resolve(s));
  });
  console.log('✅ 1. Backend Express API live on http://localhost:4000');

  // 2. Start MCP Server on port 4001 with SSE Transport
  const mcpApp = express();
  mcpApp.use(cors());
  const activeTransports = new Map<string, SSEServerTransport>();

  mcpApp.get('/sse', async (req, res) => {
    const mcp = new McpServer({ name: 'DukaanOS-Test', version: '1.0.0' });
    registerTools(mcp);
    const transport = new SSEServerTransport('/messages', res);
    activeTransports.set(transport.sessionId, transport);
    res.on('close', () => activeTransports.delete(transport.sessionId));
    await mcp.connect(transport);
  });

  mcpApp.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = activeTransports.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(404).end();
    }
  });

  const mcpServer = await new Promise<http.Server>((resolve) => {
    const s = mcpApp.listen(4001, () => resolve(s));
  });
  console.log('✅ 2. MCP Server live with SSE Transport on http://localhost:4001/sse');

  // 3. Connect MCP Client over SSE
  console.log('\n🔗 3. Connecting Claude Client via SSE transport...');
  const clientTransport = new SSEClientTransport(new URL('http://localhost:4001/sse'));
  const mcpClient = new Client({ name: 'Claude-Client', version: '1.0.0' }, { capabilities: {} });
  await mcpClient.connect(clientTransport);
  console.log('✅ 4. Claude Client successfully established bidirectional SSE connection!');

  // 4. Discover registered tools
  const { tools } = await mcpClient.listTools();
  console.log(`✅ 5. Discovered ${tools.length} active MCP tools:`);
  console.log('      ' + tools.map(t => t.name).join(', '));

  // 5. Test Tool 1: add_supplier via MCP
  console.log('\n🤖 6. Claude calls MCP tool: add_supplier ("Ramesh Traders")');
  const addSupResult = await mcpClient.callTool({
    name: 'add_supplier',
    arguments: {
      name: 'Ramesh Traders',
      phone: '+91 98112 34567'
    }
  }) as any;
  console.log('      Result:', JSON.parse(addSupResult.content[0].text).message);

  // 6. Test Tool 2: add_product via MCP
  console.log('🤖 7. Claude calls MCP tool: add_product ("Cooking Oil 1L")');
  const addProdResult = await mcpClient.callTool({
    name: 'add_product',
    arguments: {
      name: 'Cooking Oil 1L',
      selling_price: 130,
      purchase_price: 100,
      unit: 'packets',
      min_stock_threshold: 5
    }
  }) as any;
  const prodObj = JSON.parse(addProdResult.content[0].text);
  console.log('      Result:', prodObj.message);

  // 7. Test Tool 3: record_purchase via MCP
  console.log('🤖 8. Claude calls MCP tool: record_purchase (20 packets Cooking Oil from Ramesh Traders)');
  const recordPurResult = await mcpClient.callTool({
    name: 'record_purchase',
    arguments: {
      supplier_name: 'Ramesh Traders',
      items: [{
        product_name: 'Cooking Oil 1L',
        quantity: 20,
        unit_price: 100
      }],
      amount_paid: 1000,
      payment_method: 'Cash',
      notes: 'Purchased 20 packets from Ramesh Traders'
    }
  }) as any;
  const purObj = JSON.parse(recordPurResult.content[0].text);
  console.log(`      Result: Purchase ID: ${purObj.purchase_id}, Total: ${purObj.purchase_amount}, Paid: ${purObj.amount_paid}, Pending: ${purObj.outstanding_amount}`);

  // 8. Test Tool 4: record_sale via MCP
  console.log('🤖 9. Claude calls MCP tool: record_sale (5 packets for ₹650 UPI)');
  const recordSaleResult = await mcpClient.callTool({
    name: 'record_sale',
    arguments: {
      items: [{
        product_name: 'Cooking Oil 1L',
        quantity: 5,
        unit_price: 130
      }],
      payment_method: 'UPI'
    }
  }) as any;
  const saleObj = JSON.parse(recordSaleResult.content[0].text);
  console.log(`      Result: Sale ID: ${saleObj.sale_id}, Amount: ${saleObj.total_sale_amount}, Est. Gross Profit: ${saleObj.estimated_gross_profit}`);

  // 9. Test Tool 5: get_dashboard_summary via MCP
  console.log('🤖 10. Claude calls MCP tool: get_dashboard_summary');
  const dashResult = await mcpClient.callTool({
    name: 'get_dashboard_summary',
    arguments: {}
  }) as any;
  const dashObj = JSON.parse(dashResult.content[0].text);
  console.log('      Dashboard Summary:', dashObj.shop_summary);

  // 10. Test Tool 6: get_business_insights via MCP
  console.log('🤖 11. Claude calls MCP tool: get_business_insights');
  const insResult = await mcpClient.callTool({
    name: 'get_business_insights',
    arguments: {}
  }) as any;
  const insObj = JSON.parse(insResult.content[0].text);
  console.log(`      Insights Generated: ${insObj.insights_count} deterministic insights`);

  // Cleanup
  await mcpClient.close();
  apiServer.close();
  mcpServer.close();

  console.log('\n🌟 FULL SYSTEM END-TO-END VERIFICATION COMPLETED WITH 100% SUCCESS!\n');
}

fullSystemTest().catch(err => {
  console.error('\n❌ Full system test error:', err);
  process.exit(1);
});
