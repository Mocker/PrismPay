import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type {
  BudgetCategory,
  Mandate,
  Payment,
  Project,
  Proposal,
} from './types.ts';
import { D1Store, MemoryStore, type StorageStore } from './storage.ts';
import {
  computeMandateHash,
  verifyAuditChain,
  verifyMandateIntegrity,
} from './crypto.ts';
import {
  evaluateProjectFinishability,
  evaluateProposalGates,
  GATE_CONFIG,
} from './gates.ts';
import {
  findReferencePrice,
  REFERENCE_PRICES,
  SHED_DEMO_CATEGORIES,
  SHED_DEMO_PROJECT,
  SHED_DEMO_PROPOSALS,
} from './seed.ts';
import { createAndCapturePayPalSandboxOrder, type PayPalEnvConfig } from './paypal.ts';
import {
  proposeBreakdown,
  suggestCategoryForItem,
  type AIBreakdownEnv,
} from './ai.ts';
import { renderAppHtml } from './ui.ts';

export interface Bindings extends PayPalEnvConfig, AIBreakdownEnv {
  DB?: D1Database;
}

const fallbackMemoryStore = new MemoryStore();

function getStore(env?: Bindings): StorageStore {
  if (env?.DB) {
    return new D1Store(env.DB);
  }
  return fallbackMemoryStore;
}

export function createApp(customStore?: StorageStore) {
  const app = new Hono<{ Bindings: Bindings }>();

  app.use('/api/*', cors());

  const resolveStore = (env?: Bindings): StorageStore =>
    customStore ?? getStore(env);

  // ===========================================================================
  // Frontend Web Application
  // ===========================================================================
  app.get('/', (c) => {
    return c.html(renderAppHtml());
  });

  // ===========================================================================
  // Reference catalog & demo presets endpoint (for UI dropdowns & judge seed)
  // ===========================================================================
  app.get('/api/meta', (c) => {
    const hasPayPalCredentials = Boolean(
      c.env?.PAYPAL_CLIENT_ID && c.env?.PAYPAL_CLIENT_SECRET
    );
    return c.json({
      reference_prices: REFERENCE_PRICES,
      shed_demo: {
        project: SHED_DEMO_PROJECT,
        categories: SHED_DEMO_CATEGORIES,
        proposals: SHED_DEMO_PROPOSALS,
      },
      gate_config: GATE_CONFIG,
      paypal_env: 'sandbox',
      paypal_live_credentials_configured: hasPayPalCredentials,
    });
  });

  // ===========================================================================
  // POST /api/projects — Create project (PDD §9.4)
  // ===========================================================================
  app.post('/api/projects', async (c) => {
    const store = resolveStore(c.env);
    const body = await c.req.json<{
      goal_text?: string;
      total_budget_cents?: number;
    }>();

    const goal_text = (body.goal_text ?? '').trim();
    const total_budget_cents = Math.round(Number(body.total_budget_cents ?? 0));

    if (!goal_text) {
      return c.json({ error: 'goal_text is required' }, 400);
    }
    if (!Number.isInteger(total_budget_cents) || total_budget_cents < 1000) {
      return c.json(
        { error: 'total_budget_cents must be an integer >= 1000 ($10.00)' },
        400
      );
    }

    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      goal_text,
      total_budget_cents,
      currency: 'USD',
      created_at: new Date().toISOString(),
    };

    await store.createProject(project);
    await store.appendAuditEvent(project.id, 'PROJECT_CREATED', {
      project_id: project.id,
      goal_text: project.goal_text,
      total_budget_cents: project.total_budget_cents,
      currency: project.currency,
    });

    return c.json({ project }, 201);
  });

  // ===========================================================================
  // GET /api/projects — List recent projects
  // ===========================================================================
  app.get('/api/projects', async (c) => {
    const store = resolveStore(c.env);
    const projects = await store.listProjects();
    return c.json({ projects });
  });

  // ===========================================================================
  // POST /api/projects/:id/breakdown — Propose AI (or fallback) breakdown (PDD §9.4)
  // ===========================================================================
  app.post('/api/projects/:id/breakdown', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const project = await store.getProject(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const breakdown = await proposeBreakdown(
      project.goal_text,
      project.total_budget_cents,
      c.env
    );

    await store.appendAuditEvent(project.id, 'BREAKDOWN_PROPOSED', {
      project_id: project.id,
      source: breakdown.source,
      model_used: breakdown.model_used,
      category_count: breakdown.categories.length,
      total_budget_cents: project.total_budget_cents,
      categories: breakdown.categories,
    });

    return c.json({
      project_id: project.id,
      total_budget_cents: project.total_budget_cents,
      categories: breakdown.categories,
      source: breakdown.source,
      model_used: breakdown.model_used,
    });
  });

  // ===========================================================================
  // POST /api/projects/:id/mandate — Sign Mandate v1 (PDD §9.4)
  // ===========================================================================
  app.post('/api/projects/:id/mandate', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const project = await store.getProject(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const body = await c.req.json<{
      categories?: BudgetCategory[];
      owner_label?: string;
    }>();

    const categories = body.categories;
    if (!Array.isArray(categories) || categories.length === 0) {
      return c.json({ error: 'categories array is required' }, 400);
    }

    // Validate integer cents and exact sum match (Flow A step 3 & 4)
    const sanitized: BudgetCategory[] = categories.map((cat) => ({
      name: String(cat.name).trim(),
      cap_cents: Math.round(Number(cat.cap_cents)),
      essential: Boolean(cat.essential),
      reference_estimate_cents: Math.round(
        Number(cat.reference_estimate_cents ?? 0)
      ),
      rationale: cat.rationale ? String(cat.rationale) : undefined,
    }));

    const sumCents = sanitized.reduce((acc, cat) => acc + cat.cap_cents, 0);
    if (sumCents !== project.total_budget_cents) {
      return c.json(
        {
          error: `Unbalanced budget plan: category allocations sum to ${sumCents} cents, but project total budget is ${project.total_budget_cents} cents.`,
        },
        400
      );
    }

    const contingencyCat = sanitized.find(
      (cat) => cat.name.toLowerCase() === 'contingency'
    );
    const minContingency = Math.floor(
      project.total_budget_cents * GATE_CONFIG.MIN_CONTINGENCY_RATIO
    );
    if (!contingencyCat || contingencyCat.cap_cents < minContingency) {
      return c.json(
        {
          error: `Contingency reserve must be at least 10% (${minContingency} cents).`,
        },
        400
      );
    }

    const existingMandate = await store.getActiveMandate(project.id);
    const version = existingMandate ? existingMandate.version + 1 : 1;

    const sha256_hash = await computeMandateHash({
      project_id: project.id,
      version,
      total_budget_cents: project.total_budget_cents,
      categories: sanitized,
    });

    const mandate: Mandate = {
      id: `mnd-${crypto.randomUUID().slice(0, 8)}`,
      project_id: project.id,
      version,
      categories: sanitized,
      total_budget_cents: project.total_budget_cents,
      owner_label: (body.owner_label ?? 'Project Owner').trim(),
      sha256_hash,
      signed_at: new Date().toISOString(),
      status: 'active',
    };

    await store.saveMandate(mandate);
    await store.appendAuditEvent(project.id, 'MANDATE_SIGNED', {
      mandate_id: mandate.id,
      version: mandate.version,
      owner_label: mandate.owner_label,
      total_budget_cents: mandate.total_budget_cents,
      sha256_hash: mandate.sha256_hash,
      categories: mandate.categories.map((cat) => ({
        name: cat.name,
        cap_cents: cat.cap_cents,
        essential: cat.essential,
        reference_estimate_cents: cat.reference_estimate_cents,
      })),
    });

    return c.json({ mandate }, 201);
  });

  // ===========================================================================
  // GET /api/projects/:id — Project + Mandate + Dashboard Aggregates (PDD §9.4)
  // ===========================================================================
  app.get('/api/projects/:id', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const project = await store.getProject(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const mandate = await store.getActiveMandate(project.id);
    const proposalsWithDetails = await store.listProposals(project.id);

    let mandateIntegrity = null;
    if (mandate) {
      mandateIntegrity = await verifyMandateIntegrity({
        project_id: mandate.project_id,
        version: mandate.version,
        total_budget_cents: mandate.total_budget_cents,
        categories: mandate.categories,
        sha256_hash: mandate.sha256_hash,
      });
    }

    // Aggregate spent by category from captured payments
    const spent_by_category_cents: Record<string, number> = {};
    if (mandate) {
      for (const cat of mandate.categories) {
        spent_by_category_cents[cat.name] = 0;
      }
    }

    for (const item of proposalsWithDetails) {
      if (item.payment && item.payment.status === 'captured') {
        const catName = item.proposal.category;
        spent_by_category_cents[catName] =
          (spent_by_category_cents[catName] ?? 0) + item.payment.amount_cents;
      }
    }

    const finishability = mandate
      ? evaluateProjectFinishability(
          project.total_budget_cents,
          mandate.categories,
          spent_by_category_cents
        )
      : {
          total_spent_cents: 0,
          remaining_cents: project.total_budget_cents,
          required_reserve_cents: 0,
          finishable: true,
          unfinished_essential_categories: [],
        };

    const category_aggregates = mandate
      ? mandate.categories.map((cat) => {
          const spent_cents = spent_by_category_cents[cat.name] ?? 0;
          return {
            name: cat.name,
            cap_cents: cat.cap_cents,
            spent_cents,
            remaining_cap_cents: Math.max(0, cat.cap_cents - spent_cents),
            essential: cat.essential,
            reference_estimate_cents: cat.reference_estimate_cents,
            rationale: cat.rationale,
            satisfied: !cat.essential || spent_cents > 0,
          };
        })
      : [];

    return c.json({
      project,
      mandate,
      mandate_integrity: mandateIntegrity,
      dashboard: {
        total_budget_cents: project.total_budget_cents,
        total_spent_cents: finishability.total_spent_cents,
        remaining_cents: finishability.remaining_cents,
        required_reserve_cents: finishability.required_reserve_cents,
        project_finishable: finishability.finishable,
        unfinished_essential_categories:
          finishability.unfinished_essential_categories,
        categories: category_aggregates,
      },
      proposals: proposalsWithDetails,
    });
  });

  // ===========================================================================
  // POST /api/projects/:id/proposals — Propose purchase + evaluate 5 gates +
  // if PASS, create & capture PayPal sandbox order server-side (PDD §9.4 & §11)
  // ===========================================================================
  app.post('/api/projects/:id/proposals', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const project = await store.getProject(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const mandate = await store.getActiveMandate(project.id);
    if (!mandate) {
      return c.json(
        { error: 'No active signed mandate for this project. Sign a mandate first.' },
        400
      );
    }

    // AC-2: Verify mandate cryptographic integrity before evaluating any proposal!
    const integrity = await verifyMandateIntegrity({
      project_id: mandate.project_id,
      version: mandate.version,
      total_budget_cents: mandate.total_budget_cents,
      categories: mandate.categories,
      sha256_hash: mandate.sha256_hash,
    });

    if (!integrity.valid) {
      return c.json(
        {
          error: `MANDATE_TAMPER_DETECTED: Stored mandate categories do not match signed SHA-256 hash (${integrity.stored_hash} != ${integrity.expected_hash}). All spending is halted.`,
          mandate_integrity: integrity,
        },
        409
      );
    }

    const body = await c.req.json<{
      item_id?: string | null;
      item_name?: string;
      vendor?: string;
      category?: string;
      quoted_price_cents?: number;
      quantity?: number;
      justification?: string;
      source?: 'seeded' | 'manual' | 'agent';
    }>();

    const item_name = (body.item_name ?? '').trim();
    const vendor = (body.vendor ?? 'General Supplier').trim();
    const quoted_price_cents = Math.round(Number(body.quoted_price_cents ?? 0));
    const quantity = Math.max(1, Math.round(Number(body.quantity ?? 1)));
    const justification = (
      body.justification ?? 'Proposed by purchasing agent against active project mandate.'
    ).trim();
    const source = body.source ?? 'agent';

    if (!item_name) {
      return c.json({ error: 'item_name is required' }, 400);
    }
    if (!Number.isInteger(quoted_price_cents) || quoted_price_cents <= 0) {
      return c.json({ error: 'quoted_price_cents must be a positive integer' }, 400);
    }

    const category =
      body.category && body.category.trim()
        ? body.category.trim()
        : suggestCategoryForItem(item_name, mandate.categories);

    const refItem = findReferencePrice(body.item_id, item_name);
    const reference_price_cents = refItem
      ? refItem.reference_median_cents * quantity
      : null;

    // Compute prior captured spending by category
    const priorProposals = await store.listProposals(project.id);
    const spent_by_category_cents: Record<string, number> = {};
    for (const cat of mandate.categories) {
      spent_by_category_cents[cat.name] = 0;
    }
    for (const p of priorProposals) {
      if (p.payment && p.payment.status === 'captured') {
        spent_by_category_cents[p.proposal.category] =
          (spent_by_category_cents[p.proposal.category] ?? 0) +
          p.payment.amount_cents;
      }
    }

    const proposalId = `prop-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Evaluate the 5 deterministic value gates (PDD §7)
    const evaluation = evaluateProposalGates({
      proposal_id: proposalId,
      item_name,
      category,
      quoted_price_cents,
      total_budget_cents: mandate.total_budget_cents,
      categories: mandate.categories,
      spent_by_category_cents,
      reference_price_cents,
    });

    const proposal: Proposal = {
      id: proposalId,
      project_id: project.id,
      mandate_id: mandate.id,
      item_id: refItem?.item_id ?? body.item_id ?? null,
      item_name,
      vendor,
      category,
      quoted_price_cents,
      quantity,
      justification,
      source,
      created_at: now,
      decision: evaluation.decision,
    };

    await store.saveProposal(proposal, evaluation.gates);

    await store.appendAuditEvent(project.id, 'PROPOSAL_CREATED', {
      proposal_id: proposal.id,
      item_name: proposal.item_name,
      vendor: proposal.vendor,
      category: proposal.category,
      quoted_price_cents: proposal.quoted_price_cents,
      reference_price_cents,
      source: proposal.source,
    });

    await store.appendAuditEvent(project.id, 'PROPOSAL_EVALUATED', {
      proposal_id: proposal.id,
      item_name: proposal.item_name,
      quoted_price_cents: proposal.quoted_price_cents,
      decision: evaluation.decision,
      reason_codes: evaluation.reason_codes,
      gates: evaluation.gates.map((g) => ({
        gate: g.gate,
        outcome: g.outcome,
        reason_code: g.reason_code,
      })),
    });

    let payment: Payment | null = null;
    let paymentError: string | null = null;

    // Principle 3: ONLY if decision === 'PASS' do we call PayPal right now.
    // If DENY -> NO PayPal call is made, ever, for that proposal.
    // If ESCALATE -> awaits owner approval at POST /api/proposals/:id/approve.
    if (evaluation.decision === 'PASS') {
      try {
        const ppResult = await createAndCapturePayPalSandboxOrder(
          {
            proposal_id: proposal.id,
            project_id: project.id,
            mandate_id: mandate.id,
            amount_cents: proposal.quoted_price_cents,
            item_name: proposal.item_name,
            vendor: proposal.vendor,
            verified_decision: 'PASS',
          },
          c.env ?? {},
          null
        );

        payment = await store.savePayment(ppResult.payment);
        await store.updateProposalDecision(proposal.id, 'paid');
        proposal.decision = 'paid';

        await store.appendAuditEvent(project.id, 'PAYMENT_CREATED', {
          proposal_id: proposal.id,
          payment_id: payment.id,
          paypal_order_id: payment.paypal_order_id,
          amount_cents: payment.amount_cents,
        });

        await store.appendAuditEvent(project.id, 'PAYMENT_CAPTURED', {
          proposal_id: proposal.id,
          payment_id: payment.id,
          paypal_order_id: payment.paypal_order_id,
          paypal_capture_id: payment.paypal_capture_id,
          amount_cents: payment.amount_cents,
          mode: payment.mode,
        });
      } catch (err) {
        paymentError = err instanceof Error ? err.message : String(err);
        await store.updateProposalDecision(proposal.id, 'PASS');
        await store.appendAuditEvent(project.id, 'PAYMENT_FAILED', {
          proposal_id: proposal.id,
          amount_cents: proposal.quoted_price_cents,
          error: paymentError,
        });
      }
    }

    return c.json(
      {
        proposal,
        gate_evaluation: evaluation.decision,
        reason_codes: evaluation.reason_codes,
        gates: evaluation.gates,
        summary: evaluation.summary,
        payment,
        payment_error: paymentError,
      },
      201
    );
  });

  // ===========================================================================
  // POST /api/proposals/:id/approve — Owner approves an ESCALATE proposal,
  // then pays via PayPal Sandbox (PDD §6 Flow E & §9.4)
  // ===========================================================================
  app.post('/api/proposals/:id/approve', async (c) => {
    const store = resolveStore(c.env);
    const proposalId = c.req.param('id');
    const found = await store.getProposal(proposalId);
    if (!found) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    const { proposal, gates } = found;

    // Principle 1 & Flow E step 4: DENY decisions CANNOT be overridden!
    if (proposal.decision === 'DENY') {
      return c.json(
        {
          error:
            'FORBIDDEN: DENY decisions cannot be overridden. Changing caps requires signing a new mandate version (PDD Principle 1).',
        },
        403
      );
    }

    if (proposal.decision === 'paid') {
      const existingPayment = await store.getPaymentByProposal(proposal.id);
      return c.json({
        proposal,
        gates,
        payment: existingPayment,
        message: 'Proposal is already paid.',
      });
    }

    if (proposal.decision !== 'ESCALATE' && proposal.decision !== 'approved') {
      return c.json(
        {
          error: `Cannot approve proposal in state "${proposal.decision}". Only ESCALATE proposals can be approved.`,
        },
        400
      );
    }

    await store.updateProposalDecision(proposal.id, 'approved');
    proposal.decision = 'approved';

    await store.appendAuditEvent(
      proposal.project_id,
      'OWNER_OVERRIDE_APPROVED',
      {
        proposal_id: proposal.id,
        item_name: proposal.item_name,
        quoted_price_cents: proposal.quoted_price_cents,
        escalated_reasons: gates
          .filter((g) => g.outcome === 'escalate')
          .map((g) => g.reason_code),
      }
    );

    const existingPayment = await store.getPaymentByProposal(proposal.id);
    try {
      const ppResult = await createAndCapturePayPalSandboxOrder(
        {
          proposal_id: proposal.id,
          project_id: proposal.project_id,
          mandate_id: proposal.mandate_id,
          amount_cents: proposal.quoted_price_cents,
          item_name: proposal.item_name,
          vendor: proposal.vendor,
          verified_decision: 'approved',
        },
        c.env ?? {},
        existingPayment
      );

      const payment = await store.savePayment(ppResult.payment);
      await store.updateProposalDecision(proposal.id, 'paid');
      proposal.decision = 'paid';

      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_CREATED', {
        proposal_id: proposal.id,
        payment_id: payment.id,
        paypal_order_id: payment.paypal_order_id,
        amount_cents: payment.amount_cents,
      });

      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_CAPTURED', {
        proposal_id: proposal.id,
        payment_id: payment.id,
        paypal_order_id: payment.paypal_order_id,
        paypal_capture_id: payment.paypal_capture_id,
        amount_cents: payment.amount_cents,
        mode: payment.mode,
      });

      return c.json({ proposal, gates, payment });
    } catch (err) {
      const paymentError = err instanceof Error ? err.message : String(err);
      await store.updateProposalDecision(proposal.id, 'ESCALATE');
      proposal.decision = 'ESCALATE';
      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_FAILED', {
        proposal_id: proposal.id,
        amount_cents: proposal.quoted_price_cents,
        error: paymentError,
      });
      return c.json({ error: paymentError, proposal, gates }, 502);
    }
  });

  // ===========================================================================
  // POST /api/proposals/:id/reject — Owner rejects an ESCALATE proposal (PDD §9.4)
  // ===========================================================================
  app.post('/api/proposals/:id/reject', async (c) => {
    const store = resolveStore(c.env);
    const proposalId = c.req.param('id');
    const found = await store.getProposal(proposalId);
    if (!found) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    const { proposal, gates } = found;
    if (proposal.decision !== 'ESCALATE') {
      return c.json(
        {
          error: `Cannot reject proposal in state "${proposal.decision}". Only ESCALATE proposals can be rejected.`,
        },
        400
      );
    }

    await store.updateProposalDecision(proposal.id, 'rejected');
    proposal.decision = 'rejected';

    await store.appendAuditEvent(
      proposal.project_id,
      'OWNER_OVERRIDE_REJECTED',
      {
        proposal_id: proposal.id,
        item_name: proposal.item_name,
        quoted_price_cents: proposal.quoted_price_cents,
      }
    );

    return c.json({ proposal, gates });
  });

  // ===========================================================================
  // GET /api/projects/:id/audit — List hash-chained audit events (PDD §9.4)
  // ===========================================================================
  app.get('/api/projects/:id/audit', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const events = await store.listAuditEvents(projectId);
    const verification = await verifyAuditChain(events);
    return c.json({
      project_id: projectId,
      events,
      verification,
    });
  });

  // ===========================================================================
  // POST /api/projects/:id/audit/verify — Recompute & verify chain (PDD §9.2 & §9.4)
  // ===========================================================================
  app.post('/api/projects/:id/audit/verify', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const events = await store.listAuditEvents(projectId);
    const verification = await verifyAuditChain(events);

    const mandate = await store.getActiveMandate(projectId);
    let mandateIntegrity = null;
    if (mandate) {
      mandateIntegrity = await verifyMandateIntegrity({
        project_id: mandate.project_id,
        version: mandate.version,
        total_budget_cents: mandate.total_budget_cents,
        categories: mandate.categories,
        sha256_hash: mandate.sha256_hash,
      });
    }

    return c.json({
      project_id: projectId,
      verification,
      mandate_integrity: mandateIntegrity,
    });
  });

  // ===========================================================================
  // POST /api/demo/shed — One-click "Load the Shed Demo" seed (PDD §12.1 & AC-11)
  // Creates the §10 Shed project, generates the §10 breakdown, and optionally
  // signs Mandate v1 if sign_immediately is true.
  // ===========================================================================
  app.post('/api/demo/shed', async (c) => {
    const store = resolveStore(c.env);
    const body = await c.req
      .json<{ sign_immediately?: boolean }>()
      .catch(() => ({ sign_immediately: false }));

    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      goal_text: SHED_DEMO_PROJECT.goal_text,
      total_budget_cents: SHED_DEMO_PROJECT.total_budget_cents,
      currency: 'USD',
      created_at: new Date().toISOString(),
    };

    await store.createProject(project);
    await store.appendAuditEvent(project.id, 'PROJECT_CREATED', {
      project_id: project.id,
      goal_text: project.goal_text,
      total_budget_cents: project.total_budget_cents,
      currency: project.currency,
    });

    const categories = SHED_DEMO_CATEGORIES.map((cat) => ({ ...cat }));
    await store.appendAuditEvent(project.id, 'BREAKDOWN_PROPOSED', {
      project_id: project.id,
      source: 'seeded_fallback',
      model_used: 'prismpay-deterministic-planner-v1',
      category_count: categories.length,
      total_budget_cents: project.total_budget_cents,
      categories,
    });

    let mandate: Mandate | null = null;
    if (body.sign_immediately) {
      const sha256_hash = await computeMandateHash({
        project_id: project.id,
        version: 1,
        total_budget_cents: project.total_budget_cents,
        categories,
      });
      mandate = {
        id: `mnd-${crypto.randomUUID().slice(0, 8)}`,
        project_id: project.id,
        version: 1,
        categories,
        total_budget_cents: project.total_budget_cents,
        owner_label: 'Homeowner (Shed Demo)',
        sha256_hash,
        signed_at: new Date().toISOString(),
        status: 'active',
      };
      await store.saveMandate(mandate);
      await store.appendAuditEvent(project.id, 'MANDATE_SIGNED', {
        mandate_id: mandate.id,
        version: mandate.version,
        owner_label: mandate.owner_label,
        total_budget_cents: mandate.total_budget_cents,
        sha256_hash: mandate.sha256_hash,
        categories: mandate.categories,
      });
    }

    return c.json(
      {
        project,
        categories,
        mandate,
        seeded_proposals: SHED_DEMO_PROPOSALS,
      },
      201
    );
  });

  // ===========================================================================
  // POST /api/projects/:id/category-suggest — Suggest category for manual item
  // ===========================================================================
  app.post('/api/projects/:id/category-suggest', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const mandate = await store.getActiveMandate(projectId);
    const body = await c.req.json<{ item_name?: string }>();
    const item_name = (body.item_name ?? '').trim();
    const categories = mandate ? mandate.categories : SHED_DEMO_CATEGORIES;
    const suggested_category = suggestCategoryForItem(item_name, categories);
    const refItem = findReferencePrice(null, item_name);
    return c.json({
      suggested_category,
      reference_item: refItem,
    });
  });

  return app;
}

export default createApp();
