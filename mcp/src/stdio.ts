import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';

async function runStdio() {
  const server = new McpServer({
    name: 'DukaanOS-MCP',
    version: '1.0.0'
  });

  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Stdio] DukaanOS MCP server connected via stdio transport');
}

runStdio().catch(err => {
  console.error('[MCP Stdio Error]:', err);
  process.exit(1);
});
