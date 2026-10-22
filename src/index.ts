#!/usr/bin/env node
/**
 * ActSeal MCP stdio entry.
 * Env: ACTSEAL_BASE, ACTSEAL_API_KEY (legacy ACTIONRECEIPT_* ok)
 * Log only to stderr — stdout is the JSON-RPC channel.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configFromEnv } from "./client.js";
import { createActSealMcpServer } from "./server.js";

async function main() {
  let cfg;
  try {
    cfg = configFromEnv();
  } catch (err) {
    console.error(
      `[actseal-mcp] ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
  const server = createActSealMcpServer(cfg);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[actseal-mcp] stdio ready base=${cfg.baseUrl} (issue_receipt, verify_receipt)`,
  );
}

main().catch((err) => {
  console.error("[actseal-mcp] fatal:", err);
  process.exit(1);
});
