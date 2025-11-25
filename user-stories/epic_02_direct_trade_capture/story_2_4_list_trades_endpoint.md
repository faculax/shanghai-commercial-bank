# Story 2.4 – List Trades Endpoint

**As an operations analyst**,  
I want to list trades over a date range  
So that I can review captured activity and verify completeness

## ✅ Acceptance Criteria
- Endpoint: `GET /trades?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
- Defaults: if no params, return last 50 trades sorted desc by tradeDate then createdAt
- Supports filtering by `isin` optionally `GET /trades?isin=...`
- Response: array of trade objects (id, isin, quantity, price, tradeDate, settleDate, version)
- Pagination (MVP optional) – if implemented: `limit`, `cursor` or `page`

## 🔄 Additional Functionality
### 2.4.1 – Basic Pagination (Optional)
### 2.4.2 – Sort Overrides (Optional)

## 🛠 Implementation Guidance
- DB query with simple index on `tradeDate`
- Keep response lean – no joins
