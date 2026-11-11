# PrismPay — Product Design Document

| Field | Value |
|---|---|
| Product | PrismPay — a budget-aware allowance gate for AI purchasing agents |
| Event | PayPal AI Hackathon (Devpost) |
| Deadline | **Thursday, November 12, 2026, 12:00 PM PST** — hard stop, no edits after |
| Status | Design approved 2026-11-11. Build not yet started. |
| Owner | Ryan Guthrie (decisions, approvals, final submission) |
| Builders | Antigravity coding agents, working directly in this repo |
| Scope / design / review | Muse (this document is the contract; code is reviewed against it) |
| Repo | https://github.com/Mocker/PrismPay — must be **public** with an OSS license before submission |
| Hosting target | Cloudflare Workers (paid plan active) |
| Framing rule | PrismPay *implements the open Chain of Trust pattern* as design inspiration. Never claim it is "built on Chain of Trust" — that is a reference architecture, not an SDK. |

---

## 1. One-line pitch

> An owner gives an AI agent a project budget. PrismPay breaks that budget into a signed, per-category plan, then checks **every** proposed purchase for value-for-money before a single dollar moves through PayPal — so the agent can't blow a $1,000 shed budget on one overpriced component.

Devpost short description (use verbatim as the starting point):

> PrismPay is a fiduciary gate for agentic commerce. The owner states a goal and a total budget; AI proposes a line-by-line budget breakdown; the owner signs that breakdown as a cryptographic allowance mandate. From then on, every purchase the agent proposes must pass five deterministic gates — total cap, category cap, single-item proportionality, price-vs-reference value, and a forward-coherence check that the project can still be finished with what remains. Passing purchases pay through the PayPal sandbox. Failing purchases are denied visibly, with reasons, in an append-only audit log. No mandate, no money.

## 2. Problem and audience

**Problem.** People are starting to delegate purchasing to AI agents, but the controls available today are binary: either the agent has the card, or it doesn't. A single total spending limit is not a real control. An agent with a $1,000 limit can spend $950 on the first item it finds — technically "within budget" — and leave the actual project impossible to finish. It can also be gouged: nothing checks whether the price it accepted is a fair price for that item or service.

**Primary audience (name them in the pitch, exactly this narrow):** anyone who delegates a *project* budget to an agent — a homeowner running a build or renovation project, a solo maker, or a small-business operator buying supplies against a job budget.

**Demo persona:** a homeowner who tells an agent: *"Build a shed. You have $1,000."* The shed is the demo scenario, not the product limit — the same flow works for any goal + budget the owner types in.

**Impact claim to make (and be able to show in the demo):** PrismPay prevents the two failure modes that make people afraid to delegate money to an agent — budget capture by a single purchase, and overpaying for a component — and it proves it prevented them, in an audit log the owner can read.

## 3. Design principles (non-negotiable)

1. **The owner signs the plan; the agent cannot amend its own envelope.** AI *proposes* the budget breakdown. Only the owner's explicit approval creates a mandate. Changing the plan requires a new signed mandate version — the agent has no code path that raises its own caps.
2. **AI proposes and explains; deterministic code decides.** The gate math is pure, testable code with fixed thresholds. An LLM is never the thing that decides whether money moves.
3. **No mandate check, no PayPal call.** A PayPal order may only be created for a proposal whose decision is `PASS`, or `ESCALATE` followed by a recorded owner approval. There must be no other path to the PayPal API in the codebase.
4. **A denial is a feature, not an error state.** Denials render visibly, in plain English, with the gate(s) that fired and the numbers behind them.
5. **Everything is audited.** Every meaningful step appends a hash-chained event. The audit log is a product screen, not a debug view.
6. **Honest demo data.** Reference prices are a seeded dataset (see §8). The README states this plainly. Nothing in the demo fakes a PayPal payment: payments are real PayPal **sandbox** orders and captures.

## 4. Judging alignment (summary)

Full scoring analysis: `docs/JUDGING_ALIGNMENT.md`.

The five equally weighted criteria are Technological Implementation, Design, Potential Impact, Innovation/Idea, and Presentation, after a pass/fail eligibility stage. PrismPay's target category is **Best Use of Agentic Commerce**. The budget-breakdown + value gates are what lift this above a generic "agent with a spending limit" entry: they give AI a non-trivial job (breakdown, categorisation, explanation), give Design a visible product surface (the plan, the category bars, the denial), and give Presentation a story arc (fair purchase passes → trap purchase is blocked → fair alternative passes).

## 5. Scope

### 5.1 In scope — MVP (all of this, nothing more)

1. Owner creates a project: a goal in plain text + a total budget.
2. AI proposes a budget breakdown into named categories with allocations, essential flags, and reference spending estimates. Owner can edit allocations, then **signs** the breakdown, creating mandate v1.
3. Mandate integrity: canonical JSON of the mandate is SHA-256 hashed; the hash is stored and displayed. Any later tampering with stored caps makes validation fail.
4. Agent proposes purchases (item, vendor, category, quoted price, quantity, short justification). Proposals in the demo come from seeded proposal data; the proposal form/API must also accept a manually entered proposal so a judge can try their own.
5. Every proposal is evaluated by the five value gates (§7) producing `PASS` / `ESCALATE` / `DENY` with reason codes.
6. `PASS` → PayPal sandbox order is created and captured; the payment is linked to the proposal. `ESCALATE` → owner approves or rejects; approval then pays, rejection closes the proposal. `DENY` → no PayPal call is made, ever, for that proposal.
7. Project dashboard: per-category spent vs. cap bars, total spent vs. budget, remaining reserve for unfinished essential categories.
8. Audit log screen: hash-chained, append-only, human-readable.
9. Deployed, publicly reachable demo on Cloudflare Workers. Public GitHub repo with README + MIT license. Demo video under 3 minutes.

### 5.2 Explicitly out of scope (cut list — do not build)

- Live price scraping, live product search, or real merchant integrations.
- Multi-quote negotiation, agent-to-agent messaging, or automatic re-shopping after a denial. (The demo's "alternative" proposal is a second seeded proposal.)
- Multiple projects per user, user accounts / login, teams, or roles.
- Real-money PayPal. Sandbox only.
- Mandate amendment UI. If caps need to change, the owner signs a new mandate version (data model supports versions; a full amendment flow is post-hackathon).
- Mobile apps, native apps, browser extensions.
- Anything derived from Anna or PRISM source code. This is a fresh standalone build; design ideas only.

## 6. User flows

### Flow A — Plan and sign (the mandate)
1. Owner enters goal (`Build a shed`) and total budget (`1000.00 USD`).
2. System asks the AI for a breakdown (Flow A is the only place a breakdown is generated). AI returns categories per the schema in §9.3.
3. System validates the AI output deterministically: allocations sum **exactly** to the total budget (adjust the contingency line by any rounding remainder), contingency is at least 10% of total, every category has an `essential` flag and a reference estimate. Invalid AI output → regenerate once, then fall back to the seeded demo breakdown.
4. Owner reviews the breakdown as bars + numbers, may edit any allocation (the UI re-checks the sum live and will not let them sign an unbalanced plan).
5. Owner clicks **Sign mandate**. System stores mandate v1 with its SHA-256 hash and appends `MANDATE_SIGNED` to the audit log. The hash is shown on screen (short form is fine).

### Flow B — A purchase that passes
1. Agent proposes a purchase (seeded button or manual form): item, vendor, category, price.
2. Gate engine evaluates (§7). Decision `PASS`.
3. UI shows the proposal with a green gate checklist — every gate, its numbers, its result.
4. System creates a PayPal sandbox order, the sandbox approval completes, the order is captured. Payment ID is stored against the proposal.
5. Dashboard category bar and totals update. Audit log gains `PROPOSAL_EVALUATED`, `PAYMENT_CREATED`, `PAYMENT_CAPTURED`.

### Flow C — The trap (the centrepiece — must work flawlessly)
1. Agent proposes the seeded trap: a premium roofing package quoted at **$920** against a $1,000 total budget.
2. Gate engine returns `DENY` with multiple reason codes firing at once (§10 gives the exact expected numbers).
3. UI shows the denial in red, in plain English: what was proposed, which gates fired, and the numbers ("$920 is 92% of the entire budget", "roofing cap is $180", "reference price is ~$175 — this quote is 5.3× that", "only $80 would remain for $530 of still-essential work").
4. **No PayPal order exists for this proposal.** This is an acceptance test, not just a UI state.
5. Audit log gains `PROPOSAL_EVALUATED` with decision `DENY` and all reason codes.

### Flow D — The fair alternative
1. Agent proposes the standard version of the same item at a fair price ($165 vs. a $175 reference).
2. Decision `PASS`. PayPal sandbox payment completes. Dashboard updates: the project is still finishable, and the UI says so.

### Flow E — Escalation
1. A proposal that is plausible but not clearly good value (e.g. value ratio between 1.15× and 1.50×, or a small category overflow coverable from contingency) returns `ESCALATE`.
2. Owner sees the amber state with the exact reason, and **Approve** / **Reject** buttons.
3. Approval appends `OWNER_OVERRIDE_APPROVED` and the payment proceeds. Rejection appends `OWNER_OVERRIDE_REJECTED` and no payment is made.
4. `DENY` decisions cannot be overridden from this screen (Principle 1).

## 7. The five value gates (normative specification)

All money is integer cents internally. Thresholds below are defaults stored in one config object (`GATE_CONFIG`) so they are tunable in exactly one place.

Inputs for proposal `P` under mandate `M`:
- `total_budget`, `total_spent` (sum of captured payments under `M`)
- `category_cap(P.category)`, `category_spent(P.category)`
- `reference_price(P.item)` — median reference price from the seeded dataset (§8); may be `null` if unknown
- `required_reserve_after(P)` — sum of reference estimates for essential categories with **no** captured purchase yet, excluding `P.category` if this purchase satisfies that category

| # | Gate | Rule | Result |
|---|---|---|---|
| G1 | Total cap | `total_spent + P.price > total_budget` | `DENY` — `TOTAL_CAP_EXCEEDED` |
| G2 | Category cap | `category_spent + P.price > category_cap`. If the overflow fits inside unused contingency, downgrades to `ESCALATE` — `CONTINGENCY_DRAW`. Otherwise `DENY` — `CATEGORY_CAP_EXCEEDED` | `DENY` / `ESCALATE` |
| G3 | Proportionality | `P.price / total_budget > 0.50` → `DENY` — `SINGLE_ITEM_DOMINANCE`. Between 0.30 and 0.50 → `ESCALATE` — `SINGLE_ITEM_LARGE` | `DENY` / `ESCALATE` |
| G4 | Value for money | `ratio = P.price / reference_price`. `ratio > 1.50` → `DENY` — `PRICE_NOT_VALUE_FOR_MONEY`. `1.15 < ratio ≤ 1.50` → `ESCALATE` — `PRICE_ABOVE_REFERENCE`. Reference price unknown → `ESCALATE` — `NO_REFERENCE_PRICE` (never auto-pass an unpriced item) | `DENY` / `ESCALATE` / pass |
| G5 | Forward coherence | `remaining_after = total_budget − total_spent − P.price`. If `remaining_after < required_reserve_after(P)` → `DENY` — `PROJECT_LEFT_UNFINISHABLE`. If `remaining_after` is within 10% above the required reserve → `ESCALATE` — `RESERVE_TIGHT` | `DENY` / `ESCALATE` / pass |

**Decision composition:** any `DENY` gate → overall `DENY`. Otherwise any `ESCALATE` gate → overall `ESCALATE`. Otherwise `PASS`.

**Every gate result is persisted and displayed** — gate name, the numbers it compared, its outcome, and its reason code (or `OK`). A proposal detail view that only shows the final decision is a design failure against this spec.

**Worked trap check (must reproduce exactly in tests):** budget $1,000, roofing cap $180, contingency $150, reference price for a shed roofing package $175, nothing spent yet in roofing, $530 of essential work still outstanding in other categories. Proposal $920:
- G1: $920 ≤ $1,000 → pass (this is the point: the old total-only check would have let it through)
- G2: $920 > $180 cap; overflow $740 does not fit in $150 contingency → `DENY / CATEGORY_CAP_EXCEEDED`
- G3: 0.92 > 0.50 → `DENY / SINGLE_ITEM_DOMINANCE`
- G4: 920 / 175 = 5.26× > 1.50 → `DENY / PRICE_NOT_VALUE_FOR_MONEY`
- G5: remaining after = $80 < $530 required reserve → `DENY / PROJECT_LEFT_UNFINISHABLE`
- **Overall: `DENY`, four reason codes.** No PayPal order created.

## 8. Reference price dataset

- Location: `data/reference_prices.seed.json` in this repo (seeded copy included with this PDD).
- Shape: one entry per purchasable item — `item_id`, display name, category, `reference_median_cents`, `reference_low_cents`, `reference_high_cents`, `unit`, `note` (where the figure comes from / that it is an illustrative planning estimate).
- Rules: gate G4 uses the median only. The dataset covers every item used by a seeded proposal, plus enough neighbours that a judge entering a similar manual proposal gets a real value check. Items outside the dataset return `NO_REFERENCE_PRICE` → `ESCALATE`, by design.
- Honesty rule: README states these are curated planning estimates for the demo, and that a production version would source them from live price data / quote comparison. Do not present them as live market data anywhere in UI copy.

## 9. Data model and interfaces

### 9.1 Entities

```
Project        id, goal_text, total_budget_cents, currency ("USD"), created_at
Mandate        id, project_id, version, categories[], total_budget_cents,
               owner_label, sha256_hash, signed_at, status ("active" | "superseded")
BudgetCategory name, cap_cents, essential (bool), reference_estimate_cents
Proposal       id, project_id, mandate_id, item_id (nullable), item_name, vendor,
               category, quoted_price_cents, quantity, justification,
               source ("seeded" | "manual" | "agent"), created_at,
               decision ("pending" | "PASS" | "ESCALATE" | "DENY" |
                         "approved" | "rejected" | "paid")
GateResult     proposal_id, gate ("G1".."G5"), outcome ("pass"|"escalate"|"deny"),
               reason_code, detail_numbers (json), explanation (plain English)
Payment        id, proposal_id, paypal_order_id, paypal_capture_id,
               amount_cents, status, created_at
AuditEvent     seq, project_id, type, payload (json), prev_hash, event_hash, created_at
```

### 9.2 Audit event types

`PROJECT_CREATED`, `BREAKDOWN_PROPOSED`, `MANDATE_SIGNED`, `PROPOSAL_CREATED`, `PROPOSAL_EVALUATED`, `OWNER_OVERRIDE_APPROVED`, `OWNER_OVERRIDE_REJECTED`, `PAYMENT_CREATED`, `PAYMENT_CAPTURED`, `PAYMENT_FAILED`.

Hash chain: `event_hash = SHA-256(prev_hash + canonical_json(seq, type, payload, created_at))`. The audit screen shows seq, time, type, and a short hash. A "verify chain" action that recomputes the chain and reports OK / broken is a small, high-trust addition — include it if time allows, cut it before cutting any gate work.

### 9.3 AI usage — where it is and is not used

**Used (must be real, and named in the Devpost "AI tools used" statement):**
- Breakdown generation: given goal + total budget, return JSON matching `{ categories: [{ name, allocation_pct, essential, reference_estimate_cents, rationale }] }`. Output is schema-validated, then passed through the deterministic fix-ups in Flow A step 3.
- Category mapping for a manually entered proposal (suggest a category; owner can change it).
- Plain-English explanations: turn gate results into the sentences a non-technical owner reads. Explanations may be templated from the persisted numbers if LLM latency threatens the demo — the numbers, not the prose, are what is scored.

**Not used:** gate decisions, totals, sums, or any arithmetic that decides whether money moves.

**Fallback:** if the AI call fails or returns invalid JSON twice, use the seeded demo breakdown and seeded explanations. The demo must never be blocked on a model call.

**Provider:** any hosted LLM the builders can wire via an API key in an environment variable. Keep the model call behind one server-side function (`proposeBreakdown`) so the provider can be swapped without touching gate or UI code.

### 9.4 API surface (server, all PayPal and AI keys server-side only)

```
POST /api/projects                      { goal_text, total_budget_cents } → project
POST /api/projects/:id/breakdown        → AI (or fallback) breakdown draft
POST /api/projects/:id/mandate          { categories[] } → signed mandate v1 + hash
GET  /api/projects/:id                  → project + mandate + dashboard aggregates
POST /api/projects/:id/proposals        { item fields } → proposal + gate results + decision
POST /api/proposals/:id/approve         → owner approval of an ESCALATE (then pay)
POST /api/proposals/:id/reject          → owner rejection of an ESCALATE
GET  /api/projects/:id/audit            → audit events
POST /api/projects/:id/audit/verify     → chain verification result (optional, §9.2)
```

Payment creation/capture happens server-side inside the proposal/approve handlers — there is deliberately **no** standalone "pay" endpoint a client could call directly (Principle 3).

## 10. Seeded demo scenario (exact numbers — tests assert against these)

Project: goal `Build a shed`, total budget **$1,000.00**.

| Category | Cap | Essential | Reference estimate |
|---|---:|---|---:|
| Foundation & site prep | $120 | yes | $120 |
| Framing lumber & panels | $320 | yes | $300 |
| Roofing | $180 | yes | $175 |
| Doors, windows & hardware | $150 | yes | $140 |
| Fasteners & consumables | $80 | yes | $75 |
| Contingency | $150 | no | — |
| **Total** | **$1,000** | | |

Proposals, in demo order:

| # | Item | Category | Quote | Reference | Expected decision | Why |
|---|---|---|---:|---:|---|---|
| 1 | Framing lumber package | Framing lumber & panels | $285 | $300 | `PASS` → paid via PayPal sandbox | ratio 0.95; under category cap; project still finishable |
| 2 | **Premium designer roofing package (the trap)** | Roofing | **$920** | $175 | **`DENY`** | G2, G3, G4, G5 all fire (§7 worked check) |
| 3 | Standard metal roofing kit | Roofing | $165 | $175 | `PASS` → paid via PayPal sandbox | ratio 0.94; under cap; reserve intact |
| 4 (optional, if time) | Hinges & latch set | Doors, windows & hardware | $52 | $40 | `ESCALATE` | ratio 1.30 → `PRICE_ABOVE_REFERENCE`; owner approves on camera |

End state after proposals 1–3: spent $450, remaining $550, every essential category still fundable. The dashboard must be able to say exactly that.

## 11. PayPal integration specification

- **Sandbox only.** Base URL and credentials come from environment variables / Worker secrets: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (`sandbox`). Secrets are never committed — `.env.example` lists names only.
- Use the PayPal Orders API (v2): create order (intent `CAPTURE`, amount = proposal price, currency USD, reference = proposal id) → buyer approval in the sandbox flow → capture. Store order id and capture id on the `Payment` record.
- The create-order call happens **only** inside the decision path (§9.4). A code review that finds a PayPal call reachable without a preceding persisted gate evaluation fails review.
- Idempotency: a proposal that already has a `Payment` with status `captured` can never create a second order.
- Failure handling: a failed capture sets the proposal back to its pre-payment decision state, appends `PAYMENT_FAILED`, and shows the error. It never silently marks anything paid.
- Judges' access: the hosted demo must work for a judge without them needing Ryan's personal sandbox buyer account — pre-fund / pre-approve the demo flow as far as the sandbox allows, and document the exact judge path in the README (including any demo buyer credentials that are safe to publish for sandbox use, if the flow requires them).

## 12. Screens and design requirements

Design is a scored criterion: "a complete, coherent product experience, not just a technical proof of concept." Minimum screens:

1. **Home / project setup** — goal + budget form; one seeded "Load the shed demo" action that creates the §10 project in one click for judges.
2. **Plan review & sign** — breakdown as labelled bars with editable amounts, live sum check, contingency visible, Sign button with the resulting mandate hash displayed after signing.
3. **Dashboard** — per-category spent-vs-cap bars, total spent / remaining, "project still finishable: yes/no" indicator driven by G5 logic across remaining essential categories.
4. **Proposals** — list + manual proposal form; each proposal card shows decision colour (green / amber / red), price vs. reference, and expands to the full five-gate checklist with numbers.
5. **Audit log** — chronological, human-readable lines, hash shown per event.

A stranger must be able to complete Flows A–D without instructions beyond what's on screen. Labels use money language ("cap", "reference price", "left for the rest of the project"), not internal jargon ("G4 ratio") — gate names/codes are shown secondarily, for the technical judge.

## 13. Tech constraints for the builders

- Single deployable to **Cloudflare Workers**; frontend and API in the one project. Persistent storage via Workers KV or D1 — builder's choice, but audit events and payments must survive a page reload.
- TypeScript preferred. Gate engine is a pure module with **no I/O and no LLM calls**, unit-testable in isolation.
- All secrets via environment / Worker secrets. Nothing secret in the repo, ever.
- No dependency on Anna, PRISM, or any private code or service (Principle: fresh standalone build).

## 14. Acceptance criteria (review checklist — Muse reviews code against this)

- [ ] AC-1: Creating the §10 project and signing the breakdown stores a mandate whose displayed hash recomputes correctly from the stored categories.
- [ ] AC-2: Editing a stored cap directly in storage makes mandate validation fail (tamper evidence works).
- [ ] AC-3: Proposal 1 evaluates to `PASS` and produces a real sandbox `Payment` with a capture id.
- [ ] AC-4: Proposal 2 (trap) evaluates to `DENY` with exactly the reason codes `CATEGORY_CAP_EXCEEDED`, `SINGLE_ITEM_DOMINANCE`, `PRICE_NOT_VALUE_FOR_MONEY`, `PROJECT_LEFT_UNFINISHABLE`.
- [ ] AC-5: After the trap proposal, there is **no** PayPal order id anywhere in storage for that proposal.
- [ ] AC-6: Proposal 3 evaluates to `PASS`, pays, and the dashboard then reads spent $450 / remaining $550 with the project marked finishable.
- [ ] AC-7: An item with no reference price evaluates to `ESCALATE` with `NO_REFERENCE_PRICE`, and pays only after a recorded owner approval.
- [ ] AC-8: A `DENY` proposal exposes no UI action and no API path that results in a payment.
- [ ] AC-9: Audit log contains every event type exercised by Flows A–D, in order, and the hash chain verifies.
- [ ] AC-10: With the AI provider key removed, the full demo still runs on the seeded fallback breakdown.
- [ ] AC-11: A judge can start from the deployed URL, load the shed demo, and reach a captured payment and a visible denial without any instruction from Ryan.
- [ ] AC-12: Repo is public, contains `LICENSE` (MIT) and a README with setup, judge path, architecture, gate explanation, and AI-tools disclosure. Demo stays live until winners are announced (Dec 21, 2026).

## 15. Submission package

- [ ] Public repo + MIT license + README (AC-12)
- [ ] Hosted demo URL, live and working
- [ ] YouTube video, public, **under 3:00** — script and timings in `docs/DEMO_SCRIPT.md`
- [ ] Devpost text: one-liner (§1), problem/audience (§2), how it works (mandate → gates → PayPal), "Built with" naming PayPal sandbox + the AI tool actually used
- [ ] Statement of AI tools used (required by the submission form)
- [ ] Nothing in the repo or video claims live / real-money payments, live market prices, or a "built on Chain of Trust" relationship

## 16. Build order (detail in `docs/BUILD_PLAN.md`)

1. Gate engine + data model + unit tests against §7 and §10 (pure code first — everything else depends on these numbers being right).
2. Project / mandate / proposal API + storage + audit chain.
3. PayPal sandbox create/capture on the `PASS` path.
4. AI breakdown + fallback.
5. UI screens in §12 order.
6. Deploy, judge-path walkthrough (AC-11), README, video.

## 17. Open items that are Ryan's taps only

- [ ] Repo visibility: the repo was created **private** — it must be flipped **public** before submission (deliberate default-private exception, same precedent as MintWiki).
- [ ] PayPal developer sandbox app: confirm whether one already exists; if not, create it (needs Ryan's PayPal login) and supply client ID/secret as Worker secrets — never via chat or commit.
- [ ] Any merge / deploy approvals the builders surface.
- [ ] YouTube upload (public, under 3 min) and final Devpost submit before **Nov 12, 12:00 PM PST**.

## 18. Decisions already made (do not relitigate during the build)

| Decision | Value |
|---|---|
| License | MIT |
| Gate thresholds | §7 defaults, in one `GATE_CONFIG` object |
| Reference prices | Seeded dataset, honestly labelled (§8) |
| Demo scenario | Shed, $1,000, numbers frozen in §10 |
| Payments | PayPal sandbox Orders API only; no real money |
| Escalation override | Owner may approve `ESCALATE`; `DENY` requires a new signed mandate |
| Stack | Cloudflare Workers, single deployable (§13) |
