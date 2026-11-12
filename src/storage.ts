import type {
  AuditEvent,
  AuditEventType,
  BudgetCategory,
  GateResult,
  Mandate,
  Payment,
  Project,
  Proposal,
  ProposalDecision,
} from './types.ts';
import { computeAuditEventHash } from './crypto.ts';

export interface StorageStore {
  init(): Promise<void>;
  createProject(project: Project): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  saveMandate(mandate: Mandate): Promise<Mandate>;
  getActiveMandate(projectId: string): Promise<Mandate | null>;
  /** Used by AC-2 tamper test / demo to directly mutate stored categories JSON */
  tamperMandateCategories(mandateId: string, tamperedCategories: BudgetCategory[]): Promise<void>;
  saveProposal(proposal: Proposal, gates: GateResult[]): Promise<void>;
  getProposal(proposalId: string): Promise<{ proposal: Proposal; gates: GateResult[] } | null>;
  listProposals(projectId: string): Promise<Array<{ proposal: Proposal; gates: GateResult[]; payment: Payment | null }>>;
  updateProposalDecision(proposalId: string, decision: ProposalDecision): Promise<void>;
  savePayment(payment: Payment): Promise<Payment>;
  getPaymentByProposal(proposalId: string): Promise<Payment | null>;
  appendAuditEvent(
    projectId: string,
    type: AuditEventType,
    payload: Record<string, unknown>,
    createdAt?: string
  ): Promise<AuditEvent>;
  listAuditEvents(projectId: string): Promise<AuditEvent[]>;
}

/**
 * In-memory store for isolated unit/integration tests and fallback when D1 binding is absent.
 */
export class MemoryStore implements StorageStore {
  private projects = new Map<string, Project>();
  private mandates = new Map<string, Mandate>();
  private proposals = new Map<string, Proposal>();
  private gateResults = new Map<string, GateResult[]>();
  private paymentsByProposal = new Map<string, Payment>();
  private auditByProject = new Map<string, AuditEvent[]>();

  async init(): Promise<void> {}

  async createProject(project: Project): Promise<Project> {
    this.projects.set(project.id, { ...project });
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    const p = this.projects.get(id);
    return p ? { ...p } : null;
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  }

  async saveMandate(mandate: Mandate): Promise<Mandate> {
    for (const [id, existing] of this.mandates.entries()) {
      if (existing.project_id === mandate.project_id && existing.status === 'active') {
        this.mandates.set(id, { ...existing, status: 'superseded' });
      }
    }
    this.mandates.set(mandate.id, {
      ...mandate,
      categories: mandate.categories.map((c) => ({ ...c })),
    });
    return mandate;
  }

  async getActiveMandate(projectId: string): Promise<Mandate | null> {
    const matching = Array.from(this.mandates.values())
      .filter((m) => m.project_id === projectId && m.status === 'active')
      .sort((a, b) => b.version - a.version);
    if (matching.length === 0) return null;
    const m = matching[0];
    return {
      ...m,
      categories: m.categories.map((c) => ({ ...c })),
    };
  }

  async tamperMandateCategories(
    mandateId: string,
    tamperedCategories: BudgetCategory[]
  ): Promise<void> {
    const existing = this.mandates.get(mandateId);
    if (existing) {
      this.mandates.set(mandateId, {
        ...existing,
        categories: tamperedCategories.map((c) => ({ ...c })),
      });
    }
  }

  async saveProposal(proposal: Proposal, gates: GateResult[]): Promise<void> {
    this.proposals.set(proposal.id, { ...proposal });
    this.gateResults.set(
      proposal.id,
      gates.map((g) => ({ ...g, detail_numbers: { ...g.detail_numbers } }))
    );
  }

  async getProposal(
    proposalId: string
  ): Promise<{ proposal: Proposal; gates: GateResult[] } | null> {
    const p = this.proposals.get(proposalId);
    if (!p) return null;
    const gates = this.gateResults.get(proposalId) ?? [];
    return {
      proposal: { ...p },
      gates: gates.map((g) => ({ ...g })),
    };
  }

  async listProposals(
    projectId: string
  ): Promise<Array<{ proposal: Proposal; gates: GateResult[]; payment: Payment | null }>> {
    const list = Array.from(this.proposals.values())
      .filter((p) => p.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return list.map((p) => ({
      proposal: { ...p },
      gates: (this.gateResults.get(p.id) ?? []).map((g) => ({ ...g })),
      payment: this.paymentsByProposal.get(p.id) ?? null,
    }));
  }

  async updateProposalDecision(
    proposalId: string,
    decision: ProposalDecision
  ): Promise<void> {
    const p = this.proposals.get(proposalId);
    if (p) {
      this.proposals.set(proposalId, { ...p, decision });
    }
  }

  async savePayment(payment: Payment): Promise<Payment> {
    const existing = this.paymentsByProposal.get(payment.proposal_id);
    if (existing && existing.status === 'captured') {
      throw new Error(`Proposal ${payment.proposal_id} already has a captured payment`);
    }
    this.paymentsByProposal.set(payment.proposal_id, { ...payment });
    return payment;
  }

  async getPaymentByProposal(proposalId: string): Promise<Payment | null> {
    const pay = this.paymentsByProposal.get(proposalId);
    return pay ? { ...pay } : null;
  }

  async appendAuditEvent(
    projectId: string,
    type: AuditEventType,
    payload: Record<string, unknown>,
    createdAt?: string
  ): Promise<AuditEvent> {
    const existing = this.auditByProject.get(projectId) ?? [];
    const seq = existing.length + 1;
    const prev_hash = seq === 1 ? 'GENESIS' : existing[existing.length - 1].event_hash;
    const created_at = createdAt ?? new Date().toISOString();
    const event_hash = await computeAuditEventHash(
      prev_hash,
      seq,
      type,
      payload,
      created_at
    );
    const event: AuditEvent = {
      seq,
      project_id: projectId,
      type,
      payload,
      prev_hash,
      event_hash,
      created_at,
    };
    existing.push(event);
    this.auditByProject.set(projectId, existing);
    return event;
  }

  async listAuditEvents(projectId: string): Promise<AuditEvent[]> {
    const existing = this.auditByProject.get(projectId) ?? [];
    return existing.map((e) => ({ ...e }));
  }
}

/**
 * Cloudflare D1 SQLite persistent store. Automatically ensures tables exist on first call.
 */
export class D1Store implements StorageStore {
  private initialized = false;
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    const statements = [
      `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, goal_text TEXT NOT NULL, total_budget_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'USD', created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS mandates (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, version INTEGER NOT NULL, categories_json TEXT NOT NULL, total_budget_cents INTEGER NOT NULL, owner_label TEXT NOT NULL, sha256_hash TEXT NOT NULL, signed_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active')`,
      `CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, mandate_id TEXT NOT NULL, item_id TEXT, item_name TEXT NOT NULL, vendor TEXT NOT NULL, category TEXT NOT NULL, quoted_price_cents INTEGER NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, justification TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'agent', created_at TEXT NOT NULL, decision TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS gate_results (id INTEGER PRIMARY KEY AUTOINCREMENT, proposal_id TEXT NOT NULL, gate TEXT NOT NULL, gate_name TEXT NOT NULL, outcome TEXT NOT NULL, reason_code TEXT NOT NULL, detail_numbers_json TEXT NOT NULL, explanation TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL UNIQUE, paypal_order_id TEXT NOT NULL, paypal_capture_id TEXT NOT NULL, amount_cents INTEGER NOT NULL, status TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'sandbox_live', created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, seq INTEGER NOT NULL, project_id TEXT NOT NULL, type TEXT NOT NULL, payload_json TEXT NOT NULL, prev_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL)`,
    ];
    await this.db.batch(statements.map((sql) => this.db.prepare(sql)));
    this.initialized = true;
  }

  async createProject(project: Project): Promise<Project> {
    await this.init();
    await this.db
      .prepare(
        `INSERT INTO projects (id, goal_text, total_budget_cents, currency, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        project.id,
        project.goal_text,
        project.total_budget_cents,
        project.currency,
        project.created_at
      )
      .run();
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    await this.init();
    const row = await this.db
      .prepare(`SELECT * FROM projects WHERE id = ?`)
      .bind(id)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      goal_text: String(row.goal_text),
      total_budget_cents: Number(row.total_budget_cents),
      currency: 'USD',
      created_at: String(row.created_at),
    };
  }

  async listProjects(): Promise<Project[]> {
    await this.init();
    const res = await this.db
      .prepare(`SELECT * FROM projects ORDER BY created_at DESC LIMIT 25`)
      .all<Record<string, unknown>>();
    return (res.results ?? []).map((row) => ({
      id: String(row.id),
      goal_text: String(row.goal_text),
      total_budget_cents: Number(row.total_budget_cents),
      currency: 'USD',
      created_at: String(row.created_at),
    }));
  }

  async saveMandate(mandate: Mandate): Promise<Mandate> {
    await this.init();
    await this.db
      .prepare(`UPDATE mandates SET status = 'superseded' WHERE project_id = ? AND status = 'active'`)
      .bind(mandate.project_id)
      .run();

    await this.db
      .prepare(
        `INSERT INTO mandates (id, project_id, version, categories_json, total_budget_cents, owner_label, sha256_hash, signed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        mandate.id,
        mandate.project_id,
        mandate.version,
        JSON.stringify(mandate.categories),
        mandate.total_budget_cents,
        mandate.owner_label,
        mandate.sha256_hash,
        mandate.signed_at,
        mandate.status
      )
      .run();
    return mandate;
  }

  async getActiveMandate(projectId: string): Promise<Mandate | null> {
    await this.init();
    const row = await this.db
      .prepare(
        `SELECT * FROM mandates WHERE project_id = ? AND status = 'active' ORDER BY version DESC LIMIT 1`
      )
      .bind(projectId)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      project_id: String(row.project_id),
      version: Number(row.version),
      categories: JSON.parse(String(row.categories_json)) as BudgetCategory[],
      total_budget_cents: Number(row.total_budget_cents),
      owner_label: String(row.owner_label),
      sha256_hash: String(row.sha256_hash),
      signed_at: String(row.signed_at),
      status: String(row.status) as 'active' | 'superseded',
    };
  }

  async tamperMandateCategories(
    mandateId: string,
    tamperedCategories: BudgetCategory[]
  ): Promise<void> {
    await this.init();
    await this.db
      .prepare(`UPDATE mandates SET categories_json = ? WHERE id = ?`)
      .bind(JSON.stringify(tamperedCategories), mandateId)
      .run();
  }

  async saveProposal(proposal: Proposal, gates: GateResult[]): Promise<void> {
    await this.init();
    const stmts = [
      this.db
        .prepare(
          `INSERT INTO proposals (id, project_id, mandate_id, item_id, item_name, vendor, category, quoted_price_cents, quantity, justification, source, created_at, decision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          proposal.id,
          proposal.project_id,
          proposal.mandate_id,
          proposal.item_id,
          proposal.item_name,
          proposal.vendor,
          proposal.category,
          proposal.quoted_price_cents,
          proposal.quantity,
          proposal.justification,
          proposal.source,
          proposal.created_at,
          proposal.decision
        ),
      ...gates.map((g) =>
        this.db
          .prepare(
            `INSERT INTO gate_results (proposal_id, gate, gate_name, outcome, reason_code, detail_numbers_json, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            g.proposal_id,
            g.gate,
            g.gate_name,
            g.outcome,
            g.reason_code,
            JSON.stringify(g.detail_numbers),
            g.explanation
          )
      ),
    ];
    await this.db.batch(stmts);
  }

  async getProposal(
    proposalId: string
  ): Promise<{ proposal: Proposal; gates: GateResult[] } | null> {
    await this.init();
    const row = await this.db
      .prepare(`SELECT * FROM proposals WHERE id = ?`)
      .bind(proposalId)
      .first<Record<string, unknown>>();
    if (!row) return null;

    const gateRows = await this.db
      .prepare(`SELECT * FROM gate_results WHERE proposal_id = ? ORDER BY id ASC`)
      .bind(proposalId)
      .all<Record<string, unknown>>();

    return {
      proposal: this.mapProposalRow(row),
      gates: (gateRows.results ?? []).map((g) => this.mapGateRow(g)),
    };
  }

  async listProposals(
    projectId: string
  ): Promise<Array<{ proposal: Proposal; gates: GateResult[]; payment: Payment | null }>> {
    await this.init();
    const propRows = await this.db
      .prepare(`SELECT * FROM proposals WHERE project_id = ? ORDER BY created_at ASC`)
      .bind(projectId)
      .all<Record<string, unknown>>();

    const results: Array<{
      proposal: Proposal;
      gates: GateResult[];
      payment: Payment | null;
    }> = [];

    for (const row of propRows.results ?? []) {
      const proposal = this.mapProposalRow(row);
      const gateRows = await this.db
        .prepare(`SELECT * FROM gate_results WHERE proposal_id = ? ORDER BY id ASC`)
        .bind(proposal.id)
        .all<Record<string, unknown>>();
      const payment = await this.getPaymentByProposal(proposal.id);
      results.push({
        proposal,
        gates: (gateRows.results ?? []).map((g) => this.mapGateRow(g)),
        payment,
      });
    }
    return results;
  }

  async updateProposalDecision(
    proposalId: string,
    decision: ProposalDecision
  ): Promise<void> {
    await this.init();
    await this.db
      .prepare(`UPDATE proposals SET decision = ? WHERE id = ?`)
      .bind(decision, proposalId)
      .run();
  }

  async savePayment(payment: Payment): Promise<Payment> {
    await this.init();
    const existing = await this.getPaymentByProposal(payment.proposal_id);
    if (existing && existing.status === 'captured') {
      throw new Error(`Proposal ${payment.proposal_id} already has a captured payment`);
    }
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO payments (id, proposal_id, paypal_order_id, paypal_capture_id, amount_cents, status, mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        payment.id,
        payment.proposal_id,
        payment.paypal_order_id,
        payment.paypal_capture_id,
        payment.amount_cents,
        payment.status,
        payment.mode ?? 'sandbox_live',
        payment.created_at
      )
      .run();
    return payment;
  }

  async getPaymentByProposal(proposalId: string): Promise<Payment | null> {
    await this.init();
    const row = await this.db
      .prepare(`SELECT * FROM payments WHERE proposal_id = ?`)
      .bind(proposalId)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      proposal_id: String(row.proposal_id),
      paypal_order_id: String(row.paypal_order_id),
      paypal_capture_id: String(row.paypal_capture_id),
      amount_cents: Number(row.amount_cents),
      status: String(row.status) as 'created' | 'captured' | 'failed',
      mode: (row.mode as 'sandbox_live' | 'sandbox_demo') ?? 'sandbox_live',
      created_at: String(row.created_at),
    };
  }

  async appendAuditEvent(
    projectId: string,
    type: AuditEventType,
    payload: Record<string, unknown>,
    createdAt?: string
  ): Promise<AuditEvent> {
    await this.init();
    const lastRow = await this.db
      .prepare(
        `SELECT seq, event_hash FROM audit_events WHERE project_id = ? ORDER BY seq DESC LIMIT 1`
      )
      .bind(projectId)
      .first<Record<string, unknown>>();

    const seq = lastRow ? Number(lastRow.seq) + 1 : 1;
    const prev_hash = lastRow ? String(lastRow.event_hash) : 'GENESIS';
    const created_at = createdAt ?? new Date().toISOString();
    const event_hash = await computeAuditEventHash(
      prev_hash,
      seq,
      type,
      payload,
      created_at
    );

    await this.db
      .prepare(
        `INSERT INTO audit_events (seq, project_id, type, payload_json, prev_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        seq,
        projectId,
        type,
        JSON.stringify(payload),
        prev_hash,
        event_hash,
        created_at
      )
      .run();

    return {
      seq,
      project_id: projectId,
      type,
      payload,
      prev_hash,
      event_hash,
      created_at,
    };
  }

  async listAuditEvents(projectId: string): Promise<AuditEvent[]> {
    await this.init();
    const rows = await this.db
      .prepare(`SELECT * FROM audit_events WHERE project_id = ? ORDER BY seq ASC`)
      .bind(projectId)
      .all<Record<string, unknown>>();
    return (rows.results ?? []).map((r) => ({
      seq: Number(r.seq),
      project_id: String(r.project_id),
      type: String(r.type) as AuditEventType,
      payload: JSON.parse(String(r.payload_json)) as Record<string, unknown>,
      prev_hash: String(r.prev_hash),
      event_hash: String(r.event_hash),
      created_at: String(r.created_at),
    }));
  }

  private mapProposalRow(row: Record<string, unknown>): Proposal {
    return {
      id: String(row.id),
      project_id: String(row.project_id),
      mandate_id: String(row.mandate_id),
      item_id: row.item_id ? String(row.item_id) : null,
      item_name: String(row.item_name),
      vendor: String(row.vendor),
      category: String(row.category),
      quoted_price_cents: Number(row.quoted_price_cents),
      quantity: Number(row.quantity),
      justification: String(row.justification),
      source: String(row.source) as Proposal['source'],
      created_at: String(row.created_at),
      decision: String(row.decision) as ProposalDecision,
    };
  }

  private mapGateRow(row: Record<string, unknown>): GateResult {
    return {
      proposal_id: String(row.proposal_id),
      gate: String(row.gate) as GateResult['gate'],
      gate_name: String(row.gate_name),
      outcome: String(row.outcome) as GateResult['outcome'],
      reason_code: String(row.reason_code) as GateResult['reason_code'],
      detail_numbers: JSON.parse(String(row.detail_numbers_json)),
      explanation: String(row.explanation),
    };
  }
}
