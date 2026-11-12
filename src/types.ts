export interface Project {
  id: string;
  goal_text: string;
  total_budget_cents: number;
  currency: 'USD';
  paypal_approval_flow?: boolean;
  created_at: string;
}

export interface BudgetCategory {
  name: string;
  cap_cents: number;
  essential: boolean;
  reference_estimate_cents: number;
  rationale?: string;
}

export interface Mandate {
  id: string;
  project_id: string;
  version: number;
  categories: BudgetCategory[];
  total_budget_cents: number;
  owner_label: string;
  sha256_hash: string;
  signed_at: string;
  status: 'active' | 'superseded';
}

export type ProposalSource = 'seeded' | 'manual' | 'agent';

export type GateDecision = 'PASS' | 'ESCALATE' | 'DENY';

export type ProposalDecision =
  | 'pending'
  | 'PASS'
  | 'ESCALATE'
  | 'DENY'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface Proposal {
  id: string;
  project_id: string;
  mandate_id: string;
  item_id: string | null;
  item_name: string;
  vendor: string;
  category: string;
  quoted_price_cents: number;
  quantity: number;
  justification: string;
  source: ProposalSource;
  created_at: string;
  decision: ProposalDecision;
}

export type GateId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
export type GateOutcome = 'pass' | 'escalate' | 'deny';

export type ReasonCode =
  | 'OK'
  | 'TOTAL_CAP_EXCEEDED'
  | 'CONTINGENCY_DRAW'
  | 'CATEGORY_CAP_EXCEEDED'
  | 'SINGLE_ITEM_DOMINANCE'
  | 'SINGLE_ITEM_LARGE'
  | 'PRICE_NOT_VALUE_FOR_MONEY'
  | 'PRICE_ABOVE_REFERENCE'
  | 'NO_REFERENCE_PRICE'
  | 'PROJECT_LEFT_UNFINISHABLE'
  | 'RESERVE_TIGHT';

export interface GateResult {
  proposal_id: string;
  gate: GateId;
  gate_name: string;
  outcome: GateOutcome;
  reason_code: ReasonCode;
  detail_numbers: Record<string, number | string | boolean | null>;
  explanation: string;
}

export type PaymentStatus =
  | 'created'
  | 'awaiting_approval'
  | 'captured'
  | 'cancelled'
  | 'failed';

export interface Payment {
  id: string;
  proposal_id: string;
  paypal_order_id: string;
  paypal_capture_id?: string;
  approve_url?: string;
  amount_cents: number;
  status: PaymentStatus;
  mode?: 'sandbox_live' | 'sandbox_demo';
  created_at: string;
}

export type AuditEventType =
  | 'PROJECT_CREATED'
  | 'BREAKDOWN_PROPOSED'
  | 'MANDATE_SIGNED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_EVALUATED'
  | 'OWNER_OVERRIDE_APPROVED'
  | 'OWNER_OVERRIDE_REJECTED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_BUYER_APPROVED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED';

export interface AuditEvent {
  seq: number;
  project_id: string;
  type: AuditEventType;
  payload: Record<string, unknown>;
  prev_hash: string;
  event_hash: string;
  created_at: string;
}

export interface ReferencePriceItem {
  item_id: string;
  name: string;
  category: string;
  reference_median_cents: number;
  reference_low_cents: number;
  reference_high_cents: number;
  unit: string;
  note: string;
}
