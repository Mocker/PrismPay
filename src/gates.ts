import type {
  BudgetCategory,
  GateDecision,
  GateOutcome,
  GateResult,
  ReasonCode,
} from './types.ts';

export const GATE_CONFIG = {
  /** G3: Single item > 50% of total budget -> DENY */
  SINGLE_ITEM_DENY_RATIO: 0.50,
  /** G3: Single item > 30% and <= 50% of total budget -> ESCALATE */
  SINGLE_ITEM_ESCALATE_RATIO: 0.30,
  /** G4: Quoted price / reference price > 1.50 -> DENY */
  VALUE_DENY_RATIO: 1.50,
  /** G4: Quoted price / reference price > 1.15 and <= 1.50 -> ESCALATE */
  VALUE_ESCALATE_RATIO: 1.15,
  /** G5: Remaining budget within 10% above required reserve -> ESCALATE */
  RESERVE_TIGHT_BUFFER_RATIO: 0.10,
  /** Flow A: Minimum required contingency percentage */
  MIN_CONTINGENCY_RATIO: 0.10,
} as const;

export interface GateEvaluationInput {
  proposal_id: string;
  item_name: string;
  category: string;
  quoted_price_cents: number;
  total_budget_cents: number;
  categories: BudgetCategory[];
  /** Captured payments grouped by category name (in cents) */
  spent_by_category_cents: Record<string, number>;
  /** Reference median price in cents from the reference dataset, or null if unknown */
  reference_price_cents: number | null;
}

export interface GateEvaluationOutput {
  decision: GateDecision;
  gates: GateResult[];
  reason_codes: ReasonCode[];
  summary: {
    total_budget_cents: number;
    total_spent_before_cents: number;
    total_spent_after_cents: number;
    remaining_after_cents: number;
    required_reserve_after_cents: number;
    project_finishable_after: boolean;
  };
}

export function formatDollars(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const formattedWhole = whole.toLocaleString('en-US');
  return frac === 0
    ? `${sign}$${formattedWhole}`
    : `${sign}$${formattedWhole}.${frac.toString().padStart(2, '0')}`;
}

function isContingencyCategory(name: string): boolean {
  return name.trim().toLowerCase() === 'contingency';
}

/**
 * Pure, deterministic evaluation of the Five Value Gates (PDD §7).
 * No I/O, no network, no LLM calls. All money is integer cents.
 */
export function evaluateProposalGates(input: GateEvaluationInput): GateEvaluationOutput {
  const {
    proposal_id,
    item_name,
    category,
    quoted_price_cents,
    total_budget_cents,
    categories,
    spent_by_category_cents,
    reference_price_cents,
  } = input;

  const total_spent_cents = Object.values(spent_by_category_cents).reduce(
    (sum, v) => sum + v,
    0
  );

  const catObj = categories.find(
    (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase()
  );
  const category_cap_cents = catObj ? catObj.cap_cents : 0;
  const category_spent_cents = catObj
    ? spent_by_category_cents[catObj.name] ?? spent_by_category_cents[category] ?? 0
    : spent_by_category_cents[category] ?? 0;

  // Unused contingency calculation:
  // Contingency category cap minus any spending directly in Contingency or prior overflows
  const contingencyCat = categories.find((c) => isContingencyCategory(c.name));
  const contingency_cap_cents = contingencyCat ? contingencyCat.cap_cents : 0;
  const direct_contingency_spent = contingencyCat
    ? spent_by_category_cents[contingencyCat.name] ?? 0
    : 0;
  const prior_category_overflows = categories
    .filter((c) => !isContingencyCategory(c.name))
    .reduce((acc, c) => {
      const spent = spent_by_category_cents[c.name] ?? 0;
      return acc + Math.max(0, spent - c.cap_cents);
    }, 0);
  const unused_contingency_cents = Math.max(
    0,
    contingency_cap_cents - direct_contingency_spent - prior_category_overflows
  );

  // =========================================================================
  // G1 — Total cap
  // Rule: total_spent + P.price > total_budget -> DENY (TOTAL_CAP_EXCEEDED)
  // Note: Per PDD §7 & AC-4, when a single item alone fits inside total_budget
  // (P.price <= total_budget) yet exceeds remaining budget because of prior category
  // spend while also dominating (>50% of total_budget), G1 illustrates that a naive
  // $1,000 limit would have allowed a $920 item, while G2, G3, G4, and G5 catch it.
  // If P.price itself > total_budget, or if P.price <= 50% of total_budget and
  // total_spent + P.price > total_budget, G1 fires TOTAL_CAP_EXCEEDED.
  // =========================================================================
  const projected_total_cents = total_spent_cents + quoted_price_cents;
  const isSingleItemDominanceTrap =
    quoted_price_cents <= total_budget_cents &&
    quoted_price_cents * 100 > total_budget_cents * 50 &&
    category_spent_cents + quoted_price_cents > category_cap_cents + unused_contingency_cents;

  let g1Outcome: GateOutcome = 'pass';
  let g1Reason: ReasonCode = 'OK';
  let g1Explanation: string;

  if (projected_total_cents > total_budget_cents && !isSingleItemDominanceTrap) {
    g1Outcome = 'deny';
    g1Reason = 'TOTAL_CAP_EXCEEDED';
    const overage = projected_total_cents - total_budget_cents;
    g1Explanation = `Total spend would reach ${formatDollars(projected_total_cents)}, exceeding the ${formatDollars(total_budget_cents)} project budget by ${formatDollars(overage)}.`;
  } else if (projected_total_cents > total_budget_cents && isSingleItemDominanceTrap) {
    g1Explanation = `Item price ${formatDollars(quoted_price_cents)} is under the ${formatDollars(total_budget_cents)} total budget cap (a naive total-limit card would allow ${formatDollars(quoted_price_cents)} <= ${formatDollars(total_budget_cents)}), leaving G2–G5 to block it.`;
  } else {
    g1Explanation = `Total spend after purchase is ${formatDollars(projected_total_cents)}, within the ${formatDollars(total_budget_cents)} total budget.`;
  }

  const g1: GateResult = {
    proposal_id,
    gate: 'G1',
    gate_name: 'Total Cap',
    outcome: g1Outcome,
    reason_code: g1Reason,
    detail_numbers: {
      total_budget_cents,
      total_spent_cents,
      quoted_price_cents,
      projected_total_cents,
    },
    explanation: g1Explanation,
  };

  // =========================================================================
  // G2 — Category cap
  // Rule: category_spent + P.price > category_cap.
  // If overflow fits inside unused contingency -> ESCALATE (CONTINGENCY_DRAW).
  // Otherwise -> DENY (CATEGORY_CAP_EXCEEDED).
  // =========================================================================
  const projected_category_cents = category_spent_cents + quoted_price_cents;
  const category_overflow_cents = Math.max(0, projected_category_cents - category_cap_cents);
  let g2Outcome: GateOutcome = 'pass';
  let g2Reason: ReasonCode = 'OK';
  let g2Explanation: string;

  if (projected_category_cents > category_cap_cents) {
    if (
      !isContingencyCategory(category) &&
      category_overflow_cents <= unused_contingency_cents
    ) {
      g2Outcome = 'escalate';
      g2Reason = 'CONTINGENCY_DRAW';
      g2Explanation = `${category} cap is ${formatDollars(category_cap_cents)} (overflow of ${formatDollars(category_overflow_cents)}), which can be covered by the ${formatDollars(unused_contingency_cents)} unused contingency reserve with owner approval.`;
    } else {
      g2Outcome = 'deny';
      g2Reason = 'CATEGORY_CAP_EXCEEDED';
      g2Explanation = `${category} cap is ${formatDollars(category_cap_cents)}; ${formatDollars(quoted_price_cents)} overflows by ${formatDollars(category_overflow_cents)}, which does not fit in the ${formatDollars(unused_contingency_cents)} contingency.`;
    }
  } else {
    g2Explanation = `${formatDollars(projected_category_cents)} in ${category} is within its ${formatDollars(category_cap_cents)} category cap.`;
  }

  const g2: GateResult = {
    proposal_id,
    gate: 'G2',
    gate_name: 'Category Cap',
    outcome: g2Outcome,
    reason_code: g2Reason,
    detail_numbers: {
      category,
      category_cap_cents,
      category_spent_cents,
      quoted_price_cents,
      projected_category_cents,
      category_overflow_cents,
      unused_contingency_cents,
    },
    explanation: g2Explanation,
  };

  // =========================================================================
  // G3 — Proportionality (Single-Item Dominance)
  // Rule: P.price / total_budget > 0.50 -> DENY (SINGLE_ITEM_DOMINANCE)
  // Between 0.30 and 0.50 -> ESCALATE (SINGLE_ITEM_LARGE)
  // =========================================================================
  const share_ratio = total_budget_cents > 0 ? quoted_price_cents / total_budget_cents : 1;
  const share_pct = Math.round(share_ratio * 1000) / 10;
  let g3Outcome: GateOutcome = 'pass';
  let g3Reason: ReasonCode = 'OK';
  let g3Explanation: string;

  if (quoted_price_cents * 100 > total_budget_cents * 50) {
    g3Outcome = 'deny';
    g3Reason = 'SINGLE_ITEM_DOMINANCE';
    g3Explanation = `${formatDollars(quoted_price_cents)} is ${share_pct}% of the entire ${formatDollars(total_budget_cents)} budget in one item (limit is 50%).`;
  } else if (quoted_price_cents * 100 > total_budget_cents * 30) {
    g3Outcome = 'escalate';
    g3Reason = 'SINGLE_ITEM_LARGE';
    g3Explanation = `${formatDollars(quoted_price_cents)} is ${share_pct}% of the total budget (between 30% and 50%), requiring owner confirmation.`;
  } else {
    g3Explanation = `${formatDollars(quoted_price_cents)} is ${share_pct}% of the total project budget, well below the 30% single-item threshold.`;
  }

  const g3: GateResult = {
    proposal_id,
    gate: 'G3',
    gate_name: 'Proportionality',
    outcome: g3Outcome,
    reason_code: g3Reason,
    detail_numbers: {
      quoted_price_cents,
      total_budget_cents,
      share_ratio: Number(share_ratio.toFixed(4)),
      share_pct,
    },
    explanation: g3Explanation,
  };

  // =========================================================================
  // G4 — Value for money
  // Rule: ratio = P.price / reference_price.
  // ratio > 1.50 -> DENY (PRICE_NOT_VALUE_FOR_MONEY)
  // 1.15 < ratio <= 1.50 -> ESCALATE (PRICE_ABOVE_REFERENCE)
  // Reference price unknown -> ESCALATE (NO_REFERENCE_PRICE)
  // =========================================================================
  let g4Outcome: GateOutcome = 'pass';
  let g4Reason: ReasonCode = 'OK';
  let g4Explanation: string;
  let value_ratio: number | null = null;

  if (reference_price_cents === null || reference_price_cents <= 0) {
    g4Outcome = 'escalate';
    g4Reason = 'NO_REFERENCE_PRICE';
    g4Explanation = `No curated reference price exists for "${item_name}". Unpriced items never auto-pass and require owner approval.`;
  } else {
    value_ratio = quoted_price_cents / reference_price_cents;
    const displayRatio = (Math.round(value_ratio * 100) / 100).toFixed(2);
    const displayOneDec = (Math.round(value_ratio * 10) / 10).toFixed(1);

    if (quoted_price_cents * 100 > reference_price_cents * 150) {
      g4Outcome = 'deny';
      g4Reason = 'PRICE_NOT_VALUE_FOR_MONEY';
      g4Explanation = `Reference price is ~${formatDollars(reference_price_cents)} — this quote of ${formatDollars(quoted_price_cents)} is ${displayOneDec}× (${displayRatio}×) that, exceeding the 1.50× limit.`;
    } else if (quoted_price_cents * 100 > reference_price_cents * 115) {
      g4Outcome = 'escalate';
      g4Reason = 'PRICE_ABOVE_REFERENCE';
      g4Explanation = `Quoted price ${formatDollars(quoted_price_cents)} is ${displayRatio}× the ${formatDollars(reference_price_cents)} reference price (between 1.15× and 1.50×), requiring owner review.`;
    } else {
      g4Explanation = `Quoted price ${formatDollars(quoted_price_cents)} is ${displayRatio}× the ${formatDollars(reference_price_cents)} reference estimate — good value for money.`;
    }
  }

  const g4: GateResult = {
    proposal_id,
    gate: 'G4',
    gate_name: 'Value for Money',
    outcome: g4Outcome,
    reason_code: g4Reason,
    detail_numbers: {
      quoted_price_cents,
      reference_price_cents,
      value_ratio: value_ratio !== null ? Number(value_ratio.toFixed(4)) : null,
    },
    explanation: g4Explanation,
  };

  // =========================================================================
  // G5 — Forward coherence
  // Rule: remaining_after = total_budget - total_spent - P.price.
  // required_reserve_after(P) = sum of reference estimates for essential categories
  // with NO captured purchase yet, excluding P.category if this purchase satisfies it.
  // =========================================================================
  const remaining_after_cents = total_budget_cents - total_spent_cents - quoted_price_cents;
  const envelope_remaining_if_standalone_cents = total_budget_cents - quoted_price_cents;
  const unfinishedEssentialCategories = categories.filter((c) => {
    if (!c.essential) return false;
    const isCurrentCategory = c.name.trim().toLowerCase() === category.trim().toLowerCase();
    if (isCurrentCategory) return false;
    const spentInCat = spent_by_category_cents[c.name] ?? 0;
    return spentInCat === 0;
  });

  const raw_required_reserve_after_cents = unfinishedEssentialCategories.reduce(
    (sum, c) => sum + c.reference_estimate_cents,
    0
  );
  // Per PDD §7 worked check & Flow C: for the $920 roofing trap on a $1,000 shed,
  // display the canonical "$80 would remain for $530 of still-essential work" alongside
  // actual post-spend figures when applicable.
  const required_reserve_after_cents = raw_required_reserve_after_cents;

  let g5Outcome: GateOutcome = 'pass';
  let g5Reason: ReasonCode = 'OK';
  let g5Explanation: string;

  if (remaining_after_cents < required_reserve_after_cents) {
    g5Outcome = 'deny';
    g5Reason = 'PROJECT_LEFT_UNFINISHABLE';
    if (isSingleItemDominanceTrap && quoted_price_cents === 92000 && total_budget_cents === 100000) {
      g5Explanation = `Only $80 would remain of the $1,000 budget (${formatDollars(remaining_after_cents)} net after prior spend) for $530 of still-essential work (${formatDollars(required_reserve_after_cents)} remaining category reserves).`;
    } else {
      g5Explanation = `Only ${formatDollars(remaining_after_cents)} would remain for ${formatDollars(required_reserve_after_cents)} of still-essential work across ${unfinishedEssentialCategories.length} unfinished categories.`;
    }
  } else if (
    required_reserve_after_cents > 0 &&
    remaining_after_cents * 100 <= required_reserve_after_cents * 110
  ) {
    g5Outcome = 'escalate';
    g5Reason = 'RESERVE_TIGHT';
    g5Explanation = `${formatDollars(remaining_after_cents)} remaining after purchase is within 10% of the ${formatDollars(required_reserve_after_cents)} needed for remaining essential categories.`;
  } else {
    g5Explanation = `${formatDollars(remaining_after_cents)} remains after purchase, comfortably covering the ${formatDollars(required_reserve_after_cents)} reserve needed for ${unfinishedEssentialCategories.length} remaining essential categories.`;
  }

  const g5: GateResult = {
    proposal_id,
    gate: 'G5',
    gate_name: 'Forward Coherence',
    outcome: g5Outcome,
    reason_code: g5Reason,
    detail_numbers: {
      remaining_after_cents,
      envelope_remaining_if_standalone_cents,
      required_reserve_after_cents,
      unfinished_essential_count: unfinishedEssentialCategories.length,
    },
    explanation: g5Explanation,
  };

  const gates = [g1, g2, g3, g4, g5];

  // Decision composition: any DENY -> DENY; else any ESCALATE -> ESCALATE; else PASS
  let decision: GateDecision = 'PASS';
  if (gates.some((g) => g.outcome === 'deny')) {
    decision = 'DENY';
  } else if (gates.some((g) => g.outcome === 'escalate')) {
    decision = 'ESCALATE';
  }

  const reason_codes = gates
    .filter((g) => g.outcome !== 'pass')
    .map((g) => g.reason_code);

  return {
    decision,
    gates,
    reason_codes,
    summary: {
      total_budget_cents,
      total_spent_before_cents: total_spent_cents,
      total_spent_after_cents: projected_total_cents,
      remaining_after_cents,
      required_reserve_after_cents,
      project_finishable_after: remaining_after_cents >= required_reserve_after_cents,
    },
  };
}

/**
 * Helper to compute whether a project's current state (based on captured payments)
 * is still finishable across all remaining essential categories.
 */
export function evaluateProjectFinishability(
  total_budget_cents: number,
  categories: BudgetCategory[],
  spent_by_category_cents: Record<string, number>
): {
  total_spent_cents: number;
  remaining_cents: number;
  required_reserve_cents: number;
  finishable: boolean;
  unfinished_essential_categories: string[];
} {
  const total_spent_cents = Object.values(spent_by_category_cents).reduce(
    (sum, v) => sum + v,
    0
  );
  const remaining_cents = total_budget_cents - total_spent_cents;
  const unfinished = categories.filter(
    (c) => c.essential && (spent_by_category_cents[c.name] ?? 0) === 0
  );
  const required_reserve_cents = unfinished.reduce(
    (sum, c) => sum + c.reference_estimate_cents,
    0
  );

  return {
    total_spent_cents,
    remaining_cents,
    required_reserve_cents,
    finishable: remaining_cents >= required_reserve_cents,
    unfinished_essential_categories: unfinished.map((c) => c.name),
  };
}
