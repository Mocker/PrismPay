# PrismPay

**A budget-aware allowance gate for AI purchasing agents.**

> **One-line pitch:** An owner gives an AI agent a project budget. PrismPay breaks that budget into a signed, per-category plan, then checks **every** proposed purchase for value-for-money before a single dollar moves through PayPal — so the agent can't blow a \$1,000 shed budget on one overpriced component.

Built for the **PayPal AI Hackathon** (*Best Use of Agentic Commerce* track).

---

## Judge Walkthrough (Zero-Setup, 60-Second Path — AC-11)

A judge can test the entire end-to-end flow directly from the web UI without needing personal PayPal credentials or an LLM key:

1. **Load the \$1,000 Shed Scenario:** Click **Load \$1,000 Shed Demo** in the top quick-start bar (or enter any custom goal + budget in **1. Project Setup** and click **Sign Mandate v1** in **2. Plan Review & Sign**).
   - Observe the canonical **SHA-256 Mandate Hash** locking the six category caps (`Foundation $120`, `Framing $320`, `Roofing $180`, `Doors & Hardware $150`, `Fasteners $80`, `Contingency $150`).
2. **Proposal 1 — Fair Purchase (`PASS` → PayPal Sandbox Capture):** Click **1. Framing Lumber ($285 → PASS)**.
   - Quoted at \$285 against a \$300 reference median (0.95×) and \$320 category cap.
   - All five gates (`G1`–`G5`) pass; a PayPal Sandbox order is created and captured server-side.
3. **Proposal 2 — The \$920 Trap (`DENY` → Blocked Before PayPal):** Click **2. Designer Roofing ($920 → THE TRAP)**.
   - Quoted at \$920 for a \$1,000 shed. While a naive \$1,000 card limit would let \$920 through (`G1` passes), PrismPay halts the transaction with **four simultaneous gate denials**:
     - `G2: CATEGORY_CAP_EXCEEDED` (\$920 exceeds \$180 Roofing cap; \$740 overflow exceeds \$150 Contingency)
     - `G3: SINGLE_ITEM_DOMINANCE` (\$920 is 92% of the entire \$1,000 budget in one item; max 50%)
     - `G4: PRICE_NOT_VALUE_FOR_MONEY` (\$920 is 5.3× the \$175 reference median; max 1.50×)
     - `G5: PROJECT_LEFT_UNFINISHABLE` (Only \$80 of the \$1,000 budget would remain for \$530 of unfinished essential work)
   - **Zero PayPal API calls** are made for a denied proposal.
4. **Proposal 3 — Fair Alternative (`PASS` → Project Finishable):** Click **3. Standard Roofing ($165 → PASS)**.
   - Quoted at \$165 vs \$175 reference (0.94×). Passes all 5 gates and captures via PayPal Sandbox.
   - Open **3. Dashboard**: Total spent is **\$450**, remaining is **\$550**, and **Project Still Finishable (G5)** reads `YES — FINISHABLE` (\$550 covers the \$335 remaining essential reserves).
5. **Proposal 4 — Escalation (`ESCALATE` → Owner Override):** Click **4. Hinges & Latch ($52 → ESCALATE)**.
   - Quoted at \$52 vs \$40 reference (1.30× → `PRICE_ABOVE_REFERENCE`). Click **Approve & Pay via PayPal** or **Reject Proposal** to test human-in-the-loop escalation.
6. **Audit Log & Chain Verification:** Open **5. Audit Log** and click **Verify Hash Chain Integrity** to recompute every SHA-256 event link from `GENESIS`.

---

## Architecture & The Five Value Gates

PrismPay implements the open **Chain of Trust** pattern as design inspiration (cryptographically signed mandates, deterministic evidence-based trust, append-only hash-chained traceability).

### Non-Negotiable Design Principles
1. **The owner signs the plan; the agent cannot amend its own envelope.** AI proposes the budget breakdown; only the owner's explicit signature creates a SHA-256 locked mandate. Tampering with stored caps triggers `409 MANDATE_TAMPER_DETECTED` and halts all spending.
2. **AI proposes and explains; deterministic code decides.** Gate math in [`src/gates.ts`](src/gates.ts) is pure, zero-I/O TypeScript using integer cents. An LLM never decides whether money moves.
3. **No mandate check, no PayPal call.** PayPal Orders v2 creation and capture happen strictly inside the server-side `PASS` and owner-approved `ESCALATE` handlers ([`src/paypal.ts`](src/paypal.ts)). There is no standalone payment endpoint.

### Normative Gate Specification (`src/gates.ts`)

| Gate | Name | Deterministic Rule | Outcome / Reason Code |
|---|---|---|---|
| **G1** | Total Cap | `total_spent + price > total_budget` | `DENY` (`TOTAL_CAP_EXCEEDED`) |
| **G2** | Category Cap | `category_spent + price > category_cap` (downgrades to `ESCALATE` if overflow fits in unused Contingency) | `DENY` (`CATEGORY_CAP_EXCEEDED`) or `ESCALATE` (`CONTINGENCY_DRAW`) |
| **G3** | Proportionality | `price / total_budget > 0.50` (`0.30–0.50` escalates) | `DENY` (`SINGLE_ITEM_DOMINANCE`) or `ESCALATE` (`SINGLE_ITEM_LARGE`) |
| **G4** | Value for Money | `price / reference_median > 1.50` (`1.15–1.50` escalates; unknown ref escalates) | `DENY` (`PRICE_NOT_VALUE_FOR_MONEY`), `ESCALATE` (`PRICE_ABOVE_REFERENCE` / `NO_REFERENCE_PRICE`) |
| **G5** | Forward Coherence | `remaining_after < required_reserve_after` (within 10% buffer escalates) | `DENY` (`PROJECT_LEFT_UNFINISHABLE`) or `ESCALATE` (`RESERVE_TIGHT`) |

---

## Local Setup & Cloudflare Workers Deployment

### Prerequisites
- Node.js 22+ / 24+ and npm

### Install & Run Tests
```bash
npm install
npm test
npm run typecheck
```

### Run Local Development Server
```bash
npm run dev
# Or with Cloudflare Wrangler local runtime:
npm run dev:wrangler
```
The web application and API will be available at `http://localhost:8787`.

### Environment Variables / Worker Secrets
Copy [`.env.example`](.env.example) for local environment configuration, or configure secrets in Cloudflare Workers:
- `PAYPAL_CLIENT_ID` — PayPal Developer Sandbox Client ID
- `PAYPAL_CLIENT_SECRET` — PayPal Developer Sandbox Secret
- `PAYPAL_ENV` — `sandbox` (default)
- `AI_API_KEY` *(optional)* — OpenAI-compatible API key for live AI breakdown generation (automatically falls back to the deterministic planner when absent, per AC-10)

```bash
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
npm run deploy
```

---

## AI Tools & Honesty Disclosure

- **PayPal Sandbox Only:** All payments execute against the PayPal Sandbox (`api-m.sandbox.paypal.com/v2/checkout/orders` or pre-approved sandbox demo receipts when credentials are omitted). No real money moves.
- **Curated Planning Estimates:** Reference prices in [`data/reference_prices.seed.json`](data/reference_prices.seed.json) are curated planning estimates for the demo scenario, not live-scraped market data.
- **AI Tools Used:**
  - **Runtime:** AI is used in [`src/ai.ts`](src/ai.ts) (`proposeBreakdown` and `suggestCategoryForItem`) to draft initial project budget allocations and suggest categories for manual items, with schema validation and a deterministic fallback.
  - **Development:** Built with assistance from Antigravity AI coding agents against the Product Design Document ([`docs/PDD.md`](docs/PDD.md)).

---

## Documentation Index

| Document | Purpose |
|---|---|
| [`docs/PDD.md`](docs/PDD.md) | Product Design Document: scope, flows, normative 5-gate rules, API spec, and AC-1–AC-12 checklist |
| [`docs/JUDGING_ALIGNMENT.md`](docs/JUDGING_ALIGNMENT.md) | Alignment with the PayPal AI Hackathon judging criteria |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Workstreams W1–W6 and engineering rules |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Under-3-minute demo video script and narration timings |
| [`data/reference_prices.seed.json`](data/reference_prices.seed.json) | Curated reference price dataset used by Gate G4 |

## License

MIT — see [`LICENSE`](LICENSE).
