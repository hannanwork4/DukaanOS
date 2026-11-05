import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testMcpOverNetwork() {
  console.log('📡 Testing Remote MCP Server connection via SSE transport...');

  const transport = new SSEClientTransport(new URL('http://localhost:4001/sse'));
  const client = new Client({
    name: 'Test-Claude-Client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  console.log('✅ Connected to DukaanOS MCP server over SSE successfully!');

  // 1. List Tools
  const { tools } = await client.listTools();
  console.log(`✅ Discovered ${tools.length} registered MCP tools`);
  if (tools.length !== 18) {
    throw new Error(`Expected 18 tools, found ${tools.length}`);
  }

  // 2. Call get_dashboard_summary tool
  console.log('📞 Calling MCP tool: get_dashboard_summary');
  const summaryRes = await client.callTool({
    name: 'get_dashboard_summary',
    arguments: {}
  }) as any;
  console.log('   Result:', summaryRes.content[0].text);

  // 3. Call get_business_insights tool
  console.log('📞 Calling MCP tool: get_business_insights');
  const insightsRes = await client.callTool({
    name: 'get_business_insights',
    arguments: {}
  }) as any;
  console.log('   Result:', insightsRes.content[0].text.slice(0, 200) + '...');

  await client.close();
  console.log('\n🎉 Remote MCP Server SSE integration verified 100% working!\n');
}

testMcpOverNetwork().catch(err => {
  console.error('❌ MCP integration test error:', err);
  process.exit(1);
});
