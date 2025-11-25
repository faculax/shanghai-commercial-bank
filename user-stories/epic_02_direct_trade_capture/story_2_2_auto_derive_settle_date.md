# Story 2.2 – Auto-Derive Settlement Date (T+2)

**As a trade capture user**,  
I want the system to auto-populate the settlement date when I omit it  
So that I reduce manual input and follow market convention

## ✅ Acceptance Criteria
- If `settleDate` missing in `POST /trades`, system sets `settleDate = tradeDate + 2 business days`
- Business day logic: Skip Saturday/Sunday (no holiday calendar in MVP)
- Returned payload shows derived `settleDate`
- If user supplies `settleDate`, system does NOT override it (still validates rule >= tradeDate)

## 🔄 Additional Functionality
### 2.2.1 – Future Enhancement Placeholder
- Hook for future holiday calendar injection

## 🛠 Implementation Guidance
- Small utility function `deriveSettleDate(tradeDate)`
- Unit tests: Friday trade -> Tuesday settlement
