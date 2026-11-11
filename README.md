# PrismPay

**A budget-aware allowance gate for AI purchasing agents.**

An owner gives an AI agent a project budget. PrismPay breaks that budget into a signed, per-category plan, then checks **every** proposed purchase for value-for-money before any money moves through PayPal — so the agent can't blow a $1,000 shed budget on one overpriced component.

> Status: **design phase** — product design document approved 2026-11-11, build in progress for the PayPal AI Hackathon (submission deadline Nov 12, 2026, 12:00 PM PST).

## How it works

1. **Plan** — the owner states a goal and a total budget ("Build a shed — $1,000"). AI proposes a line-by-line budget breakdown.
2. **Sign** — the owner reviews and signs the breakdown. That signed plan is the mandate: a cryptographic allowance the agent cannot amend.
3. **Propose** — the agent proposes purchases against the plan.
4. **Gate** — every proposal must pass five deterministic checks: total cap, category cap, single-item proportionality, price-vs-reference value, and a forward-coherence check that the project can still be finished with what remains.
5. **Pay or deny** — passing purchases pay through the **PayPal sandbox**. Failing purchases are denied visibly, with reasons. Every step lands in an append-only, hash-chained audit log.

PrismPay implements the open Chain of Trust pattern as design inspiration (signed mandates, evidence-based trust, append-only traceability).

## Documentation

| Doc | What it is |
|---|---|
| [Product Design Document](docs/PDD.md) | The build contract: scope, flows, the five value gates, data model, PayPal spec, acceptance criteria |
| [Judging alignment](docs/JUDGING_ALIGNMENT.md) | How the design scores against the hackathon's five judging criteria, and where the risks are |
| [Build plan](docs/BUILD_PLAN.md) | Workstreams, sequencing, and review gates for the coding agents |
| [Demo script](docs/DEMO_SCRIPT.md) | The under-3-minute video script and the exact demo walkthrough |
| [Reference prices (seed)](data/reference_prices.seed.json) | Curated planning estimates used by the value gate in the demo |

## Honesty notes

- Payments are **PayPal sandbox** only — no real money moves.
- Reference prices are **curated planning estimates** for the demo, not live market data. A production version would source them from live price data and competing quotes.
- AI proposes the budget breakdown and explains decisions; **deterministic code** makes every decision about whether money moves.

## License

MIT — see [LICENSE](LICENSE).
