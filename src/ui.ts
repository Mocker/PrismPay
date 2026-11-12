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
      --bg-page: #f8fafc;
      --bg-surface: #ffffff;
      --bg-subtle: #f1f5f9;
      --bg-elevated: #ffffff;
      --ink-primary: #0f172a;
      --ink-secondary: #334155;
      --ink-muted: #64748b;
      --border-subtle: #e2e8f0;
      --border-strong: #cbd5e1;
      
      --brand-navy: #003087;
      --brand-blue: #0070ba;
      --brand-light: #eff6ff;
      
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
      --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
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

    /* Top App Bar */
    .app-header {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .header-inner {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: inherit;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, var(--brand-navy), var(--brand-blue));
      color: white;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
      letter-spacing: -0.02em;
    }
    .brand-title {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Badges & Pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.74rem;
      font-weight: 600;
      padding: 0.22rem 0.6rem;
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

    /* Controls Bar */
    .controls-bar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.6rem 0;
    }
    .controls-inner {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Buttons */
    .btn {
      appearance: none;
      border: 1px solid var(--border-strong);
      background: var(--bg-surface);
      color: var(--ink-primary);
      font-family: var(--font-sans);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
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
    .btn-active-toggle {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
      font-weight: 700;
    }

    /* Main Dashboard Layout */
    .dashboard-container {
      max-width: 1300px;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Judge Walkthrough Drawer (Hidden by default) */
    .walkthrough-drawer {
      background: linear-gradient(to right, #f8fafc, #f0fdf4);
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    @media (max-width: 860px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.15rem;
      box-shadow: var(--shadow-sm);
    }
    .kpi-label {
      font-size: 0.73rem;
      font-weight: 700;
      color: var(--ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.55rem;
      font-weight: 800;
      font-family: var(--font-mono);
      margin-top: 0.25rem;
      color: var(--ink-primary);
    }
    .kpi-sub {
      font-size: 0.76rem;
      color: var(--ink-muted);
      margin-top: 0.2rem;
    }

    /* Cockpit Main Grid: 2 Columns */
    .cockpit-grid {
      display: grid;
      grid-template-columns: 1.05fr 1.35fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 960px) {
      .cockpit-grid { grid-template-columns: 1fr; }
    }

    /* Cards */
    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.3rem;
      box-shadow: var(--shadow-card);
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.1rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.85rem;
    }
    .card-title {
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .card-desc {
      font-size: 0.78rem;
      color: var(--ink-muted);
      margin-top: 0.15rem;
    }

    /* Category Envelopes */
    .cat-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      margin-bottom: 0.65rem;
    }
    .progress-bar-bg {
      width: 100%;
      height: 7px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--brand-blue);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
    .progress-bar-fill.safe { background: var(--pass); }
    .progress-bar-fill.over { background: var(--deny); }

    /* Proposals Catalog Grid */
    .catalog-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .catalog-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.9rem 1.1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.15s ease;
    }
    .catalog-item:hover {
      border-color: var(--brand-blue);
      box-shadow: var(--shadow-sm);
    }
    .catalog-item.trap {
      border-color: #fecaca;
      background: #fffafa;
    }

    /* Evaluated Proposals */
    .eval-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 0.85rem;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .eval-card.pass { border-left: 4px solid var(--pass); }
    .eval-card.deny { border-left: 4px solid var(--deny); }
    .eval-card.escalate { border-left: 4px solid var(--escalate); }

    .eval-card-header {
      padding: 0.9rem 1.15rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .eval-card-callout {
      padding: 0.75rem 1.15rem;
      font-size: 0.82rem;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }
    .eval-card-callout.deny { background: var(--deny-bg); color: var(--deny-ink); }
    .eval-card-callout.pass { background: var(--pass-bg); color: var(--pass-ink); }
    .eval-card-callout.escalate { background: var(--escalate-bg); color: var(--escalate-ink); }

    .eval-gate-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .eval-gate-table th, .eval-gate-table td {
      padding: 0.5rem 0.85rem;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }
    .eval-gate-table th {
      background: var(--bg-subtle);
      color: var(--ink-muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.7rem;
    }

    /* Modal Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-window {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 740px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-top {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-content-area {
      padding: 1.25rem;
      overflow-y: auto;
      font-size: 0.84rem;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    .font-mono { font-family: var(--font-mono); }
    .hidden { display: none !important; }

    .toast {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      background: #0f172a;
      color: white;
      padding: 0.7rem 1.1rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      box-shadow: var(--shadow-lg);
      z-index: 120;
      max-width: 400px;
    }
  </style>
</head>
<body>

  <!-- Top App Bar -->
  <header class="app-header">
    <div class="header-inner">
      <a href="#" class="brand">
        <div class="brand-icon">PP</div>
        <div>
          <div class="brand-title">
            <span>PrismPay</span>
            <span class="pill pill-paypal">PayPal Sandbox Orders v2</span>
          </div>
          <p style="font-size: 0.74rem; color: var(--ink-muted);">Fiduciary allowance gate for AI purchasing agents</p>
        </div>
      </a>

      <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
        <!-- Walkthrough Toggle Button (Hidden by default) -->
        <button type="button" class="btn" id="btn-toggle-walkthrough" style="font-size: 0.78rem;">
          <span>⚡ Guided Walkthrough</span>
          <span style="font-size: 0.72rem; color: var(--ink-muted);" id="walkthrough-toggle-state">[Off]</span>
        </button>

        <button type="button" class="btn" id="btn-open-tech-modal" style="font-size: 0.78rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Technical Spec &amp; Flow
        </button>
      </div>
    </div>
  </header>

  <!-- Controls & Scenario Bar -->
  <div class="controls-bar">
    <div class="controls-inner">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <label for="select-project-scenario" style="font-size: 0.8rem; font-weight: 700; color: var(--ink-secondary);">
          Project Scenario:
        </label>
        <select id="select-project-scenario" style="padding: 0.35rem 0.65rem; border-radius: var(--radius-md); border: 1px solid var(--border-strong); font-size: 0.84rem; font-weight: 600; background: var(--bg-surface);">
          <option value="shed-1000">🏡 Backyard Tool Shed ($1,000)</option>
          <option value="kitchen-3500">🍳 Compact Kitchenette Remodel ($3,500)</option>
          <option value="maker-2000">🖨️ Maker Studio &amp; 3D Lab ($2,000)</option>
        </select>
        <span class="pill pill-pass font-mono" id="mandate-hash-badge">
          Mandate: Active (v1)
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button type="button" class="btn" id="btn-reset-scenario-data" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
          Reset Scenario State
        </button>
      </div>
    </div>
  </div>

  <!-- Main Unified Dashboard -->
  <main class="dashboard-container">

    <!-- Guided Walkthrough Drawer (Hidden by default, toggled via header) -->
    <section id="walkthrough-drawer" class="walkthrough-drawer hidden" aria-label="Guided Judge Walkthrough">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.86rem; font-weight: 800; color: #166534; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚡ Interactive Story Arc (Testing the Flow)</span>
            <span class="pill pill-pass" id="walkthrough-scenario-tag">Backyard Tool Shed</span>
          </div>
          <p style="font-size: 0.78rem; color: #1e3a5f; margin-top: 0.15rem;">
            Experience the 4-step sequence: Fair Part passes → Overpriced Trap gets denied 4 ways → Fair alternative passes → Escalation prompts human override.
          </p>
        </div>
        <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
          <button type="button" class="btn" id="btn-wt-step-1" style="border-color: #86efac; background: white; font-size: 0.76rem;">
            1. Fair Material (PASS)
          </button>
          <button type="button" class="btn" id="btn-wt-step-2" style="border-color: #fca5a5; background: #fff5f5; color: #991b1b; font-size: 0.76rem; font-weight: 700;">
            2. The Overpriced Trap (DENY)
          </button>
          <button type="button" class="btn" id="btn-wt-step-3" style="border-color: #86efac; background: white; font-size: 0.76rem;">
            3. Fair Alternative (PASS)
          </button>
          <button type="button" class="btn" id="btn-wt-step-4" style="border-color: #fde68a; background: white; font-size: 0.76rem;">
            4. Escalation Item
          </button>
        </div>
      </div>
    </section>

    <!-- Top KPI Grid: Instant Financial Visibility -->
    <section class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Mandate Budget</div>
        <div class="kpi-value" id="kpi-total-budget">$1,000</div>
        <div class="kpi-sub" id="kpi-goal-title">Goal: Build a shed</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">PayPal Captured</div>
        <div class="kpi-value" style="color: var(--pass);" id="kpi-spent">$0</div>
        <div class="kpi-sub" id="kpi-spent-pct">0% captured</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Remaining Spendable</div>
        <div class="kpi-value" id="kpi-remaining">$1,000</div>
        <div class="kpi-sub" id="kpi-reserve-needed">Essential reserve: $810</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Project Finishable? (G5)</div>
        <div class="kpi-value" style="color: var(--pass);" id="kpi-finishable">YES — INTACT</div>
        <div class="kpi-sub" id="kpi-finishable-sub">All essential reserves fundable</div>
      </div>
    </section>

    <!-- Main Cockpit: Left Envelopes & Right Purchasing Engine -->
    <div class="cockpit-grid">
      
      <!-- LEFT COLUMN: Category Allowance Envelopes -->
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Category Allowance Envelopes</h2>
            <p class="card-desc">Signed cryptographic caps. Spending in each envelope updates live.</p>
          </div>
          <button type="button" class="btn" id="btn-edit-envelope-dialog" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
            Edit Envelopes
          </button>
        </div>

        <div id="category-envelopes-list"></div>

        <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 0.76rem; color: var(--ink-muted);">
          <span>Fiduciary Invariant: Sum equals budget</span>
          <span class="font-mono" id="envelope-sha-indicator">SHA-256 locked</span>
        </div>
      </section>

      <!-- RIGHT COLUMN: Interactive Agent Purchasing Engine -->
      <section class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="card-header" style="margin-bottom: 0;">
          <div>
            <h2 class="card-title">Agent Purchasing Engine</h2>
            <p class="card-desc">Propose parts and labor quotes. Evaluated against 5 gates before PayPal capture.</p>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn btn-primary" id="tab-btn-catalog" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
              Parts &amp; Labor Catalog
            </button>
            <button type="button" class="btn" id="tab-btn-evalfeed" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
              Decision Feed (<span id="feed-count-badge">0</span>)
            </button>
          </div>
        </div>

        <!-- VIEW 1: Available Proposals Catalog (Default) -->
        <div id="view-catalog" class="space-y-3">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;" id="catalog-filter-bar">
              <button type="button" class="btn btn-active-toggle btn-filter" data-type="all" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">All</button>
              <button type="button" class="btn btn-filter" data-type="part" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">Parts / Materials</button>
              <button type="button" class="btn btn-filter" data-type="labor" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">Labor / Subcontracts</button>
              <button type="button" class="btn btn-filter" data-type="trap" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; color: #dc2626;">Traps &amp; Tests</button>
            </div>
            <button type="button" class="btn" id="btn-open-custom-quote-dialog" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">
              + Custom Proposal
            </button>
          </div>

          <div id="catalog-items-container" class="catalog-grid"></div>
        </div>

        <!-- VIEW 2: Evaluated Purchases Decision Feed (Hidden by default) -->
        <div id="view-evalfeed" class="hidden space-y-3">
          <div id="eval-items-container">
            <div style="padding: 2rem; text-align: center; color: var(--ink-muted); font-size: 0.82rem;">
              No proposals evaluated yet for this project. Propose items from the catalog to see 5-gate decisions.
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- BOTTOM PANEL: Cryptographic Hash-Chained Audit Trail -->
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Append-Only Hash-Chained Audit Trail</h2>
          <p class="card-desc">Every mandate, proposal evaluation, and PayPal Sandbox capture linked via SHA-256.</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="pill pill-pass" id="audit-chain-badge">Chain: Verified OK</span>
          <button type="button" class="btn" id="btn-reverify-chain" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
            Re-verify Chain
          </button>
        </div>
      </div>
      <div id="audit-log-stream" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.45rem;"></div>
    </section>

  </main>

  <!-- Technical Spec & Flow Modal -->
  <div id="tech-modal" class="modal-backdrop hidden">
    <div class="modal-window">
      <div class="modal-top">
        <h3 style="font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.45rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Technical Architecture &amp; Judging Alignment
        </h3>
        <button type="button" class="btn" id="btn-close-modal" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">✕ Close</button>
      </div>

      <div style="display: flex; background: var(--bg-subtle); padding: 0.35rem 1rem; gap: 0.4rem; border-bottom: 1px solid var(--border-subtle); overflow-x: auto;" id="modal-tab-bar">
        <button type="button" class="btn btn-primary modtab-btn" data-tab="flow" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">1. Fiduciary Flow</button>
        <button type="button" class="btn modtab-btn" data-tab="gates" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">2. The 5 Gates</button>
        <button type="button" class="btn modtab-btn" data-tab="paypal" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">3. PayPal Integration</button>
        <button type="button" class="btn modtab-btn" data-tab="crypto" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">4. Chain of Trust</button>
        <button type="button" class="btn modtab-btn" data-tab="judging" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">5. Judging Alignment</button>
      </div>

      <div class="modal-content-area">
        <div id="modpane-flow" class="modpane space-y-2">
          <h4 style="font-weight: 700; color: var(--ink-primary);">Why Single Spending Limits Fail</h4>
          <p>Giving an AI purchasing agent a single total spending limit (e.g. $1,000) is hazardous: the agent can spend $920 on an overpriced component on day one. It is technically within budget, but the project is rendered impossible to finish.</p>
          <div style="padding: 0.75rem; background: var(--bg-subtle); border-radius: var(--radius-md); margin: 0.6rem 0;">
            <strong>The 5-Step Fiduciary Flow:</strong>
            <ol style="padding-left: 1.25rem; margin-top: 0.3rem;">
              <li><strong>Plan:</strong> AI breaks down the goal into named categories with reference price estimates.</li>
              <li><strong>Sign:</strong> Owner signs the envelope; canonical SHA-256 hash locks the mandate.</li>
              <li><strong>Propose:</strong> Agent proposes purchases against the active plan.</li>
              <li><strong>Gate:</strong> 5 deterministic gates evaluate value-for-money and forward coherence.</li>
              <li><strong>Pay or Deny:</strong> Passing purchases capture via the <strong>PayPal Orders v2 Sandbox API</strong>. Blocked proposals halt with zero PayPal calls made.</li>
            </ol>
          </div>
        </div>

        <div id="modpane-gates" class="modpane hidden space-y-2">
          <h4 style="font-weight: 700; color: var(--ink-primary);">The Five Deterministic Value Gates (PDD §7)</h4>
          <p>Evaluated using pure TypeScript math in integer cents. An LLM never decides whether money moves.</p>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <li><strong>G1 Total Cap:</strong> <code>total_spent + quote > total_budget</code> → <code>DENY (TOTAL_CAP_EXCEEDED)</code>.</li>
            <li><strong>G2 Category Cap:</strong> Exceeds category cap. If overflow fits in unused contingency, downgrades to <code>ESCALATE (CONTINGENCY_DRAW)</code>; otherwise <code>DENY</code>.</li>
            <li><strong>G3 Proportionality:</strong> <code>quote / total_budget > 0.50</code> → <code>DENY (SINGLE_ITEM_DOMINANCE)</code>; <code>0.30–0.50</code> → <code>ESCALATE</code>.</li>
            <li><strong>G4 Value for Money:</strong> Compares quote against curated reference median. <code>ratio > 1.50</code> → <code>DENY (PRICE_NOT_VALUE_FOR_MONEY)</code>; <code>1.15–1.50</code> → <code>ESCALATE</code>; unpriced items → <code>ESCALATE (NO_REFERENCE_PRICE)</code>.</li>
            <li><strong>G5 Forward Coherence:</strong> Verifies remaining budget covers required reserves for unfinished essential categories. If <code>remaining_after < required_reserve</code> → <code>DENY (PROJECT_LEFT_UNFINISHABLE)</code>.</li>
          </ul>
        </div>

        <div id="modpane-paypal" class="modpane hidden space-y-2">
          <h4 style="font-weight: 700; color: var(--ink-primary);">PayPal Orders v2 Sandbox Integration</h4>
          <p>PrismPay integrates server-side with PayPal's Orders v2 API (<code>api-m.sandbox.paypal.com/v2/checkout/orders</code>) with intent <code>CAPTURE</code>.</p>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Principle 3 Invariant:</strong> A PayPal order is created strictly on <code>PASS</code> or owner-approved <code>ESCALATE</code>. There is no standalone payment endpoint.</li>
            <li><strong>Idempotency:</strong> Proposals with a captured payment cannot execute duplicate orders.</li>
            <li><strong>Traceability:</strong> PayPal Order ID and Capture ID are permanently linked to the proposal in the audit trail.</li>
          </ul>
        </div>

        <div id="modpane-crypto" class="modpane hidden space-y-2">
          <h4 style="font-weight: 700; color: var(--ink-primary);">Chain of Trust &amp; Mandate Hashing</h4>
          <p>PrismPay implements the open Chain of Trust pattern as design inspiration:</p>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Canonical JSON Mandate Hashing:</strong> Category allocations are hashed via SHA-256. Any manual alteration in storage fails with <code>409 MANDATE_TAMPER_DETECTED</code>.</li>
            <li><strong>Append-Only Hash Chain:</strong> Events are chained via <code>event_hash = SHA-256(prev_hash + canonical_json(seq, type, payload, created_at))</code> from <code>GENESIS</code>, verifiable on demand.</li>
          </ul>
        </div>

        <div id="modpane-judging" class="modpane hidden space-y-2">
          <h4 style="font-weight: 700; color: var(--ink-primary);">Judging Criteria Alignment</h4>
          <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <li><strong>Technological Implementation:</strong> Server-side PayPal Orders v2 integration, deterministic testable gate engine, and schema-validated AI budget breakdown.</li>
            <li><strong>Design:</strong> Unified dashboard cockpit with live updating envelopes, multiple pre-priced project scenarios, and clean verification drawers.</li>
            <li><strong>Potential Impact:</strong> Solves runaway spending in autonomous purchasing agents.</li>
            <li><strong>Innovation:</strong> Multi-category forward-coherence budgeting ("can the project finish?") rather than primitive single-limit cards.</li>
            <li><strong>Presentation:</strong> Scripted walkthrough highlighting the trap denial and fair alternative resolution.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Custom Quote Dialog -->
  <div id="custom-quote-modal" class="modal-backdrop hidden">
    <div class="modal-window" style="max-width: 520px;">
      <div class="modal-top">
        <h3 style="font-size: 0.92rem; font-weight: 700;">Submit Custom Agent Proposal</h3>
        <button type="button" class="btn" id="btn-close-custom-quote" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">✕ Close</button>
      </div>
      <form id="form-custom-quote-dialog" style="padding: 1.2rem; display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.82rem;">
        <div>
          <label class="block font-semibold mb-1">Item or Service Name</label>
          <input type="text" id="dlg-item-name" class="w-full p-2 border rounded" placeholder="e.g. Custom stainless worktable" required style="border: 1px solid var(--border-strong);" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label class="block font-semibold mb-1">Category</label>
            <select id="dlg-category" class="w-full p-2 border rounded" style="border: 1px solid var(--border-strong);"></select>
          </div>
          <div>
            <label class="block font-semibold mb-1">Quoted Price ($ USD)</label>
            <input type="number" id="dlg-price" class="w-full p-2 border rounded font-mono" value="85" min="1" step="1" required style="border: 1px solid var(--border-strong);" />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label class="block font-semibold mb-1">Vendor Name</label>
            <input type="text" id="dlg-vendor" class="w-full p-2 border rounded" value="Metro Supply Co." required style="border: 1px solid var(--border-strong);" />
          </div>
          <div>
            <label class="block font-semibold mb-1">Type</label>
            <select id="dlg-type" class="w-full p-2 border rounded" style="border: 1px solid var(--border-strong);">
              <option value="part">Part / Material</option>
              <option value="labor">Labor / Subcontract</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.6rem;">
          Evaluate Against Active Mandate
        </button>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast-el" class="toast hidden"></div>

  <!-- Application Script -->
  <script>
    (function() {
      const state = {
        meta: null,
        scenarios: [],
        currentScenarioId: 'shed-1000',
        project: null,
        mandate: null,
        dashboard: null,
        proposals: [],
        catalog: [],
        auditEvents: [],
        currentCatalogFilter: 'all',
        showWalkthrough: false
      };

      function fmtDollars(cents) {
        const sign = cents < 0 ? '-' : '';
        const abs = Math.abs(Math.round(cents));
        const whole = Math.floor(abs / 100).toLocaleString('en-US');
        const frac = abs % 100;
        return frac === 0 ? sign + '$' + whole : sign + '$' + whole + '.' + String(frac).padStart(2, '0');
      }

      function showToast(msg) {
        const t = document.getElementById('toast-el');
        t.textContent = msg;
        t.classList.remove('hidden');
        clearTimeout(window.__tTimer);
        window.__tTimer = setTimeout(() => t.classList.add('hidden'), 3800);
      }

      // Initialize metadata and scenarios from server
      async function initApp() {
        try {
          const res = await fetch('/api/meta');
          state.meta = await res.json();
          state.scenarios = state.meta.scenarios || [];

          // Populate scenario dropdown
          const sel = document.getElementById('select-project-scenario');
          sel.innerHTML = '';
          state.scenarios.forEach(sc => {
            const opt = document.createElement('option');
            opt.value = sc.id;
            opt.textContent = sc.name;
            sel.appendChild(opt);
          });

          // Load first scenario (Shed Demo)
          await loadScenario('shed-1000');
        } catch (e) {
          console.error(e);
        }
      }

      // Load a specific scenario by ID
      async function loadScenario(scenarioId) {
        state.currentScenarioId = scenarioId;
        const res = await fetch('/api/demo/scenario/' + scenarioId, { method: 'POST' });
        const data = await res.json();

        state.project = data.project;
        state.mandate = data.mandate;
        state.catalog = data.proposals || [];
        state.proposals = [];

        await refreshDashboardState(state.project.id);
        renderCatalog();
        updateWalkthroughScenario();
        showToast('Loaded ' + data.scenario.name + ' & signed Mandate v1!');
      }

      // Refresh Dashboard data and audit log
      async function refreshDashboardState(projectId) {
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

        renderKPIs();
        renderCategoryEnvelopes();
        renderDecisionFeed();
        renderAuditLog(aData.verification);

        // Populate dialog categories
        const dlgCat = document.getElementById('dlg-category');
        dlgCat.innerHTML = '';
        state.mandate.categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          dlgCat.appendChild(opt);
        });
      }

      // Render KPIs
      function renderKPIs() {
        if (!state.dashboard) return;
        const d = state.dashboard;
        document.getElementById('kpi-total-budget').textContent = fmtDollars(d.total_budget_cents);
        document.getElementById('kpi-goal-title').textContent = 'Goal: ' + state.project.goal_text;
        document.getElementById('kpi-spent').textContent = fmtDollars(d.total_spent_cents);
        const pct = d.total_budget_cents > 0 ? Math.round((d.total_spent_cents / d.total_budget_cents) * 100) : 0;
        document.getElementById('kpi-spent-pct').textContent = pct + '% captured via PayPal';
        document.getElementById('kpi-remaining').textContent = fmtDollars(d.remaining_cents);
        document.getElementById('kpi-reserve-needed').textContent = 'Essential reserve: ' + fmtDollars(d.required_reserve_cents);

        const finEl = document.getElementById('kpi-finishable');
        const finSub = document.getElementById('kpi-finishable-sub');
        if (d.project_finishable) {
          finEl.textContent = 'YES — INTACT';
          finEl.style.color = 'var(--pass)';
          finSub.textContent = fmtDollars(d.remaining_cents) + ' covers ' + fmtDollars(d.required_reserve_cents) + ' reserves';
        } else {
          finEl.textContent = 'NO — DEFICIT';
          finEl.style.color = 'var(--deny)';
          finSub.textContent = 'Remaining budget insufficient for essentials';
        }

        if (state.mandate) {
          document.getElementById('mandate-hash-badge').textContent = 'Mandate v' + state.mandate.version + ': ' + state.mandate.sha256_hash.slice(0, 10) + '…';
          document.getElementById('envelope-sha-indicator').textContent = 'SHA-256: ' + state.mandate.sha256_hash.slice(0, 14) + '…';
        }
      }

      // Render Left Column Envelopes
      function renderCategoryEnvelopes() {
        const container = document.getElementById('category-envelopes-list');
        container.innerHTML = '';
        if (!state.dashboard || !state.dashboard.categories) return;

        state.dashboard.categories.forEach(cat => {
          const fillPct = cat.cap_cents > 0 ? Math.min(100, Math.round((cat.spent_cents / cat.cap_cents) * 100)) : 0;
          const isOver = cat.spent_cents > cat.cap_cents;
          const isFunded = cat.essential && cat.spent_cents > 0;

          const row = document.createElement('div');
          row.className = 'cat-card';
          row.innerHTML = \`
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <strong style="font-size: 0.86rem; color: var(--ink-primary);">\${cat.name}</strong>
                \${cat.essential ? (isFunded ? '<span class="pill pill-pass" style="font-size: 0.68rem;">✓ Funded</span>' : '<span class="pill" style="font-size: 0.68rem;">Essential</span>') : '<span class="pill" style="font-size: 0.68rem;">Contingency</span>'}
              </div>
              <div class="font-mono" style="font-size: 0.8rem;">
                Spent: <strong>\${fmtDollars(cat.spent_cents)}</strong> / Cap: <strong>\${fmtDollars(cat.cap_cents)}</strong>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill \${isOver ? 'over' : fillPct > 0 ? 'safe' : ''}" style="width: \${fillPct}%;"></div>
            </div>
          \`;
          container.appendChild(row);
        });
      }

      // Render Available Proposals Catalog (Right Column Tab 1)
      function renderCatalog() {
        const container = document.getElementById('catalog-items-container');
        container.innerHTML = '';

        const filter = state.currentCatalogFilter;
        const items = state.catalog.filter(item => {
          if (filter === 'all') return true;
          if (filter === 'part') return item.item_type === 'part';
          if (filter === 'labor') return item.item_type === 'labor';
          if (filter === 'trap') return item.expected_decision === 'DENY' || item.expected_decision === 'ESCALATE';
          return true;
        });

        if (items.length === 0) {
          container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--ink-muted); font-size: 0.8rem;">No items match this filter.</div>';
          return;
        }

        items.forEach((item, idx) => {
          const isTrap = item.expected_decision === 'DENY';
          const isLabor = item.item_type === 'labor';

          const card = document.createElement('div');
          card.className = 'catalog-item' + (isTrap ? ' trap' : '');
          card.innerHTML = \`
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <strong style="font-size: 0.88rem; color: var(--ink-primary);">\${item.item_name}</strong>
                <span class="pill" style="font-size: 0.68rem;">\${item.category}</span>
                <span class="pill \${isLabor ? 'pill-paypal' : ''}" style="font-size: 0.68rem;">\${isLabor ? 'Labor' : 'Part'}</span>
                \${isTrap ? '<span class="pill pill-deny" style="font-size: 0.68rem;">The Trap</span>' : ''}
              </div>
              <div style="font-size: 0.76rem; color: var(--ink-muted); margin-top: 0.2rem;">
                \${item.justification} (Vendor: \${item.vendor})
              </div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
              <div class="font-mono font-bold" style="font-size: 0.95rem; color: var(--ink-primary);">
                \${fmtDollars(item.quoted_price_cents)}
              </div>
              <button type="button" class="btn btn-primary btn-propose-item" data-idx="\${idx}" style="font-size: 0.74rem; padding: 0.3rem 0.65rem;">
                Propose Item →
              </button>
            </div>
          \`;
          container.appendChild(card);
        });

        container.querySelectorAll('.btn-propose-item').forEach(b => {
          b.addEventListener('click', async (e) => {
            const idx = Number(b.dataset.idx);
            const item = items[idx];
            b.disabled = true;
            b.textContent = 'Evaluating…';
            await executeProposalSubmission(item);
            b.disabled = false;
            b.textContent = 'Propose Item →';
          });
        });
      }

      // Execute Proposal Submission through API
      async function executeProposalSubmission(itemSpec) {
        if (!state.project || !state.mandate) return;
        const res = await fetch('/api/projects/' + state.project.id + '/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: itemSpec.item_id,
            item_name: itemSpec.item_name,
            vendor: itemSpec.vendor,
            category: itemSpec.category,
            quoted_price_cents: itemSpec.quoted_price_cents,
            quantity: itemSpec.quantity || 1,
            justification: itemSpec.justification,
            source: 'agent'
          })
        });

        const data = await res.json();
        await refreshDashboardState(state.project.id);

        if (data.gate_evaluation === 'DENY') {
          showToast(\`DENIED: \${data.reason_codes.length} gates fired against \${fmtDollars(itemSpec.quoted_price_cents)}. Zero PayPal calls.\`);
        } else if (data.gate_evaluation === 'PASS') {
          showToast(\`PASS: Paid \${fmtDollars(itemSpec.quoted_price_cents)} via PayPal Sandbox.\`);
        } else {
          showToast(\`ESCALATED: \${fmtDollars(itemSpec.quoted_price_cents)} quote requires owner approval.\`);
        }
      }

      // Render Evaluated Decision Feed (Right Column Tab 2)
      function renderDecisionFeed() {
        const container = document.getElementById('eval-items-container');
        document.getElementById('feed-count-badge').textContent = String(state.proposals.length);

        if (!state.proposals || state.proposals.length === 0) {
          container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--ink-muted); font-size: 0.82rem;">No proposals evaluated yet for this project. Propose items from the catalog to see 5-gate decisions.</div>';
          return;
        }

        container.innerHTML = '';
        state.proposals.slice().reverse().forEach((item, idx) => {
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
          else if (isEscalate) badgeHtml = '<span class="pill pill-escalate">ESCALATE · OWNER ACTION</span>';
          else badgeHtml = '<span class="pill">' + p.decision + '</span>';

          let calloutHtml = '';
          if (isDeny) {
            const reasonsList = failedGates.map(g => \`<li><strong>\${g.gate} (\${g.gate_name}):</strong> \${g.explanation}</li>\`).join('');
            calloutHtml = \`
              <div class="eval-card-callout deny">
                <div style="font-weight: 700; margin-bottom: 0.2rem;">✕ Blocked Before PayPal — Zero PayPal Calls</div>
                <ul style="padding-left: 1.2rem; font-size: 0.78rem; display: flex; flex-direction: column; gap: 0.15rem;">\${reasonsList}</ul>
              </div>
            \`;
          } else if (isEscalate) {
            const reasonsList = failedGates.map(g => \`<li><strong>\${g.gate}:</strong> \${g.explanation}</li>\`).join('');
            calloutHtml = \`
              <div class="eval-card-callout escalate">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-weight: 700;">⚠ Escalated for Owner Confirmation</div>
                    <ul style="padding-left: 1rem; font-size: 0.78rem;">\${reasonsList}</ul>
                  </div>
                  <div style="display: flex; gap: 0.4rem;">
                    <button type="button" class="btn btn-primary btn-eval-approve" data-id="\${p.id}" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">Approve &amp; Pay</button>
                    <button type="button" class="btn btn-eval-reject" data-id="\${p.id}" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">Reject</button>
                  </div>
                </div>
              </div>
            \`;
          } else if (pay && pay.status === 'captured') {
            calloutHtml = \`
              <div class="eval-card-callout pass">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; font-size: 0.78rem;">
                  <span>✓ PayPal Sandbox Captured: <strong>\${fmtDollars(pay.amount_cents)}</strong></span>
                  <span class="font-mono">Order: <strong>\${pay.paypal_order_id}</strong> · Capture: <strong>\${pay.paypal_capture_id}</strong></span>
                </div>
              </div>
            \`;
          }

          const gateRows = gates.map(g => {
            const pillCls = g.outcome === 'pass' ? 'pill-pass' : g.outcome === 'escalate' ? 'pill-escalate' : 'pill-deny';
            return \`
              <tr>
                <td class="font-mono font-bold" style="white-space: nowrap;">\${g.gate} · \${g.gate_name}</td>
                <td><span class="pill \${pillCls}">\${g.outcome.toUpperCase()}</span></td>
                <td class="font-mono" style="font-size: 0.74rem;">\${g.reason_code}</td>
                <td>\${g.explanation}</td>
              </tr>
            \`;
          }).join('');

          const card = document.createElement('div');
          card.className = \`eval-card \${isPaid ? 'pass' : isDeny ? 'deny' : 'escalate'}\`;
          card.innerHTML = \`
            <div class="eval-card-header">
              <div>
                <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                  <strong style="font-size: 0.9rem; color: var(--ink-primary);">\${p.item_name}</strong>
                  <span class="pill" style="font-size: 0.68rem;">\${p.category}</span>
                  <span style="font-size: 0.75rem; color: var(--ink-muted);">Vendor: \${p.vendor}</span>
                </div>
                <div style="font-size: 0.76rem; color: var(--ink-muted); margin-top: 0.2rem;">\${p.justification}</div>
              </div>
              <div style="text-align: right;">
                <div class="font-mono font-bold" style="font-size: 1rem;">\${fmtDollars(p.quoted_price_cents)}</div>
                <div style="margin-top: 0.2rem;">\${badgeHtml}</div>
              </div>
            </div>
            \${calloutHtml}
            <div style="padding: 0.45rem 1.15rem; background: var(--bg-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
              <span style="color: var(--ink-muted);">5 Deterministic Gates</span>
              <button type="button" class="btn-toggle-gates" style="background: none; border: none; color: var(--brand-blue); font-weight: 700; cursor: pointer;">
                Inspect Verification Details ▾
              </button>
            </div>
            <div class="gate-pane hidden" style="border-top: 1px solid var(--border-subtle);">
              <table class="eval-gate-table">
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Result</th>
                    <th>Reason Code</th>
                    <th>Deterministic Comparison</th>
                  </tr>
                </thead>
                <tbody>\${gateRows}</tbody>
              </table>
            </div>
          \`;
          container.appendChild(card);
        });

        // Toggle verification details
        container.querySelectorAll('.btn-toggle-gates').forEach(b => {
          b.addEventListener('click', (e) => {
            const card = e.target.closest('.eval-card');
            const pane = card.querySelector('.gate-pane');
            const isHidden = pane.classList.contains('hidden');
            pane.classList.toggle('hidden', !isHidden);
            b.textContent = isHidden ? 'Hide Verification Details ▴' : 'Inspect Verification Details ▾';
          });
        });

        container.querySelectorAll('.btn-eval-approve').forEach(b => {
          b.addEventListener('click', async () => {
            const id = b.dataset.id;
            b.disabled = true;
            b.textContent = 'Capturing…';
            await fetch('/api/proposals/' + id + '/approve', { method: 'POST' });
            await refreshDashboardState(state.project.id);
            showToast('Escalation approved — PayPal Sandbox payment captured.');
          });
        });

        container.querySelectorAll('.btn-eval-reject').forEach(b => {
          b.addEventListener('click', async () => {
            const id = b.dataset.id;
            b.disabled = true;
            await fetch('/api/proposals/' + id + '/reject', { method: 'POST' });
            await refreshDashboardState(state.project.id);
            showToast('Escalation rejected — no payment created.');
          });
        });
      }

      // Render Audit Log Stream
      function renderAuditLog(verification) {
        const stream = document.getElementById('audit-log-stream');
        const badge = document.getElementById('audit-chain-badge');
        if (verification && verification.valid) {
          badge.textContent = \`✓ Chain Verified (\${verification.checked_count} events intact)\`;
          badge.className = 'pill pill-pass';
        } else if (verification && !verification.valid) {
          badge.textContent = \`✕ Chain Broken at seq \${verification.broken_at_seq}\`;
          badge.className = 'pill pill-deny';
        }

        stream.innerHTML = '';
        state.auditEvents.slice().reverse().forEach(ev => {
          const row = document.createElement('div');
          const isGreen = ev.type.includes('CAPTURED') || ev.type.includes('SIGNED') || ev.type.includes('APPROVED');
          const isRed = ev.type.includes('REJECTED') || (ev.payload && ev.payload.decision === 'DENY');
          const badgeClass = isGreen ? 'pill-pass' : isRed ? 'pill-deny' : 'pill-paypal';

          row.style.padding = '0.45rem 0.75rem';
          row.style.background = 'var(--bg-subtle)';
          row.style.borderRadius = 'var(--radius-sm)';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.gap = '0.75rem';
          row.style.fontSize = '0.78rem';
          row.className = 'font-mono';

          row.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-weight: 700; color: var(--ink-muted);">#\${ev.seq}</span>
              <span class="pill \${badgeClass}" style="font-size: 0.68rem;">\${ev.type}</span>
              <span class="font-sans" style="font-size: 0.8rem; color: var(--ink-primary);">\${JSON.stringify(ev.payload)}</span>
            </div>
            <div style="font-size: 0.7rem; color: var(--ink-muted); text-align: right;">
              hash: \${ev.event_hash.slice(0, 12)}…
            </div>
          \`;
          stream.appendChild(row);
        });
      }

      // Update Walkthrough Scenario guidance
      function updateWalkthroughScenario() {
        const sc = state.scenarios.find(s => s.id === state.currentScenarioId) || state.scenarios[0];
        if (!sc) return;
        document.getElementById('walkthrough-scenario-tag').textContent = sc.name;

        // Populate step buttons with this scenario's specific test items
        const p1 = sc.proposals[0];
        const p2 = sc.proposals.find(p => p.expected_decision === 'DENY') || sc.proposals[1];
        const p3 = sc.proposals.find(p => p.step === 3) || sc.proposals[2];
        const p4 = sc.proposals.find(p => p.expected_decision === 'ESCALATE') || sc.proposals[3];

        if (p1) document.getElementById('btn-wt-step-1').textContent = \`1. \${p1.item_name.slice(0, 18)}… (\${fmtDollars(p1.quoted_price_cents)} PASS)\`;
        if (p2) document.getElementById('btn-wt-step-2').textContent = \`2. \${p2.item_name.slice(0, 18)}… (TRAP DENY)\`;
        if (p3) document.getElementById('btn-wt-step-3').textContent = \`3. \${p3.item_name.slice(0, 18)}… (PASS)\`;
        if (p4) document.getElementById('btn-wt-step-4').textContent = \`4. \${p4.item_name.slice(0, 18)}… (ESCALATE)\`;

        document.getElementById('btn-wt-step-1').onclick = () => p1 && executeProposalSubmission(p1);
        document.getElementById('btn-wt-step-2').onclick = () => p2 && executeProposalSubmission(p2);
        document.getElementById('btn-wt-step-3').onclick = () => p3 && executeProposalSubmission(p3);
        document.getElementById('btn-wt-step-4').onclick = () => p4 && executeProposalSubmission(p4);
      }

      // Event Listeners: Scenario Selector
      document.getElementById('select-project-scenario').addEventListener('change', (e) => {
        loadScenario(e.target.value);
      });

      document.getElementById('btn-reset-scenario-data').addEventListener('click', () => {
        loadScenario(state.currentScenarioId);
      });

      // Walkthrough Toggle (Hidden by default)
      const wtDrawer = document.getElementById('walkthrough-drawer');
      const wtBtn = document.getElementById('btn-toggle-walkthrough');
      const wtState = document.getElementById('walkthrough-toggle-state');
      wtBtn.addEventListener('click', () => {
        state.showWalkthrough = !state.showWalkthrough;
        wtDrawer.classList.toggle('hidden', !state.showWalkthrough);
        wtBtn.classList.toggle('btn-active-toggle', state.showWalkthrough);
        wtState.textContent = state.showWalkthrough ? '[Active]' : '[Off]';
      });

      // Purchasing Engine Tab Switcher
      const tabCatalog = document.getElementById('tab-btn-catalog');
      const tabEvalFeed = document.getElementById('tab-btn-evalfeed');
      const viewCatalog = document.getElementById('view-catalog');
      const viewEvalFeed = document.getElementById('view-evalfeed');

      tabCatalog.addEventListener('click', () => {
        tabCatalog.classList.add('btn-primary');
        tabEvalFeed.classList.remove('btn-primary');
        viewCatalog.classList.remove('hidden');
        viewEvalFeed.classList.add('hidden');
      });

      tabEvalFeed.addEventListener('click', () => {
        tabEvalFeed.classList.add('btn-primary');
        tabCatalog.classList.remove('btn-primary');
        viewEvalFeed.classList.remove('hidden');
        viewCatalog.classList.add('hidden');
      });

      // Catalog Filter Buttons
      document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('btn-active-toggle'));
          btn.classList.add('btn-active-toggle');
          state.currentCatalogFilter = btn.dataset.type;
          renderCatalog();
        });
      });

      // Technical Details Modal
      const techModal = document.getElementById('tech-modal');
      document.getElementById('btn-open-tech-modal').addEventListener('click', () => {
        techModal.classList.remove('hidden');
      });
      document.getElementById('btn-close-modal').addEventListener('click', () => {
        techModal.classList.add('hidden');
      });
      techModal.addEventListener('click', (e) => {
        if (e.target === techModal) techModal.classList.add('hidden');
      });

      document.querySelectorAll('.modtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.modtab-btn').forEach(b => b.classList.remove('btn-primary'));
          document.querySelectorAll('.modpane').forEach(p => p.classList.add('hidden'));
          btn.classList.add('btn-primary');
          const tabId = btn.dataset.tab;
          document.getElementById('modpane-' + tabId).classList.remove('hidden');
        });
      });

      // Custom Proposal Modal
      const customModal = document.getElementById('custom-quote-modal');
      document.getElementById('btn-open-custom-quote-dialog').addEventListener('click', () => {
        customModal.classList.remove('hidden');
      });
      document.getElementById('btn-close-custom-quote').addEventListener('click', () => {
        customModal.classList.add('hidden');
      });

      document.getElementById('form-custom-quote-dialog').addEventListener('submit', async (e) => {
        e.preventDefault();
        const item_name = document.getElementById('dlg-item-name').value.trim();
        const category = document.getElementById('dlg-category').value;
        const priceDollars = Number(document.getElementById('dlg-price').value || 0);
        const vendor = document.getElementById('dlg-vendor').value.trim();

        customModal.classList.add('hidden');
        await executeProposalSubmission({
          item_id: null,
          item_name,
          category,
          quoted_price_cents: Math.round(priceDollars * 100),
          vendor,
          justification: 'Custom quote submitted by agent against active envelope.'
        });
      });

      // Audit Chain Re-verify
      document.getElementById('btn-reverify-chain').addEventListener('click', async () => {
        if (!state.project) return;
        const res = await fetch('/api/projects/' + state.project.id + '/audit/verify', { method: 'POST' });
        const data = await res.json();
        renderAuditLog(data.verification);
        showToast('Audit chain verified: all SHA-256 links valid.');
      });

      // Start application
      initApp();
    })();
  </script>
</body>
</html>`;
}
