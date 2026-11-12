export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PrismPay — Fiduciary Allowance Gate for AI Purchasing Agents</title>
  <meta name="description" content="PrismPay breaks a project budget into a cryptographically signed per-category mandate and checks every AI purchase proposal through five deterministic value gates before PayPal sandbox checkout." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-page: #f5f4f0;
      --bg-surface: #ffffff;
      --bg-subtle: #edece6;
      --bg-elevated: #faf9f6;
      --ink-primary: #14181f;
      --ink-secondary: #4a5260;
      --ink-muted: #727b8a;
      --border-hairline: #dcdad2;
      --border-strong: #b9b6ac;

      --paypal-navy: #003087;
      --paypal-blue: #0070ba;
      --paypal-sky: #eef5fc;

      --pass-bg: #ecf8f2;
      --pass-border: #8ad4b0;
      --pass-ink: #0c5e38;
      --pass-bar: #12804c;

      --escalate-bg: #fef7e6;
      --escalate-border: #f0c36d;
      --escalate-ink: #8a5300;
      --escalate-bar: #d98200;

      --deny-bg: #fdf0f0;
      --deny-border: #eb9b9b;
      --deny-ink: #9c1c1c;
      --deny-bar: #c92a2a;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-card: 0 1px 3px rgba(20, 24, 31, 0.05), 0 4px 14px rgba(20, 24, 31, 0.03);
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-page);
      color: var(--ink-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top Header */
    .topbar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-hairline);
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .topbar-inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--paypal-navy);
      color: #fff;
      display: grid;
      place-items: center;
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 1rem;
      letter-spacing: -0.03em;
      box-shadow: inset 0 -2px 0 rgba(0,0,0,0.25);
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: var(--ink-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-sub {
      font-size: 0.78rem;
      color: var(--ink-secondary);
    }

    .honesty-strip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 500;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      border: 1px solid var(--border-hairline);
      white-space: nowrap;
    }

    .pill-paypal {
      background: var(--paypal-sky);
      color: var(--paypal-navy);
      border-color: #b9d7f5;
      font-weight: 600;
    }

    .pill-pass {
      background: var(--pass-bg);
      color: var(--pass-ink);
      border-color: var(--pass-border);
    }

    .pill-escalate {
      background: var(--escalate-bg);
      color: var(--escalate-ink);
      border-color: var(--escalate-border);
    }

    .pill-deny {
      background: var(--deny-bg);
      color: var(--deny-ink);
      border-color: var(--deny-border);
    }

    /* Navigation Tabs */
    .nav-bar {
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-hairline);
    }

    .nav-inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      overflow-x: auto;
    }

    .nav-tabs {
      display: flex;
      gap: 0.25rem;
    }

    .nav-tab {
      appearance: none;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.85rem 1rem;
      font-family: var(--font-sans);
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--ink-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      transition: color 0.15s ease, border-color 0.15s ease;
      white-space: nowrap;
    }

    .nav-tab:hover {
      color: var(--ink-primary);
    }

    .nav-tab.active {
      color: var(--paypal-navy);
      border-bottom-color: var(--paypal-navy);
    }

    .step-num {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      display: inline-grid;
      place-items: center;
    }

    .nav-tab.active .step-num {
      background: var(--paypal-navy);
      color: #fff;
    }

    /* Main Container */
    .main-container {
      max-width: 1240px;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem;
      flex: 1;
    }

    /* Guided Judge Walkthrough Banner */
    .judge-banner {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .judge-banner-left {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .judge-banner-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--ink-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .judge-banner-desc {
      font-size: 0.82rem;
      color: var(--ink-secondary);
    }

    .judge-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* Buttons */
    .btn {
      appearance: none;
      border: 1px solid var(--border-strong);
      background: var(--bg-surface);
      color: var(--ink-primary);
      font-family: var(--font-sans);
      font-size: 0.84rem;
      font-weight: 600;
      padding: 0.55rem 0.95rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.14s ease;
      text-decoration: none;
    }

    .btn:hover:not(:disabled) {
      background: var(--bg-subtle);
      border-color: var(--ink-secondary);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--paypal-navy);
      color: #ffffff;
      border-color: var(--paypal-navy);
    }

    .btn-primary:hover:not(:disabled) {
      background: #002366;
      border-color: #002366;
    }

    .btn-pass {
      background: var(--pass-ink);
      color: #ffffff;
      border-color: var(--pass-ink);
    }

    .btn-pass:hover:not(:disabled) {
      background: #09472a;
    }

    .btn-trap {
      background: var(--deny-bg);
      color: var(--deny-ink);
      border-color: var(--deny-border);
    }

    .btn-trap:hover:not(:disabled) {
      background: #f9dede;
      border-color: var(--deny-ink);
    }

    .btn-escalate {
      background: var(--escalate-bg);
      color: var(--escalate-ink);
      border-color: var(--escalate-border);
    }

    .btn-escalate:hover:not(:disabled) {
      background: #fcebc4;
    }

    /* Layout Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 920px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 1.35rem;
      box-shadow: var(--shadow-card);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border-hairline);
    }

    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.015em;
    }

    .card-subtitle {
      font-size: 0.82rem;
      color: var(--ink-secondary);
      margin-top: 0.2rem;
    }

    /* Forms */
    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ink-secondary);
      margin-bottom: 0.35rem;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.6rem 0.75rem;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      color: var(--ink-primary);
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: 2px solid var(--paypal-blue);
      outline-offset: 1px;
      background: var(--bg-surface);
    }

    .mono {
      font-family: var(--font-mono);
    }

    /* KPI Strip */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 820px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 1rem 1.15rem;
      box-shadow: var(--shadow-card);
    }

    .kpi-label {
      font-size: 0.76rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-muted);
    }

    .kpi-value {
      font-family: var(--font-mono);
      font-size: 1.45rem;
      font-weight: 600;
      margin-top: 0.3rem;
      color: var(--ink-primary);
    }

    .kpi-sub {
      font-size: 0.76rem;
      color: var(--ink-secondary);
      margin-top: 0.2rem;
    }

    /* Category Allocation & Spent Bars */
    .cat-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .cat-row {
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
    }

    .cat-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.45rem;
      flex-wrap: wrap;
    }

    .cat-name {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .cat-figures {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: var(--ink-secondary);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-track {
      width: 100%;
      height: 10px;
      background: var(--bg-subtle);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: var(--paypal-blue);
      border-radius: 999px;
      transition: width 0.25s ease;
    }

    .progress-fill.pass {
      background: var(--pass-bar);
    }

    .progress-fill.warn {
      background: var(--escalate-bar);
    }

    .progress-fill.over {
      background: var(--deny-bar);
    }

    /* Mandate Hash Banner */
    .hash-box {
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    /* Proposal Cards */
    .proposal-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .proposal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .proposal-card.state-PASS, .proposal-card.state-paid, .proposal-card.state-approved {
      border-left: 5px solid var(--pass-bar);
    }

    .proposal-card.state-ESCALATE {
      border-left: 5px solid var(--escalate-bar);
    }

    .proposal-card.state-DENY, .proposal-card.state-rejected {
      border-left: 5px solid var(--deny-bar);
    }

    .proposal-summary {
      padding: 1rem 1.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      cursor: pointer;
      background: var(--bg-surface);
    }

    .proposal-summary:hover {
      background: var(--bg-elevated);
    }

    .proposal-Callout-DENY {
      background: var(--deny-bg);
      border-top: 1px solid var(--deny-border);
      border-bottom: 1px solid var(--deny-border);
      padding: 0.9rem 1.2rem;
      color: var(--deny-ink);
    }

    .proposal-Callout-ESCALATE {
      background: var(--escalate-bg);
      border-top: 1px solid var(--escalate-border);
      border-bottom: 1px solid var(--escalate-border);
      padding: 0.9rem 1.2rem;
      color: var(--escalate-ink);
    }

    .proposal-Callout-PASS {
      background: var(--pass-bg);
      border-top: 1px solid var(--pass-border);
      border-bottom: 1px solid var(--pass-border);
      padding: 0.75rem 1.2rem;
      color: var(--pass-ink);
    }

    /* Five Gate Checklist Table */
    .gate-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.83rem;
    }

    .gate-table th, .gate-table td {
      padding: 0.65rem 0.9rem;
      text-align: left;
      border-bottom: 1px solid var(--border-hairline);
      vertical-align: top;
    }

    .gate-table th {
      font-size: 0.73rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-muted);
      background: var(--bg-elevated);
    }

    /* Audit Table */
    .audit-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .audit-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      display: grid;
      grid-template-columns: 56px 190px 1fr 210px;
      gap: 0.75rem;
      align-items: center;
      font-size: 0.83rem;
    }

    @media (max-width: 860px) {
      .audit-item {
        grid-template-columns: 1fr;
      }
    }

    .hidden {
      display: none !important;
    }

    .footer {
      border-top: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      padding: 1rem 1.5rem;
      font-size: 0.78rem;
      color: var(--ink-muted);
      text-align: center;
      margin-top: 2rem;
    }

    .toast {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      background: var(--ink-primary);
      color: #fff;
      padding: 0.75rem 1.1rem;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      z-index: 100;
      max-width: 420px;
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-mark">PP</div>
        <div>
          <div class="brand-title">
            <h1>PrismPay</h1>
            <span class="pill pill-paypal">PayPal Sandbox</span>
          </div>
          <div class="brand-sub">Fiduciary allowance gate for AI purchasing agents · Implements the open Chain of Trust pattern</div>
        </div>
      </div>
      <div class="honesty-strip">
        <span class="pill" title="Reference prices in data/reference_prices.seed.json are curated planning estimates for the demo, not live market feeds.">Ref Prices: Curated Planning Estimates</span>
        <span class="pill" id="header-mandate-pill">Mandate: Unsigned</span>
      </div>
    </div>
  </header>

  <nav class="nav-bar" aria-label="Product workflow screens">
    <div class="nav-inner">
      <div class="nav-tabs">
        <button type="button" class="nav-tab active" id="tab-btn-setup" data-screen="setup">
          <span class="step-num">1</span> Project Setup
        </button>
        <button type="button" class="nav-tab" id="tab-btn-plan" data-screen="plan">
          <span class="step-num">2</span> Plan Review &amp; Sign
        </button>
        <button type="button" class="nav-tab" id="tab-btn-dashboard" data-screen="dashboard">
          <span class="step-num">3</span> Dashboard
        </button>
        <button type="button" class="nav-tab" id="tab-btn-proposals" data-screen="proposals">
          <span class="step-num">4</span> Proposals &amp; 5 Value Gates <span class="pill" id="nav-proposal-count">0</span>
        </button>
        <button type="button" class="nav-tab" id="tab-btn-audit" data-screen="audit">
          <span class="step-num">5</span> Audit Log <span class="pill" id="nav-audit-count">0</span>
        </button>
      </div>
    </div>
  </nav>

  <main class="main-container">
    <!-- Persistent Judge Quick-Action Bar -->
    <section class="judge-banner" aria-label="Judge quick demo controls">
      <div class="judge-banner-left">
        <div class="judge-banner-title">
          <span>Judge Quick-Start Walkthrough ($1,000 Shed Scenario)</span>
          <span class="pill pill-pass" id="active-project-badge">No Active Project</span>
        </div>
        <div class="judge-banner-desc" id="judge-banner-status">
          Click <strong>Load $1,000 Shed Demo</strong> to seed the PDD §10 project, sign the mandate, and test the $285 pass, the $920 trap denial, and the $165 fair alternative.
        </div>
      </div>
      <div class="judge-actions">
        <button type="button" class="btn btn-primary" id="btn-quick-load-shed">
          Load $1,000 Shed Demo
        </button>
        <button type="button" class="btn btn-pass hidden" id="btn-quick-prop-1">
          1. Framing Lumber ($285 → PASS)
        </button>
        <button type="button" class="btn btn-trap hidden" id="btn-quick-prop-2">
          2. Designer Roofing ($920 → THE TRAP)
        </button>
        <button type="button" class="btn btn-pass hidden" id="btn-quick-prop-3">
          3. Standard Roofing ($165 → PASS)
        </button>
        <button type="button" class="btn btn-escalate hidden" id="btn-quick-prop-4">
          4. Hinges &amp; Latch ($52 → ESCALATE)
        </button>
      </div>
    </section>

    <!-- SCREEN 1: HOME / PROJECT SETUP -->
    <section id="screen-setup" class="screen-section">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">1. Delegate a Project Budget to Your Agent</h2>
              <p class="card-subtitle">State a goal and a total budget. AI will propose a per-category breakdown that you review and cryptographically sign.</p>
            </div>
          </div>
          <form id="form-create-project">
            <div class="form-group">
              <label class="form-label" for="input-goal-text">Project Goal</label>
              <input type="text" id="input-goal-text" class="form-input" value="Build a shed" placeholder="e.g., Build a shed" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="input-total-budget">Total Budget (USD Dollars)</label>
              <input type="number" id="input-total-budget" class="form-input mono" value="1000" min="50" step="1" required />
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem;">
              <button type="submit" class="btn btn-primary" id="btn-create-project">
                Generate AI Budget Breakdown →
              </button>
              <button type="button" class="btn" id="btn-load-shed-hero">
                One-Click: Load &amp; Sign $1,000 Shed Demo
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Why a Single Spending Limit Fails</h2>
              <p class="card-subtitle">How PrismPay protects delegated agent budgets before PayPal executes.</p>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.86rem; color: var(--ink-secondary);">
            <div style="padding: 0.8rem; background: var(--deny-bg); border: 1px solid var(--deny-border); border-radius: var(--radius-sm); color: var(--deny-ink);">
              <strong>The Naive Card Limit Problem:</strong> Give an agent a $1,000 limit for a shed, and it can spend <strong>$920</strong> on a luxury roof first — technically "under $1,000", leaving $80 for $530 of unfinished foundation, walls, and doors.
            </div>
            <div style="padding: 0.8rem; background: var(--bg-elevated); border: 1px solid var(--border-hairline); border-radius: var(--radius-sm);">
              <strong>Five Deterministic Value Gates:</strong>
              <ul style="margin-top: 0.4rem; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <li><strong>G1 Total Cap:</strong> Total spend stays within total project budget.</li>
                <li><strong>G2 Category Cap:</strong> Spend stays within the signed category cap (or escalates if covered by Contingency).</li>
                <li><strong>G3 Proportionality:</strong> Blocks single-item dominance (&gt;50% of total budget).</li>
                <li><strong>G4 Value for Money:</strong> Compares quote against curated reference price median (&gt;1.50× denied).</li>
                <li><strong>G5 Forward Coherence:</strong> Verifies remaining budget still covers required reserves for all unfinished essential categories.</li>
              </ul>
            </div>
            <div style="font-size: 0.78rem; color: var(--ink-muted);">
              <strong>Honesty note:</strong> AI proposes the budget breakdown and explains decisions; deterministic code makes every decision about whether money moves. All payments use the <strong>PayPal Sandbox Orders v2 API</strong>.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SCREEN 2: PLAN REVIEW & SIGN -->
    <section id="screen-plan" class="screen-section hidden">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">2. Review &amp; Sign Cryptographic Allowance Mandate</h2>
            <p class="card-subtitle" id="plan-subtitle">Adjust category caps as needed. Allocations must sum to the exact total budget, with at least 10% in Contingency.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span class="pill" id="plan-ai-source-pill">AI Draft</span>
            <span class="pill pill-pass" id="plan-sum-status-pill">Balanced: $1,000 / $1,000</span>
          </div>
        </div>

        <div id="plan-categories-container" class="cat-list"></div>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-hairline); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <label for="input-owner-label" style="font-size: 0.82rem; font-weight: 600; color: var(--ink-secondary);">Signer Identity:</label>
            <input type="text" id="input-owner-label" class="form-input" style="width: 240px;" value="Homeowner (Project Owner)" />
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button type="button" class="btn" id="btn-reset-shed-caps">Reset to Default Caps</button>
            <button type="button" class="btn btn-primary" id="btn-sign-mandate">
              Sign Mandate v1 (Lock SHA-256 Envelope)
            </button>
          </div>
        </div>

        <div id="signed-mandate-banner" class="hash-box hidden">
          <div>
            <div style="font-weight: 600; color: var(--pass-ink);">✓ Mandate Signed &amp; Locked (Agent Cannot Amend Caps)</div>
            <div style="margin-top: 0.25rem; color: var(--ink-secondary); word-break: break-all;">
              SHA-256 Hash: <strong id="signed-mandate-hash-text"></strong>
            </div>
          </div>
          <button type="button" class="btn btn-primary" id="btn-goto-proposals">
            Proceed to Agent Proposals →
          </button>
        </div>
      </div>
    </section>

    <!-- SCREEN 3: DASHBOARD -->
    <section id="screen-dashboard" class="screen-section hidden">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Mandate Budget</div>
          <div class="kpi-value" id="dash-total-budget">$1,000</div>
          <div class="kpi-sub" id="dash-goal-label">Goal: Build a shed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Spent (PayPal Captured)</div>
          <div class="kpi-value" id="dash-total-spent">$0</div>
          <div class="kpi-sub" id="dash-spent-pct">0% of total budget</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Left for Rest of Project</div>
          <div class="kpi-value" id="dash-remaining">$1,000</div>
          <div class="kpi-sub" id="dash-reserve-sub">Required essential reserve: $810</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Project Still Finishable? (G5)</div>
          <div class="kpi-value" id="dash-finishable-badge" style="color: var(--pass-ink);">YES — INTACT</div>
          <div class="kpi-sub" id="dash-finishable-sub">All essential categories fundable</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Per-Category Spent vs. Signed Cap</h2>
            <p class="card-subtitle">Live tracking of PayPal sandbox captures against each signed category allowance.</p>
          </div>
          <div id="dash-mandate-hash-pill" class="pill">Mandate Hash: —</div>
        </div>
        <div id="dashboard-categories-list" class="cat-list"></div>
      </div>
    </section>

    <!-- SCREEN 4: PROPOSALS & 5 VALUE GATES -->
    <section id="screen-proposals" class="screen-section hidden">
      <div class="grid-2">
        <div>
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Seeded Agent Proposals (PDD §10 Scenario)</h2>
                <p class="card-subtitle">Run the four canonical proposals in sequence to test PASS, DENY (the $920 trap), Fair Alternative PASS, and ESCALATE.</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <button type="button" class="btn btn-pass" id="card-btn-prop-1" style="justify-content: space-between; text-align: left; padding: 0.75rem;">
                <div>
                  <div style="font-weight: 700;">1. Framing Lumber Package</div>
                  <div style="font-size: 0.76rem; opacity: 0.9;">Quote: $285 vs $300 ref · Cap $320</div>
                </div>
                <span class="mono" style="font-size: 0.75rem;">PASS →</span>
              </button>

              <button type="button" class="btn btn-trap" id="card-btn-prop-2" style="justify-content: space-between; text-align: left; padding: 0.75rem;">
                <div>
                  <div style="font-weight: 700;">2. Designer Roofing (THE TRAP)</div>
                  <div style="font-size: 0.76rem;">Quote: $920 vs $175 ref · Cap $180</div>
                </div>
                <span class="mono" style="font-size: 0.75rem;">DENY →</span>
              </button>

              <button type="button" class="btn btn-pass" id="card-btn-prop-3" style="justify-content: space-between; text-align: left; padding: 0.75rem;">
                <div>
                  <div style="font-weight: 700;">3. Standard Metal Roofing Kit</div>
                  <div style="font-size: 0.76rem; opacity: 0.9;">Quote: $165 vs $175 ref · Cap $180</div>
                </div>
                <span class="mono" style="font-size: 0.75rem;">PASS →</span>
              </button>

              <button type="button" class="btn btn-escalate" id="card-btn-prop-4" style="justify-content: space-between; text-align: left; padding: 0.75rem;">
                <div>
                  <div style="font-weight: 700;">4. Hinges &amp; Latch Set</div>
                  <div style="font-size: 0.76rem;">Quote: $52 vs $40 ref (1.30×)</div>
                </div>
                <span class="mono" style="font-size: 0.75rem;">ESCALATE →</span>
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Evaluated Proposals &amp; Five-Gate Checklists</h2>
                <p class="card-subtitle">Every proposal expands to show all 5 gates (G1–G5), the numbers compared, reason codes, and PayPal Sandbox capture status.</p>
              </div>
            </div>
            <div id="proposals-feed" class="proposal-list">
              <div style="padding: 1.5rem; text-align: center; color: var(--ink-muted); font-size: 0.88rem;">
                No purchase proposals submitted yet. Click Proposal 1 above or submit a custom proposal on the right.
              </div>
            </div>
          </div>
        </div>

        <!-- Manual Proposal Form for Judges -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Submit Custom Agent Proposal</h2>
              <p class="card-subtitle">Test your own item and price against the active mandate and curated reference catalog.</p>
            </div>
          </div>
          <form id="form-manual-proposal">
            <div class="form-group">
              <label class="form-label" for="select-ref-preset">Curated Reference Item (or choose Custom Unpriced Item)</label>
              <select id="select-ref-preset" class="form-select">
                <option value="">-- Custom / Unpriced Item (triggers NO_REFERENCE_PRICE → ESCALATE) --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="input-prop-item-name">Item Name</label>
              <input type="text" id="input-prop-item-name" class="form-input" placeholder="e.g., Single shed door, pre-hung" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="select-prop-category">Budget Category</label>
              <select id="select-prop-category" class="form-select" required></select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="input-prop-price">Quoted Price (USD $)</label>
                <input type="number" id="input-prop-price" class="form-input mono" step="0.01" min="1" value="105" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="input-prop-vendor">Vendor Name</label>
                <input type="text" id="input-prop-vendor" class="form-input" value="Builders Depot" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="input-prop-justification">Agent Justification</label>
              <input type="text" id="input-prop-justification" class="form-input" value="Required material to complete project milestone." />
            </div>
            <button type="submit" class="btn btn-primary" id="btn-submit-manual-proposal" style="width: 100%; justify-content: center;">
              Evaluate Proposal Through 5 Value Gates
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- SCREEN 5: AUDIT LOG -->
    <section id="screen-audit" class="screen-section hidden">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">5. Append-Only Hash-Chained Audit Log</h2>
            <p class="card-subtitle">Every mandate signature, proposal evaluation, owner override, and PayPal sandbox capture is cryptographically chained.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span class="pill pill-pass" id="audit-chain-status-pill">Chain Status: Verified OK</span>
            <button type="button" class="btn btn-primary" id="btn-verify-audit-chain">
              Verify Hash Chain Integrity
            </button>
          </div>
        </div>
        <div id="audit-events-container" class="audit-list"></div>
      </div>
    </section>
  </main>

  <footer class="footer">
    PrismPay — A budget-aware fiduciary allowance gate for AI purchasing agents · Payments execute in the <strong>PayPal Sandbox</strong> only · Reference prices are curated planning estimates · MIT License
  </footer>

  <div id="toast-box" class="toast hidden"></div>

  <script>
    (function() {
      const state = {
        meta: null,
        project: null,
        draftCategories: [],
        draftSource: 'seeded_fallback',
        mandate: null,
        dashboard: null,
        proposals: [],
        auditEvents: [],
        auditVerification: null,
      };

      function fmtDollars(cents) {
        const sign = cents < 0 ? '-' : '';
        const abs = Math.abs(Math.round(cents));
        const whole = Math.floor(abs / 100).toLocaleString('en-US');
        const frac = abs % 100;
        return frac === 0 ? sign + '$' + whole : sign + '$' + whole + '.' + String(frac).padStart(2, '0');
      }

      function showToast(msg) {
        const el = document.getElementById('toast-box');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => el.classList.add('hidden'), 4200);
      }

      function switchScreen(screenName) {
        document.querySelectorAll('.screen-section').forEach((sec) => {
          sec.classList.add('hidden');
        });
        const target = document.getElementById('screen-' + screenName);
        if (target) target.classList.remove('hidden');

        document.querySelectorAll('.nav-tab').forEach((btn) => {
          btn.classList.toggle('active', btn.getAttribute('data-screen') === screenName);
        });
      }

      document.querySelectorAll('.nav-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchScreen(btn.getAttribute('data-screen'));
        });
      });

      async function fetchMeta() {
        const res = await fetch('/api/meta');
        state.meta = await res.json();
        populateReferencePresetDropdown();
      }

      function populateReferencePresetDropdown() {
        if (!state.meta) return;
        const sel = document.getElementById('select-ref-preset');
        sel.innerHTML = '<option value="">-- Custom / Unpriced Item (triggers NO_REFERENCE_PRICE → ESCALATE) --</option>';
        state.meta.reference_prices.forEach((item) => {
          const opt = document.createElement('option');
          opt.value = item.item_id;
          opt.textContent = item.name + ' (' + item.category + ' · Ref median ' + fmtDollars(item.reference_median_cents) + ')';
          sel.appendChild(opt);
        });

        sel.addEventListener('change', () => {
          const chosen = state.meta.reference_prices.find((r) => r.item_id === sel.value);
          if (chosen) {
            document.getElementById('input-prop-item-name').value = chosen.name;
            document.getElementById('input-prop-price').value = (chosen.reference_median_cents / 100).toFixed(0);
            const catSel = document.getElementById('select-prop-category');
            for (let i = 0; i < catSel.options.length; i++) {
              if (catSel.options[i].value === chosen.category) {
                catSel.selectedIndex = i;
                break;
              }
            }
          }
        });
      }

      async function refreshProjectState(projectId) {
        const [projRes, auditRes] = await Promise.all([
          fetch('/api/projects/' + projectId),
          fetch('/api/projects/' + projectId + '/audit'),
        ]);
        if (!projRes.ok) return;
        const data = await projRes.json();
        const auditData = await auditRes.json();

        state.project = data.project;
        state.mandate = data.mandate;
        state.dashboard = data.dashboard;
        state.proposals = data.proposals || [];
        state.auditEvents = auditData.events || [];
        state.auditVerification = auditData.verification;

        if (state.mandate) {
          state.draftCategories = state.mandate.categories.map((c) => ({ ...c }));
        }

        renderHeaderAndJudgeBar();
        renderPlanScreen();
        renderDashboardScreen();
        renderProposalsScreen();
        renderAuditScreen();
      }

      function renderHeaderAndJudgeBar() {
        const mandatePill = document.getElementById('header-mandate-pill');
        const activeBadge = document.getElementById('active-project-badge');
        const statusDesc = document.getElementById('judge-banner-status');
        const propCount = document.getElementById('nav-proposal-count');
        const auditCount = document.getElementById('nav-audit-count');

        propCount.textContent = String(state.proposals.length);
        auditCount.textContent = String(state.auditEvents.length);

        const quickBtns = [
          'btn-quick-prop-1',
          'btn-quick-prop-2',
          'btn-quick-prop-3',
          'btn-quick-prop-4',
        ].map((id) => document.getElementById(id));

        if (!state.project) {
          mandatePill.textContent = 'Mandate: Unsigned';
          mandatePill.className = 'pill';
          activeBadge.textContent = 'No Active Project';
          quickBtns.forEach((b) => b.classList.add('hidden'));
          return;
        }

        activeBadge.textContent = state.project.goal_text + ' (' + fmtDollars(state.project.total_budget_cents) + ')';

        if (state.mandate) {
          const shortHash = state.mandate.sha256_hash.slice(0, 12) + '…';
          mandatePill.textContent = 'Mandate v' + state.mandate.version + ': ' + shortHash;
          mandatePill.className = 'pill pill-pass';
          statusDesc.innerHTML = 'Mandate v' + state.mandate.version + ' signed (SHA-256: <code class="mono">' + shortHash + '</code>). Click the numbered proposal buttons on the right to run the demo sequence:';
          quickBtns.forEach((b) => b.classList.remove('hidden'));
        } else {
          mandatePill.textContent = 'Mandate: Draft (Unsigned)';
          mandatePill.className = 'pill pill-escalate';
          statusDesc.textContent = 'Project created. Review the category breakdown below and click "Sign Mandate v1" to unlock agent purchasing.';
          quickBtns.forEach((b) => b.classList.add('hidden'));
        }

        // Populate category dropdown in manual proposal form
        const catSel = document.getElementById('select-prop-category');
        const cats = state.mandate ? state.mandate.categories : state.draftCategories;
        catSel.innerHTML = '';
        cats.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name + ' (Cap: ' + fmtDollars(c.cap_cents) + ')';
          catSel.appendChild(opt);
        });
      }

      function renderPlanScreen() {
        if (!state.project) return;
        const container = document.getElementById('plan-categories-container');
        const sumPill = document.getElementById('plan-sum-status-pill');
        const signBtn = document.getElementById('btn-sign-mandate');
        const signedBanner = document.getElementById('signed-mandate-banner');
        const hashText = document.getElementById('signed-mandate-hash-text');

        const totalBudget = state.project.total_budget_cents;
        const currentSum = state.draftCategories.reduce((s, c) => s + Number(c.cap_cents || 0), 0);
        const diff = totalBudget - currentSum;

        const contingencyCat = state.draftCategories.find((c) => c.name.toLowerCase() === 'contingency');
        const minCont = Math.floor(totalBudget * 0.10);
        const contOk = contingencyCat && contingencyCat.cap_cents >= minCont;

        if (diff === 0 && contOk) {
          sumPill.textContent = 'Balanced: ' + fmtDollars(currentSum) + ' / ' + fmtDollars(totalBudget);
          sumPill.className = 'pill pill-pass';
          signBtn.disabled = false;
        } else if (diff !== 0) {
          sumPill.textContent = 'Unbalanced: ' + fmtDollars(currentSum) + ' / ' + fmtDollars(totalBudget) + ' (' + (diff > 0 ? fmtDollars(diff) + ' unallocated' : fmtDollars(-diff) + ' over') + ')';
          sumPill.className = 'pill pill-deny';
          signBtn.disabled = true;
        } else {
          sumPill.textContent = 'Contingency below 10% minimum (' + fmtDollars(minCont) + ')';
          sumPill.className = 'pill pill-deny';
          signBtn.disabled = true;
        }

        container.innerHTML = '';
        state.draftCategories.forEach((cat, idx) => {
          const pct = totalBudget > 0 ? Math.min(100, Math.round((cat.cap_cents / totalBudget) * 100)) : 0;
          const row = document.createElement('div');
          row.className = 'cat-row';
          row.innerHTML = \`
            <div class="cat-row-top">
              <div class="cat-name">
                <span>\${cat.name}</span>
                \${cat.essential ? '<span class="pill pill-paypal">Essential</span>' : '<span class="pill">Reserve Buffer</span>'}
              </div>
              <div class="cat-figures">
                \${cat.essential ? '<span>Ref Estimate: ' + fmtDollars(cat.reference_estimate_cents) + '</span>' : '<span>Min 10% required</span>'}
                <label style="display: inline-flex; align-items: center; gap: 0.3rem;">
                  Cap ($):
                  <input type="number" class="form-input mono input-cat-cap" data-idx="\${idx}" value="\${(cat.cap_cents / 100).toFixed(0)}" min="0" step="5" style="width: 95px; padding: 0.25rem 0.45rem; font-size: 0.84rem;" />
                </label>
              </div>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: \${pct}%;"></div>
            </div>
            \${cat.rationale ? '<div style="font-size: 0.77rem; color: var(--ink-secondary); margin-top: 0.4rem;">' + cat.rationale + '</div>' : ''}
          \`;
          container.appendChild(row);
        });

        container.querySelectorAll('.input-cat-cap').forEach((input) => {
          input.addEventListener('input', (e) => {
            const idx = Number(e.target.getAttribute('data-idx'));
            const dollars = Number(e.target.value || 0);
            state.draftCategories[idx].cap_cents = Math.max(0, Math.round(dollars * 100));
            renderPlanScreen();
          });
        });

        if (state.mandate) {
          signedBanner.classList.remove('hidden');
          hashText.textContent = state.mandate.sha256_hash;
        } else {
          signedBanner.classList.add('hidden');
        }
      }

      function renderDashboardScreen() {
        if (!state.project || !state.dashboard) return;
        const d = state.dashboard;

        document.getElementById('dash-total-budget').textContent = fmtDollars(d.total_budget_cents);
        document.getElementById('dash-goal-label').textContent = 'Goal: ' + state.project.goal_text;
        document.getElementById('dash-total-spent').textContent = fmtDollars(d.total_spent_cents);
        const pct = d.total_budget_cents > 0 ? Math.round((d.total_spent_cents / d.total_budget_cents) * 100) : 0;
        document.getElementById('dash-spent-pct').textContent = pct + '% of total budget captured via PayPal';
        document.getElementById('dash-remaining').textContent = fmtDollars(d.remaining_cents);
        document.getElementById('dash-reserve-sub').textContent = 'Required reserve for unfinished essentials: ' + fmtDollars(d.required_reserve_cents);

        const finBadge = document.getElementById('dash-finishable-badge');
        const finSub = document.getElementById('dash-finishable-sub');
        if (d.project_finishable) {
          finBadge.textContent = 'YES — FINISHABLE';
          finBadge.style.color = 'var(--pass-ink)';
          finSub.textContent = fmtDollars(d.remaining_cents) + ' left covers ' + fmtDollars(d.required_reserve_cents) + ' essential reserve';
        } else {
          finBadge.textContent = 'NO — UNFINISHABLE';
          finBadge.style.color = 'var(--deny-ink)';
          finSub.textContent = 'Remaining budget insufficient for unfinished essentials';
        }

        const hashPill = document.getElementById('dash-mandate-hash-pill');
        if (state.mandate) {
          hashPill.textContent = 'Signed Mandate SHA-256: ' + state.mandate.sha256_hash.slice(0, 16) + '…';
        }

        const list = document.getElementById('dashboard-categories-list');
        list.innerHTML = '';
        (d.categories || []).forEach((cat) => {
          const fillPct = cat.cap_cents > 0 ? Math.min(100, Math.round((cat.spent_cents / cat.cap_cents) * 100)) : 0;
          const barClass = cat.spent_cents > cat.cap_cents ? 'over' : cat.spent_cents > 0 ? 'pass' : '';
          const row = document.createElement('div');
          row.className = 'cat-row';
          row.innerHTML = \`
            <div class="cat-row-top">
              <div class="cat-name">
                <span>\${cat.name}</span>
                \${cat.essential ? (cat.spent_cents > 0 ? '<span class="pill pill-pass">Essential · Funded</span>' : '<span class="pill">Essential · Reserve ' + fmtDollars(cat.reference_estimate_cents) + '</span>') : '<span class="pill">Contingency Reserve</span>'}
              </div>
              <div class="cat-figures">
                <span>Spent: <strong>\${fmtDollars(cat.spent_cents)}</strong> / Cap: <strong>\${fmtDollars(cat.cap_cents)}</strong></span>
                <span>Left in Cap: \${fmtDollars(cat.remaining_cap_cents)}</span>
              </div>
            </div>
            <div class="progress-track">
              <div class="progress-fill \${barClass}" style="width: \${fillPct}%;"></div>
            </div>
          \`;
          list.appendChild(row);
        });
      }

      function renderProposalsScreen() {
        const feed = document.getElementById('proposals-feed');
        if (!state.proposals || state.proposals.length === 0) {
          feed.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--ink-muted); font-size: 0.88rem;">No purchase proposals submitted yet. Click Proposal 1 above to start the walkthrough.</div>';
          return;
        }

        feed.innerHTML = '';
        // Show newest proposals at the top or chronological? Chronological makes the story arc 1 -> 2 -> 3 super clear!
        state.proposals.forEach((item, index) => {
          const p = item.proposal;
          const gates = item.gates || [];
          const pay = item.payment;

          const g4 = gates.find((g) => g.gate === 'G4');
          const refCents = g4 && g4.detail_numbers ? g4.detail_numbers.reference_price_cents : null;
          const failedGates = gates.filter((g) => g.outcome !== 'pass');

          let badgeHtml = '';
          if (p.decision === 'paid') {
            badgeHtml = '<span class="pill pill-pass">PASS · PAID VIA PAYPAL SANDBOX</span>';
          } else if (p.decision === 'DENY') {
            badgeHtml = '<span class="pill pill-deny">DENIED · ' + failedGates.length + ' GATES FIRED (NO PAYPAL CALL)</span>';
          } else if (p.decision === 'ESCALATE') {
            badgeHtml = '<span class="pill pill-escalate">ESCALATED · AWAITING OWNER DECISION</span>';
          } else if (p.decision === 'rejected') {
            badgeHtml = '<span class="pill pill-deny">ESCALATION REJECTED BY OWNER</span>';
          } else {
            badgeHtml = '<span class="pill">' + p.decision + '</span>';
          }

          let calloutHtml = '';
          if (p.decision === 'DENY') {
            const reasonsList = failedGates.map((g) => '<li><strong>' + g.gate + ' (' + g.gate_name + ' — ' + g.reason_code + '):</strong> ' + g.explanation + '</li>').join('');
            calloutHtml = \`
              <div class="proposal-Callout-DENY">
                <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 0.35rem;">
                  ✕ Purchase Blocked Before PayPal — No PayPal Order Created
                </div>
                <ul style="padding-left: 1.2rem; font-size: 0.84rem; display: flex; flex-direction: column; gap: 0.25rem;">
                  \${reasonsList}
                </ul>
              </div>
            \`;
          } else if (p.decision === 'ESCALATE') {
            const reasonsList = failedGates.map((g) => '<li><strong>' + g.gate + ' (' + g.reason_code + '):</strong> ' + g.explanation + '</li>').join('');
            calloutHtml = \`
              <div class="proposal-Callout-ESCALATE">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem;">
                      ⚠ Escalated for Owner Review
                    </div>
                    <ul style="padding-left: 1.2rem; font-size: 0.83rem;">\${reasonsList}</ul>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-pass btn-approve-escalate" data-id="\${p.id}">Approve &amp; Pay via PayPal</button>
                    <button type="button" class="btn btn-trap btn-reject-escalate" data-id="\${p.id}">Reject Proposal</button>
                  </div>
                </div>
              </div>
            \`;
          } else if (pay && pay.status === 'captured') {
            calloutHtml = \`
              <div class="proposal-Callout-PASS">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.83rem;">
                  <span><strong>✓ All Gates Authorized:</strong> Paid <strong>\${fmtDollars(pay.amount_cents)}</strong> via PayPal Sandbox</span>
                  <span class="mono">Order ID: <strong>\${pay.paypal_order_id}</strong> · Capture ID: <strong>\${pay.paypal_capture_id}</strong></span>
                </div>
              </div>
            \`;
          }

          const gateRowsHtml = gates.map((g) => {
            const pillClass = g.outcome === 'pass' ? 'pill-pass' : g.outcome === 'escalate' ? 'pill-escalate' : 'pill-deny';
            return \`
              <tr>
                <td class="mono" style="font-weight: 600; white-space: nowrap;">\${g.gate} · \${g.gate_name}</td>
                <td><span class="pill \${pillClass}">\${g.outcome.toUpperCase()}</span></td>
                <td class="mono" style="font-size: 0.76rem;">\${g.reason_code}</td>
                <td>\${g.explanation}</td>
              </tr>
            \`;
          }).join('');

          const card = document.createElement('div');
          card.className = 'proposal-card state-' + p.decision;
          card.innerHTML = \`
            <div class="proposal-summary">
              <div>
                <div style="display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap;">
                  <span class="mono" style="font-size: 0.78rem; color: var(--ink-muted);">#\${index + 1}</span>
                  <strong style="font-size: 0.98rem;">\${p.item_name}</strong>
                  <span class="pill">\${p.category}</span>
                  <span style="font-size: 0.8rem; color: var(--ink-secondary);">Vendor: \${p.vendor}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--ink-secondary); margin-top: 0.25rem;">
                  \${p.justification}
                </div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
                <div class="mono" style="font-size: 1.1rem; font-weight: 700;">
                  Quote: \${fmtDollars(p.quoted_price_cents)}
                  <span style="font-size: 0.78rem; font-weight: 400; color: var(--ink-secondary);">
                    (Ref: \${refCents ? fmtDollars(refCents) : 'Unpriced'})
                  </span>
                </div>
                \${badgeHtml}
              </div>
            </div>
            \${calloutHtml}
            <div style="padding: 0.75rem 1.2rem; background: var(--bg-elevated);">
              <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-muted); margin-bottom: 0.45rem;">
                Five Value Gates Evaluation Breakdown
              </div>
              <table class="gate-table">
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Outcome</th>
                    <th>Reason Code</th>
                    <th>Plain-English Comparison &amp; Math</th>
                  </tr>
                </thead>
                <tbody>
                  \${gateRowsHtml}
                </tbody>
              </table>
            </div>
          \`;
          feed.appendChild(card);
        });

        feed.querySelectorAll('.btn-approve-escalate').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Approving & Capturing PayPal…';
            const res = await fetch('/api/proposals/' + id + '/approve', { method: 'POST' });
            if (res.ok) {
              showToast('Escalation approved — PayPal Sandbox payment captured.');
              await refreshProjectState(state.project.id);
            } else {
              const err = await res.json();
              showToast('Error: ' + (err.error || 'Failed to approve'));
              btn.disabled = false;
            }
          });
        });

        feed.querySelectorAll('.btn-reject-escalate').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            const res = await fetch('/api/proposals/' + id + '/reject', { method: 'POST' });
            if (res.ok) {
              showToast('Escalated proposal rejected — no payment created.');
              await refreshProjectState(state.project.id);
            }
          });
        });
      }

      function renderAuditScreen() {
        const container = document.getElementById('audit-events-container');
        const statusPill = document.getElementById('audit-chain-status-pill');

        if (state.auditVerification && state.auditVerification.valid) {
          statusPill.textContent = '✓ Chain Verified (' + state.auditVerification.checked_count + ' events intact)';
          statusPill.className = 'pill pill-pass';
        } else if (state.auditVerification && !state.auditVerification.valid) {
          statusPill.textContent = '✕ Chain Broken at seq ' + state.auditVerification.broken_at_seq;
          statusPill.className = 'pill pill-deny';
        }

        if (!state.auditEvents || state.auditEvents.length === 0) {
          container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--ink-muted);">No audit events recorded yet.</div>';
          return;
        }

        container.innerHTML = '';
        state.auditEvents.forEach((ev) => {
          const row = document.createElement('div');
          row.className = 'audit-item';
          const summary = formatAuditSummary(ev);
          const typeClass =
            ev.type.includes('CAPTURED') || ev.type.includes('SIGNED') || ev.type.includes('APPROVED')
              ? 'pill-pass'
              : ev.type.includes('FAILED') || ev.type.includes('REJECTED') || (ev.payload && ev.payload.decision === 'DENY')
                ? 'pill-deny'
                : 'pill-paypal';

          row.innerHTML = \`
            <div class="mono" style="font-weight: 600; color: var(--ink-muted);">#\${ev.seq}</div>
            <div><span class="pill \${typeClass}">\${ev.type}</span></div>
            <div style="font-size: 0.84rem; color: var(--ink-primary);">\${summary}</div>
            <div class="mono" style="font-size: 0.72rem; color: var(--ink-muted); text-align: right;" title="Prev: \${ev.prev_hash}\\nHash: \${ev.event_hash}">
              <div>hash: \${ev.event_hash.slice(0, 14)}…</div>
              <div>prev: \${ev.prev_hash === 'GENESIS' ? 'GENESIS' : ev.prev_hash.slice(0, 14) + '…'}</div>
            </div>
          \`;
          container.appendChild(row);
        });
      }

      function formatAuditSummary(ev) {
        const p = ev.payload || {};
        switch (ev.type) {
          case 'PROJECT_CREATED':
            return 'Created project "' + p.goal_text + '" with total budget ' + fmtDollars(p.total_budget_cents);
          case 'BREAKDOWN_PROPOSED':
            return 'Generated ' + p.category_count + '-category breakdown (' + p.source + ')';
          case 'MANDATE_SIGNED':
            return 'Owner (' + p.owner_label + ') signed Mandate v' + p.version + ' · SHA-256: ' + String(p.sha256_hash).slice(0, 16) + '…';
          case 'PROPOSAL_CREATED':
            return 'Proposed "' + p.item_name + '" from ' + p.vendor + ' at ' + fmtDollars(p.quoted_price_cents) + ' (' + p.category + ')';
          case 'PROPOSAL_EVALUATED':
            return 'Evaluated "' + p.item_name + '" (' + fmtDollars(p.quoted_price_cents) + ') → Decision: ' + p.decision + (p.reason_codes && p.reason_codes.length ? ' [' + p.reason_codes.join(', ') + ']' : ' [All 5 gates OK]');
          case 'PAYMENT_CREATED':
            return 'Created PayPal Sandbox Order ' + p.paypal_order_id + ' for ' + fmtDollars(p.amount_cents);
          case 'PAYMENT_CAPTURED':
            return 'Captured PayPal Sandbox Payment ' + p.paypal_capture_id + ' (' + fmtDollars(p.amount_cents) + ')';
          case 'OWNER_OVERRIDE_APPROVED':
            return 'Owner approved escalated proposal "' + p.item_name + '" (' + fmtDollars(p.quoted_price_cents) + ')';
          case 'OWNER_OVERRIDE_REJECTED':
            return 'Owner rejected escalated proposal "' + p.item_name + '" (' + fmtDollars(p.quoted_price_cents) + ')';
          case 'PAYMENT_FAILED':
            return 'PayPal Sandbox capture failed: ' + p.error;
          default:
            return JSON.stringify(p);
        }
      }

      // Event Listeners: Create Project Form (Flow A)
      document.getElementById('form-create-project').addEventListener('submit', async (e) => {
        e.preventDefault();
        const goal = document.getElementById('input-goal-text').value.trim();
        const budgetDollars = Number(document.getElementById('input-total-budget').value || 1000);
        const btn = document.getElementById('btn-create-project');
        btn.disabled = true;
        btn.textContent = 'Generating AI Breakdown…';

        try {
          const createRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goal_text: goal,
              total_budget_cents: Math.round(budgetDollars * 100),
            }),
          });
          const createData = await createRes.json();
          const projectId = createData.project.id;

          const bdRes = await fetch('/api/projects/' + projectId + '/breakdown', {
            method: 'POST',
          });
          const bdData = await bdRes.json();
          state.draftCategories = bdData.categories;
          state.draftSource = bdData.source;
          document.getElementById('plan-ai-source-pill').textContent =
            bdData.source === 'ai_live' ? 'AI Generated (' + bdData.model_used + ')' : 'Deterministic Planner (' + bdData.model_used + ')';

          await refreshProjectState(projectId);
          switchScreen('plan');
          showToast('Draft budget breakdown ready — review caps and click Sign Mandate v1.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Generate AI Budget Breakdown →';
        }
      });

      // One-Click Load Shed Demo
      async function loadShedDemoAndSign() {
        const res = await fetch('/api/demo/shed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sign_immediately: true }),
        });
        const data = await res.json();
        state.draftCategories = data.categories;
        await refreshProjectState(data.project.id);
        switchScreen('proposals');
        showToast('Loaded $1,000 Shed Demo & signed Mandate v1! Click Proposal 1, 2 (The Trap), or 3.');
      }

      document.getElementById('btn-quick-load-shed').addEventListener('click', loadShedDemoAndSign);
      document.getElementById('btn-load-shed-hero').addEventListener('click', loadShedDemoAndSign);

      document.getElementById('btn-reset-shed-caps').addEventListener('click', () => {
        if (state.meta && state.meta.shed_demo) {
          state.draftCategories = state.meta.shed_demo.categories.map((c) => ({ ...c }));
          renderPlanScreen();
        }
      });

      // Sign Mandate Button
      document.getElementById('btn-sign-mandate').addEventListener('click', async () => {
        if (!state.project) return;
        const ownerLabel = document.getElementById('input-owner-label').value.trim() || 'Project Owner';
        const btn = document.getElementById('btn-sign-mandate');
        btn.disabled = true;
        btn.textContent = 'Signing Mandate…';

        try {
          const res = await fetch('/api/projects/' + state.project.id + '/mandate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categories: state.draftCategories,
              owner_label: ownerLabel,
            }),
          });
          if (!res.ok) {
            const err = await res.json();
            showToast('Error: ' + err.error);
            return;
          }
          await refreshProjectState(state.project.id);
          showToast('Mandate v1 cryptographically signed and locked!');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Sign Mandate v1 (Lock SHA-256 Envelope)';
        }
      });

      document.getElementById('btn-goto-proposals').addEventListener('click', () => {
        switchScreen('proposals');
      });

      // Run a seeded proposal (1, 2, 3, 4)
      async function runSeededProposal(stepNumber) {
        if (!state.project || !state.mandate) {
          await loadShedDemoAndSign();
        }
        const spec = state.meta.shed_demo.proposals.find((p) => p.step === stepNumber);
        if (!spec) return;

        const res = await fetch('/api/projects/' + state.project.id + '/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: spec.item_id,
            item_name: spec.item_name,
            vendor: spec.vendor,
            category: spec.category,
            quoted_price_cents: spec.quoted_price_cents,
            quantity: spec.quantity,
            justification: spec.justification,
            source: 'seeded',
          }),
        });
        const data = await res.json();
        await refreshProjectState(state.project.id);
        switchScreen('proposals');

        if (data.gate_evaluation === 'DENY') {
          showToast('DENIED! ' + data.reason_codes.length + ' gates fired (' + data.reason_codes.join(', ') + '). No PayPal order created.');
        } else if (data.gate_evaluation === 'PASS') {
          showToast('PASS! Paid ' + fmtDollars(spec.quoted_price_cents) + ' via PayPal Sandbox (Capture: ' + (data.payment ? data.payment.paypal_capture_id : 'ok') + ').');
        } else {
          showToast('ESCALATED (' + data.reason_codes.join(', ') + ') — awaiting owner approval.');
        }
      }

      [1, 2, 3, 4].forEach((step) => {
        document.getElementById('btn-quick-prop-' + step).addEventListener('click', () => runSeededProposal(step));
        document.getElementById('card-btn-prop-' + step).addEventListener('click', () => runSeededProposal(step));
      });

      // Manual Proposal Submission
      document.getElementById('form-manual-proposal').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.project || !state.mandate) {
          showToast('Please load or sign a project mandate first.');
          return;
        }
        const item_id = document.getElementById('select-ref-preset').value || null;
        const item_name = document.getElementById('input-prop-item-name').value.trim();
        const category = document.getElementById('select-prop-category').value;
        const priceDollars = Number(document.getElementById('input-prop-price').value || 0);
        const vendor = document.getElementById('input-prop-vendor').value.trim();
        const justification = document.getElementById('input-prop-justification').value.trim();

        const res = await fetch('/api/projects/' + state.project.id + '/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id,
            item_name,
            vendor,
            category,
            quoted_price_cents: Math.round(priceDollars * 100),
            quantity: 1,
            justification,
            source: 'manual',
          }),
        });
        const data = await res.json();
        await refreshProjectState(state.project.id);
        showToast('Evaluated "' + item_name + '" → ' + data.gate_evaluation);
      });

      // Verify Audit Chain Button
      document.getElementById('btn-verify-audit-chain').addEventListener('click', async () => {
        if (!state.project) return;
        const res = await fetch('/api/projects/' + state.project.id + '/audit/verify', {
          method: 'POST',
        });
        const data = await res.json();
        state.auditVerification = data.verification;
        renderAuditScreen();
        if (data.verification.valid) {
          showToast('Audit chain verified: all ' + data.verification.checked_count + ' SHA-256 event hashes intact.');
        } else {
          showToast('Audit chain tampering detected at seq ' + data.verification.broken_at_seq);
        }
      });

      fetchMeta();
    })();
  </script>
</body>
</html>`;
}
