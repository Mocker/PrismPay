export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PrismPay — Fiduciary Allowance Gate for AI Purchasing Agents</title>
  <meta name="description" content="A budget-aware allowance gate for AI purchasing agents. Signed mandates, 5 deterministic value gates, and PayPal Sandbox integration." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-page: #f8f9fa;
      --bg-surface: #ffffff;
      --bg-subtle: #f1f3f5;
      --bg-elevated: #ffffff;
      
      --ink-primary: #111827;
      --ink-secondary: #4b5563;
      --ink-muted: #6b7280;
      
      --border-subtle: #e5e7eb;
      --border-strong: #d1d5db;
      
      --brand-navy: #003087;
      --brand-blue: #0070ba;
      --brand-accent: #0284c7;
      --brand-light: #f0f7ff;
      
      --pass: #059669;
      --pass-bg: #ecfdf5;
      --pass-border: #a7f3d0;
      --pass-ink: #065f46;
      
      --escalate: #d97706;
      --escalate-bg: #fffbeb;
      --escalate-border: #fde68a;
      --escalate-ink: #92400e;
      
      --deny: #dc2626;
      --deny-bg: #fef2f2;
      --deny-border: #fecaca;
      --deny-ink: #991b1b;
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-full: 9999px;
      
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
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

    /* Top Navigation */
    .header {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--brand-navy), var(--brand-blue));
      color: white;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: -0.03em;
      box-shadow: 0 2px 4px rgba(0, 48, 135, 0.2);
    }

    .brand-text h1 {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .brand-tagline {
      font-size: 0.75rem;
      color: var(--ink-muted);
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      white-space: nowrap;
    }

    .pill-paypal {
      background: var(--brand-light);
      color: var(--brand-navy);
      border-color: #bfdbfe;
    }

    .pill-pass {
      background: var(--pass-bg);
      color: var(--pass-ink);
      border-color: var(--pass-border);
    }

    .pill-deny {
      background: var(--deny-bg);
      color: var(--deny-ink);
      border-color: var(--deny-border);
    }

    .pill-escalate {
      background: var(--escalate-bg);
      color: var(--escalate-ink);
      border-color: var(--escalate-border);
    }

    /* Buttons */
    .btn {
      appearance: none;
      border: 1px solid var(--border-strong);
      background: var(--bg-surface);
      color: var(--ink-primary);
      font-family: var(--font-sans);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn:hover:not(:disabled) {
      background: var(--bg-subtle);
      border-color: var(--ink-muted);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--brand-navy);
      color: white;
      border-color: var(--brand-navy);
    }

    .btn-primary:hover:not(:disabled) {
      background: #002266;
      border-color: #002266;
    }

    .btn-subtle {
      border-color: transparent;
      background: transparent;
      color: var(--ink-secondary);
    }

    .btn-subtle:hover:not(:disabled) {
      background: var(--bg-subtle);
      border-color: transparent;
      color: var(--ink-primary);
    }

    /* Workflow Nav Bar */
    .nav-bar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
    }

    .nav-tabs {
      display: flex;
      gap: 0.25rem;
    }

    .nav-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.75rem 0.95rem;
      font-family: var(--font-sans);
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--ink-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .nav-tab:hover {
      color: var(--ink-primary);
    }

    .nav-tab.active {
      color: var(--brand-navy);
      border-bottom-color: var(--brand-navy);
    }

    .nav-tab-badge {
      font-size: 0.72rem;
      padding: 0.1rem 0.45rem;
      border-radius: var(--radius-full);
      background: var(--bg-subtle);
      color: var(--ink-secondary);
    }

    .nav-tab.active .nav-tab-badge {
      background: var(--brand-light);
      color: var(--brand-navy);
      font-weight: 700;
    }

    /* Main Container */
    .main-content {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem;
      flex: 1;
    }

    /* Clean Hero Demo Strip */
    .hero-strip {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.15rem 1.4rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .hero-strip-left {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      max-width: 600px;
    }

    .hero-title {
      font-size: 0.92rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .hero-desc {
      font-size: 0.8rem;
      color: var(--ink-muted);
    }

    .hero-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* Layout Cards */
    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.4rem;
      box-shadow: var(--shadow-card);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .card-desc {
      font-size: 0.82rem;
      color: var(--ink-muted);
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

    .form-input, .form-select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      font-family: var(--font-sans);
      font-size: 0.88rem;
      color: var(--ink-primary);
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s ease;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--brand-blue);
      box-shadow: 0 0 0 3px rgba(0, 112, 186, 0.12);
    }

    .font-mono {
      font-family: var(--font-mono);
    }

    /* KPI Summary Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 800px) {
      .kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.1rem;
      box-shadow: var(--shadow-sm);
    }

    .kpi-label {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-val {
      font-size: 1.45rem;
      font-weight: 700;
      font-family: var(--font-mono);
      margin-top: 0.3rem;
      color: var(--ink-primary);
    }

    .kpi-sub {
      font-size: 0.76rem;
      color: var(--ink-muted);
      margin-top: 0.2rem;
    }

    /* Category Envelope Rows */
    .cat-item {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.9rem 1.1rem;
      margin-bottom: 0.75rem;
    }

    .cat-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.45rem;
      flex-wrap: wrap;
    }

    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--brand-blue);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-bar-fill.safe { background: var(--pass); }
    .progress-bar-fill.overflow { background: var(--deny); }

    /* Proposals Feed */
    .proposal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      margin-bottom: 1rem;
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: border-color 0.15s ease;
    }

    .proposal-card.pass { border-left: 5px solid var(--pass); }
    .proposal-card.deny { border-left: 5px solid var(--deny); }
    .proposal-card.escalate { border-left: 5px solid var(--escalate); }

    .proposal-header {
      padding: 1.1rem 1.3rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .proposal-headline {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .proposal-title {
      font-size: 0.96rem;
      font-weight: 700;
    }

    .proposal-quote {
      font-family: var(--font-mono);
      font-size: 1.15rem;
      font-weight: 700;
      text-align: right;
    }

    .proposal-callout {
      padding: 0.85rem 1.3rem;
      font-size: 0.84rem;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .proposal-callout.deny {
      background: var(--deny-bg);
      border-color: var(--deny-border);
      color: var(--deny-ink);
    }

    .proposal-callout.pass {
      background: var(--pass-bg);
      border-color: var(--pass-border);
      color: var(--pass-ink);
    }

    .proposal-callout.escalate {
      background: var(--escalate-bg);
      border-color: var(--escalate-border);
      color: var(--escalate-ink);
    }

    .proposal-footer {
      padding: 0.65rem 1.3rem;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gate-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      background: var(--bg-surface);
    }

    .gate-table th, .gate-table td {
      padding: 0.6rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }

    .gate-table th {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-muted);
      background: var(--bg-subtle);
    }

    /* Modal / Technical Details Dialog */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.5);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 780px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.97);
      transition: transform 0.2s ease;
    }

    .modal-overlay.active .modal-box {
      transform: scale(1);
    }

    .modal-header {
      padding: 1.1rem 1.4rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .modal-title {
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-tabs {
      display: flex;
      background: var(--bg-subtle);
      padding: 0.35rem 1.4rem;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
      overflow-x: auto;
    }

    .modal-tab-btn {
      background: transparent;
      border: none;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ink-muted);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
    }

    .modal-tab-btn.active {
      background: var(--bg-surface);
      color: var(--brand-navy);
      box-shadow: var(--shadow-sm);
    }

    .modal-body {
      padding: 1.4rem;
      overflow-y: auto;
      font-size: 0.85rem;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    .modal-section {
      display: none;
    }

    .modal-section.active {
      display: block;
    }

    /* Grid 2 Column */
    .grid-2 {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 880px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .hidden {
      display: none !important;
    }

    .footer {
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      padding: 1rem 1.5rem;
      font-size: 0.78rem;
      color: var(--ink-muted);
      text-align: center;
    }

    .toast {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      background: var(--ink-primary);
      color: white;
      padding: 0.75rem 1.1rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      box-shadow: var(--shadow-lg);
      z-index: 120;
      max-width: 380px;
    }
  </style>
</head>
<body>

  <!-- Top App Header -->
  <header class="header">
    <div class="header-inner">
      <a href="#" class="brand">
        <div class="brand-icon">PP</div>
        <div class="brand-text">
          <h1>PrismPay</h1>
          <div class="brand-tagline">Allowance gate for AI purchasing agents · PayPal AI Hackathon</div>
        </div>
      </a>

      <div class="header-actions">
        <span class="pill pill-paypal" title="Payments execute in the PayPal Sandbox">
          PayPal Sandbox
        </span>
        <button type="button" class="btn btn-subtle" id="btn-open-tech-modal" aria-haspopup="dialog">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Technical Details &amp; Flow
        </button>
      </div>
    </div>
  </header>

  <!-- Navigation Workflow Bar -->
  <nav class="nav-bar" aria-label="Workflow screens">
    <div class="nav-inner">
      <div class="nav-tabs">
        <button type="button" class="nav-tab active" data-screen="setup">
          1. Project Setup
        </button>
        <button type="button" class="nav-tab" data-screen="plan">
          2. Plan Review &amp; Sign
        </button>
        <button type="button" class="nav-tab" data-screen="dashboard">
          3. Dashboard
        </button>
        <button type="button" class="nav-tab" data-screen="proposals">
          4. Agent Proposals &amp; 5 Gates
          <span class="nav-tab-badge" id="nav-prop-count">0</span>
        </button>
        <button type="button" class="nav-tab" data-screen="audit">
          5. Audit Log
          <span class="nav-tab-badge" id="nav-audit-count">0</span>
        </button>
      </div>

      <div class="py-2">
        <span class="pill" id="mandate-status-pill">
          Mandate: Unsigned
        </span>
      </div>
    </div>
  </nav>

  <!-- Main Content Area -->
  <main class="main-content">

    <!-- Clean Quick Walkthrough Banner -->
    <section class="hero-strip" aria-label="Judge walkthrough bar">
      <div class="hero-strip-left">
        <div class="hero-title">
          <span>Judge Walkthrough — $1,000 Shed Scenario</span>
          <span class="pill pill-pass" id="hero-project-badge">No Project Active</span>
        </div>
        <div class="hero-desc" id="hero-instruction-text">
          Click <strong>Load $1,000 Shed Demo</strong> to initialize the project, sign the mandate, and run the 4-step walkthrough.
        </div>
      </div>
      <div class="hero-controls">
        <button type="button" class="btn btn-primary" id="btn-quick-shed">
          Load $1,000 Shed Demo
        </button>
        <button type="button" class="btn hidden" id="btn-quick-p1">
          1. Lumber ($285 → PASS)
        </button>
        <button type="button" class="btn hidden" id="btn-quick-p2" style="border-color: #fca5a5; color: #991b1b; background: #fff5f5;">
          2. Designer Roof ($920 → THE TRAP)
        </button>
        <button type="button" class="btn hidden" id="btn-quick-p3">
          3. Metal Roof ($165 → PASS)
        </button>
        <button type="button" class="btn hidden" id="btn-quick-p4">
          4. Hardware ($52 → ESCALATE)
        </button>
      </div>
    </section>

    <!-- SCREEN 1: PROJECT SETUP -->
    <section id="screen-setup" class="screen-view grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">1. Delegate a Project Budget</h2>
            <p class="card-desc">State a goal and a total limit. AI will propose a line-by-line category breakdown that you sign as a mandate.</p>
          </div>
        </div>

        <form id="form-create-project">
          <div class="form-group">
            <label class="form-label" for="input-goal">Project Goal</label>
            <input type="text" id="input-goal" class="form-input" value="Build a shed" placeholder="e.g. Build an 8x10 tool shed" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="input-budget">Total Budget (USD Dollars)</label>
            <input type="number" id="input-budget" class="form-input font-mono" value="1000" min="50" step="1" required />
          </div>
          <div style="display: flex; gap: 0.6rem; margin-top: 1.25rem;">
            <button type="submit" class="btn btn-primary" id="btn-propose-plan">
              Propose Budget Breakdown →
            </button>
            <button type="button" class="btn" id="btn-load-shed-hero">
              One-Click $1,000 Shed Demo
            </button>
          </div>
        </form>
      </div>

      <div class="card" style="background: var(--bg-subtle);">
        <div class="card-header">
          <div>
            <h2 class="card-title">How PrismPay Works</h2>
            <p class="card-desc">Three clean layers protect delegated money:</p>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.83rem;">
          <div style="padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <strong>1. Signed Mandate:</strong> The owner reviews and signs category caps. The cryptographic hash locks the envelope so the agent cannot raise its own limits.
          </div>
          <div style="padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <strong>2. 5 Deterministic Value Gates:</strong> Before any dollar moves, purchases are checked against total cap, category cap, single-item dominance, reference price, and project finishability.
          </div>
          <div style="padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <strong>3. PayPal Sandbox Orders v2:</strong> Only approved purchases execute. Denials halt before PayPal is ever contacted, recorded in an append-only audit trail.
          </div>
        </div>
      </div>
    </section>

    <!-- SCREEN 2: PLAN REVIEW & SIGN -->
    <section id="screen-plan" class="screen-view hidden">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">2. Review &amp; Sign Allowance Mandate</h2>
            <p class="card-desc">Review category allowances. Allocations must sum to the exact project budget, with at least 10% in Contingency.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="pill pill-pass" id="plan-balance-pill">Balanced: $1,000 / $1,000</span>
          </div>
        </div>

        <div id="plan-categories-list"></div>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="input-signer-label" style="font-size: 0.82rem; font-weight: 600;">Signer Identity:</label>
            <input type="text" id="input-signer-label" class="form-input" style="width: 220px;" value="Homeowner (Project Owner)" />
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button type="button" class="btn" id="btn-reset-caps">Reset to Default</button>
            <button type="button" class="btn btn-primary" id="btn-sign-mandate">
              Sign Mandate v1 (Lock Envelope)
            </button>
          </div>
        </div>

        <div id="mandate-signed-banner" class="hidden" style="margin-top: 1rem; padding: 0.9rem; background: var(--pass-bg); border: 1px solid var(--pass-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="font-weight: 700; color: var(--pass-ink); font-size: 0.88rem;">✓ Mandate Cryptographically Signed &amp; Active</div>
            <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--pass-ink); margin-top: 0.2rem;" id="mandate-hash-text"></div>
          </div>
          <button type="button" class="btn btn-primary" id="btn-goto-proposals">
            Proceed to Agent Proposals →
          </button>
        </div>
      </div>
    </section>

    <!-- SCREEN 3: DASHBOARD -->
    <section id="screen-dashboard" class="screen-view hidden">
      <div class="kpi-row">
        <div class="kpi-item">
          <div class="kpi-label">Total Mandate Budget</div>
          <div class="kpi-val" id="dash-kpi-total">$1,000</div>
          <div class="kpi-sub" id="dash-kpi-goal">Goal: Build a shed</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">PayPal Captured</div>
          <div class="kpi-val" style="color: var(--pass-ink);" id="dash-kpi-spent">$0</div>
          <div class="kpi-sub" id="dash-kpi-pct">0% of total budget</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">Remaining Budget</div>
          <div class="kpi-val" id="dash-kpi-remaining">$1,000</div>
          <div class="kpi-sub" id="dash-kpi-reserve">Essential reserve: $810</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">Project Finishable? (G5)</div>
          <div class="kpi-val" style="color: var(--pass);" id="dash-kpi-finishable">YES — INTACT</div>
          <div class="kpi-sub" id="dash-kpi-fin-sub">All essential reserves fundable</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Category Spending vs. Signed Caps</h2>
            <p class="card-desc">Live tracking of PayPal Sandbox transactions against each category envelope.</p>
          </div>
          <span class="pill font-mono" id="dash-mandate-hash-pill">Mandate Hash: —</span>
        </div>
        <div id="dash-category-progress-list"></div>
      </div>
    </section>

    <!-- SCREEN 4: AGENT PROPOSALS & 5 VALUE GATES -->
    <section id="screen-proposals" class="screen-view hidden grid-2">
      <div>
        <div class="card" style="margin-bottom: 1.5rem;">
          <div class="card-header">
            <div>
              <h2 class="card-title">Seeded Agent Proposals (PDD §10 Scenario)</h2>
              <p class="card-desc">Click proposals in sequence to experience the four core outcomes:</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
            <button type="button" class="btn" id="card-p1" style="border-color: var(--pass-border); background: var(--pass-bg); text-align: left; padding: 0.75rem; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--pass-ink);">1. Framing Lumber ($285)</div>
                <div style="font-size: 0.74rem; color: var(--pass-ink); opacity: 0.9;">Ref: $300 · Cap: $320</div>
              </div>
              <span class="pill pill-pass">PASS →</span>
            </button>

            <button type="button" class="btn" id="card-p2" style="border-color: var(--deny-border); background: var(--deny-bg); text-align: left; padding: 0.75rem; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--deny-ink);">2. Designer Roof ($920)</div>
                <div style="font-size: 0.74rem; color: var(--deny-ink);">THE TRAP · 4 Gates Fire</div>
              </div>
              <span class="pill pill-deny">DENY →</span>
            </button>

            <button type="button" class="btn" id="card-p3" style="border-color: var(--pass-border); background: var(--pass-bg); text-align: left; padding: 0.75rem; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--pass-ink);">3. Standard Roof ($165)</div>
                <div style="font-size: 0.74rem; color: var(--pass-ink); opacity: 0.9;">Ref: $175 · Fair Alternative</div>
              </div>
              <span class="pill pill-pass">PASS →</span>
            </button>

            <button type="button" class="btn" id="card-p4" style="border-color: var(--escalate-border); background: var(--escalate-bg); text-align: left; padding: 0.75rem; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--escalate-ink);">4. Hinges &amp; Latch ($52)</div>
                <div style="font-size: 0.74rem; color: var(--escalate-ink);">1.30× Ref · Human-in-the-loop</div>
              </div>
              <span class="pill pill-escalate">ESCALATE →</span>
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Evaluated Proposals Feed</h2>
              <p class="card-desc">Every purchase proposal is recorded with its plain-English summary, and an expandable 5-gate technical breakdown.</p>
            </div>
          </div>
          <div id="proposals-feed">
            <div style="padding: 2rem; text-align: center; color: var(--ink-muted); font-size: 0.85rem;">
              No proposals evaluated yet. Click Proposal 1 above or submit a manual proposal.
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Proposal Form -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Submit Custom Proposal</h2>
            <p class="card-desc">Test custom prices against the mandate and curated reference catalog.</p>
          </div>
        </div>
        <form id="form-manual-proposal">
          <div class="form-group">
            <label class="form-label" for="select-preset">Curated Reference Item</label>
            <select id="select-preset" class="form-select">
              <option value="">-- Custom / Unpriced Item (triggers NO_REFERENCE_PRICE) --</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="input-item-name">Item Name</label>
            <input type="text" id="input-item-name" class="form-input" placeholder="e.g. Small shed window" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="select-category">Category</label>
            <select id="select-category" class="form-select" required></select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
            <div class="form-group">
              <label class="form-label" for="input-price">Quote ($ USD)</label>
              <input type="number" id="input-price" class="form-input font-mono" step="1" min="1" value="65" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="input-vendor">Vendor</label>
              <input type="text" id="input-vendor" class="form-input" value="Builders Depot" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="input-justification">Agent Justification</label>
            <input type="text" id="input-justification" class="form-input" value="Required material to complete milestone." />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            Evaluate Through 5 Value Gates
          </button>
        </form>
      </div>
    </section>

    <!-- SCREEN 5: AUDIT LOG -->
    <section id="screen-audit" class="screen-view hidden">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">5. Append-Only Hash-Chained Audit Trail</h2>
            <p class="card-desc">Every mandate signature, proposal evaluation, owner override, and PayPal Sandbox capture is cryptographically linked.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="pill pill-pass" id="audit-status-pill">Chain: Verified OK</span>
            <button type="button" class="btn btn-primary" id="btn-reverify-chain">
              Re-verify Chain
            </button>
          </div>
        </div>
        <div id="audit-events-container"></div>
      </div>
    </section>

  </main>

  <!-- Technical Details & Architecture Modal -->
  <div class="modal-overlay" id="tech-modal" role="dialog" aria-modal="true" aria-labelledby="tech-modal-title">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title" id="tech-modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Technical Architecture &amp; Judging Alignment
        </div>
        <button type="button" class="btn btn-subtle" id="btn-close-modal" aria-label="Close dialog">✕</button>
      </div>

      <div class="modal-tabs">
        <button type="button" class="modal-tab-btn active" data-modtab="flow">1. Fiduciary Flow</button>
        <button type="button" class="modal-tab-btn" data-modtab="gates">2. The 5 Value Gates</button>
        <button type="button" class="modal-tab-btn" data-modtab="paypal">3. PayPal Integration</button>
        <button type="button" class="modal-tab-btn" data-modtab="crypto">4. Cryptographic Mandates</button>
        <button type="button" class="modal-tab-btn" data-modtab="judging">5. Hackathon Criteria</button>
      </div>

      <div class="modal-body">
        <!-- Tab 1: Fiduciary Flow -->
        <div class="modal-section active" id="modtab-flow">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--ink-primary); margin-bottom: 0.4rem;">The Delegated Commerce Bottleneck</h3>
          <p style="margin-bottom: 0.75rem;">Delegating spending to an AI purchasing agent has previously been binary: either the human approves every single transaction, or the agent holds a credit card with a lump-sum limit (e.g. $1,000).</p>
          <p style="margin-bottom: 0.75rem;">Under a simple $1,000 limit, an agent can spend <strong>$920</strong> on the very first overpriced item it encounters. Technically "within budget", this leaves the project stranded with insufficient funds to complete essential tasks.</p>
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--ink-primary); margin: 0.75rem 0 0.3rem;">PrismPay's 5-Step Solution:</h4>
          <ol style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Plan:</strong> The owner inputs a goal and budget. AI drafts a category breakdown.</li>
            <li><strong>Sign:</strong> The owner edits and signs the breakdown, locking the envelope with a SHA-256 hash. The agent has no code path to raise its own caps.</li>
            <li><strong>Propose:</strong> The agent submits purchase quotes against the active plan.</li>
            <li><strong>Gate:</strong> Every proposal must satisfy five deterministic gates evaluated in pure TypeScript.</li>
            <li><strong>Pay or Deny:</strong> Passing purchases capture via the <strong>PayPal Sandbox Orders API v2</strong>. Blocked purchases halt with zero PayPal calls, writing an entry to the append-only audit trail.</li>
          </ol>
        </div>

        <!-- Tab 2: The 5 Value Gates -->
        <div class="modal-section" id="modtab-gates">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--ink-primary); margin-bottom: 0.5rem;">Deterministic Mathematical Gates (PDD §7)</h3>
          <p style="margin-bottom: 0.75rem;">All thresholds are evaluated in integer cents using pure deterministic logic. An LLM never decides whether money moves.</p>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div style="padding: 0.6rem 0.8rem; background: var(--bg-subtle); border-radius: var(--radius-sm);">
              <strong>G1 — Total Cap:</strong> <code>total_spent + quote > total_budget</code> → <code>DENY (TOTAL_CAP_EXCEEDED)</code>.
            </div>
            <div style="padding: 0.6rem 0.8rem; background: var(--bg-subtle); border-radius: var(--radius-sm);">
              <strong>G2 — Category Cap:</strong> <code>cat_spent + quote > cat_cap</code>. If overflow fits in unused contingency, downgrades to <code>ESCALATE (CONTINGENCY_DRAW)</code>; otherwise <code>DENY (CATEGORY_CAP_EXCEEDED)</code>.
            </div>
            <div style="padding: 0.6rem 0.8rem; background: var(--bg-subtle); border-radius: var(--radius-sm);">
              <strong>G3 — Proportionality:</strong> <code>quote / total_budget > 0.50</code> → <code>DENY (SINGLE_ITEM_DOMINANCE)</code>; between 0.30 and 0.50 → <code>ESCALATE (SINGLE_ITEM_LARGE)</code>.
            </div>
            <div style="padding: 0.6rem 0.8rem; background: var(--bg-subtle); border-radius: var(--radius-sm);">
              <strong>G4 — Value for Money:</strong> Compares quote to curated reference median. <code>ratio > 1.50</code> → <code>DENY (PRICE_NOT_VALUE_FOR_MONEY)</code>; <code>1.15 < ratio ≤ 1.50</code> → <code>ESCALATE</code>; unpriced items → <code>ESCALATE (NO_REFERENCE_PRICE)</code>.
            </div>
            <div style="padding: 0.6rem 0.8rem; background: var(--bg-subtle); border-radius: var(--radius-sm);">
              <strong>G5 — Forward Coherence:</strong> Verifies remaining budget covers required reserves for unfinished essential categories. If <code>remaining_after < required_reserve</code> → <code>DENY (PROJECT_LEFT_UNFINISHABLE)</code>.
            </div>
          </div>
        </div>

        <!-- Tab 3: PayPal Integration -->
        <div class="modal-section" id="modtab-paypal">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--ink-primary); margin-bottom: 0.4rem;">PayPal Developer Platform Integration</h3>
          <p style="margin-bottom: 0.6rem;">PrismPay integrates server-side with the <strong>PayPal Orders v2 API</strong> (<code>api-m.sandbox.paypal.com</code>) using intent <code>CAPTURE</code>.</p>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem;">
            <li><strong>Principle 3 Invariant:</strong> A PayPal order is created ONLY when a proposal's decision is <code>PASS</code> (or an owner-approved <code>ESCALATE</code>). There is deliberately no standalone checkout endpoint.</li>
            <li><strong>Idempotency:</strong> A proposal with an existing captured payment can never create duplicate PayPal transactions.</li>
            <li><strong>Audit Linkage:</strong> Every captured payment stores the PayPal Order ID and Capture ID directly in the proposal record and append-only audit trail.</li>
          </ul>
        </div>

        <!-- Tab 4: Cryptographic Mandates -->
        <div class="modal-section" id="modtab-crypto">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--ink-primary); margin-bottom: 0.4rem;">Chain of Trust &amp; Tamper Detection</h3>
          <p style="margin-bottom: 0.6rem;">PrismPay implements the open Chain of Trust pattern as design inspiration:</p>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem;">
            <li><strong>Canonical JSON Mandate Hashing:</strong> Category caps are normalized and hashed via SHA-256. If stored caps are modified in storage without an owner signature, validation fails with <code>409 MANDATE_TAMPER_DETECTED</code> and halts spending.</li>
            <li><strong>Hash-Chained Audit Trail:</strong> Each event links to its predecessor via <code>event_hash = SHA-256(prev_hash + canonical_json(seq, type, payload, created_at))</code>, allowing on-demand cryptographic verification of the entire transaction chain.</li>
          </ul>
        </div>

        <!-- Tab 5: Hackathon Criteria -->
        <div class="modal-section" id="modtab-judging">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--ink-primary); margin-bottom: 0.4rem;">Alignment with PayPal AI Hackathon Scoring</h3>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.45rem;">
            <li><strong>Technological Implementation:</strong> Server-side PayPal Orders v2 create &amp; capture, deterministic TypeScript gate engine with 10 passing unit/acceptance tests, and schema-validated AI budget breakdown.</li>
            <li><strong>Design:</strong> 5 complete product screens (Setup, Plan &amp; Sign, Dashboard, Proposals, and Audit) designed for clarity and intuitive use.</li>
            <li><strong>Potential Impact:</strong> Solves the runaway spending problem in autonomous commerce, enabling safe delegation of budgets to agents.</li>
            <li><strong>Innovation:</strong> Multi-category forward-coherence budgeting ("can the project finish?") rather than primitive single-limit cards.</li>
            <li><strong>Presentation:</strong> Scripted walkthrough highlighting the \$920 trap denial and fair alternative resolution.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer">
    PrismPay · Fiduciary Allowance Gate for AI Purchasing Agents · PayPal AI Hackathon Entry · MIT License
  </footer>

  <div id="toast-el" class="toast hidden"></div>

  <!-- Client Application Logic -->
  <script>
    (function() {
      const state = {
        meta: null,
        project: null,
        draftCategories: [],
        mandate: null,
        dashboard: null,
        proposals: [],
        auditEvents: [],
        auditVerification: null
      };

      function fmtDollars(cents) {
        const sign = cents < 0 ? '-' : '';
        const abs = Math.abs(Math.round(cents));
        const whole = Math.floor(abs / 100).toLocaleString('en-US');
        const frac = abs % 100;
        return frac === 0 ? sign + '$' + whole : sign + '$' + whole + '.' + String(frac).padStart(2, '0');
      }

      function showToast(msg) {
        const el = document.getElementById('toast-el');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(window.__tTimer);
        window.__tTimer = setTimeout(() => el.classList.add('hidden'), 3800);
      }

      // Screen navigation
      function switchScreen(screenName) {
        document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById('screen-' + screenName);
        if (target) target.classList.remove('hidden');

        document.querySelectorAll('.nav-tab').forEach(b => {
          const active = b.getAttribute('data-screen') === screenName;
          b.classList.toggle('active', active);
        });
      }

      document.querySelectorAll('.nav-tab').forEach(b => {
        b.addEventListener('click', () => switchScreen(b.getAttribute('data-screen')));
      });

      // Technical Details Modal
      const modal = document.getElementById('tech-modal');
      document.getElementById('btn-open-tech-modal').addEventListener('click', () => {
        modal.classList.add('active');
      });
      document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      });

      // Modal tabs
      document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.modal-section').forEach(s => s.classList.remove('active'));
          btn.classList.add('active');
          const tabId = btn.getAttribute('data-modtab');
          document.getElementById('modtab-' + tabId).classList.add('active');
        });
      });

      async function fetchMeta() {
        try {
          const res = await fetch('/api/meta');
          state.meta = await res.json();
          populatePresetDropdown();
        } catch {
          // Fallback if offline
        }
      }

      function populatePresetDropdown() {
        if (!state.meta || !state.meta.reference_prices) return;
        const sel = document.getElementById('select-preset');
        sel.innerHTML = '<option value="">-- Custom / Unpriced Item (triggers NO_REFERENCE_PRICE) --</option>';
        state.meta.reference_prices.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.item_id;
          opt.textContent = \`\${item.name} (\${item.category} · Ref \${fmtDollars(item.reference_median_cents)})\`;
          sel.appendChild(opt);
        });

        sel.addEventListener('change', () => {
          const chosen = state.meta.reference_prices.find(r => r.item_id === sel.value);
          if (chosen) {
            document.getElementById('input-item-name').value = chosen.name;
            document.getElementById('input-price').value = (chosen.reference_median_cents / 100).toFixed(0);
            const catSel = document.getElementById('select-category');
            for (let i = 0; i < catSel.options.length; i++) {
              if (catSel.options[i].value === chosen.category) {
                catSel.selectedIndex = i;
                break;
              }
            }
          }
        });
      }

      async function refreshState(projectId) {
        const [pRes, aRes] = await Promise.all([
          fetch('/api/projects/' + projectId),
          fetch('/api/projects/' + projectId + '/audit')
        ]);
        if (!pRes.ok) return;
        const pData = await pRes.json();
        const aData = await aRes.json();

        state.project = pData.project;
        state.mandate = pData.mandate;
        state.dashboard = pData.dashboard;
        state.proposals = pData.proposals || [];
        state.auditEvents = aData.events || [];
        state.auditVerification = aData.verification;

        if (state.mandate) {
          state.draftCategories = state.mandate.categories.map(c => ({ ...c }));
        }

        renderHeaderAndHero();
        renderPlanScreen();
        renderDashboardScreen();
        renderProposalsFeed();
        renderAuditScreen();
      }

      function renderHeaderAndHero() {
        const badge = document.getElementById('hero-project-badge');
        const pill = document.getElementById('mandate-status-pill');
        const text = document.getElementById('hero-instruction-text');
        const pCount = document.getElementById('nav-prop-count');
        const aCount = document.getElementById('nav-audit-count');

        pCount.textContent = String(state.proposals.length);
        aCount.textContent = String(state.auditEvents.length);

        const quickBtns = ['btn-quick-p1', 'btn-quick-p2', 'btn-quick-p3', 'btn-quick-p4'].map(id => document.getElementById(id));

        if (!state.project) {
          badge.textContent = 'No Project Active';
          pill.textContent = 'Mandate: Unsigned';
          pill.className = 'pill';
          quickBtns.forEach(b => b.classList.add('hidden'));
          return;
        }

        badge.textContent = \`\${state.project.goal_text} (\${fmtDollars(state.project.total_budget_cents)})\`;

        if (state.mandate) {
          const shortHash = state.mandate.sha256_hash.slice(0, 10) + '…';
          pill.textContent = 'Mandate v' + state.mandate.version + ': ' + shortHash;
          pill.className = 'pill pill-pass';
          text.innerHTML = 'Mandate v' + state.mandate.version + ' active. Click the numbered buttons to run the story arc:';
          quickBtns.forEach(b => b.classList.remove('hidden'));
        } else {
          pill.textContent = 'Mandate: Draft (Unsigned)';
          pill.className = 'pill pill-escalate';
          text.textContent = 'Project created. Review the category breakdown and click "Sign Mandate v1".';
          quickBtns.forEach(b => b.classList.add('hidden'));
        }

        // Populate category dropdown
        const catSel = document.getElementById('select-category');
        const cats = state.mandate ? state.mandate.categories : state.draftCategories;
        catSel.innerHTML = '';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = \`\${c.name} (Cap \${fmtDollars(c.cap_cents)})\`;
          catSel.appendChild(opt);
        });
      }

      function renderPlanScreen() {
        if (!state.project) return;
        const container = document.getElementById('plan-categories-list');
        const balancePill = document.getElementById('plan-balance-pill');
        const signBtn = document.getElementById('btn-sign-mandate');
        const banner = document.getElementById('mandate-signed-banner');
        const hashDisplay = document.getElementById('mandate-hash-text');

        const totalBudget = state.project.total_budget_cents;
        const currentSum = state.draftCategories.reduce((s, c) => s + Number(c.cap_cents || 0), 0);
        const cont = state.draftCategories.find(c => c.name.toLowerCase() === 'contingency');
        const minCont = Math.floor(totalBudget * 0.10);
        const isBalanced = currentSum === totalBudget && cont && cont.cap_cents >= minCont;

        if (isBalanced) {
          balancePill.textContent = \`Balanced: \${fmtDollars(currentSum)} / \${fmtDollars(totalBudget)}\`;
          balancePill.className = 'pill pill-pass';
          signBtn.disabled = false;
        } else {
          balancePill.textContent = \`Unbalanced: \${fmtDollars(currentSum)} / \${fmtDollars(totalBudget)}\`;
          balancePill.className = 'pill pill-deny';
          signBtn.disabled = true;
        }

        container.innerHTML = '';
        state.draftCategories.forEach((cat, idx) => {
          const pct = Math.round((cat.cap_cents / totalBudget) * 100);
          const el = document.createElement('div');
          el.className = 'cat-item';
          el.innerHTML = \`
            <div class="cat-item-top">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="font-size: 0.88rem;">\${cat.name}</strong>
                \${cat.essential ? '<span class="pill pill-paypal">Essential</span>' : '<span class="pill">Contingency Reserve</span>'}
              </div>
              <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem;">
                <span style="color: var(--ink-muted);">\${cat.essential ? 'Ref Estimate: ' + fmtDollars(cat.reference_estimate_cents) : 'Min 10% Required'}</span>
                <label style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 600;">
                  Cap $:
                  <input type="number" class="form-input font-mono input-cat-cap" data-idx="\${idx}" value="\${(cat.cap_cents / 100).toFixed(0)}" style="width: 85px; padding: 0.25rem 0.45rem; font-size: 0.82rem;" />
                </label>
              </div>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: \${pct}%;"></div>
            </div>
          \`;
          container.appendChild(el);
        });

        container.querySelectorAll('.input-cat-cap').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = Number(e.target.dataset.idx);
            state.draftCategories[idx].cap_cents = Math.round(Number(e.target.value || 0) * 100);
            renderPlanScreen();
          });
        });

        if (state.mandate) {
          banner.classList.remove('hidden');
          hashDisplay.textContent = 'Mandate SHA-256: ' + state.mandate.sha256_hash;
        } else {
          banner.classList.add('hidden');
        }
      }

      function renderDashboardScreen() {
        if (!state.project || !state.dashboard) return;
        const d = state.dashboard;

        document.getElementById('dash-kpi-total').textContent = fmtDollars(d.total_budget_cents);
        document.getElementById('dash-kpi-goal').textContent = 'Goal: ' + state.project.goal_text;
        document.getElementById('dash-kpi-spent').textContent = fmtDollars(d.total_spent_cents);
        const pct = d.total_budget_cents > 0 ? Math.round((d.total_spent_cents / d.total_budget_cents) * 100) : 0;
        document.getElementById('dash-kpi-pct').textContent = pct + '% captured via PayPal Sandbox';
        document.getElementById('dash-kpi-remaining').textContent = fmtDollars(d.remaining_cents);
        document.getElementById('dash-kpi-reserve').textContent = 'Essential reserve: ' + fmtDollars(d.required_reserve_cents);

        const finEl = document.getElementById('dash-kpi-finishable');
        const finSub = document.getElementById('dash-kpi-fin-sub');
        if (d.project_finishable) {
          finEl.textContent = 'YES — FINISHABLE';
          finEl.style.color = 'var(--pass-ink)';
          finSub.textContent = \`\${fmtDollars(d.remaining_cents)} covers \${fmtDollars(d.required_reserve_cents)} essential reserves\`;
        } else {
          finEl.textContent = 'NO — UNFINISHABLE';
          finEl.style.color = 'var(--deny-ink)';
          finSub.textContent = 'Remaining budget insufficient for remaining essentials';
        }

        if (state.mandate) {
          document.getElementById('dash-mandate-hash-pill').textContent = 'Mandate SHA-256: ' + state.mandate.sha256_hash.slice(0, 14) + '…';
        }

        const list = document.getElementById('dash-category-progress-list');
        list.innerHTML = '';
        (d.categories || []).forEach(cat => {
          const fillPct = cat.cap_cents > 0 ? Math.min(100, Math.round((cat.spent_cents / cat.cap_cents) * 100)) : 0;
          const isOver = cat.spent_cents > cat.cap_cents;
          const row = document.createElement('div');
          row.className = 'cat-item';
          row.innerHTML = \`
            <div class="cat-item-top">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="font-size: 0.88rem;">\${cat.name}</strong>
                \${cat.essential ? (cat.spent_cents > 0 ? '<span class="pill pill-pass">Funded</span>' : '<span class="pill">Needed: ' + fmtDollars(cat.reference_estimate_cents) + '</span>') : '<span class="pill">Contingency</span>'}
              </div>
              <div class="font-mono" style="font-size: 0.82rem;">
                Spent: <strong>\${fmtDollars(cat.spent_cents)}</strong> / Cap: \${fmtDollars(cat.cap_cents)}
              </div>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill \${isOver ? 'overflow' : fillPct > 0 ? 'safe' : ''}" style="width: \${fillPct}%;"></div>
            </div>
          \`;
          list.appendChild(row);
        });
      }

      function renderProposalsFeed() {
        const feed = document.getElementById('proposals-feed');
        if (!state.proposals || state.proposals.length === 0) {
          feed.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--ink-muted); font-size: 0.85rem;">No proposals evaluated yet. Click one of the seeded proposals above.</div>';
          return;
        }

        feed.innerHTML = '';
        state.proposals.forEach((item, index) => {
          const p = item.proposal;
          const gates = item.gates || [];
          const pay = item.payment;
          const isDeny = p.decision === 'DENY';
          const isPaid = p.decision === 'paid';
          const isEscalate = p.decision === 'ESCALATE';
          const failedGates = gates.filter(g => g.outcome !== 'pass');

          let badgeHtml = '';
          if (isPaid) badgeHtml = '<span class="pill pill-pass">PASS · PAID (PayPal Sandbox)</span>';
          else if (isDeny) badgeHtml = \`<span class="pill pill-deny">DENIED · \${failedGates.length} GATES FIRED</span>\`;
          else if (isEscalate) badgeHtml = '<span class="pill pill-escalate">ESCALATE · OWNER ACTION REQUIRED</span>';
          else badgeHtml = '<span class="pill">' + p.decision + '</span>';

          let calloutHtml = '';
          if (isDeny) {
            const reasons = failedGates.map(g => \`<li><strong>\${g.gate} (\${g.gate_name}):</strong> \${g.explanation}</li>\`).join('');
            calloutHtml = \`
              <div class="proposal-callout deny">
                <div style="width: 100%;">
                  <div style="font-weight: 700; margin-bottom: 0.35rem;">✕ Purchase Blocked Before PayPal — Zero PayPal Calls Made</div>
                  <ul style="padding-left: 1.2rem; font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.2rem;">
                    \${reasons}
                  </ul>
                </div>
              </div>
            \`;
          } else if (isEscalate) {
            const reasons = failedGates.map(g => \`<li><strong>\${g.gate}:</strong> \${g.explanation}</li>\`).join('');
            calloutHtml = \`
              <div class="proposal-callout escalate">
                <div>
                  <div style="font-weight: 700; margin-bottom: 0.25rem;">⚠ Escalated for Owner Confirmation</div>
                  <ul style="padding-left: 1.2rem; font-size: 0.82rem;">\${reasons}</ul>
                </div>
                <div style="display: flex; gap: 0.45rem;">
                  <button type="button" class="btn btn-primary btn-approve" data-id="\${p.id}">Approve &amp; Pay</button>
                  <button type="button" class="btn btn-reject" data-id="\${p.id}">Reject</button>
                </div>
              </div>
            \`;
          } else if (pay && pay.status === 'captured') {
            calloutHtml = \`
              <div class="proposal-callout pass">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 0.5rem; font-size: 0.82rem;">
                  <span>✓ <strong>PayPal Sandbox Captured:</strong> \${fmtDollars(pay.amount_cents)}</span>
                  <span class="font-mono">Order: <strong>\${pay.paypal_order_id}</strong> · Capture: <strong>\${pay.paypal_capture_id}</strong></span>
                </div>
              </div>
            \`;
          }

          const gateRowsHtml = gates.map(g => {
            const pillCls = g.outcome === 'pass' ? 'pill-pass' : g.outcome === 'escalate' ? 'pill-escalate' : 'pill-deny';
            return \`
              <tr>
                <td class="font-mono font-bold" style="white-space: nowrap;">\${g.gate} · \${g.gate_name}</td>
                <td><span class="pill \${pillCls}">\${g.outcome.toUpperCase()}</span></td>
                <td class="font-mono" style="font-size: 0.76rem;">\${g.reason_code}</td>
                <td>\${g.explanation}</td>
              </tr>
            \`;
          }).join('');

          const card = document.createElement('div');
          card.className = \`proposal-card \${isPaid ? 'pass' : isDeny ? 'deny' : 'escalate'}\`;
          card.innerHTML = \`
            <div class="proposal-header">
              <div>
                <div class="proposal-headline">
                  <span class="font-mono" style="font-size: 0.78rem; color: var(--ink-muted);">#\${index + 1}</span>
                  <span class="proposal-title">\${p.item_name}</span>
                  <span class="pill">\${p.category}</span>
                  <span style="font-size: 0.78rem; color: var(--ink-muted);">Vendor: \${p.vendor}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--ink-secondary); margin-top: 0.3rem;">
                  \${p.justification}
                </div>
              </div>
              <div style="text-align: right;">
                <div class="proposal-quote">Quote: \${fmtDollars(p.quoted_price_cents)}</div>
                <div style="margin-top: 0.3rem;">\${badgeHtml}</div>
              </div>
            </div>
            \${calloutHtml}
            <div class="proposal-footer">
              <span style="font-size: 0.78rem; color: var(--ink-muted);">5-Gate Verification Math &amp; Reason Codes</span>
              <button type="button" class="btn btn-subtle btn-toggle-gates" style="font-size: 0.78rem; padding: 0.25rem 0.6rem;">
                Inspect Verification Details ▾
              </button>
            </div>
            <div class="gate-detail-pane hidden" style="border-top: 1px solid var(--border-subtle);">
              <table class="gate-table">
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Result</th>
                    <th>Reason Code</th>
                    <th>Deterministic Comparison</th>
                  </tr>
                </thead>
                <tbody>\${gateRowsHtml}</tbody>
              </table>
            </div>
          \`;
          feed.appendChild(card);
        });

        feed.querySelectorAll('.btn-toggle-gates').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const card = e.target.closest('.proposal-card');
            const pane = card.querySelector('.gate-detail-pane');
            const isHidden = pane.classList.contains('hidden');
            pane.classList.toggle('hidden', !isHidden);
            btn.textContent = isHidden ? 'Hide Verification Details ▴' : 'Inspect Verification Details ▾';
          });
        });

        feed.querySelectorAll('.btn-approve').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Capturing…';
            const res = await fetch('/api/proposals/' + id + '/approve', { method: 'POST' });
            if (res.ok) {
              showToast('Escalation approved — PayPal Sandbox payment captured.');
              await refreshState(state.project.id);
            } else {
              const err = await res.json();
              showToast('Error: ' + (err.error || 'Failed to approve'));
              btn.disabled = false;
            }
          });
        });

        feed.querySelectorAll('.btn-reject').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            const res = await fetch('/api/proposals/' + id + '/reject', { method: 'POST' });
            if (res.ok) {
              showToast('Escalation rejected — no payment created.');
              await refreshState(state.project.id);
            }
          });
        });
      }

      function renderAuditScreen() {
        const container = document.getElementById('audit-events-container');
        const statusPill = document.getElementById('audit-status-pill');

        if (state.auditVerification && state.auditVerification.valid) {
          statusPill.textContent = \`✓ Chain Verified (\${state.auditVerification.checked_count} events intact)\`;
          statusPill.className = 'pill pill-pass';
        } else if (state.auditVerification && !state.auditVerification.valid) {
          statusPill.textContent = \`✕ Chain Broken at seq \${state.auditVerification.broken_at_seq}\`;
          statusPill.className = 'pill pill-deny';
        }

        if (!state.auditEvents || state.auditEvents.length === 0) {
          container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--ink-muted); font-size: 0.85rem;">No audit events recorded yet.</div>';
          return;
        }

        container.innerHTML = '';
        state.auditEvents.slice().reverse().forEach(ev => {
          const row = document.createElement('div');
          const isGreen = ev.type.includes('CAPTURED') || ev.type.includes('SIGNED') || ev.type.includes('APPROVED');
          const isRed = ev.type.includes('REJECTED') || (ev.payload && ev.payload.decision === 'DENY');
          const pillClass = isGreen ? 'pill-pass' : isRed ? 'pill-deny' : 'pill-paypal';

          row.className = 'cat-item font-mono';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.gap = '1rem';
          row.style.flexWrap = 'wrap';
          row.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span style="font-weight: 700; color: var(--ink-muted);">#\${ev.seq}</span>
              <span class="pill \${pillClass}">\${ev.type}</span>
              <span class="font-sans" style="font-size: 0.84rem; color: var(--ink-primary);">\${JSON.stringify(ev.payload)}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--ink-muted); text-align: right;">
              <div>hash: \${ev.event_hash.slice(0, 14)}…</div>
              <div>prev: \${ev.prev_hash === 'GENESIS' ? 'GENESIS' : ev.prev_hash.slice(0, 14) + '…'}</div>
            </div>
          \`;
          container.appendChild(row);
        });
      }

      // Action: Create Project
      document.getElementById('form-create-project').addEventListener('submit', async (e) => {
        e.preventDefault();
        const goal = document.getElementById('input-goal').value.trim();
        const budgetDollars = Number(document.getElementById('input-budget').value || 1000);
        const btn = document.getElementById('btn-propose-plan');
        btn.disabled = true;
        btn.textContent = 'Proposing Plan…';

        try {
          const createRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal_text: goal, total_budget_cents: Math.round(budgetDollars * 100) })
          });
          const createData = await createRes.json();
          const projId = createData.project.id;

          const bdRes = await fetch('/api/projects/' + projId + '/breakdown', { method: 'POST' });
          const bdData = await bdRes.json();
          state.draftCategories = bdData.categories;

          await refreshState(projId);
          switchScreen('plan');
          showToast('Draft breakdown ready — review caps and click Sign Mandate v1.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Propose Budget Breakdown →';
        }
      });

      // Action: Load Shed Demo
      async function loadShedDemo() {
        const res = await fetch('/api/demo/shed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sign_immediately: true })
        });
        const data = await res.json();
        state.draftCategories = data.categories;
        await refreshState(data.project.id);
        switchScreen('proposals');
        showToast('Loaded $1,000 Shed Scenario & signed Mandate v1!');
      }

      document.getElementById('btn-quick-shed').addEventListener('click', loadShedDemo);
      document.getElementById('btn-load-shed-hero').addEventListener('click', loadShedDemo);

      document.getElementById('btn-reset-caps').addEventListener('click', () => {
        if (state.meta && state.meta.shed_demo) {
          state.draftCategories = state.meta.shed_demo.categories.map(c => ({ ...c }));
          renderPlanScreen();
        }
      });

      // Action: Sign Mandate
      document.getElementById('btn-sign-mandate').addEventListener('click', async () => {
        if (!state.project) return;
        const owner = document.getElementById('input-signer-label').value.trim() || 'Owner';
        const res = await fetch('/api/projects/' + state.project.id + '/mandate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: state.draftCategories, owner_label: owner })
        });
        if (res.ok) {
          await refreshState(state.project.id);
          showToast('Mandate v1 signed and locked.');
        } else {
          const err = await res.json();
          showToast('Error: ' + err.error);
        }
      });

      document.getElementById('btn-goto-proposals').addEventListener('click', () => switchScreen('proposals'));

      // Action: Execute Seeded Proposal
      async function runProposal(stepNum) {
        if (!state.project || !state.mandate) await loadShedDemo();
        const spec = state.meta.shed_demo.proposals.find(p => p.step === stepNum);
        if (!spec) return;

        const res = await fetch('/api/projects/' + state.project.id + '/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spec)
        });
        const data = await res.json();
        await refreshState(state.project.id);
        switchScreen('proposals');

        if (data.gate_evaluation === 'DENY') {
          showToast(\`DENIED: 4 gates fired against \${fmtDollars(spec.quoted_price_cents)} quote. Zero PayPal calls made.\`);
        } else if (data.gate_evaluation === 'PASS') {
          showToast(\`PASS: Paid \${fmtDollars(spec.quoted_price_cents)} via PayPal Sandbox.\`);
        } else {
          showToast(\`ESCALATED: \${fmtDollars(spec.quoted_price_cents)} quote requires owner review.\`);
        }
      }

      [1, 2, 3, 4].forEach(step => {
        document.getElementById('btn-quick-p' + step).addEventListener('click', () => runProposal(step));
        document.getElementById('card-p' + step).addEventListener('click', () => runProposal(step));
      });

      // Action: Custom Proposal
      document.getElementById('form-manual-proposal').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.project || !state.mandate) {
          showToast('Please sign a mandate first.');
          return;
        }
        const item_id = document.getElementById('select-preset').value || null;
        const item_name = document.getElementById('input-item-name').value.trim();
        const category = document.getElementById('select-category').value;
        const priceDollars = Number(document.getElementById('input-price').value || 0);
        const vendor = document.getElementById('input-vendor').value.trim();
        const justification = document.getElementById('input-justification').value.trim();

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
            source: 'manual'
          })
        });
        const data = await res.json();
        await refreshState(state.project.id);
        showToast('Evaluated: ' + data.gate_evaluation);
      });

      // Action: Re-verify chain
      document.getElementById('btn-reverify-chain').addEventListener('click', async () => {
        if (!state.project) return;
        const res = await fetch('/api/projects/' + state.project.id + '/audit/verify', { method: 'POST' });
        const data = await res.json();
        state.auditVerification = data.verification;
        renderAuditScreen();
        if (data.verification.valid) {
          showToast('Audit chain verified: all hashes intact.');
        } else {
          showToast('Audit chain broken at seq ' + data.verification.broken_at_seq);
        }
      });

      fetchMeta();
    })();
  </script>
</body>
</html>`;
}
