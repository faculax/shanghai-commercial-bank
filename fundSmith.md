# 💸 FundSmith

## 🎨 Application Look & Feel
- **Fonts**: Arial, Georgia  
- **Colours**:  
  - RGB(255, 255, 255)  
  - RGB(0, 240, 0)  
  - RGB(60, 75, 97)  
  - RGB(0, 232, 247)  
  - RGB(30, 230, 190)  
  - RGB(0, 255, 195)  

---

## 🚀 Realistic Two-Day MVP Scope

### Focus
- Single fund  
- One share class  
- One asset type (equity)  
- One currency  

### Features
- **Trade Capture**  
  - API endpoint: `POST /trades`  
  - Fields: ISIN, quantity, price, trade date, settle date  

- **Position Keeping (IBOR)**  
  - Positions table updated in real time  
  - Running cash balance  

- **Accounting Engine (ABOR)**  
  - Journal entries for trade date + settlement date  
  - Double-entry rules (e.g. debit cash / credit securities)  

- **NAV Calculation**  
  - Market price × positions + cash  
  - Apply 0.5% management fee accrual  
  - Divide by shares outstanding  

- **Reporting**  
  - Generate PDF/Excel statement  
  - Contents: positions, cash, NAV  

---

## 📅 Two-Day Sprint Plan

### Day 1
- Scaffold repo (services: trades, positions, accounting, nav)  
- Implement trade booking API + Mongo collections  
- Update positions on trade  
- Add simple accounting postings  

### Day 2
- Add NAV calc service + fee accrual  
- Generate PDF/Excel report  
- Build basic React UI:  
  - Enter trade form  
  - View positions  
  - Show NAV  
- Wire lineage logging  
- Polish demo: book 2 trades → see positions → run NAV → download report  

---

## 🎭 Fund Accounting (SimCorp Vertical-Slice) — Theatrical Demo Script

### Cast & Setup
- **Presenter (you):** narration + business framing  
- **Driver:** runs UI, triggers feeds, clicks buttons  
- **Cameo (optional):** “Custodian” with second laptop to send positions file  

### Big Moments (Wow Beats)
- Trades flood in from “Murex” stub (streaming)  
- Instant IBOR update (positions tick up live)  
- ABOR postings appear (journals auto-generated)  
- One-click NAV (with fee accrual)  
- AMEND/CANCEL auto-reversal (ledger proves it)  
- Bad price quarantined (no dirty NAVs)  
- Reconciliation agent flags + resolves breaks live  
- Drill-down lineage: NAV → journal → trade → feed message  
- Export investor report (PDF/CSV) on the spot  

---

## ⏱️ Pre-Show Checklist (T–5 minutes)
- Open tabs: Trades, Positions (IBOR), Journals (ABOR), NAV  
- Keep Murex Feed Console visible (toggle “Start feed”)  
- Recon page ready (“Waiting for custodian file…”)  
- Ensure one fund selected: `GLOBAL_EQUITY_A` (USD base, e.g. 10,000,000 shares outstanding)  
- Load tiny pre-prices + FX; “Inject bad tick” button ready  
- Export button visible on NAV page (CSV/PDF)  
- Lineage side drawer open (collapsible)  

---

## 🎬 Demo Flow

### Opening (00:00–01:30)
Presenter:  
> “Imagine SimCorp’s vertical slice — trade capture → IBOR → ABOR → NAV — but rebuilt as small, explainable services with guardrails by design...”

---

### Beat 1 — Start Murex Stream (01:30–03:00)
- Driver clicks **Start Feed** (10k trades queued, ~50/s).  
- Trades page fills, positions tick upward.  
- Presenter explains feed safety & IBOR update.  

---

### Beat 2 — Show ABOR Postings (03:00–04:30)
- Journals auto-fill with buys, sells, fees.  
- Presenter explains double-entry + lineage.  

---

### Beat 3 — Compute NAV (04:30–06:00)
- Driver clicks **Run NAV**.  
- Presenter explains valuation, fees, per-share calc.  
- Export NAV to CSV/PDF.  

---

### Beat 4 — AMEND/CANCEL (06:00–07:30)
- Driver sends AMEND via Murex console.  
- Ledger auto-reverses and reposts.  
- Presenter explains idempotency & audit trail.  

---

### Beat 5 — Guardrail: Bad Price (07:30–09:00)
- Inject bad tick.  
- NAV page shows quarantine banner.  
- Presenter explains safety-by-default.  

---

### Beat 6 — Reconciliation Theatre (09:00–10:30)
- Custodian uploads file.  
- Recs run, breaks highlighted.  
- Presenter explains tolerance + auto-explain.  

---

### Beat 7 — End-to-End Lineage (10:30–12:00)
- Drill from NAV → valuation → journal → trade → feed message.  
- Presenter emphasizes audit readiness.  

---

### Beat 8 — The Closer (12:00–13:30)
- Recap: IBOR, ABOR, NAV, AMEND/CANCEL, guardrails, recon, lineage.  
- End with forward roadmap.  

---

## 🎯 Q&A Bait Slides
- Architecture: services on pub/sub bus  
- Posting rules (YAML snippet: policy-as-code)  
- Idempotency & versioning diagram (AMEND/CANCEL lifecycle)  
- Guardrails catalogue (price sanity, settlement checks, FX coverage)  
- Roadmap: multi-fund, share classes, swing pricing, derivatives, GAAPs  

---

## 🧰 Contingency Moves
- Slow stream → toggle “+x10 rate”  
- PDF export fails → show CSV in Excel  
- Bad-price quarantine fails → adjust tolerance to 2% + re-inject  
- Recon upload fails → open last successful recon + exception detail  

---

## 🔑 One-Liner Value Summary
> **“Front-to-back clarity, fewer reconciliations, zero midnight journals — and every number explains itself. That’s the SimCorp vertical slice, vibe-coded.”**
