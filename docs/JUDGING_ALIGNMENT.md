# PrismPay — Judging Alignment

PayPal AI Hackathon, Devpost. Source: official rules on the hackathon site, checked 2026-11-11.

## How judging works

- **Stage One (pass/fail):** the project reasonably fits the theme and reasonably applies the required APIs/SDKs. For PrismPay that means: a working build, meaningful use of a PayPal API (sandbox is fine), meaningful use of AI, a public repo with an open-source license, and a public demo video under 3 minutes.
- **Stage Two:** five **equally weighted** criteria —
  1. **Technological Implementation** — how thoroughly and skillfully the project uses the PayPal Developer Platform and AI tool(s); genuine effort; a working, non-trivial implementation. (Also the tie-breaker.)
  2. **Design** — a complete, coherent product experience, not just a technical proof of concept.
  3. **Potential Impact** — a credible, specific case for solving a real problem for a real audience, addressed by what's demonstrated.
  4. **Innovation / Idea** — creative, novel, differs from existing concepts.
  5. **Presentation** — the video clearly shows the project working end-to-end; the pitch communicates the problem, who it's for, and why it matters.
- **Target special prize:** Best Use of Agentic Commerce ($5,000). Overall 1st is $12,000 in a field of 28,000+ registrants — the special prize is the realistic aim, overall placement is upside.

## Score estimate

Estimated 1–5 per criterion, assuming the PDD is built as specified. These are planning estimates, not results.

| Criterion | Mandate-only version (total cap + vendor list) | PrismPay as designed (breakdown + value gates) | What earns the score |
|---|---:|---:|---|
| Technological Implementation | 3 | 4 | AI does non-trivial work (breakdown, categorisation, explanation); gate decisions are deterministic, tested code; real PayPal Orders API create + capture, not a button |
| Design | 2–3 | 4 | The plan is a visible, editable, signable surface; category bars; the denial is a designed moment, not an error |
| Potential Impact | 3 | 4 | Specific audience (anyone delegating a project budget to an agent) and a specific failure prevented, shown with numbers |
| Innovation / Idea | 3 | 4 | Signed allowances will be common in this field; per-category value gates + forward-coherence ("can the project still be finished?") are the differentiator |
| Presentation | 3 | 4–5 | Story arc: fair purchase passes → $920 trap is blocked with reasons → fair alternative passes → audit log proves all of it |
| **Total** | **~14–16 / 25** | **~20 / 25** | |

## Where points are most likely to be lost

1. **Technological Implementation — if the value check looks like an LLM opinion.** Mitigation (in the PDD): five deterministic gates with fixed thresholds and a seeded reference dataset; the LLM never decides. The trap proposal must fire four named reason codes, reproducibly, in tests.
2. **Design — if it ships as a terminal / API demo.** Mitigation: the five screens in PDD §12 are in scope, and a judge must be able to complete the whole flow unaided (acceptance criterion AC-11).
3. **Stage One — logistics, not ideas.** A private repo, a missing license file, a video over 3:00, or a dead demo link fails the entry before scoring. The repo is currently **private** and must be flipped public before submission; the demo must stay live until winners are announced (Dec 21, 2026).
4. **Presentation — if the trap isn't the centrepiece.** The $920 denial is the most memorable 30 seconds available to this entry. The demo script is built around it.
5. **Credibility — overclaiming.** Claiming live prices, real-money readiness, or "built on Chain of Trust" would undercut an otherwise honest entry. The PDD's honesty rules (seeded reference prices labelled as such, sandbox labelled as such, "implements the open Chain of Trust pattern" as design inspiration only) exist for this reason.

## Verdict

The original mandate-only slice was shippable but mid-field. Adding the budget breakdown and value gates is the single highest-leverage scope addition available in the time: it raises four of the five criteria, creates the demo's story, and directly fits the Agentic Commerce special prize — at the cost of one data model (categories), one seeded dataset, and gate code that is pure and testable. The risk is scope creep beyond that (live pricing, negotiation, multi-quote shopping), which is why those are explicit cuts in the PDD.
