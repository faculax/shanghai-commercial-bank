# Story 2.3 – Validate ISIN Format

**As the system**,  
I want to reject malformed ISINs  
So that data integrity is preserved and downstream processes trust identifiers

## ✅ Acceptance Criteria
- Pattern check: 12 characters, uppercase alphanumeric
- Reject if fails pattern with HTTP 400 `{ field: "isin", message: "Invalid ISIN format" }`
- Accept examples: `US0378331005`, `GB0002634946`
- Reject examples: `AAPL`, `123`, `us0378331005`

## 🧠 Client Education
ISIN is a global instrument identifier; enforcing structure avoids mismatches.

## 🛠 Implementation Guidance
- Regex: `^[A-Z0-9]{12}$`
- Consider future checksum validation (not in MVP)
