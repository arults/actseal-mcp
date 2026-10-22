/**
 * Tool handlers shared by the MCP server and unit tests.
 * No MCP SDK import here — keeps root vitest free of mcp/node_modules.
 */

import type { ActSealClient } from "./client.js";

export type ToolTextResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function textResult(payload: unknown, isError = false): ToolTextResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

const HASH_RE = /^[a-f0-9]{64}$/i;
const RECEIPT_ID_RE = /^rcpt_[a-f0-9]{32}$/;

export async function handleIssueReceipt(
  client: ActSealClient,
  args: {
    action: string;
    inputs_hash: string;
    outputs_hash: string;
    policy_id?: string;
    idempotency_key?: string;
  },
): Promise<ToolTextResult> {
  if (!args.action || args.action.length > 256) {
    return textResult({ error: "invalid_action" }, true);
  }
  if (!HASH_RE.test(args.inputs_hash)) {
    return textResult(
      { error: "invalid_inputs_hash", hint: "64 hex chars (sha256)" },
      true,
    );
  }
  if (!HASH_RE.test(args.outputs_hash)) {
    return textResult(
      { error: "invalid_outputs_hash", hint: "64 hex chars (sha256)" },
      true,
    );
  }
  const result = await client.issueReceipt({
    action: args.action,
    inputs_hash: args.inputs_hash,
    outputs_hash: args.outputs_hash,
    policy_id: args.policy_id,
    idempotency_key: args.idempotency_key,
  });
  if (!result.ok) {
    return textResult(
      { error: result.error, status: result.status, body: result.body ?? null },
      true,
    );
  }
  return textResult({
    status: result.status,
    ...result.body,
    honesty:
      "Best-effort signed log. Not legal evidence. Free tier only; x402 not live.",
  });
}

export async function handleVerifyReceipt(
  client: ActSealClient,
  args: { id: string },
): Promise<ToolTextResult> {
  if (!RECEIPT_ID_RE.test(args.id)) {
    return textResult(
      { error: "invalid_id", hint: "rcpt_ + 32 hex chars" },
      true,
    );
  }
  const result = await client.verifyReceipt(args.id);
  if (!result.ok) {
    return textResult(
      { error: result.error, status: result.status, body: result.body ?? null },
      true,
    );
  }
  return textResult(result.body);
}
