import type { BudgetCategory, ReferencePriceItem } from './types.ts';

/**
 * Curated planning estimates from `data/reference_prices.seed.json` (PDD §8).
 * Gate G4 compares quoted prices against `reference_median_cents` only.
 */
export const REFERENCE_PRICES: ReferencePriceItem[] = [
  {
    category: 'Foundation & site prep',
    item_id: 'foundation-kit',
    name: 'Concrete blocks, gravel and slab materials',
    note: 'Small shed footprint, materials only',
    reference_high_cents: 15000,
    reference_low_cents: 9500,
    reference_median_cents: 12000,
    unit: 'lot',
  },
  {
    category: 'Framing lumber & panels',
    item_id: 'framing-lumber-package',
    name: 'Framing lumber package',
    note: 'Studs, plates and sheathing panels for an 8x10 shed',
    reference_high_cents: 34500,
    reference_low_cents: 26000,
    reference_median_cents: 30000,
    unit: 'lot',
  },
  {
    category: 'Roofing',
    item_id: 'roofing-standard-kit',
    name: 'Standard metal roofing kit',
    note: 'Corrugated panels, flashing and fixings',
    reference_high_cents: 20500,
    reference_low_cents: 15000,
    reference_median_cents: 17500,
    unit: 'kit',
  },
  {
    category: 'Roofing',
    item_id: 'roofing-premium-package',
    name: 'Premium designer roofing package',
    note: "Same functional job as roofing-standard-kit; used by the demo's overpriced trap proposal, quoted at $920 in the scenario",
    reference_high_cents: 20500,
    reference_low_cents: 15000,
    reference_median_cents: 17500,
    unit: 'kit',
  },
  {
    category: 'Doors, windows & hardware',
    item_id: 'shed-door',
    name: 'Single shed door, pre-hung',
    note: 'Basic ledged door with frame',
    reference_high_cents: 14000,
    reference_low_cents: 8500,
    reference_median_cents: 11000,
    unit: 'each',
  },
  {
    category: 'Doors, windows & hardware',
    item_id: 'hinges-latch-set',
    name: 'Hinges and latch set',
    note: 'Heavy-duty T-hinges, padlock latch',
    reference_high_cents: 5200,
    reference_low_cents: 3000,
    reference_median_cents: 4000,
    unit: 'set',
  },
  {
    category: 'Doors, windows & hardware',
    item_id: 'shed-window',
    name: 'Small shed window',
    note: 'Fixed acrylic window with frame',
    reference_high_cents: 8500,
    reference_low_cents: 5000,
    reference_median_cents: 6500,
    unit: 'each',
  },
  {
    category: 'Fasteners & consumables',
    item_id: 'fasteners-consumables',
    name: 'Screws, nails and consumables',
    note: 'Structural screws, nails, sealant, blades',
    reference_high_cents: 9500,
    reference_low_cents: 6000,
    reference_median_cents: 7500,
    unit: 'lot',
  },
];

export const SHED_DEMO_PROJECT = {
  goal_text: 'Build a shed',
  total_budget_cents: 100000, // $1,000.00
  currency: 'USD' as const,
};

export const SHED_DEMO_CATEGORIES: BudgetCategory[] = [
  {
    name: 'Foundation & site prep',
    cap_cents: 12000, // $120
    essential: true,
    reference_estimate_cents: 12000, // $120
    rationale: 'Concrete blocks, gravel base, and site levelling for an 8x10 footprint.',
  },
  {
    name: 'Framing lumber & panels',
    cap_cents: 32000, // $320
    essential: true,
    reference_estimate_cents: 30000, // $300
    rationale: 'Dimensional studs, top/bottom plates, and exterior sheathing panels.',
  },
  {
    name: 'Roofing',
    cap_cents: 18000, // $180
    essential: true,
    reference_estimate_cents: 17500, // $175
    rationale: 'Weatherproof roofing panels, ridge cap, flashing, and underlayment.',
  },
  {
    name: 'Doors, windows & hardware',
    cap_cents: 15000, // $150
    essential: true,
    reference_estimate_cents: 14000, // $140
    rationale: 'Entry door, fixed window, hinges, and security latch hardware.',
  },
  {
    name: 'Fasteners & consumables',
    cap_cents: 8000, // $80
    essential: true,
    reference_estimate_cents: 7500, // $75
    rationale: 'Structural screws, galvanized nails, weatherproofing sealant, and blades.',
  },
  {
    name: 'Contingency',
    cap_cents: 15000, // $150
    essential: false,
    reference_estimate_cents: 0,
    rationale: '15% buffer reserved for approved price variances or material overages.',
  },
];

export interface SeededProposalSpec {
  step: number;
  label: string;
  badge: string;
  item_id: string | null;
  item_name: string;
  vendor: string;
  category: string;
  quoted_price_cents: number;
  quantity: number;
  justification: string;
  expected_decision: 'PASS' | 'DENY' | 'ESCALATE';
}

export const SHED_DEMO_PROPOSALS: SeededProposalSpec[] = [
  {
    step: 1,
    label: 'Proposal 1: Framing lumber package ($285)',
    badge: 'Fair Purchase -> PASS',
    item_id: 'framing-lumber-package',
    item_name: 'Framing lumber package',
    vendor: 'TimberLine Supply Co.',
    category: 'Framing lumber & panels',
    quoted_price_cents: 28500, // $285.00
    quantity: 1,
    justification:
      'Complete 8x10 kiln-dried framing stud and OSB sheathing bundle at 5% below median reference.',
    expected_decision: 'PASS',
  },
  {
    step: 2,
    label: 'Proposal 2: Premium designer roofing package ($920 — The Trap)',
    badge: 'The Trap -> DENY (4 Gates Fire)',
    item_id: 'roofing-premium-package',
    item_name: 'Premium designer roofing package',
    vendor: 'LuxRoof Architectural Metals',
    category: 'Roofing',
    quoted_price_cents: 92000, // $920.00
    quantity: 1,
    justification:
      'Agent selected top-ranked architectural standing-seam copper-clad roofing kit ($920 fits inside $1,000 total budget).',
    expected_decision: 'DENY',
  },
  {
    step: 3,
    label: 'Proposal 3: Standard metal roofing kit ($165)',
    badge: 'Fair Alternative -> PASS',
    item_id: 'roofing-standard-kit',
    item_name: 'Standard metal roofing kit',
    vendor: 'Metro Building Materials',
    category: 'Roofing',
    quoted_price_cents: 16500, // $165.00
    quantity: 1,
    justification:
      'Galvanized corrugated steel roofing kit with ridge flashing and neoprene screws, under the $175 reference estimate.',
    expected_decision: 'PASS',
  },
  {
    step: 4,
    label: 'Proposal 4: Hinges & latch set ($52 — Escalation)',
    badge: 'Above Reference (1.30×) -> ESCALATE',
    item_id: 'hinges-latch-set',
    item_name: 'Hinges and latch set',
    vendor: 'IronCraft Hardware',
    category: 'Doors, windows & hardware',
    quoted_price_cents: 5200, // $52.00
    quantity: 1,
    justification:
      'Heavy-duty powder-coated T-hinges and commercial padlock hasp ($52 vs $40 median reference; within category cap).',
    expected_decision: 'ESCALATE',
  },
];

export function findReferencePrice(
  item_id?: string | null,
  item_name?: string | null
): ReferencePriceItem | null {
  if (item_id) {
    const byId = REFERENCE_PRICES.find(
      (r) => r.item_id.toLowerCase() === item_id.trim().toLowerCase()
    );
    if (byId) return byId;
  }
  if (item_name) {
    const clean = item_name.trim().toLowerCase();
    const byExactName = REFERENCE_PRICES.find(
      (r) => r.name.toLowerCase() === clean || r.item_id.toLowerCase() === clean
    );
    if (byExactName) return byExactName;

    // Fuzzy substring match for manual judge testing against known items
    const byPartial = REFERENCE_PRICES.find(
      (r) =>
        clean.includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(clean)
    );
    if (byPartial) return byPartial;
  }
  return null;
}
