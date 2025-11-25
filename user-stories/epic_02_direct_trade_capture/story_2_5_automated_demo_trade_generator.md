# Story 2.5 – Automated Demo Trad## 🧠 Client Education
Supports demo narrative: "feed of trades" without external integration. Can be disabled in production.

### Trade Generation Modes
- **Regular Mode (default)**: Trades are generated with today's date and will settle T+2 business days later.
- **Backdated Mode**: Trades are generated with a trade date set to T-2 days and will settle today, useful for demonstrating settlement-related features without waiting.
- **Stopped Mode**: No trades will be generated even if the scheduler is running, useful for temporarily pausing trade generation without stopping the service.Generator

**As a demo facilitator**,  
I want the system to auto-generate random valid trades every 5 seconds  
So that the frontend trade list has live activity without manual input

## ✅ Acceptance Criteria
- Background task runs while service is up (feature flag controlled: `AUTO_TRADE_ENABLED=true`)
- Interval: every 5 seconds create a trade via internal service layer (NOT public REST)
- Generated fields:
  - `isin`: choose randomly from configured list (e.g. 5 well-known ISINs)
  - `quantity`: random block size (e.g. 100 – 5000, step 100)
  - `price`: base price ± small jitter (e.g. start map of ISIN→basePrice, apply ±2%)
  - `tradeDate`: today (UTC)
  - `settleDate`: derived by existing logic (Story 2.2)
- Trades are indistinguishable from manual ones (same persistence path)
- Log each synthetic trade with marker `synthetic=true`

## 🔄 Additional Functionality
### 2.5.1 – API Toggle
Endpoint: `POST /admin/auto-trades/{action}` where action in (`start`,`stop`,`backdated-mode`,`regular-mode`,`stopped-mode`)
- `start` - Start the demo trade generator
- `stop` - Stop the demo trade generator
- `backdated-mode` - Enable backdated trade generation (trades will settle today)
- `regular-mode` - Enable regular trade generation (trades will settle T+2)
- `stopped-mode` - Enable stopped mode (no trades will be generated)

### 2.5.2 – Status and Metrics
Endpoint: `GET /admin/auto-trades/status`
Returns status information including:
- `running`: boolean indicating if the generator is currently active
- `mode`: the current generation mode (REGULAR, BACKDATED, or STOPPED)
- `tradeCount`: count of synthetic trades generated

## 🧠 Client Education
Supports demo narrative: “feed of trades” without external integration. Can be disabled in production.

## 🛠 Implementation Guidance
- Use scheduled executor / Spring @Scheduled (if using Spring) with conditional bean
- Config list: `demo.isins=US0378331005,US5949181045,GB0002634946,...`
- Maintain in-memory map of base prices; adjust small random delta each iteration
- Guard: do not run if service detects non-demo profile
