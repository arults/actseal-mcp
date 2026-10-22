/**
 * Thin HTTP client for ActSeal API.
 * Injectable `fetch` for tests (mock without live server).
 */

export type ActSealClientConfig = {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
};

export type IssueReceiptInput = {
  action: string;
  inputs_hash: string;
  outputs_hash: string;
  policy_id?: string | null;
  idempotency_key?: string;
};

export type IssueReceiptResult = {
  ok: true;
  status: number;
  body: Record<string, unknown>;
} | {
  ok: false;
  status: number;
  error: string;
  body?: unknown;
};

export type VerifyReceiptResult = {
  ok: true;
  status: number;
  body: Record<string, unknown>;
} | {
  ok: false;
  status: number;
  error: string;
  body?: unknown;
};

function normalizeBase(url: string): string {
  return url.replace(/\/$/, "");
}

/** Prefer ACTSEAL_*; fall back to legacy ACTIONRECEIPT_* for older configs. */
export function configFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ActSealClientConfig {
  const baseUrl =
    env.ACTSEAL_BASE?.trim() || env.ACTIONRECEIPT_BASE?.trim();
  const apiKey =
    env.ACTSEAL_API_KEY?.trim() || env.ACTIONRECEIPT_API_KEY?.trim();
  if (!baseUrl) {
    throw new Error(
      "ACTSEAL_BASE is required (e.g. http://127.0.0.1:8787 or https://…). Legacy ACTIONRECEIPT_BASE also accepted.",
    );
  }
  if (!apiKey) {
    throw new Error(
      "ACTSEAL_API_KEY is required (Bearer key for POST /v1/receipt). Legacy ACTIONRECEIPT_API_KEY also accepted.",
    );
  }
  return { baseUrl: normalizeBase(baseUrl), apiKey };
}

export class ActSealClient {
  readonly baseUrl: string;
  readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: ActSealClientConfig) {
    this.baseUrl = normalizeBase(cfg.baseUrl);
    this.apiKey = cfg.apiKey;
    this.fetchImpl = cfg.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async issueReceipt(input: IssueReceiptInput): Promise<IssueReceiptResult> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    if (input.idempotency_key) {
      headers["Idempotency-Key"] = input.idempotency_key;
    }
    const body = {
      action: input.action,
      inputs_hash: input.inputs_hash,
      outputs_hash: input.outputs_hash,
      ...(input.policy_id !== undefined && input.policy_id !== null
        ? { policy_id: input.policy_id }
        : {}),
    };
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/v1/receipt`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      return {
        ok: false,
        status: 0,
        error: `network_error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return { ok: false, status: res.status, error: "invalid_json_response" };
    }
    if (!res.ok) {
      const errObj = parsed as { error?: string; message?: string };
      return {
        ok: false,
        status: res.status,
        error: errObj?.error ?? errObj?.message ?? `http_${res.status}`,
        body: parsed,
      };
    }
    return {
      ok: true,
      status: res.status,
      body: parsed as Record<string, unknown>,
    };
  }

  async verifyReceipt(id: string): Promise<VerifyReceiptResult> {
    let res: Response;
    try {
      res = await this.fetchImpl(
        `${this.baseUrl}/v1/verify/${encodeURIComponent(id)}`,
        { method: "GET", headers: { Accept: "application/json" } },
      );
    } catch (err) {
      return {
        ok: false,
        status: 0,
        error: `network_error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return { ok: false, status: res.status, error: "invalid_json_response" };
    }
    if (!res.ok) {
      const errObj = parsed as { error?: string };
      return {
        ok: false,
        status: res.status,
        error: errObj?.error ?? `http_${res.status}`,
        body: parsed,
      };
    }
    return {
      ok: true,
      status: res.status,
      body: parsed as Record<string, unknown>,
    };
  }
}
