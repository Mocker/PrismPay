-- PrismPay D1 SQLite Schema (PDD §9.1)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  goal_text TEXT NOT NULL,
  total_budget_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  categories_json TEXT NOT NULL,
  total_budget_cents INTEGER NOT NULL,
  owner_label TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  signed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  mandate_id TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  quoted_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  justification TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'agent',
  created_at TEXT NOT NULL,
  decision TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gate_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id TEXT NOT NULL,
  gate TEXT NOT NULL,
  gate_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  detail_numbers_json TEXT NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  paypal_order_id TEXT NOT NULL,
  paypal_capture_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'sandbox_live',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seq INTEGER NOT NULL,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mandates_project ON mandates(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_gate_results_proposal ON gate_results(proposal_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_project ON audit_events(project_id, seq);
