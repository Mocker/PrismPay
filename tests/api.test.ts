import { describe, expect, it } from 'vitest';
import { createApp } from '../src/index';
import { MemoryStore } from '../src/storage';
import { computeMandateHash } from '../src/crypto';
import { SHED_DEMO_PROPOSALS } from '../src/seed';

describe('PrismPay End-to-End Acceptance Criteria (PDD §14 AC-1 through AC-11)', () => {
  it('Full PDD §10 Shed Flow (AC-1, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10)', async () => {
    const store = new MemoryStore();
    const app = createApp(store);

    // 1. Create Project ("Build a shed", $1,000.00)
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_text: 'Build a shed',
        total_budget_cents: 100000,
      }),
    });
    expect(createRes.status).toBe(201);
    const { project } = (await createRes.json()) as { project: { id: string; total_budget_cents: number } };
    expect(project.total_budget_cents).toBe(100000);

    // 2. AC-10: With AI provider key removed, breakdown still runs on seeded fallback
    const bdRes = await app.request(`/api/projects/${project.id}/breakdown`, {
      method: 'POST',
    });
    expect(bdRes.status).toBe(200);
    const bdData = (await bdRes.json()) as {
      categories: Array<{ name: string; cap_cents: number; essential: boolean; reference_estimate_cents: number }>;
      source: string;
    };
    expect(bdData.source).toBe('seeded_fallback');
    expect(bdData.categories).toHaveLength(6);
    const totalAllocated = bdData.categories.reduce((s, c) => s + c.cap_cents, 0);
    expect(totalAllocated).toBe(100000);

    // 3. AC-1: Signing breakdown stores mandate v1 whose displayed hash recomputes from stored categories
    const signRes = await app.request(`/api/projects/${project.id}/mandate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: bdData.categories,
        owner_label: 'Ryan Guthrie',
      }),
    });
    expect(signRes.status).toBe(201);
    const { mandate } = (await signRes.json()) as {
      mandate: {
        id: string;
        project_id: string;
        version: number;
        total_budget_cents: number;
        sha256_hash: string;
        categories: typeof bdData.categories;
      };
    };
    const recomputedHash = await computeMandateHash({
      project_id: mandate.project_id,
      version: mandate.version,
      total_budget_cents: mandate.total_budget_cents,
      categories: mandate.categories,
    });
    expect(mandate.sha256_hash).toBe(recomputedHash);

    // 4. AC-3: Proposal 1 ($285 Framing lumber package) evaluates to PASS and produces a sandbox Payment with capture id
    const p1Spec = SHED_DEMO_PROPOSALS[0];
    const p1Res = await app.request(`/api/projects/${project.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p1Spec),
    });
    expect(p1Res.status).toBe(201);
    const p1Data = (await p1Res.json()) as {
      proposal: { id: string; decision: string };
      gate_evaluation: string;
      payment: { paypal_order_id: string; paypal_capture_id: string; status: string } | null;
    };
    expect(p1Data.gate_evaluation).toBe('PASS');
    expect(p1Data.proposal.decision).toBe('paid');
    expect(p1Data.payment).not.toBeNull();
    expect(p1Data.payment?.status).toBe('captured');
    expect(p1Data.payment?.paypal_order_id).toBeTruthy();
    expect(p1Data.payment?.paypal_capture_id).toBeTruthy();

    // 5. AC-4 & AC-5: Proposal 2 ($920 Designer roofing trap) evaluates to DENY with exact 4 reason codes, and NO PayPal order exists in storage
    const p2Spec = SHED_DEMO_PROPOSALS[1];
    const p2Res = await app.request(`/api/projects/${project.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p2Spec),
    });
    expect(p2Res.status).toBe(201);
    const p2Data = (await p2Res.json()) as {
      proposal: { id: string; decision: string };
      gate_evaluation: string;
      reason_codes: string[];
      payment: unknown;
    };
    expect(p2Data.gate_evaluation).toBe('DENY');
    expect(p2Data.proposal.decision).toBe('DENY');
    expect(p2Data.reason_codes).toEqual([
      'CATEGORY_CAP_EXCEEDED',
      'SINGLE_ITEM_DOMINANCE',
      'PRICE_NOT_VALUE_FOR_MONEY',
      'PROJECT_LEFT_UNFINISHABLE',
    ]);
    expect(p2Data.payment).toBeNull();

    // AC-5: Verify directly in storage that no payment record exists for Proposal 2
    const storedTrapPayment = await store.getPaymentByProposal(p2Data.proposal.id);
    expect(storedTrapPayment).toBeNull();

    // AC-8: Verify that attempting to call /approve on a DENY proposal is strictly forbidden (403) and creates no payment
    const illegalApproveRes = await app.request(
      `/api/proposals/${p2Data.proposal.id}/approve`,
      { method: 'POST' }
    );
    expect(illegalApproveRes.status).toBe(403);
    expect(await store.getPaymentByProposal(p2Data.proposal.id)).toBeNull();

    // 6. AC-6: Proposal 3 ($165 Standard metal roofing kit) evaluates to PASS, pays, and dashboard reads spent $450 / remaining $550 and finishable
    const p3Spec = SHED_DEMO_PROPOSALS[2];
    const p3Res = await app.request(`/api/projects/${project.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p3Spec),
    });
    expect(p3Res.status).toBe(201);
    const p3Data = (await p3Res.json()) as {
      gate_evaluation: string;
      payment: { paypal_capture_id: string } | null;
    };
    expect(p3Data.gate_evaluation).toBe('PASS');
    expect(p3Data.payment?.paypal_capture_id).toBeTruthy();

    // Check Dashboard state after Proposals 1–3
    const dashRes = await app.request(`/api/projects/${project.id}`);
    expect(dashRes.status).toBe(200);
    const dashData = (await dashRes.json()) as {
      dashboard: {
        total_budget_cents: number;
        total_spent_cents: number;
        remaining_cents: number;
        project_finishable: boolean;
      };
    };
    expect(dashData.dashboard.total_budget_cents).toBe(100000);
    expect(dashData.dashboard.total_spent_cents).toBe(45000); // $450.00
    expect(dashData.dashboard.remaining_cents).toBe(55000); // $550.00
    expect(dashData.dashboard.project_finishable).toBe(true);

    // 7. AC-9: Audit log contains every event type exercised by Flows A–D in order, and hash chain verifies
    const auditRes = await app.request(`/api/projects/${project.id}/audit`);
    expect(auditRes.status).toBe(200);
    const auditData = (await auditRes.json()) as {
      events: Array<{ seq: number; type: string }>;
      verification: { valid: boolean; checked_count: number };
    };
    expect(auditData.verification.valid).toBe(true);
    const eventTypes = auditData.events.map((e) => e.type);
    expect(eventTypes).toEqual([
      'PROJECT_CREATED',
      'BREAKDOWN_PROPOSED',
      'MANDATE_SIGNED',
      // Proposal 1 (PASS -> paid)
      'PROPOSAL_CREATED',
      'PROPOSAL_EVALUATED',
      'PAYMENT_CREATED',
      'PAYMENT_CAPTURED',
      // Proposal 2 (DENY -> no payment events!)
      'PROPOSAL_CREATED',
      'PROPOSAL_EVALUATED',
      // Proposal 3 (PASS -> paid)
      'PROPOSAL_CREATED',
      'PROPOSAL_EVALUATED',
      'PAYMENT_CREATED',
      'PAYMENT_CAPTURED',
    ]);
  });

  it('AC-2: Editing a stored cap directly in storage makes mandate validation fail and blocks new proposals', async () => {
    const store = new MemoryStore();
    const app = createApp(store);

    const demoRes = await app.request('/api/demo/shed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign_immediately: true }),
    });
    const { project, mandate } = (await demoRes.json()) as {
      project: { id: string };
      mandate: { id: string; categories: Array<{ name: string; cap_cents: number; essential: boolean; reference_estimate_cents: number }> };
    };

    // Tamper directly with the stored Roofing cap in storage (raising $180 -> $950 without owner signature)
    const tampered = mandate.categories.map((c) =>
      c.name === 'Roofing' ? { ...c, cap_cents: 95000 } : c
    );
    await store.tamperMandateCategories(mandate.id, tampered);

    // Attempting to submit a proposal must now fail with 409 MANDATE_TAMPER_DETECTED
    const propRes = await app.request(`/api/projects/${project.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SHED_DEMO_PROPOSALS[0]),
    });
    expect(propRes.status).toBe(409);
    const errBody = (await propRes.json()) as { error: string };
    expect(errBody.error).toContain('MANDATE_TAMPER_DETECTED');
  });

  it('AC-7: An item with no reference price evaluates to ESCALATE with NO_REFERENCE_PRICE, and pays only after a recorded owner approval', async () => {
    const store = new MemoryStore();
    const app = createApp(store);

    const demoRes = await app.request('/api/demo/shed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign_immediately: true }),
    });
    const { project } = (await demoRes.json()) as { project: { id: string } };

    // Submit unpriced custom item
    const propRes = await app.request(`/api/projects/${project.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: 'Bespoke hand-forged weathervane',
        vendor: 'Artisan Ironworks',
        category: 'Roofing',
        quoted_price_cents: 4500, // $45
        quantity: 1,
        justification: 'Custom roof accessory',
        source: 'manual',
      }),
    });
    expect(propRes.status).toBe(201);
    const propData = (await propRes.json()) as {
      proposal: { id: string; decision: string };
      gate_evaluation: string;
      reason_codes: string[];
      payment: unknown;
    };

    expect(propData.gate_evaluation).toBe('ESCALATE');
    expect(propData.reason_codes).toContain('NO_REFERENCE_PRICE');
    // Must NOT pay before owner approval
    expect(propData.payment).toBeNull();
    expect(await store.getPaymentByProposal(propData.proposal.id)).toBeNull();

    // Owner approves the escalation
    const approveRes = await app.request(
      `/api/proposals/${propData.proposal.id}/approve`,
      { method: 'POST' }
    );
    expect(approveRes.status).toBe(200);
    const approveData = (await approveRes.json()) as {
      proposal: { decision: string };
      payment: { status: string; paypal_capture_id: string };
    };
    expect(approveData.proposal.decision).toBe('paid');
    expect(approveData.payment.status).toBe('captured');
    expect(approveData.payment.paypal_capture_id).toBeTruthy();

    // Verify OWNER_OVERRIDE_APPROVED is recorded in audit log before PAYMENT_CREATED
    const auditRes = await app.request(`/api/projects/${project.id}/audit`);
    const { events } = (await auditRes.json()) as { events: Array<{ type: string }> };
    const types = events.map((e) => e.type);
    const overrideIdx = types.indexOf('OWNER_OVERRIDE_APPROVED');
    const payCreatedIdx = types.indexOf('PAYMENT_CREATED');
    expect(overrideIdx).toBeGreaterThan(-1);
    expect(payCreatedIdx).toBeGreaterThan(overrideIdx);
  });
});
