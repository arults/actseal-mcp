# ActSeal MCP

stdio MCP server for [ActSeal](https://actseal.xyz) — Ed25519-signed receipts for agent actions.

| Tool | Purpose |
|------|---------|
| `issue_receipt` | `POST /v1/receipt` — action + inputs_hash + outputs_hash (+ optional policy_id, idempotency_key) |
| `verify_receipt` | `GET /v1/verify/:id` — public verify |

**Honesty:** best-effort signed log. Not legal evidence, not SOC2, not custody, not e-sign. Free 100 receipts/API-key/UTC-day; Starter $19/mo in USDC/USDT/ETH at https://actseal.xyz/pay.

## Env

| Var | Required | Example |
|-----|----------|---------|
| `ACTSEAL_BASE` | yes* | `https://actseal.xyz` |
| `ACTSEAL_API_KEY` | yes* | free key via https://actseal.xyz/get-key |

\* Legacy `ACTIONRECEIPT_BASE` / `ACTIONRECEIPT_API_KEY` still accepted.

## Run

```bash
pnpm install
export ACTSEAL_BASE=https://actseal.xyz
export ACTSEAL_API_KEY=as_…
pnpm start
```

## Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "actseal": {
      "command": "npx",
      "args": ["--yes", "tsx", "/ABSOLUTE/PATH/actseal-mcp/src/index.ts"],
      "env": {
        "ACTSEAL_BASE": "https://actseal.xyz",
        "ACTSEAL_API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

## Links

- Site: https://actseal.xyz
- Docs: https://actseal.xyz/docs
- OpenAPI: https://actseal.xyz/openapi.json
- llms.txt: https://actseal.xyz/llms.txt
