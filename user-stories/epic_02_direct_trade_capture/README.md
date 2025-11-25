# Epic 2: Direct Trade Capture (Equities MVP)

## Overview
Core ability to capture equity trades directly into the system outside RFQ flow. Supports single fund, single currency, single share class.

## Scope (MVP)
- Create trade (ISIN, quantity, price, trade date, settle date)
- Basic validation (positive numbers, settlement >= trade)
- Derive default settlement (T+2) if omitted
- List trades
- Automated demo trade generator (every 5s)

## Stories
- [Story 2.1 – Book Equity Trade](./story_2_1_book_equity_trade.md)
- [Story 2.2 – Auto-Derive Settlement Date](./story_2_2_auto_derive_settle_date.md)
- [Story 2.3 – Validate ISIN Format](./story_2_3_validate_isin_format.md)
- [Story 2.4 – List Trades Endpoint](./story_2_4_list_trades_endpoint.md)
- [Story 2.5 – Automated Demo Trade Generator](./story_2_5_automated_demo_trade_generator.md)
