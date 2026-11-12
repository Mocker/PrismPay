import { describe, expect, it } from 'vitest';
import { KvStore } from '../src/storage.ts';
import type { Mandate, Project, Proposal, GateResult, Payment } from '../src/types.ts';

class FakeKV {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async list({ prefix }: { prefix?: string } = {}): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cacheStatus: string | null;
  }> {
    const keys = Array.from(this.map.keys())
      .filter((k) => !prefix || k.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true, cacheStatus: null };
  }
}

const project: Project = {
  id: 'proj-kv-1',
  goal_text: 'Build a shed',
  total_budget_cents: 100000,
  currency: 'USD',
  created_at: '2026-11-12T00:00:00.000Z',
};

const mandate: Mandate = {
  id: 'mand-kv-1',
  project_id: project.id,
  version: 1,
  categories: [
    { name: 'Roofing', cap_cents: 18000, essential: true, reference_estimate_cents: 17500 },
  ],
  total_budget_cents: 100000,
  owner_label: 'Owner',
  sha256_hash: 'abc123',
  signed_at: '2026-11-12T00:00:00.000Z',
  status: 'active',
};

describe('KvStore (production persistence)', () => {
  it('round-trips project, mandate, proposal, payment and audit across store instances', async () => {
    const fake = new FakeKV();
    const kv = fake as unknown as KVNamespace;

    const writer = new KvStore(kv);
    await writer.createProject(project);
    await writer.saveMandate(mandate);

    const proposal: Proposal = {
      id: 'prop-kv-1',
      project_id: project.id,
      mandate_id: mandate.id,
      item_id: 'roofing-standard-kit',
      item_name: 'Standard metal roofing kit',
      vendor: 'Metro Building Materials',
      category: 'Roofing',
      quoted_price_cents: 16500,
      quantity: 1,
      justification: 'test',
      source: 'agent',
      created_at: '2026-11-12T00:01:00.000Z',
      decision: 'paid',
    };
    const gates: GateResult[] = [];
    await writer.saveProposal(proposal, gates);

    const payment: Payment = {
      id: 'pay-prop-kv-1',
      proposal_id: proposal.id,
      paypal_order_id: 'SBX-ORD-TEST',
      paypal_capture_id: 'SBX-CAP-TEST',
      amount_cents: 16500,
      status: 'captured',
      mode: 'sandbox_demo',
      created_at: '2026-11-12T00:02:00.000Z',
    };
    await writer.savePayment(payment);
    await writer.appendAuditEvent(project.id, 'PAYMENT_CAPTURED', { proposal_id: proposal.id });

    // A fresh store instance over the same KV must see everything —
    // this is exactly what the in-memory fallback failed to do on Workers.
    const reader = new KvStore(kv);
    expect((await reader.getProject(project.id))?.goal_text).toBe('Build a shed');
    expect((await reader.listProjects()).map((p) => p.id)).toContain(project.id);
    expect((await reader.getActiveMandate(project.id))?.id).toBe(mandate.id);

    const listed = await reader.listProposals(project.id);
    expect(listed).toHaveLength(1);
    expect(listed[0].proposal.id).toBe(proposal.id);
    expect(listed[0].payment?.paypal_capture_id).toBe('SBX-CAP-TEST');

    const audit = await reader.listAuditEvents(project.id);
    expect(audit).toHaveLength(1);
    expect(audit[0].seq).toBe(1);
    expect(audit[0].prev_hash).toBe('GENESIS');

    await reader.updateProposalDecision(proposal.id, 'rejected');
    expect((await reader.getProposal(proposal.id))?.proposal.decision).toBe('rejected');

    // Verify order-ID index lookup and project flag update across KV instances
    const byOrder = await reader.getPaymentByOrderId('SBX-ORD-TEST');
    expect(byOrder?.id).toBe('pay-prop-kv-1');
    expect(byOrder?.paypal_capture_id).toBe('SBX-CAP-TEST');

    await reader.updateProject({ ...project, paypal_approval_flow: true });
    const reader2 = new KvStore(kv);
    expect((await reader2.getProject(project.id))?.paypal_approval_flow).toBe(true);
  });
});
