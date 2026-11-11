# PrismPay — Build Plan for Coding Agents

Contract document: [`docs/PDD.md`](PDD.md). Deadline: **Nov 12, 2026, 12:00 PM PST**. Nothing ships that contradicts the PDD; if the PDD is wrong, flag it in the PR / issue rather than silently diverging.

## Roles

- **Ryan (owner):** repo visibility, PayPal sandbox credentials (as Worker secrets — never in chat, code, or commits), merge/deploy approvals, YouTube upload, final Devpost submit.
- **Antigravity agents:** all code, in this repo, on branches, with PRs describing what/why + test evidence.
- **Muse:** scope, this plan, and review of every PR against PDD §14 acceptance criteria. Review failures that matter most: any PayPal call reachable without a persisted gate evaluation (PDD Principle 3), any LLM involvement in a gate decision, any secret in the repo.

## Workstreams (in dependency order)

### W1 — Gate engine first (no I/O, no UI, no network)
- `GATE_CONFIG` with the PDD §7 thresholds in one place.
- Pure evaluation function: (mandate, prior payments, proposal, reference price) → decision + five `GateResult`s with reason codes.
- Unit tests reproducing the PDD §7 worked trap check and §10 proposals 1 and 3 exactly.
- **Exit gate:** tests green. Everything else is built on these numbers; do not start W3/W5 against an untested engine.

### W2 — Data + API + audit
- Entities and API per PDD §9. Storage on Workers KV or D1 (builder's choice; must persist across reloads).
- Mandate signing: canonical JSON → SHA-256, stored + returned. Tamper check (AC-2).
- Hash-chained append-only audit log with the PDD §9.2 event types.

### W3 — PayPal sandbox
- Orders API v2 create → approve → capture, server-side only, inside the proposal/approve handlers. No standalone pay endpoint.
- Idempotency per proposal; failed capture rolls the proposal back and logs `PAYMENT_FAILED`.
- **Exit gate:** proposal 1 pays end-to-end in the sandbox and the capture id is visible in the UI/audit log.

### W4 — AI breakdown + fallback
- One server-side `proposeBreakdown(goal, total)` function behind a provider-agnostic interface; schema-validated output; deterministic fix-ups (exact sum, ≥10% contingency); seeded fallback after one failed retry.
- Category suggestion for manual proposals; templated plain-English gate explanations are acceptable.

### W5 — UI (PDD §12 screens, in this order)
1. Project setup + "Load the shed demo" one-click seed.
2. Plan review & sign (editable bars, live sum, hash display).
3. Proposals list + detail with the full five-gate checklist and PASS / ESCALATE / DENY states.
4. Dashboard (category bars, spent/remaining, finishable indicator).
5. Audit log.

### W6 — Ship
- Deploy to Cloudflare Workers; judge-path walkthrough against AC-11 with no help from Ryan.
- README finalised (setup, judge path, architecture, gates, AI disclosure); confirm `LICENSE` present; confirm repo is **public**.
- Video per `docs/DEMO_SCRIPT.md`; Devpost draft filled from PDD §1–2.

## Sequencing notes under the deadline

- W1 and W2 can run in parallel only if W2 codes against the W1 interface from the PDD, not against a guessed implementation.
- If time compresses, cut in this order: audit chain verification action → proposal 4 (escalation demo) → category-suggestion for manual proposals. **Never** cut: any of the five gates, the trap flow, the PayPal capture on the PASS path, the denial's plain-English reasons, or the judge one-click demo seed.
- Money is integer cents everywhere. No floats for currency, anywhere.

## Standing rules

- Secrets only as Worker secrets / env vars. `.env.example` lists names only. A secret found in a commit stops the line until it's rotated and scrubbed.
- Fresh standalone code only — nothing copied from Anna, PRISM, or any private repo.
- Framing: "implements the open Chain of Trust pattern" — never "built on Chain of Trust".
- UI copy never claims live market prices or real-money payments.
