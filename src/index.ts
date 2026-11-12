import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type {
  BudgetCategory,
  Mandate,
  Payment,
  Project,
  Proposal,
} from './types.ts';
import { D1Store, KvStore, MemoryStore, type StorageStore } from './storage.ts';
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
  DEMO_SCENARIOS,
} from './seed.ts';
import {
  capturePayPalOrder,
  createAndCapturePayPalSandboxOrder,
  createPayPalOrder,
  hasPayPalCredentials,
  type PayPalEnvConfig,
} from './paypal.ts';
import {
  proposeBreakdown,
  suggestCategoryForItem,
  type AIBreakdownEnv,
} from './ai.ts';
import { renderAppHtml } from './ui.ts';

export interface Bindings extends PayPalEnvConfig, AIBreakdownEnv {
  DB?: D1Database;
  KV?: KVNamespace;
}

const fallbackMemoryStore = new MemoryStore();

function getStore(env?: Bindings): StorageStore {
  if (env?.KV) {
    return new KvStore(env.KV);
  }
  if (env?.DB) {
    return new D1Store(env.DB);
  }
  return fallbackMemoryStore;
}

function escapeHtmlServer(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPayPalRedirectPage(opts: {
  title: string;
  badgeText: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  heading: string;
  subtitle: string;
  details: Array<{ label: string; value: string; mono?: boolean }>;
  projectId?: string;
}): string {
  const colorMap = {
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      text: '#34d399',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      text: '#fbbf24',
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      text: '#fb7185',
    },
  }[opts.badgeColor];

  const returnHref = opts.projectId
    ? `/?project_id=${encodeURIComponent(opts.projectId)}`
    : '/';

  const detailRows = opts.details
    .map(
      (d) => `
      <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #1e293b;font-size:14px;">
        <span style="color:#94a3b8;">${escapeHtmlServer(d.label)}</span>
        <span style="color:#f8fafc;font-weight:600;${d.mono ? 'font-family:monospace;' : ''}">${escapeHtmlServer(d.value)}</span>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlServer(opts.title)} — PrismPay</title>
</head>
<body style="margin:0;min-height:100vh;background:#070b14;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="max-width:520px;width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:28px;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;background:${colorMap.bg};border:1px solid ${colorMap.border};color:${colorMap.text};font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
      ${escapeHtmlServer(opts.badgeText)}
    </div>
    <h1 style="margin:16px 0 8px;font-size:22px;font-weight:700;color:#ffffff;">${escapeHtmlServer(opts.heading)}</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#94a3b8;">${escapeHtmlServer(opts.subtitle)}</p>
    <div style="background:#090e1a;border:1px solid #1e293b;border-radius:12px;padding:6px 16px;margin-bottom:24px;">
      ${detailRows}
    </div>
    <div style="display:flex;gap:12px;align-items:center;justify-content:flex-end;">
      <a href="${returnHref}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:10px;background:#4f46e5;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;">
        Return to PrismPay Dashboard →
      </a>
    </div>
  </div>
</body>
</html>`;
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
    const liveCreds = hasPayPalCredentials(c.env);
    return c.json({
      reference_prices: REFERENCE_PRICES,
      scenarios: DEMO_SCENARIOS,
      shed_demo: {
        project: SHED_DEMO_PROJECT,
        categories: SHED_DEMO_CATEGORIES,
        proposals: SHED_DEMO_PROPOSALS,
      },
      gate_config: GATE_CONFIG,
      paypal_env: 'sandbox',
      paypal_live_credentials_configured: liveCreds,
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
      paypal_approval_flow?: boolean;
    }>();

    const goal_text = (body.goal_text ?? '').trim();
    const total_budget_cents = Math.round(Number(body.total_budget_cents ?? 0));
    const paypal_approval_flow = Boolean(body.paypal_approval_flow);

    if (!goal_text) {
      return c.json({ error: 'goal_text is required' }, 400);
    }
    if (!Number.isInteger(total_budget_cents) || total_budget_cents < 1000) {
      return c.json(
        { error: 'total_budget_cents must be an integer >= 1000 ($10.00)' },
        400
      );
    }
    if (paypal_approval_flow && !hasPayPalCredentials(c.env)) {
      return c.json(
        {
          error:
            'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).',
        },
        400
      );
    }

    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      goal_text,
      total_budget_cents,
      currency: 'USD',
      paypal_approval_flow,
      created_at: new Date().toISOString(),
    };

    await store.createProject(project);
    await store.appendAuditEvent(project.id, 'PROJECT_CREATED', {
      project_id: project.id,
      goal_text: project.goal_text,
      total_budget_cents: project.total_budget_cents,
      currency: project.currency,
      ...(paypal_approval_flow ? { paypal_approval_flow: true } : {}),
    });

    return c.json({ project }, 201);
  });

  // ===========================================================================
  // POST /api/projects/:id/approval-flow — Toggle opt-in PayPal buyer-approval mode
  // ===========================================================================
  app.post('/api/projects/:id/approval-flow', async (c) => {
    const store = resolveStore(c.env);
    const projectId = c.req.param('id');
    const project = await store.getProject(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const body = await c.req.json<{ paypal_approval_flow?: boolean }>();
    const enabled = Boolean(body.paypal_approval_flow);

    if (enabled && !hasPayPalCredentials(c.env)) {
      return c.json(
        {
          error:
            'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).',
        },
        400
      );
    }

    const updated: Project = {
      ...project,
      paypal_approval_flow: enabled,
    };
    await store.updateProject(updated);
    return c.json({ project: updated });
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

    // Aggregate spent by category from captured payments, and pending from awaiting_approval
    const spent_by_category_cents: Record<string, number> = {};
    const pending_by_category_cents: Record<string, number> = {};
    let total_pending_cents = 0;

    if (mandate) {
      for (const cat of mandate.categories) {
        spent_by_category_cents[cat.name] = 0;
        pending_by_category_cents[cat.name] = 0;
      }
    }

    for (const item of proposalsWithDetails) {
      if (item.payment && item.payment.status === 'captured') {
        const catName = item.proposal.category;
        spent_by_category_cents[catName] =
          (spent_by_category_cents[catName] ?? 0) + item.payment.amount_cents;
      } else if (item.payment && item.payment.status === 'awaiting_approval') {
        const catName = item.proposal.category;
        pending_by_category_cents[catName] =
          (pending_by_category_cents[catName] ?? 0) + item.payment.amount_cents;
        total_pending_cents += item.payment.amount_cents;
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
          const pending_cents = pending_by_category_cents[cat.name] ?? 0;
          return {
            name: cat.name,
            cap_cents: cat.cap_cents,
            spent_cents,
            pending_cents,
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
        total_pending_cents,
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
  // if PASS, create & capture PayPal sandbox order server-side (or create order
  // and return approve_url when project.paypal_approval_flow is true)
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
      if (project.paypal_approval_flow) {
        // Opt-in buyer-approval redirect flow (AC-R2, AC-R6)
        if (!hasPayPalCredentials(c.env)) {
          paymentError =
            'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET). Never faking a capture ID.';
          await store.appendAuditEvent(project.id, 'PAYMENT_FAILED', {
            proposal_id: proposal.id,
            amount_cents: proposal.quoted_price_cents,
            error: paymentError,
            flow: 'buyer_approval',
          });
          return c.json(
            {
              error: paymentError,
              proposal,
              gate_evaluation: evaluation.decision,
              reason_codes: evaluation.reason_codes,
              gates: evaluation.gates,
              summary: evaluation.summary,
              payment: null,
              payment_error: paymentError,
            },
            400
          );
        }

        try {
          const orderResult = await createPayPalOrder(
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

          payment = await store.savePayment(orderResult.payment);

          await store.appendAuditEvent(project.id, 'PAYMENT_CREATED', {
            proposal_id: proposal.id,
            payment_id: payment.id,
            paypal_order_id: payment.paypal_order_id,
            amount_cents: payment.amount_cents,
            flow: 'buyer_approval',
            approve_url: payment.approve_url,
          });
        } catch (err) {
          paymentError = err instanceof Error ? err.message : String(err);
          await store.updateProposalDecision(proposal.id, 'PASS');
          await store.appendAuditEvent(project.id, 'PAYMENT_FAILED', {
            proposal_id: proposal.id,
            amount_cents: proposal.quoted_price_cents,
            error: paymentError,
            flow: 'buyer_approval',
          });
        }
      } else {
        // Default flag-OFF path: untouched combined create-and-capture
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
    }

    return c.json(
      {
        proposal,
        gate_evaluation: evaluation.decision,
        reason_codes: evaluation.reason_codes,
        gates: evaluation.gates,
        summary: evaluation.summary,
        payment,
        ...(payment?.approve_url ? { approve_url: payment.approve_url } : {}),
        payment_error: paymentError,
      },
      201
    );
  });

  // ===========================================================================
  // POST /api/proposals/:id/approve — Owner approves an ESCALATE proposal
  // (or retries a cancelled PASS/approved proposal), then pays via PayPal Sandbox
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

    const existingPayment = await store.getPaymentByProposal(proposal.id);

    if (proposal.decision === 'paid' && existingPayment?.status === 'captured') {
      return c.json({
        proposal,
        gates,
        payment: existingPayment,
        message: 'Proposal is already paid.',
      });
    }

    const isRetryAfterCancel =
      proposal.decision === 'PASS' && existingPayment?.status === 'cancelled';

    if (
      proposal.decision !== 'ESCALATE' &&
      proposal.decision !== 'approved' &&
      !isRetryAfterCancel
    ) {
      return c.json(
        {
          error: `Cannot approve proposal in state "${proposal.decision}". Only ESCALATE proposals can be approved.`,
        },
        400
      );
    }

    const project = await store.getProject(proposal.project_id);

    if (!isRetryAfterCancel) {
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
    }

    if (project?.paypal_approval_flow) {
      if (!hasPayPalCredentials(c.env)) {
        const paymentError =
          'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET). Never faking a capture ID.';
        await store.appendAuditEvent(proposal.project_id, 'PAYMENT_FAILED', {
          proposal_id: proposal.id,
          amount_cents: proposal.quoted_price_cents,
          error: paymentError,
          flow: 'buyer_approval',
        });
        return c.json({ error: paymentError, proposal, gates }, 400);
      }

      try {
        const orderResult = await createPayPalOrder(
          {
            proposal_id: proposal.id,
            project_id: proposal.project_id,
            mandate_id: proposal.mandate_id,
            amount_cents: proposal.quoted_price_cents,
            item_name: proposal.item_name,
            vendor: proposal.vendor,
            verified_decision: isRetryAfterCancel ? 'PASS' : 'approved',
          },
          c.env ?? {},
          existingPayment
        );

        const payment = await store.savePayment(orderResult.payment);

        await store.appendAuditEvent(proposal.project_id, 'PAYMENT_CREATED', {
          proposal_id: proposal.id,
          payment_id: payment.id,
          paypal_order_id: payment.paypal_order_id,
          amount_cents: payment.amount_cents,
          flow: 'buyer_approval',
          approve_url: payment.approve_url,
        });

        return c.json({
          proposal,
          gates,
          payment,
          approve_url: payment.approve_url,
        });
      } catch (err) {
        const paymentError = err instanceof Error ? err.message : String(err);
        if (!isRetryAfterCancel) {
          await store.updateProposalDecision(proposal.id, 'ESCALATE');
          proposal.decision = 'ESCALATE';
        }
        await store.appendAuditEvent(proposal.project_id, 'PAYMENT_FAILED', {
          proposal_id: proposal.id,
          amount_cents: proposal.quoted_price_cents,
          error: paymentError,
          flow: 'buyer_approval',
        });
        return c.json({ error: paymentError, proposal, gates }, 502);
      }
    }

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
  // GET /paypal/return — Buyer approved on PayPal Sandbox; capture order (AC-R3, AC-R7)
  // ===========================================================================
  app.get('/paypal/return', async (c) => {
    const store = resolveStore(c.env);
    const orderId = (c.req.query('token') ?? c.req.query('order_id') ?? '').trim();
    const wantsJson =
      c.req.query('format') === 'json' ||
      (c.req.header('Accept') ?? '').includes('application/json');

    if (!orderId) {
      if (wantsJson) {
        return c.json({ error: 'Missing PayPal order token query parameter' }, 400);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Missing Order Token',
          badgeText: 'Invalid Return Link',
          badgeColor: 'rose',
          heading: 'Missing PayPal Order Token',
          subtitle: 'No ?token=<order_id> parameter was provided on the return URL.',
          details: [],
        }),
        400
      );
    }

    const payment = await store.getPaymentByOrderId(orderId);
    if (!payment) {
      if (wantsJson) {
        return c.json({ error: `Payment for PayPal order ${orderId} not found` }, 404);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Order Not Found',
          badgeText: 'Order Not Found',
          badgeColor: 'rose',
          heading: 'PayPal Order Not Found',
          subtitle: `Could not locate a PrismPay payment record for order ${orderId}.`,
          details: [{ label: 'PayPal Order ID', value: orderId, mono: true }],
        }),
        404
      );
    }

    const found = await store.getProposal(payment.proposal_id);
    if (!found) {
      if (wantsJson) {
        return c.json({ error: `Proposal ${payment.proposal_id} not found` }, 404);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Proposal Not Found',
          badgeText: 'Proposal Not Found',
          badgeColor: 'rose',
          heading: 'Proposal Record Not Found',
          subtitle: `Could not locate proposal ${payment.proposal_id}.`,
          details: [{ label: 'PayPal Order ID', value: orderId, mono: true }],
        }),
        404
      );
    }

    const { proposal } = found;

    // AC-R7 Idempotency: if already captured, do not double-capture or duplicate audit events
    if (payment.status === 'captured' && payment.paypal_capture_id) {
      if (wantsJson) {
        return c.json({
          status: 'captured',
          already_captured: true,
          payment,
          proposal,
        });
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Payment Captured',
          badgeText: 'Payment Captured',
          badgeColor: 'emerald',
          heading: 'Payment captured — return to PrismPay',
          subtitle:
            'This PayPal Sandbox order has already been captured and recorded on the hash-chained audit ledger.',
          details: [
            { label: 'Item', value: proposal.item_name },
            { label: 'Vendor', value: proposal.vendor },
            {
              label: 'Amount',
              value: `$${(payment.amount_cents / 100).toFixed(2)} USD`,
            },
            { label: 'PayPal Order ID', value: payment.paypal_order_id, mono: true },
            {
              label: 'PayPal Capture ID',
              value: payment.paypal_capture_id,
              mono: true,
            },
          ],
          projectId: proposal.project_id,
        })
      );
    }

    try {
      const captureResult = await capturePayPalOrder(orderId, c.env ?? {});
      const capturedPayment: Payment = {
        ...payment,
        paypal_capture_id: captureResult.capture_id,
        status: 'captured',
        mode: 'sandbox_live',
      };

      await store.savePayment(capturedPayment);
      await store.updateProposalDecision(proposal.id, 'paid');
      proposal.decision = 'paid';

      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_BUYER_APPROVED', {
        proposal_id: proposal.id,
        payment_id: capturedPayment.id,
        paypal_order_id: capturedPayment.paypal_order_id,
        amount_cents: capturedPayment.amount_cents,
        flow: 'buyer_approval',
      });

      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_CAPTURED', {
        proposal_id: proposal.id,
        payment_id: capturedPayment.id,
        paypal_order_id: capturedPayment.paypal_order_id,
        paypal_capture_id: capturedPayment.paypal_capture_id,
        amount_cents: capturedPayment.amount_cents,
        mode: capturedPayment.mode,
        flow: 'buyer_approval',
      });

      if (wantsJson) {
        return c.json({
          status: 'captured',
          already_captured: captureResult.already_captured,
          payment: capturedPayment,
          proposal,
        });
      }

      return c.html(
        renderPayPalRedirectPage({
          title: 'Payment Captured',
          badgeText: 'Payment Captured',
          badgeColor: 'emerald',
          heading: 'Payment captured — return to PrismPay',
          subtitle:
            'Buyer approval verified and PayPal Orders v2 capture completed. Your project budget and cryptographic audit trail have been updated.',
          details: [
            { label: 'Item', value: proposal.item_name },
            { label: 'Vendor', value: proposal.vendor },
            {
              label: 'Amount',
              value: `$${(capturedPayment.amount_cents / 100).toFixed(2)} USD`,
            },
            {
              label: 'PayPal Order ID',
              value: capturedPayment.paypal_order_id,
              mono: true,
            },
            {
              label: 'PayPal Capture ID',
              value: capturedPayment.paypal_capture_id ?? '',
              mono: true,
            },
          ],
          projectId: proposal.project_id,
        })
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_FAILED', {
        proposal_id: proposal.id,
        payment_id: payment.id,
        paypal_order_id: payment.paypal_order_id,
        amount_cents: payment.amount_cents,
        error: errorMsg,
        flow: 'buyer_approval',
      });

      if (wantsJson) {
        return c.json({ error: errorMsg, payment, proposal }, 502);
      }

      return c.html(
        renderPayPalRedirectPage({
          title: 'Capture Failed',
          badgeText: 'Capture Failed',
          badgeColor: 'rose',
          heading: 'PayPal Capture Failed',
          subtitle: errorMsg,
          details: [
            { label: 'Item', value: proposal.item_name },
            { label: 'PayPal Order ID', value: payment.paypal_order_id, mono: true },
          ],
          projectId: proposal.project_id,
        }),
        502
      );
    }
  });

  // ===========================================================================
  // GET /paypal/cancel — Buyer cancelled on PayPal Sandbox (AC-R4)
  // ===========================================================================
  app.get('/paypal/cancel', async (c) => {
    const store = resolveStore(c.env);
    const orderId = (c.req.query('token') ?? c.req.query('order_id') ?? '').trim();
    const wantsJson =
      c.req.query('format') === 'json' ||
      (c.req.header('Accept') ?? '').includes('application/json');

    if (!orderId) {
      if (wantsJson) {
        return c.json({ error: 'Missing PayPal order token query parameter' }, 400);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Missing Order Token',
          badgeText: 'Invalid Cancel Link',
          badgeColor: 'rose',
          heading: 'Missing PayPal Order Token',
          subtitle: 'No ?token=<order_id> parameter was provided on the cancel URL.',
          details: [],
        }),
        400
      );
    }

    const payment = await store.getPaymentByOrderId(orderId);
    if (!payment) {
      if (wantsJson) {
        return c.json({ error: `Payment for PayPal order ${orderId} not found` }, 404);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Order Not Found',
          badgeText: 'Order Not Found',
          badgeColor: 'rose',
          heading: 'PayPal Order Not Found',
          subtitle: `Could not locate a PrismPay payment record for order ${orderId}.`,
          details: [{ label: 'PayPal Order ID', value: orderId, mono: true }],
        }),
        404
      );
    }

    const found = await store.getProposal(payment.proposal_id);
    if (!found) {
      if (wantsJson) {
        return c.json({ error: `Proposal ${payment.proposal_id} not found` }, 404);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Proposal Not Found',
          badgeText: 'Proposal Not Found',
          badgeColor: 'rose',
          heading: 'Proposal Record Not Found',
          subtitle: `Could not locate proposal ${payment.proposal_id}.`,
          details: [{ label: 'PayPal Order ID', value: orderId, mono: true }],
        }),
        404
      );
    }

    const { proposal } = found;

    if (payment.status === 'captured') {
      if (wantsJson) {
        return c.json({ error: 'Payment is already captured and cannot be cancelled', payment }, 409);
      }
      return c.html(
        renderPayPalRedirectPage({
          title: 'Already Captured',
          badgeText: 'Already Captured',
          badgeColor: 'emerald',
          heading: 'Payment already captured — return to PrismPay',
          subtitle: 'This order was already captured and cannot be cancelled.',
          details: [
            { label: 'PayPal Order ID', value: payment.paypal_order_id, mono: true },
            { label: 'PayPal Capture ID', value: payment.paypal_capture_id ?? '', mono: true },
          ],
          projectId: proposal.project_id,
        }),
        409
      );
    }

    let cancelledPayment = payment;
    if (payment.status !== 'cancelled') {
      cancelledPayment = {
        ...payment,
        status: 'cancelled',
      };
      await store.savePayment(cancelledPayment);
      await store.appendAuditEvent(proposal.project_id, 'PAYMENT_FAILED', {
        proposal_id: proposal.id,
        payment_id: cancelledPayment.id,
        paypal_order_id: cancelledPayment.paypal_order_id,
        amount_cents: cancelledPayment.amount_cents,
        reason: 'buyer_cancelled',
        flow: 'buyer_approval',
      });
    }

    if (wantsJson) {
      return c.json({
        status: 'cancelled',
        payment: cancelledPayment,
        proposal,
      });
    }

    return c.html(
      renderPayPalRedirectPage({
        title: 'Payment Cancelled',
        badgeText: 'Buyer Cancelled',
        badgeColor: 'amber',
        heading: 'PayPal approval cancelled — return to PrismPay',
        subtitle:
          'No funds were captured and your project budget is unchanged. This proposal remains eligible to be paid again.',
        details: [
          { label: 'Item', value: proposal.item_name },
          { label: 'Vendor', value: proposal.vendor },
          {
            label: 'Amount',
            value: `$${(cancelledPayment.amount_cents / 100).toFixed(2)} USD`,
          },
          {
            label: 'PayPal Order ID',
            value: cancelledPayment.paypal_order_id,
            mono: true,
          },
          { label: 'Status', value: 'Cancelled (Re-payable)' },
        ],
        projectId: proposal.project_id,
      })
    );
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
      .json<{ sign_immediately?: boolean; paypal_approval_flow?: boolean }>()
      .catch(() => ({ sign_immediately: false, paypal_approval_flow: false }));

    const paypal_approval_flow = Boolean(body.paypal_approval_flow);
    if (paypal_approval_flow && !hasPayPalCredentials(c.env)) {
      return c.json(
        {
          error:
            'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).',
        },
        400
      );
    }

    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      goal_text: SHED_DEMO_PROJECT.goal_text,
      total_budget_cents: SHED_DEMO_PROJECT.total_budget_cents,
      currency: 'USD',
      paypal_approval_flow,
      created_at: new Date().toISOString(),
    };

    await store.createProject(project);
    await store.appendAuditEvent(project.id, 'PROJECT_CREATED', {
      project_id: project.id,
      goal_text: project.goal_text,
      total_budget_cents: project.total_budget_cents,
      currency: project.currency,
      ...(paypal_approval_flow ? { paypal_approval_flow: true } : {}),
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
  // POST /api/demo/scenario/:id — Load any pre-configured scenario (Shed, Kitchen, Maker)
  // ===========================================================================
  app.post('/api/demo/scenario/:id', async (c) => {
    const store = resolveStore(c.env);
    const scenarioId = c.req.param('id');
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId) ?? DEMO_SCENARIOS[0];
    const body = await c.req
      .json<{ paypal_approval_flow?: boolean }>()
      .catch(() => ({ paypal_approval_flow: false }));

    const paypal_approval_flow = Boolean(body.paypal_approval_flow);
    if (paypal_approval_flow && !hasPayPalCredentials(c.env)) {
      return c.json(
        {
          error:
            'PAYPAL_CREDENTIALS_REQUIRED: Real PayPal buyer-approval flow requires live PayPal Sandbox credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).',
        },
        400
      );
    }

    const project: Project = {
      id: `proj-${scenario.id}-${crypto.randomUUID().slice(0, 6)}`,
      goal_text: scenario.project.goal_text,
      total_budget_cents: scenario.project.total_budget_cents,
      currency: 'USD',
      paypal_approval_flow,
      created_at: new Date().toISOString(),
    };

    await store.createProject(project);
    await store.appendAuditEvent(project.id, 'PROJECT_CREATED', {
      project_id: project.id,
      goal_text: project.goal_text,
      total_budget_cents: project.total_budget_cents,
      currency: project.currency,
      scenario_id: scenario.id,
      ...(paypal_approval_flow ? { paypal_approval_flow: true } : {}),
    });

    const categories = scenario.categories.map((cat) => ({ ...cat }));
    await store.appendAuditEvent(project.id, 'BREAKDOWN_PROPOSED', {
      project_id: project.id,
      source: 'scenario_seed',
      model_used: 'prismpay-planner-v1',
      category_count: categories.length,
      total_budget_cents: project.total_budget_cents,
      categories,
    });

    const sha256_hash = await computeMandateHash({
      project_id: project.id,
      version: 1,
      total_budget_cents: project.total_budget_cents,
      categories,
    });

    const mandate: Mandate = {
      id: `mnd-${crypto.randomUUID().slice(0, 8)}`,
      project_id: project.id,
      version: 1,
      categories,
      total_budget_cents: project.total_budget_cents,
      owner_label: `Owner (${scenario.name})`,
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

    return c.json(
      {
        scenario,
        project,
        categories,
        mandate,
        proposals: scenario.proposals,
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
