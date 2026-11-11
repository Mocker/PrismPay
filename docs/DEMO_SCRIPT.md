# PrismPay — Demo Video Script (under 3:00)

Public YouTube video, under 3 minutes — judges are not required to watch past 3:00. Upload early; YouTube processing can take hours. AI voiceover is acceptable. No copyrighted music.

All numbers below are the frozen demo data from PDD §10. If the build's numbers differ from this script, the build is wrong, not the script.

## Timings

| Time | On screen | Narration (target wording) |
|---|---|---|
| 0:00–0:20 | Title + the problem, in text | "Give an AI agent your card and a $1,000 budget, and it can spend $950 on the first thing it finds — technically within budget, and your project is dead. PrismPay is the control layer that stops that." |
| 0:20–0:45 | Flow A: enter goal "Build a shed", budget $1,000 → AI breakdown appears as category bars → sign | "The owner states a goal and a total. AI proposes a line-by-line budget breakdown. The owner reviews it and signs it — that signed plan is the mandate. The agent can spend against it, but it can never change it." Show the mandate hash. |
| 0:45–1:10 | Flow B: proposal 1, framing lumber $285 vs $300 reference → green five-gate checklist → PayPal sandbox checkout completes | "A fair purchase: $285 for the framing lumber package, under its $320 category cap and under the $300 reference price. All five gates pass, and it pays through the PayPal sandbox." |
| 1:10–1:50 | Flow C: THE TRAP — premium roofing package, $920 → red denial, gates firing, reasons in plain English | "Then the agent finds a premium roofing package: $920 — for a $1,000 shed. A total-only limit would have paid this. PrismPay denies it four ways: it's over the $180 roofing cap, it's 92% of the entire budget in one item, it's 5.3 times the reference price, and it would leave $80 for $530 of essential work still to do. No payment is created." |
| 1:50–2:15 | Flow D: standard metal roofing kit $165 → passes → pays | "The standard kit at $165 passes every gate and pays. The project is still finishable — and the dashboard proves it: $450 spent, $550 left, every essential category still funded." |
| 2:15–2:45 | Audit log screen, scrolling; dashboard category bars | "Every proposal, every gate, every payment and every denial is in an append-only audit log the owner can read and verify. The agent proposes. Deterministic rules decide. PayPal only ever sees purchases that passed." |
| 2:45–3:00 | Close: name, one-liner, repo + demo URL | "PrismPay — a budget-aware allowance gate for AI purchasing agents. Built with the PayPal sandbox and AI for the PayPal AI Hackathon." |

## Production notes

- Record the live deployed demo, not a local build, so what judges see is what they can run.
- Keep the trap segment (1:10–1:50) uncut and legible — pause on the denial screen long enough to read the four reasons.
- Charmbracelet VHS is an acceptable way to produce any terminal segments, but the judged flow is the web UI; prefer screen capture of the real demo.
- Do not show any credential, secret, or sandbox password on screen. Sandbox buyer details may be shown only if they are the publishable demo credentials documented in the README.
- Captions on. The denial reasons must be readable at 480p — zoom the browser if needed.
