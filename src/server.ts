import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { ActSealClient, type ActSealClientConfig } from "./client.js";
import { handleIssueReceipt, handleVerifyReceipt } from "./tools.js";

const HASH = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/, "64 hex chars (sha256)")
  .describe("SHA-256 hex digest (64 chars)");

/**
 * Build an ActSeal MCP server (tools only). Transport is connected by the caller.
 */
export function createActSealMcpServer(
  clientCfg: ActSealClientConfig,
): McpServer {
  const client = new ActSealClient(clientCfg);
  const server = new McpServer({
    name: "actseal",
    version: "0.1.0",
  });

  server.registerTool(
    "issue_receipt",
    {
      title: "Issue ActSeal",
      description:
        "Issue an Ed25519-signed ActSeal receipt for a tool action. Pass SHA-256 hex hashes of inputs/outputs — never raw secrets. Optional Idempotency-Key. Free tier only; x402 not live.",
      inputSchema: {
        action: z
          .string()
          .min(1)
          .max(256)
          .describe("Short action name, e.g. tools.web_search"),
        inputs_hash: HASH.describe("SHA-256 of canonical inputs JSON"),
        outputs_hash: HASH.describe("SHA-256 of canonical outputs JSON"),
        policy_id: z
          .string()
          .max(128)
          .optional()
          .describe("Optional policy / run id label"),
        idempotency_key: z
          .string()
          .min(1)
          .max(128)
          .optional()
          .describe("Optional Idempotency-Key (24h TTL on server)"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
      },
    },
    async (args) => handleIssueReceipt(client, args),
  );

  server.registerTool(
    "verify_receipt",
    {
      title: "Verify ActSeal",
      description:
        "Verify a receipt by id (public). Returns valid/invalid, receipt payload, and issuer public key.",
      inputSchema: {
        id: z
          .string()
          .regex(/^rcpt_[a-f0-9]{32}$/, "rcpt_ + 32 hex")
          .describe("Receipt id from issue_receipt"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => handleVerifyReceipt(client, args),
  );

  return server;
}
