# Story 2.1 – Book Equity Trade

**As an operations analyst**,  
I want to capture an equity trade (ISIN, quantity, price, trade date, settle date)  
So that it is persisted and available for downstream position, accounting, and NAV processes

## ✅ Acceptance Criteria
- Endpoint: `POST /trades` (JSON payload)
- Required fields: `isin`, `quantity`, `price`, `tradeDate`
- Optional: `settleDate` (if omitted, handled by Story 2.2)
- Response returns: `id`, echo of inputs, `version = 1`
- Validation errors produce HTTP 400 with field-level messages

## 🧪 Validation Rules
- `isin`: 12-character alphanumeric (basic pattern)  
- `quantity`: integer > 0  
- `price`: decimal > 0  
- `tradeDate`: not in future  
- `settleDate` (if present): >= `tradeDate`

## 🧠 Client Education
A booked trade represents contractual intent pending settlement; downstream systems will reflect cash and position over lifecycle.

## 🛠 Implementation Guidance
- Persist to `trades` table/collection with fields: id, isin, quantity, price, tradeDate, settleDate, createdAt
- Emit domain event `TradeBooked` (future use)
- Keep design open for versioned amendments
