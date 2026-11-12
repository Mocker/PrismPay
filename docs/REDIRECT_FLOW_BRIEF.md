# Brief: Real PayPal Buyer-Approval Redirect Flow (HELD — post-submission polish)

**Status: BRANCH WORK AUTHORIZED (Ryan, 2026-11-12 09:07 PST).** Coding agents
may build on a branch/worktree in parallel with the Devpost submission work.
**Merge and deploy remain held:** merge only on Ryan's explicit say-so, deploy
only after the Devpost submission is confirmed in and before the 11:30 AM
deadline guard below. Owner of this brief: Muse (scope/review). Builders:
Antigravity coding agents, directly on this repo.

## Why

PrismPay is live at https://prismpay.sokercap.workers.dev with real PayPal sandbox
credentials configured (verified 2026-11-12: `/api/meta` →
`paypal_live_credentials_configured: true`). Today a PASS payment:

1. Creates a **real** sandbox order via Orders v2 (`src/paypal.ts`) — real order
   IDs, e.g. `34U36939F4287090F` from the 2026-11-12 smoke test.
2. Immediately attempts server-side capture, which PayPal rejects with
   `422 ORDER_NOT_APPROVED` because no buyer ever approved the order.
3. Falls back to recording a deterministic `SBX-CAP-…` capture receipt with
   `mode: sandbox_live`. Disclosed in the README; acceptable under the
   hackathon's "sandbox acceptable" rule, but it is not a completed capture.

This brief adds the missing middle steps — buyer approval on PayPal, redirect
back, then a real capture — so a payment can complete end-to-end with a genuine
PayPal capture ID.

## Design rule: additive and opt-in, default flow untouched

The demo video is recorded against the current one-click flow. The redirect
flow must therefore be an **opt-in per-project mode**, never a replacement:

- New project/demo flag: `paypal_approval_flow: boolean` (default `false`).
  A visible UI toggle: "Real PayPal approval flow (sandbox buyer login required)".
- Flag OFF → behavior is byte-for-byte the current behavior. All existing tests
  pass unmodified.
- Flag ON + live credentials present → the flow below.
- Flag ON + no credentials → the toggle is disabled in the UI with an
  explanation; the API rejects the mode with a clear error. **Never** fake a
  real capture ID.

## Flow spec (flag ON, credentials present)

1. Proposal evaluates PASS (or ESCALATE → owner approval), exactly as today.
   Principle 3 is unchanged: **no order is created for any other decision.**
2. `paypal.ts`: create the order with
   `payment_source.paypal.experience_context` extended with
   `return_url` and `cancel_url` (below). Split the current combined
   create-and-capture function into `createPayPalOrder()` and
   `capturePayPalOrder(orderId)`; keep the existing combined function as the
   flag-OFF path.
   - `return_url`: `https://prismpay.sokercap.workers.dev/paypal/return`
   - `cancel_url`: `https://prismpay.sokercap.workers.dev/paypal/cancel`
3. Persist a `Payment` with `status: 'awaiting_approval'`, the real
   `paypal_order_id`, **no capture ID yet** (`paypal_capture_id` becomes
   optional), and the approve URL taken from the order response link with
   `rel: 'payer-action'`. Audit: `PAYMENT_CREATED` (payload notes
   `flow: 'buyer_approval'`).
4. The proposal response and UI show an **"Approve on PayPal (sandbox)"**
   button linking to the approve URL in a new tab. Dashboard counts the
   amount as *pending*, not spent — spent totals only move on capture.
5. Buyer approves on PayPal's sandbox site (sandbox **buyer/personal**
   account) → PayPal redirects to `/paypal/return?token=<order_id>`.
   - The return route looks up the payment by order ID, calls capture
     server-side, and on success stores the **real** capture ID,
     `status: 'captured'`, `mode: 'sandbox_live'`. Audit: new event type
     `PAYMENT_BUYER_APPROVED` may be added, plus `PAYMENT_CAPTURED`.
   - The return route renders a small confirmation page ("Payment captured —
     return to PrismPay") linking back to the project.
   - Idempotency: a refreshed/repeated return hit must not double-capture.
     If PayPal reports the order already captured, fetch the order, reconcile
     the stored capture ID, and show the same confirmation.
6. Buyer cancels → `/paypal/cancel?token=<order_id>` marks the payment
   `status: 'cancelled'`, audit `PAYMENT_FAILED` (payload
   `reason: 'buyer_cancelled'`), and the proposal becomes payable again
   (a fresh proposal/order is allowed; the cancelled payment does not trip
   the idempotency guard).

## Workstreams

- **W1 `src/paypal.ts`** — split create/capture; parse `links` for
  `payer-action`; experience_context return/cancel URLs. No change to the
  flag-OFF combined path.
- **W2 `src/types.ts` + `src/storage.ts`** — `Payment.status` gains
  `'awaiting_approval' | 'cancelled'`; `paypal_capture_id` optional;
  project flag stored; lookup of a payment by `paypal_order_id`.
- **W3 `src/index.ts`** — proposal endpoint branches on the flag;
  `GET /paypal/return` and `GET /paypal/cancel` routes; project/demo
  creation accepts the flag.
- **W4 `src/ui.ts`** — toggle at project/demo setup; approve button +
  pending state on proposals; dashboard pending vs spent display.
- **W5 `tests/`** — new tests per the acceptance criteria; mocked PayPal
  fetch, no live calls in the test suite.
- **W6 `README.md`** — update the capture-caveat paragraph **only after**
  the feature is deployed and smoke-verified.

## Acceptance criteria

- **AC-R1** Flag OFF: full existing suite passes unmodified; live behavior
  identical to today (incl. the trap DENY with its four reason codes).
- **AC-R2** Flag ON + creds: a PASS proposal creates a real order, returns an
  approve URL, persists `awaiting_approval`, attempts **no** capture, and
  the dashboard spent total does not move.
- **AC-R3** After buyer approval, the return route captures and stores a real
  PayPal capture ID (not `SBX-CAP-…`); dashboard spent updates; the audit
  chain verifies.
- **AC-R4** Cancel path: payment `cancelled`, proposal re-payable, audit
  chain verifies.
- **AC-R5** Flag ON or OFF, a DENY (the $920 trap) creates **no** PayPal
  order and no payment record.
- **AC-R6** Flag ON + no creds: UI toggle disabled with explanation; API
  rejects approval-mode payment attempts with a clear error.
- **AC-R7** Double-hit of the return URL: exactly one capture; second hit
  reconciles and re-displays confirmation.
- **AC-R8** `npm test` green and `tsc --noEmit` clean, as with the base build.

## Process gates (all mandatory)

1. **Branch** `feature/paypal-buyer-approval` → **PR** with what/why + test
   evidence. No direct pushes to `main`. Ryan merges (his 1-tap) — nobody
   else merges.
2. **No changes** to `src/gates.ts` thresholds, mandate hashing, or the
   flag-OFF payment path. No secrets in the repo, ever.
3. After merge, **Muse deploys** (wrangler, same flow as PR #1) and runs the
   live smoke: flag-OFF regression first, then flag-ON order creation.
4. The final end-to-end approval click needs a human at a browser with the
   sandbox **buyer** account (developer.paypal.com → Testing Tools →
   Sandbox Accounts → the Personal account). That tap is Ryan's.
5. **Abort rule:** any failing gate above → PR closes unmerged, the live
   Worker stays on the current verified version, and the README caveat
   stays as-is. The submission is already in by then; this is polish, and
   it must never put the submitted demo at risk.
6. **Deadline guard:** no deploy after **11:30 AM PST, Thu Nov 12, 2026**.
   If the window is missed, the deploy decision returns to Ryan (judging
   runs Dec 1–15; the demo must stay live and working until winners are
   announced Dec 21).

## Out of scope

- Live (non-sandbox) PayPal, real money, webhooks, vaulted payment methods,
  mandate-amendment UI, per-event KV audit keys (separate follow-up).
