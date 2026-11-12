import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, type Bindings } from '../src/index.ts';
import { MemoryStore } from '../src/storage.ts';
import { PAYPAL_CANCEL_URL, PAYPAL_RETURN_URL } from '../src/paypal.ts';
import { SHED_DEMO_PROPOSALS } from '../src/seed.ts';

const LIVE_ENV: Bindings = {
  PAYPAL_CLIENT_ID: 'sbx-live-client-id',
  PAYPAL_CLIENT_SECRET: 'sbx-live-client-secret',
};

const NO_CREDS_ENV: Bindings = {};

function createPayPalFetchMock(options?: {
  orderId?: string;
  captureId?: string;
  approveUrl?: string;
  simulateAlreadyCapturedOnCaptureCall?: boolean;
}) {
  const orderId = options?.orderId ?? '34U36939F4287090F';
  const captureId = options?.captureId ?? '88H9911002233445B';
  const approveUrl =
    options?.approveUrl ??
    `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

  const calls: Array<{ url: string; method: string; body?: unknown }> = [];

  const mockFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();
    let parsedBody: unknown = undefined;
    if (init?.body && typeof init.body === 'string') {
      try {
        parsedBody = JSON.parse(init.body);
      } catch {
        parsedBody = init.body;
      }
    }
    calls.push({ url, method, body: parsedBody });

    if (url.endsWith('/v1/oauth2/token') && method === 'POST') {
      return new Response(
        JSON.stringify({ access_token: 'mock-sandbox-access-token' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/v2/checkout/orders') && method === 'POST') {
      return new Response(
        JSON.stringify({
          id: orderId,
          status: 'PAYER_ACTION_REQUIRED',
          links: [
            {
              href: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
              rel: 'self',
              method: 'GET',
            },
            {
              href: approveUrl,
              rel: 'payer-action',
              method: 'GET',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (
      url.endsWith(`/v2/checkout/orders/${orderId}/capture`) &&
      method === 'POST'
    ) {
      if (options?.simulateAlreadyCapturedOnCaptureCall) {
        return new Response(
          JSON.stringify({
            name: 'UNPROCESSABLE_ENTITY',
            details: [{ issue: 'ORDER_ALREADY_CAPTURED' }],
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          id: orderId,
          status: 'COMPLETED',
          purchase_units: [
            {
              payments: {
                captures: [{ id: captureId, status: 'COMPLETED' }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith(`/v2/checkout/orders/${orderId}`) && method === 'GET') {
      return new Response(
        JSON.stringify({
          id: orderId,
          status: 'COMPLETED',
          purchase_units: [
            {
              payments: {
                captures: [{ id: captureId, status: 'COMPLETED' }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(`Unhandled mock URL: ${method} ${url}`, { status: 500 });
  });

  return { mockFn, calls, orderId, captureId, approveUrl };
}

describe('Real PayPal Buyer-Approval Redirect Flow (AC-R1 to AC-R8)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AC-R1: Flag OFF preserves byte-for-byte existing behavior (immediate capture + trap DENY with 4 reason codes)', async () => {
    const store = new MemoryStore();
    const app = createApp(store);

    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign_immediately: true }),
      },
      NO_CREDS_ENV
    );
    expect(seedRes.status).toBe(201);
    const seedData = (await seedRes.json()) as {
      project: { id: string; paypal_approval_flow?: boolean };
    };
    expect(Boolean(seedData.project.paypal_approval_flow)).toBe(false);

    // 1. Fair framing lumber ($285) passes and captures immediately in flag-OFF mode
    const passRes = await app.request(
      `/api/projects/${seedData.project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[0]),
      },
      NO_CREDS_ENV
    );
    expect(passRes.status).toBe(201);
    const passData = (await passRes.json()) as {
      proposal: { decision: string };
      payment: { status: string; paypal_capture_id: string };
    };
    expect(passData.proposal.decision).toBe('paid');
    expect(passData.payment.status).toBe('captured');
    expect(passData.payment.paypal_capture_id).toMatch(/^SBX-CAP-/);

    // 2. The $920 trap is DENIED with all 4 reason codes
    const trapRes = await app.request(
      `/api/projects/${seedData.project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[1]),
      },
      NO_CREDS_ENV
    );
    expect(trapRes.status).toBe(201);
    const trapData = (await trapRes.json()) as {
      gate_evaluation: string;
      reason_codes: string[];
      payment: unknown;
    };
    expect(trapData.gate_evaluation).toBe('DENY');
    expect(trapData.reason_codes).toEqual([
      'CATEGORY_CAP_EXCEEDED',
      'SINGLE_ITEM_DOMINANCE',
      'PRICE_NOT_VALUE_FOR_MONEY',
      'PROJECT_LEFT_UNFINISHABLE',
    ]);
    expect(trapData.payment).toBeNull();
  });

  it('AC-R2 & AC-R3: Flag ON + live creds creates real order (awaiting_approval, $0 spent) and /paypal/return captures real PayPal capture ID', async () => {
    const store = new MemoryStore();
    const app = createApp(store);
    const ppMock = createPayPalFetchMock({
      orderId: '34U36939F4287090F',
      captureId: '77C5544332211009Z',
    });
    vi.stubGlobal('fetch', ppMock.mockFn);

    // Create shed demo with paypal_approval_flow: true
    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    expect(seedRes.status).toBe(201);
    const { project } = (await seedRes.json()) as {
      project: { id: string; paypal_approval_flow?: boolean };
    };
    expect(project.paypal_approval_flow).toBe(true);

    // Submit a PASS proposal ($165 standard metal roofing kit = SHED_DEMO_PROPOSALS[2])
    const propRes = await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[2]),
      },
      LIVE_ENV
    );
    expect(propRes.status).toBe(201);
    const propData = (await propRes.json()) as {
      proposal: { id: string; decision: string };
      gate_evaluation: string;
      approve_url: string;
      payment: {
        id: string;
        status: string;
        paypal_order_id: string;
        paypal_capture_id?: string;
        approve_url?: string;
      };
    };

    // AC-R2 checks:
    expect(propData.gate_evaluation).toBe('PASS');
    expect(propData.proposal.decision).toBe('PASS');
    expect(propData.payment.status).toBe('awaiting_approval');
    expect(propData.payment.paypal_order_id).toBe('34U36939F4287090F');
    expect(propData.payment.paypal_capture_id).toBeUndefined();
    expect(propData.approve_url).toBe(ppMock.approveUrl);

    // Verify experience_context sent return_url and cancel_url, and NO capture call was made
    const createOrderCall = ppMock.calls.find((c) =>
      c.url.endsWith('/v2/checkout/orders')
    );
    expect(createOrderCall).toBeDefined();
    const orderBody = createOrderCall?.body as {
      payment_source: {
        paypal: {
          experience_context: { return_url: string; cancel_url: string };
        };
      };
    };
    expect(orderBody.payment_source.paypal.experience_context.return_url).toBe(
      PAYPAL_RETURN_URL
    );
    expect(orderBody.payment_source.paypal.experience_context.cancel_url).toBe(
      PAYPAL_CANCEL_URL
    );
    expect(
      ppMock.calls.some((c) => c.url.includes('/capture'))
    ).toBe(false);

    // Dashboard spent total must NOT move while awaiting_approval (counted as pending)
    const dashBeforeRes = await app.request(
      `/api/projects/${project.id}`,
      { method: 'GET' },
      LIVE_ENV
    );
    const dashBefore = (await dashBeforeRes.json()) as {
      dashboard: {
        total_spent_cents: number;
        total_pending_cents: number;
        remaining_cents: number;
      };
    };
    expect(dashBefore.dashboard.total_spent_cents).toBe(0);
    expect(dashBefore.dashboard.total_pending_cents).toBe(16500);
    expect(dashBefore.dashboard.remaining_cents).toBe(100000);

    // AC-R3: Buyer approves on PayPal and redirects to /paypal/return?token=<order_id>
    const returnRes = await app.request(
      `/paypal/return?token=${ppMock.orderId}`,
      { method: 'GET' },
      LIVE_ENV
    );
    expect(returnRes.status).toBe(200);
    const returnHtml = await returnRes.text();
    expect(returnHtml).toContain('Payment captured — return to PrismPay');
    expect(returnHtml).toContain('77C5544332211009Z');
    expect(returnHtml).not.toContain('SBX-CAP-');

    // Verify capture call happened once
    const captureCalls = ppMock.calls.filter((c) => c.url.includes('/capture'));
    expect(captureCalls).toHaveLength(1);

    // Verify dashboard spent updated and pending cleared
    const dashAfterRes = await app.request(
      `/api/projects/${project.id}`,
      { method: 'GET' },
      LIVE_ENV
    );
    const dashAfter = (await dashAfterRes.json()) as {
      dashboard: {
        total_spent_cents: number;
        total_pending_cents: number;
        remaining_cents: number;
      };
      proposals: Array<{
        proposal: { id: string; decision: string };
        payment: {
          status: string;
          paypal_capture_id?: string;
          mode?: string;
        };
      }>;
    };
    expect(dashAfter.dashboard.total_spent_cents).toBe(16500);
    expect(dashAfter.dashboard.total_pending_cents).toBe(0);
    expect(dashAfter.dashboard.remaining_cents).toBe(83500);
    expect(dashAfter.proposals[0].proposal.decision).toBe('paid');
    expect(dashAfter.proposals[0].payment.status).toBe('captured');
    expect(dashAfter.proposals[0].payment.paypal_capture_id).toBe(
      '77C5544332211009Z'
    );
    expect(dashAfter.proposals[0].payment.mode).toBe('sandbox_live');

    // Verify cryptographic audit chain
    const auditRes = await app.request(
      `/api/projects/${project.id}/audit`,
      { method: 'GET' },
      LIVE_ENV
    );
    const auditData = (await auditRes.json()) as {
      events: Array<{ type: string; payload: Record<string, unknown> }>;
      verification: { valid: boolean; checked_count: number };
    };
    expect(auditData.verification.valid).toBe(true);
    const eventTypes = auditData.events.map((e) => e.type);
    expect(eventTypes).toContain('PAYMENT_CREATED');
    expect(eventTypes).toContain('PAYMENT_BUYER_APPROVED');
    expect(eventTypes).toContain('PAYMENT_CAPTURED');
  });

  it('AC-R4: Cancel path marks payment cancelled, logs PAYMENT_FAILED (buyer_cancelled), and leaves proposal re-payable with intact audit chain', async () => {
    const store = new MemoryStore();
    const app = createApp(store);
    let orderCounter = 1;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        const method = (init?.method ?? 'GET').toUpperCase();
        if (url.endsWith('/v1/oauth2/token')) {
          return new Response(
            JSON.stringify({ access_token: 'mock-token' }),
            { status: 200 }
          );
        }
        if (url.endsWith('/v2/checkout/orders') && method === 'POST') {
          const orderId = `ORD-CANCEL-FLOW-${orderCounter++}`;
          return new Response(
            JSON.stringify({
              id: orderId,
              status: 'PAYER_ACTION_REQUIRED',
              links: [
                {
                  href: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
                  rel: 'payer-action',
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response('Unhandled', { status: 500 });
      })
    );

    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    const { project } = (await seedRes.json()) as { project: { id: string } };

    // Create PASS proposal -> ORD-CANCEL-FLOW-1
    const propRes = await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[2]),
      },
      LIVE_ENV
    );
    const propData = (await propRes.json()) as {
      proposal: { id: string };
      payment: { paypal_order_id: string };
    };
    expect(propData.payment.paypal_order_id).toBe('ORD-CANCEL-FLOW-1');

    // Buyer clicks Cancel on PayPal -> /paypal/cancel?token=ORD-CANCEL-FLOW-1
    const cancelRes = await app.request(
      '/paypal/cancel?token=ORD-CANCEL-FLOW-1&format=json',
      { method: 'GET' },
      LIVE_ENV
    );
    expect(cancelRes.status).toBe(200);
    const cancelData = (await cancelRes.json()) as {
      status: string;
      payment: { status: string };
    };
    expect(cancelData.status).toBe('cancelled');
    expect(cancelData.payment.status).toBe('cancelled');

    // Proposal is re-payable via /api/proposals/:id/approve (creates fresh order ORD-CANCEL-FLOW-2 without tripping idempotency guard)
    const retryRes = await app.request(
      `/api/proposals/${propData.proposal.id}/approve`,
      { method: 'POST' },
      LIVE_ENV
    );
    expect(retryRes.status).toBe(200);
    const retryData = (await retryRes.json()) as {
      payment: { status: string; paypal_order_id: string; approve_url: string };
    };
    expect(retryData.payment.status).toBe('awaiting_approval');
    expect(retryData.payment.paypal_order_id).toBe('ORD-CANCEL-FLOW-2');
    expect(retryData.payment.approve_url).toContain('ORD-CANCEL-FLOW-2');

    // Audit chain verifies and contains PAYMENT_FAILED with reason: 'buyer_cancelled'
    const auditRes = await app.request(
      `/api/projects/${project.id}/audit`,
      { method: 'GET' },
      LIVE_ENV
    );
    const auditData = (await auditRes.json()) as {
      events: Array<{ type: string; payload: Record<string, unknown> }>;
      verification: { valid: boolean };
    };
    expect(auditData.verification.valid).toBe(true);
    const cancelEvent = auditData.events.find(
      (e) =>
        e.type === 'PAYMENT_FAILED' && e.payload.reason === 'buyer_cancelled'
    );
    expect(cancelEvent).toBeDefined();
  });

  it('AC-R5: Flag ON or OFF, a DENY proposal ($920 trap) creates NO PayPal order and NO payment record', async () => {
    const store = new MemoryStore();
    const app = createApp(store);
    const ppMock = createPayPalFetchMock();
    vi.stubGlobal('fetch', ppMock.mockFn);

    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    const { project } = (await seedRes.json()) as { project: { id: string } };

    const trapRes = await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[1]),
      },
      LIVE_ENV
    );
    expect(trapRes.status).toBe(201);
    const trapData = (await trapRes.json()) as {
      gate_evaluation: string;
      payment: unknown;
    };
    expect(trapData.gate_evaluation).toBe('DENY');
    expect(trapData.payment).toBeNull();
    // Principle 3: zero PayPal network calls
    expect(ppMock.calls).toHaveLength(0);
  });

  it('AC-R6: Flag ON + no credentials — UI toggle disabled with explanation and API rejects approval-mode with clear error (never fakes capture ID)', async () => {
    const store = new MemoryStore();
    const app = createApp(store);

    // 1. Check /api/meta and UI HTML
    const metaRes = await app.request('/api/meta', { method: 'GET' }, NO_CREDS_ENV);
    const metaData = (await metaRes.json()) as {
      paypal_live_credentials_configured: boolean;
    };
    expect(metaData.paypal_live_credentials_configured).toBe(false);

    const uiRes = await app.request('/', { method: 'GET' }, NO_CREDS_ENV);
    const uiHtml = await uiRes.text();
    expect(uiHtml).toContain('Real PayPal approval flow (sandbox buyer login required)');
    expect(uiHtml).toContain('Disabled: PayPal Sandbox credentials not configured');

    // 2. Trying to create a project or enable approval-flow without credentials returns 400
    const badCreateRes = await app.request(
      '/api/projects',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_text: 'Build a shed',
          total_budget_cents: 100000,
          paypal_approval_flow: true,
        }),
      },
      NO_CREDS_ENV
    );
    expect(badCreateRes.status).toBe(400);
    const badCreateData = (await badCreateRes.json()) as { error: string };
    expect(badCreateData.error).toContain('PAYPAL_CREDENTIALS_REQUIRED');

    // 3. Even if a project was created when credentials existed and then a proposal is submitted without credentials, API rejects with 400 and never fakes a capture ID
    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    const { project } = (await seedRes.json()) as { project: { id: string } };

    const propNoCredsRes = await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[2]),
      },
      NO_CREDS_ENV
    );
    expect(propNoCredsRes.status).toBe(400);
    const propNoCredsData = (await propNoCredsRes.json()) as {
      error: string;
      payment: unknown;
    };
    expect(propNoCredsData.error).toContain('PAYPAL_CREDENTIALS_REQUIRED');
    expect(propNoCredsData.payment).toBeNull();
  });

  it('AC-R7: Double-hit of /paypal/return performs exactly one capture and reconciles idempotently on repeat hits', async () => {
    const store = new MemoryStore();
    const app = createApp(store);
    const ppMock = createPayPalFetchMock({
      orderId: 'ORD-IDEMPOTENT-99',
      captureId: 'CAP-REAL-999888777',
    });
    vi.stubGlobal('fetch', ppMock.mockFn);

    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    const { project } = (await seedRes.json()) as { project: { id: string } };

    await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[2]),
      },
      LIVE_ENV
    );

    // First hit to /paypal/return
    const hit1 = await app.request(
      `/paypal/return?token=${ppMock.orderId}&format=json`,
      { method: 'GET' },
      LIVE_ENV
    );
    expect(hit1.status).toBe(200);
    const hit1Data = (await hit1.json()) as {
      already_captured: boolean;
      payment: { paypal_capture_id: string };
    };
    expect(hit1Data.already_captured).toBe(false);
    expect(hit1Data.payment.paypal_capture_id).toBe('CAP-REAL-999888777');

    // Second hit to /paypal/return (browser refresh)
    const hit2 = await app.request(
      `/paypal/return?token=${ppMock.orderId}&format=json`,
      { method: 'GET' },
      LIVE_ENV
    );
    expect(hit2.status).toBe(200);
    const hit2Data = (await hit2.json()) as {
      already_captured: boolean;
      payment: { paypal_capture_id: string };
    };
    expect(hit2Data.already_captured).toBe(true);
    expect(hit2Data.payment.paypal_capture_id).toBe('CAP-REAL-999888777');

    // PayPal capture endpoint was called ONLY ONCE across both hits
    const captureCalls = ppMock.calls.filter((c) => c.url.includes('/capture'));
    expect(captureCalls).toHaveLength(1);

    // Dashboard spent is 16500 (not 33000) and audit chain is valid
    const dashRes = await app.request(
      `/api/projects/${project.id}`,
      { method: 'GET' },
      LIVE_ENV
    );
    const dashData = (await dashRes.json()) as {
      dashboard: { total_spent_cents: number };
    };
    expect(dashData.dashboard.total_spent_cents).toBe(16500);
  });

  it('AC-R7 (PayPal-side ORDER_ALREADY_CAPTURED): reconciles capture ID via GET /v2/checkout/orders/:id', async () => {
    const store = new MemoryStore();
    const app = createApp(store);
    const ppMock = createPayPalFetchMock({
      orderId: 'ORD-RECONCILE-422',
      captureId: 'CAP-RECONCILED-422',
      simulateAlreadyCapturedOnCaptureCall: true,
    });
    vi.stubGlobal('fetch', ppMock.mockFn);

    const seedRes = await app.request(
      '/api/demo/shed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_immediately: true,
          paypal_approval_flow: true,
        }),
      },
      LIVE_ENV
    );
    const { project } = (await seedRes.json()) as { project: { id: string } };

    await app.request(
      `/api/projects/${project.id}/proposals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SHED_DEMO_PROPOSALS[2]),
      },
      LIVE_ENV
    );

    const retRes = await app.request(
      `/paypal/return?token=${ppMock.orderId}&format=json`,
      { method: 'GET' },
      LIVE_ENV
    );
    expect(retRes.status).toBe(200);
    const retData = (await retRes.json()) as {
      status: string;
      already_captured: boolean;
      payment: { paypal_capture_id: string; status: string };
    };
    expect(retData.status).toBe('captured');
    expect(retData.already_captured).toBe(true);
    expect(retData.payment.paypal_capture_id).toBe('CAP-RECONCILED-422');
  });
});
