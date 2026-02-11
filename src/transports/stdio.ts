import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getGlobalSunsamaClient } from "../auth/stdio.js";

export async function setupStdioTransport(server: McpServer) {
  // Initialize global authentication (supports both email/password and browser OAuth)
  await getGlobalSunsamaClient();

  // Create and connect stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Stdio transport initialized');
}
