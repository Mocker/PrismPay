import type { AuditEvent, AuditEventType, BudgetCategory } from './types.ts';

/**
 * Produces deterministic, key-sorted canonical JSON string for cryptographic hashing.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  const entries = sortedKeys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`
  );
  return '{' + entries.join(',') + '}';
}

/**
 * Computes hex-encoded SHA-256 hash using Web Crypto API (standard in Cloudflare Workers & Node 20+).
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface CanonicalMandatePayload {
  project_id: string;
  version: number;
  total_budget_cents: number;
  categories: Array<{
    name: string;
    cap_cents: number;
    essential: boolean;
    reference_estimate_cents: number;
  }>;
}

export async function computeMandateHash(
  payload: CanonicalMandatePayload
): Promise<string> {
  const normalized: CanonicalMandatePayload = {
    project_id: payload.project_id,
    version: payload.version,
    total_budget_cents: payload.total_budget_cents,
    categories: payload.categories.map((c) => ({
      name: c.name,
      cap_cents: c.cap_cents,
      essential: Boolean(c.essential),
      reference_estimate_cents: c.reference_estimate_cents,
    })),
  };
  return sha256Hex(canonicalJson(normalized));
}

export async function verifyMandateIntegrity(
  payload: CanonicalMandatePayload & { sha256_hash: string }
): Promise<{ valid: boolean; expected_hash: string; stored_hash: string }> {
  const expected_hash = await computeMandateHash(payload);
  return {
    valid: expected_hash === payload.sha256_hash,
    expected_hash,
    stored_hash: payload.sha256_hash,
  };
}

/**
 * PDD §9.2 Hash chain:
 * event_hash = SHA-256(prev_hash + canonical_json({ seq, type, payload, created_at }))
 */
export async function computeAuditEventHash(
  prev_hash: string,
  seq: number,
  type: AuditEventType,
  payload: Record<string, unknown>,
  created_at: string
): Promise<string> {
  const canonical = canonicalJson({ seq, type, payload, created_at });
  return sha256Hex(prev_hash + canonical);
}

export async function verifyAuditChain(events: AuditEvent[]): Promise<{
  valid: boolean;
  checked_count: number;
  broken_at_seq: number | null;
  error?: string;
}> {
  let expectedPrevHash = 'GENESIS';
  const sorted = [...events].sort((a, b) => a.seq - b.seq);

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    if (ev.seq !== i + 1) {
      return {
        valid: false,
        checked_count: i,
        broken_at_seq: ev.seq,
        error: `Sequence gap at index ${i}: expected seq ${i + 1}, found ${ev.seq}`,
      };
    }
    if (ev.prev_hash !== expectedPrevHash) {
      return {
        valid: false,
        checked_count: i,
        broken_at_seq: ev.seq,
        error: `prev_hash mismatch at seq ${ev.seq}: expected ${expectedPrevHash}, found ${ev.prev_hash}`,
      };
    }
    const recomputed = await computeAuditEventHash(
      ev.prev_hash,
      ev.seq,
      ev.type,
      ev.payload,
      ev.created_at
    );
    if (recomputed !== ev.event_hash) {
      return {
        valid: false,
        checked_count: i,
        broken_at_seq: ev.seq,
        error: `Event hash tampered at seq ${ev.seq}: expected ${recomputed}, found ${ev.event_hash}`,
      };
    }
    expectedPrevHash = ev.event_hash;
  }

  return {
    valid: true,
    checked_count: sorted.length,
    broken_at_seq: null,
  };
}
