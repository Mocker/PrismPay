import type { BudgetCategory, ReferencePriceItem } from './types.ts';
import seedData from '../data/reference_prices.seed.json';

export const REFERENCE_PRICES: ReferencePriceItem[] = seedData.items as ReferencePriceItem[];

// =============================================================================
// Scenario 1: Backyard Tool Shed ($1,000) — Canonical PDD §10 Hackathon Scenario
// =============================================================================
export const SHED_DEMO_PROJECT = {
  id: 'proj-shed-demo',
  goal_text: 'Build a shed',
  total_budget_cents: 100000, // $1,000.00
  currency: 'USD' as const,
};

export const SHED_DEMO_CATEGORIES: BudgetCategory[] = [
  {
    name: 'Foundation & site prep',
    cap_cents: 12000, // $120
    essential: true,
    reference_estimate_cents: 12000,
    rationale: 'Concrete blocks, gravel base, and site levelling for an 8x10 footprint.',
  },
  {
    name: 'Framing lumber & panels',
    cap_cents: 32000, // $320
    essential: true,
    reference_estimate_cents: 30000,
    rationale: 'Dimensional studs, top/bottom plates, and exterior sheathing panels.',
  },
  {
    name: 'Roofing',
    cap_cents: 18000, // $180
    essential: true,
    reference_estimate_cents: 17500,
    rationale: 'Weatherproof roofing panels, ridge cap, flashing, and underlayment.',
  },
  {
    name: 'Doors, windows & hardware',
    cap_cents: 15000, // $150
    essential: true,
    reference_estimate_cents: 14000,
    rationale: 'Entry door, fixed window, hinges, and security latch hardware.',
  },
  {
    name: 'Fasteners & consumables',
    cap_cents: 8000, // $80
    essential: true,
    reference_estimate_cents: 7500,
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
  item_type?: 'part' | 'labor';
  expected_decision: 'PASS' | 'DENY' | 'ESCALATE';
}

export const SHED_DEMO_PROPOSALS: SeededProposalSpec[] = [
  {
    step: 1,
    label: 'Framing lumber package ($285)',
    badge: 'Fair Part -> PASS',
    item_id: 'framing-lumber-package',
    item_name: 'Framing lumber package',
    vendor: 'TimberLine Supply Co.',
    category: 'Framing lumber & panels',
    quoted_price_cents: 28500, // $285.00
    quantity: 1,
    justification: 'Complete 8x10 kiln-dried framing stud bundle at 5% below median reference.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 2,
    label: 'Premium designer roofing ($920 — The Trap)',
    badge: 'The Trap -> DENY',
    item_id: 'roofing-premium-package',
    item_name: 'Premium designer roofing package',
    vendor: 'LuxRoof Architectural Metals',
    category: 'Roofing',
    quoted_price_cents: 92000, // $920.00
    quantity: 1,
    justification: 'Agent selected luxury copper-clad roofing ($920 fits inside naive $1,000 card limit).',
    item_type: 'part',
    expected_decision: 'DENY',
  },
  {
    step: 3,
    label: 'Standard metal roofing kit ($165)',
    badge: 'Fair Alternative -> PASS',
    item_id: 'roofing-standard-kit',
    item_name: 'Standard metal roofing kit',
    vendor: 'Metro Building Materials',
    category: 'Roofing',
    quoted_price_cents: 16500, // $165.00
    quantity: 1,
    justification: 'Galvanized corrugated steel roofing kit with ridge flashing, under reference estimate.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 4,
    label: 'Hinges & latch set ($52)',
    badge: '1.30× Ref -> ESCALATE',
    item_id: 'hinges-latch-set',
    item_name: 'Hinges and latch set',
    vendor: 'IronCraft Hardware',
    category: 'Doors, windows & hardware',
    quoted_price_cents: 5200, // $52.00
    quantity: 1,
    justification: 'Heavy-duty powder-coated T-hinges and padlock hasp ($52 vs $40 median reference).',
    item_type: 'part',
    expected_decision: 'ESCALATE',
  },
  {
    step: 5,
    label: 'Site grading & leveling labor ($85)',
    badge: 'Subcontractor Labor -> PASS',
    item_id: 'foundation-labor',
    item_name: 'Excavation, grading & block leveling labor',
    vendor: 'Valley Groundworks LLC',
    category: 'Foundation & site prep',
    quoted_price_cents: 8500,
    quantity: 1,
    justification: 'Subcontractor site prep and concrete paver pad leveling.',
    item_type: 'labor',
    expected_decision: 'PASS',
  },
  {
    step: 6,
    label: 'Concrete blocks & gravel ($115)',
    badge: 'Foundation Materials -> PASS',
    item_id: 'foundation-kit',
    item_name: 'Concrete blocks, gravel and slab materials',
    vendor: 'County Masonry Supply',
    category: 'Foundation & site prep',
    quoted_price_cents: 11500,
    quantity: 1,
    justification: 'Paving stones, gravel foundation base, and vapor barrier.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
];

// =============================================================================
// Scenario 2: Compact Kitchenette Remodel ($3,500) — Home Renovation
// =============================================================================
export const KITCHEN_DEMO_PROJECT = {
  id: 'proj-kitchen-demo',
  goal_text: 'Compact kitchenette remodel',
  total_budget_cents: 350000, // $3,500.00
  currency: 'USD' as const,
};

export const KITCHEN_DEMO_CATEGORIES: BudgetCategory[] = [
  {
    name: 'Cabinetry & Storage',
    cap_cents: 110000, // $1,100
    essential: true,
    reference_estimate_cents: 105000,
    rationale: 'Wall and base cabinets with soft-close hinges and shelf inserts.',
  },
  {
    name: 'Countertops',
    cap_cents: 60000, // $600
    essential: true,
    reference_estimate_cents: 58000,
    rationale: 'Food-safe durable prep surface and sink cutout.',
  },
  {
    name: 'Plumbing & Fixtures',
    cap_cents: 55000, // $550
    essential: true,
    reference_estimate_cents: 52000,
    rationale: 'Undermount stainless sink, gooseneck pull-down faucet, and PEX plumbing.',
  },
  {
    name: 'Appliances & Ventilation',
    cap_cents: 75000, // $750
    essential: true,
    reference_estimate_cents: 70000,
    rationale: 'Induction 2-burner cooktop, refrigerator, and range vent hood.',
  },
  {
    name: 'Electrical & Lighting',
    cap_cents: 20000, // $200
    essential: true,
    reference_estimate_cents: 18000,
    rationale: 'GFCI countertop outlets and under-cabinet LED task illumination.',
  },
  {
    name: 'Contingency',
    cap_cents: 30000, // $300
    essential: false,
    reference_estimate_cents: 0,
    rationale: 'Fiduciary reserve buffer for unforeseen rough-in adjustments.',
  },
];

export const KITCHEN_DEMO_PROPOSALS: SeededProposalSpec[] = [
  {
    step: 1,
    label: 'Shaker ready-to-assemble cabinet suite ($980)',
    badge: 'Cabinet Suite -> PASS',
    item_id: 'kitchen-cabinets-rta',
    item_name: 'Shaker base & wall RTA cabinet suite',
    vendor: 'CabinetKraft Direct',
    category: 'Cabinetry & Storage',
    quoted_price_cents: 98000,
    quantity: 1,
    justification: 'Plywood box ready-to-assemble 5-cabinet kitchen set under reference median.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 2,
    label: 'Hand-carved mahogany cabinets ($2,950 — The Trap)',
    badge: '84% Budget Trap -> DENY',
    item_id: 'kitchen-cabinets-luxury-trap',
    item_name: 'Custom hand-carved mahogany cabinet suite',
    vendor: 'Milano Artisan Joinery',
    category: 'Cabinetry & Storage',
    quoted_price_cents: 295000,
    quantity: 1,
    justification: 'Luxury solid mahogany cabinet suite ($2,950 fits inside naive $3,500 card limit).',
    item_type: 'part',
    expected_decision: 'DENY',
  },
  {
    step: 3,
    label: 'Cabinet assembly & wall hang labor ($280)',
    badge: 'Finish Carpentry Labor -> PASS',
    item_id: 'kitchen-cabinet-labor',
    item_name: 'Cabinet assembly & precision wall hang labor',
    vendor: 'Apex Carpentry Pros',
    category: 'Cabinetry & Storage',
    quoted_price_cents: 28000,
    quantity: 1,
    justification: 'Finish carpenter cabinet assembly, wall stud fastening, and laser leveling.',
    item_type: 'labor',
    expected_decision: 'PASS',
  },
  {
    step: 4,
    label: 'Maple butcherblock countertop slab ($340)',
    badge: 'Countertop Part -> PASS',
    item_id: 'countertop-butcherblock',
    item_name: 'Solid maple butcherblock countertop slab',
    vendor: 'Hardwood Direct Depot',
    category: 'Countertops',
    quoted_price_cents: 34000,
    quantity: 1,
    justification: '8-foot mineral-oiled edge-grain hard maple slab, well within $600 cap.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 5,
    label: 'Undermount sink & spring faucet ($260)',
    badge: 'Sink Combo -> PASS',
    item_id: 'sink-faucet-combo',
    item_name: 'Undermount stainless deep sink & pull-down faucet',
    vendor: 'AquaPro Fixtures',
    category: 'Plumbing & Fixtures',
    quoted_price_cents: 26000,
    quantity: 1,
    justification: '16-gauge soundproof stainless sink with commercial spring pull-down faucet.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 6,
    label: 'Certified plumbing hookup labor ($220)',
    badge: 'Plumbing Labor -> PASS',
    item_id: 'plumbing-hookup-labor',
    item_name: 'Certified plumber PEX supply & PVC drain hookup',
    vendor: 'RapidFlow Plumbing Services',
    category: 'Plumbing & Fixtures',
    quoted_price_cents: 22000,
    quantity: 1,
    justification: 'Licensed plumber installation of PEX shutoffs, drain trap, and faucet hookups.',
    item_type: 'labor',
    expected_decision: 'PASS',
  },
  {
    step: 7,
    label: 'Induction cooktop & quiet fridge bundle ($640)',
    badge: 'Appliances Bundle -> PASS',
    item_id: 'compact-appliances-set',
    item_name: 'Induction 2-burner cooktop & 10 cu.ft refrigerator',
    vendor: 'HomeTech Appliances',
    category: 'Appliances & Ventilation',
    quoted_price_cents: 64000,
    quantity: 1,
    justification: 'Energy-star compact kitchen appliance package under reference estimate.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 8,
    label: 'Commercial 6-burner range ($2,700 — The Trap)',
    badge: 'Range Trap -> DENY',
    item_id: 'luxury-appliances-trap',
    item_name: 'Commercial 6-burner brass range suite',
    vendor: 'Haute Cuisine Equipment',
    category: 'Appliances & Ventilation',
    quoted_price_cents: 270000,
    quantity: 1,
    justification: 'Commercial brass gas range ($2,700 exceeds 50% single-item dominance).',
    item_type: 'part',
    expected_decision: 'DENY',
  },
  {
    step: 9,
    label: 'Electrician 20A circuit & GFCI labor ($175)',
    badge: 'Electrical Labor -> PASS',
    item_id: 'electrical-subcontract-labor',
    item_name: 'Electrician 20A dedicated circuit & GFCI install',
    vendor: 'VoltCraft Electric LLC',
    category: 'Electrical & Lighting',
    quoted_price_cents: 17500,
    quantity: 1,
    justification: 'Certified electrician rough-in for countertop GFCI outlets and breaker.',
    item_type: 'labor',
    expected_decision: 'PASS',
  },
];

// =============================================================================
// Scenario 3: Maker Studio / 3D Print Lab ($2,000) — Solo Maker Setup
// =============================================================================
export const MAKER_DEMO_PROJECT = {
  id: 'proj-maker-demo',
  goal_text: '3D print maker studio setup',
  total_budget_cents: 200000, // $2,000.00
  currency: 'USD' as const,
};

export const MAKER_DEMO_CATEGORIES: BudgetCategory[] = [
  {
    name: '3D Printers & Core Tools',
    cap_cents: 85000, // $850
    essential: true,
    reference_estimate_cents: 80000,
    rationale: 'High-speed enclosed CoreXY additive manufacturing units.',
  },
  {
    name: 'Workstations & Enclosures',
    cap_cents: 40000, // $400
    essential: true,
    reference_estimate_cents: 38000,
    rationale: 'Heavy-duty steel benches, anti-vibration mats, and power delivery.',
  },
  {
    name: 'Air Filtration & Ventilation',
    cap_cents: 30000, // $300
    essential: true,
    reference_estimate_cents: 28000,
    rationale: 'Active VOC carbon scrubber, HEPA filters, and duct ventilation.',
  },
  {
    name: 'Filament, Resin & Consumables',
    cap_cents: 20000, // $200
    essential: true,
    reference_estimate_cents: 18000,
    rationale: 'Engineering filament spools, hardened nozzles, and maintenance parts.',
  },
  {
    name: 'Contingency',
    cap_cents: 25000, // $250
    essential: false,
    reference_estimate_cents: 0,
    rationale: 'Reserve buffer for custom tooling upgrades or warranty spares.',
  },
];

export const MAKER_DEMO_PROPOSALS: SeededProposalSpec[] = [
  {
    step: 1,
    label: 'Dual enclosed CoreXY 3D printers ($740)',
    badge: 'Core Tools -> PASS',
    item_id: 'printers-corexy-duo',
    item_name: 'Dual high-speed enclosed CoreXY 3D printers',
    vendor: 'PrintCraft Systems',
    category: '3D Printers & Core Tools',
    quoted_price_cents: 74000,
    quantity: 1,
    justification: 'Enclosed dual-printer production setup at 7% below reference median.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 2,
    label: 'Industrial 5-axis metal sinter printer ($1,850 — The Trap)',
    badge: '92% Dominance Trap -> DENY',
    item_id: 'printers-industrial-trap',
    item_name: 'Industrial 5-axis laser sintering metal 3D printer',
    vendor: 'TitanSinter Heavy Additive',
    category: '3D Printers & Core Tools',
    quoted_price_cents: 185000,
    quantity: 1,
    justification: 'Industrial metal printer ($1,850 fits within naive $2,000 card limit).',
    item_type: 'part',
    expected_decision: 'DENY',
  },
  {
    step: 3,
    label: 'Heavy-duty steel workbench with power ($310)',
    badge: 'Workbench Part -> PASS',
    item_id: 'maker-workbench',
    item_name: 'Heavy-duty steel workbench with power strip',
    vendor: 'Industrial Benchworks',
    category: 'Workstations & Enclosures',
    quoted_price_cents: 31000,
    quantity: 1,
    justification: '1,000 lb capacity hardwood-top bench with built-in surge protected outlets.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 4,
    label: 'Studio bench assembly & anchoring labor ($110)',
    badge: 'Assembly Labor -> PASS',
    item_id: 'bench-assembly-labor',
    item_name: 'Studio bench assembly & equipment anchoring labor',
    vendor: 'Precision Shop Assembly',
    category: 'Workstations & Enclosures',
    quoted_price_cents: 11000,
    quantity: 1,
    justification: 'Professional bench assembly, acoustic leveling, and wall anchoring.',
    item_type: 'labor',
    expected_decision: 'PASS',
  },
  {
    step: 5,
    label: 'HEPA & carbon VOC fume filtration system ($240)',
    badge: 'Air Safety System -> PASS',
    item_id: 'fume-filtration-system',
    item_name: 'HEPA & activated carbon fume extraction system',
    vendor: 'PureAir Filtration Corp',
    category: 'Air Filtration & Ventilation',
    quoted_price_cents: 24000,
    quantity: 1,
    justification: 'Sealed particulate and VOC scrubber with dynamic speed control.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 6,
    label: '10-spool filament bundle & nozzle pack ($160)',
    badge: 'Consumables Bundle -> PASS',
    item_id: 'filament-spools-bundle',
    item_name: '10-spool engineering PLA & PETG filament bundle',
    vendor: 'PolyFilament Direct',
    category: 'Filament, Resin & Consumables',
    quoted_price_cents: 16000,
    quantity: 1,
    justification: 'Vacuum-sealed engineering filament spools with hardened 0.4/0.6mm nozzles.',
    item_type: 'part',
    expected_decision: 'PASS',
  },
  {
    step: 7,
    label: 'Hardened titanium hotend upgrade kit ($68)',
    badge: '1.36× Ref -> ESCALATE',
    item_id: 'titanium-hotend-upgrade',
    item_name: 'Hardened titanium bi-metal hotend upgrade kit',
    vendor: 'AeroExtrude Components',
    category: 'Filament, Resin & Consumables',
    quoted_price_cents: 6800,
    quantity: 1,
    justification: 'Bimetallic titanium heatbreak upgrade ($68 vs $50 reference = 1.36×).',
    item_type: 'part',
    expected_decision: 'ESCALATE',
  },
];

// Unified scenario directory
export interface ProjectScenario {
  id: string;
  name: string;
  tagline: string;
  project: { id: string; goal_text: string; total_budget_cents: number; currency: 'USD' };
  categories: BudgetCategory[];
  proposals: SeededProposalSpec[];
}

export const DEMO_SCENARIOS: ProjectScenario[] = [
  {
    id: 'shed-1000',
    name: 'Backyard Tool Shed ($1,000)',
    tagline: 'Standard 8x10 construction project with material kit & site prep labor',
    project: SHED_DEMO_PROJECT,
    categories: SHED_DEMO_CATEGORIES,
    proposals: SHED_DEMO_PROPOSALS,
  },
  {
    id: 'kitchen-3500',
    name: 'Kitchenette Remodel ($3,500)',
    tagline: 'Full interior remodel with cabinetry, butcherblock, induction appliances, and licensed trades',
    project: KITCHEN_DEMO_PROJECT,
    categories: KITCHEN_DEMO_CATEGORIES,
    proposals: KITCHEN_DEMO_PROPOSALS,
  },
  {
    id: 'maker-2000',
    name: 'Maker Studio & 3D Lab ($2,000)',
    tagline: 'Dual CoreXY printers, steel bench, active VOC ventilation, and engineering consumables',
    project: MAKER_DEMO_PROJECT,
    categories: MAKER_DEMO_CATEGORIES,
    proposals: MAKER_DEMO_PROPOSALS,
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
