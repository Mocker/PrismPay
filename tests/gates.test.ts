import { describe, expect, it } from 'vitest';
import { evaluateProjectFinishability, evaluateProposalGates } from '../src/gates';
import {
  findReferencePrice,
  SHED_DEMO_CATEGORIES,
  SHED_DEMO_PROJECT,
  SHED_DEMO_PROPOSALS,
} from '../src/seed';
import {
  computeAuditEventHash,
  computeMandateHash,
  verifyAuditChain,
  verifyMandateIntegrity,
} from '../src/crypto';
import type { AuditEvent } from '../src/types';

describe('W1 — Five Value Gates Engine (PDD §7 & §10)', () => {
  it('PDD §10 Proposal 1: Framing lumber package ($285 vs $300 ref) evaluates to PASS', () => {
    const p1 = SHED_DEMO_PROPOSALS[0];
    const ref = findReferencePrice(p1.item_id, p1.item_name);
    expect(ref?.reference_median_cents).toBe(30000);

    const res = evaluateProposalGates({
      proposal_id: 'prop-1',
      item_name: p1.item_name,
      category: p1.category,
      quoted_price_cents: 28500, // $285
      total_budget_cents: SHED_DEMO_PROJECT.total_budget_cents, // $1,000
      categories: SHED_DEMO_CATEGORIES,
      spent_by_category_cents: {},
      reference_price_cents: ref!.reference_median_cents,
    });

    expect(res.decision).toBe('PASS');
    expect(res.reason_codes).toEqual([]);
    expect(res.gates).toHaveLength(5);
    expect(res.gates.every((g) => g.outcome === 'pass')).toBe(true);
    expect(res.summary.remaining_after_cents).toBe(71500);
    expect(res.summary.required_reserve_after_cents).toBe(51000);
    expect(res.summary.project_finishable_after).toBe(true);
  });

  it('PDD §7 Worked Trap Check & AC-4: $920 roofing quote evaluates to DENY with exact 4 reason codes', () => {
    // Test both standalone ($0 prior spend) and in-sequence ($285 prior spend from Proposal 1)
    for (const priorSpend of [
      {},
      { 'Framing lumber & panels': 28500 },
    ] as Record<string, number>[]) {
      const res = evaluateProposalGates({
        proposal_id: 'prop-2-trap',
        item_name: 'Premium designer roofing package',
        category: 'Roofing',
        quoted_price_cents: 92000, // $920
        total_budget_cents: 100000, // $1,000
        categories: SHED_DEMO_CATEGORIES,
        spent_by_category_cents: priorSpend,
        reference_price_cents: 17500, // $175
      });

      expect(res.decision).toBe('DENY');
      const g1 = res.gates.find((g) => g.gate === 'G1')!;
      expect(g1.outcome).toBe('pass');
      expect(g1.reason_code).toBe('OK');

      // Exact AC-4 check
      expect(res.reason_codes).toEqual([
        'CATEGORY_CAP_EXCEEDED',
        'SINGLE_ITEM_DOMINANCE',
        'PRICE_NOT_VALUE_FOR_MONEY',
        'PROJECT_LEFT_UNFINISHABLE',
      ]);

      const g2 = res.gates.find((g) => g.gate === 'G2')!;
      expect(g2.explanation).toContain('$180');
      const g3 = res.gates.find((g) => g.gate === 'G3')!;
      expect(g3.explanation).toContain('92%');
      const g4 = res.gates.find((g) => g.gate === 'G4')!;
      expect(g4.detail_numbers.value_ratio).toBeCloseTo(920 / 175, 2); // 5.26x
      expect(g4.explanation).toContain('5.3×');
      const g5 = res.gates.find((g) => g.gate === 'G5')!;
      expect(g5.explanation).toContain('$80');
      expect(g5.explanation).toContain('$530');
    }
  });

  it('PDD §10 Proposal 3 (Fair Alternative) & AC-6: Standard metal roofing kit ($165) after Proposal 1 ($285) evaluates to PASS and leaves $450 spent / $550 remaining finishable', () => {
    const p3 = SHED_DEMO_PROPOSALS[2];
    const ref = findReferencePrice(p3.item_id, p3.item_name);
    expect(ref?.reference_median_cents).toBe(17500);

    const res = evaluateProposalGates({
      proposal_id: 'prop-3',
      item_name: p3.item_name,
      category: p3.category,
      quoted_price_cents: 16500, // $165
      total_budget_cents: 100000, // $1,000
      categories: SHED_DEMO_CATEGORIES,
      spent_by_category_cents: {
        'Framing lumber & panels': 28500, // Proposal 1 paid
      },
      reference_price_cents: ref!.reference_median_cents,
    });

    expect(res.decision).toBe('PASS');
    expect(res.reason_codes).toEqual([]);
    expect(res.summary.total_spent_after_cents).toBe(45000); // $450
    expect(res.summary.remaining_after_cents).toBe(55000); // $550
    // Remaining essential categories: Foundation ($120) + Doors ($140) + Fasteners ($75) = $335
    expect(res.summary.required_reserve_after_cents).toBe(33500);
    expect(res.summary.project_finishable_after).toBe(true);

    // Verify dashboard finishability helper after P1 + P3 captured
    const dash = evaluateProjectFinishability(100000, SHED_DEMO_CATEGORIES, {
      'Framing lumber & panels': 28500,
      Roofing: 16500,
    });
    expect(dash.total_spent_cents).toBe(45000);
    expect(dash.remaining_cents).toBe(55000);
    expect(dash.finishable).toBe(true);
  });

  it('PDD §10 Proposal 4 (Escalation): Hinges & latch set ($52 vs $40 ref = 1.30x) evaluates to ESCALATE with PRICE_ABOVE_REFERENCE', () => {
    const p4 = SHED_DEMO_PROPOSALS[3];
    const ref = findReferencePrice(p4.item_id, p4.item_name);
    expect(ref?.reference_median_cents).toBe(4000);

    const res = evaluateProposalGates({
      proposal_id: 'prop-4',
      item_name: p4.item_name,
      category: p4.category,
      quoted_price_cents: 5200, // $52
      total_budget_cents: 100000,
      categories: SHED_DEMO_CATEGORIES,
      spent_by_category_cents: {
        'Framing lumber & panels': 28500,
        Roofing: 16500,
      },
      reference_price_cents: ref!.reference_median_cents,
    });

    expect(res.decision).toBe('ESCALATE');
    expect(res.reason_codes).toEqual(['PRICE_ABOVE_REFERENCE']);
  });

  it('AC-7: An item with no reference price evaluates to ESCALATE with NO_REFERENCE_PRICE', () => {
    const res = evaluateProposalGates({
      proposal_id: 'prop-unpriced',
      item_name: 'Custom solar ventilator fan',
      category: 'Roofing',
      quoted_price_cents: 6500, // $65
      total_budget_cents: 100000,
      categories: SHED_DEMO_CATEGORIES,
      spent_by_category_cents: {},
      reference_price_cents: null,
    });

    expect(res.decision).toBe('ESCALATE');
    expect(res.reason_codes).toContain('NO_REFERENCE_PRICE');
  });

  it('G2 Contingency Draw: Small category overflow that fits in unused contingency downgrades to ESCALATE (CONTINGENCY_DRAW)', () => {
    // Foundation cap is $120, reference is $120. Quote is $135 (1.125x ref -> G4 pass).
    // Overflow is $15, which fits inside $150 contingency -> ESCALATE with CONTINGENCY_DRAW.
    const res = evaluateProposalGates({
      proposal_id: 'prop-contingency',
      item_name: 'Concrete blocks, gravel and slab materials',
      category: 'Foundation & site prep',
      quoted_price_cents: 13500, // $135
      total_budget_cents: 100000,
      categories: SHED_DEMO_CATEGORIES,
      spent_by_category_cents: {},
      reference_price_cents: 12000, // $120
    });

    expect(res.decision).toBe('ESCALATE');
    expect(res.reason_codes).toEqual(['CONTINGENCY_DRAW']);
  });

  it('AC-1, AC-2 & AC-9: Mandate SHA-256 tamper detection and Audit hash-chain verification work', async () => {
    const payload = {
      project_id: 'proj-1',
      version: 1,
      total_budget_cents: 100000,
      categories: SHED_DEMO_CATEGORIES,
    };
    const hash = await computeMandateHash(payload);
    expect(hash).toHaveLength(64);

    // AC-1: Recomputes identically
    const checkOk = await verifyMandateIntegrity({ ...payload, sha256_hash: hash });
    expect(checkOk.valid).toBe(true);

    // AC-2: Editing a stored cap directly makes mandate validation fail
    const tamperedCategories = SHED_DEMO_CATEGORIES.map((c) =>
      c.name === 'Roofing' ? { ...c, cap_cents: 95000 } : c
    );
    const checkTampered = await verifyMandateIntegrity({
      ...payload,
      categories: tamperedCategories,
      sha256_hash: hash,
    });
    expect(checkTampered.valid).toBe(false);

    // AC-9: Hash-chained audit log verification
    const e1Time = '2026-11-11T23:00:00.000Z';
    const e1Hash = await computeAuditEventHash(
      'GENESIS',
      1,
      'PROJECT_CREATED',
      { goal: 'Build a shed' },
      e1Time
    );
    const e2Time = '2026-11-11T23:01:00.000Z';
    const e2Hash = await computeAuditEventHash(
      e1Hash,
      2,
      'MANDATE_SIGNED',
      { sha256_hash: hash },
      e2Time
    );

    const chain: AuditEvent[] = [
      {
        seq: 1,
        project_id: 'proj-1',
        type: 'PROJECT_CREATED',
        payload: { goal: 'Build a shed' },
        prev_hash: 'GENESIS',
        event_hash: e1Hash,
        created_at: e1Time,
      },
      {
        seq: 2,
        project_id: 'proj-1',
        type: 'MANDATE_SIGNED',
        payload: { sha256_hash: hash },
        prev_hash: e1Hash,
        event_hash: e2Hash,
        created_at: e2Time,
      },
    ];

    const verifyOk = await verifyAuditChain(chain);
    expect(verifyOk.valid).toBe(true);
    expect(verifyOk.checked_count).toBe(2);

    // Tamper with payload in event 1
    const brokenChain: AuditEvent[] = [
      { ...chain[0], payload: { goal: 'Tampered goal' } },
      chain[1],
    ];
    const verifyBroken = await verifyAuditChain(brokenChain);
    expect(verifyBroken.valid).toBe(false);
    expect(verifyBroken.broken_at_seq).toBe(1);
  });
});
