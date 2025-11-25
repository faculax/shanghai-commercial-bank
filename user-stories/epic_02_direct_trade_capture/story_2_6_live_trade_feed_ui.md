# Story 2.6 – Live Trade Feed UI

**As a demo viewer / operations analyst**,  
I want to visually see newly booked (and synthetic) trades appear in near real-time  
So that I can monitor capture activity and validate that the system is ingesting trades continuously.

## ✅ Acceptance Criteria
- A "Trades" panel is visible on the frontend landing page.
- Panel shows a table (or list) with columns: `Time` (created or trade date+time), `ISIN`, `Qty`, `Price`, `Trade Date`, `Settle Date`.
- Latest trades appear at the top (descending by createdAt then id/version if needed).
- UI auto-refreshes every 5 seconds by default (configurable constant) without full page reload.
- New trades since last refresh are visually highlighted (e.g. soft green flash or badge) for ~3 seconds.
- A small status bar shows: `Last update: <HH:MM:SS>` and a green pulsing indicator while polling succeeds.
- If polling fails (HTTP/network), an error banner appears and retries continue (exponential backoff up to 30s max interval, then steady) until recovery.
- While first load in progress, a skeleton loader or spinner displays.
- Empty state: "No trades yet" message if API returns zero.
- Hover tooltip on ISIN shows full ISIN and maybe a placeholder for instrument name (future enhancement).

## 🔄 Additional Functionality (Optional)
1. Manual refresh button (disabled while a request in-flight).
2. Filter input for `ISIN` with debounced (300ms) API call (`GET /trades?isin=...`).
3. Date range quick filters: `Today`, `Last 15m`, `Last Hour` (translating to fromDate/toDate params).
4. Row density toggle (compact vs spacious).
5. Persist user preferences (filters, density) in localStorage.

## 🧪 Test Scenarios
- New synthetic trade arrives between polling cycles -> appears at top & highlight animation triggers.
- API error (e.g. 500) -> error banner shows; once API recovers highlight of resumed polling state.
- Switching ISIN filter reduces list; clearing filter resets to default last 50.
- No trades -> empty state visible, no errors.
- Accessibility: Table rows readable by screen reader; status region has `aria-live="polite"`.

## 🛠 Implementation Guidance
- Add a `trade.ts` type definition matching backend response: `{ id, isin, quantity, price, tradeDate, settleDate, createdAt, version }` (include `createdAt` if backend returns it; if not, consider adding backend support - current stories mention createdAt for persistence).
- Implement `tradeService.ts` with functions: `fetchRecentTrades(params)` returning Promise<Trade[]>.
- Create `TradeList.tsx` (or enhance) to encapsulate polling + rendering logic.
- Use `useEffect` + `setInterval` for polling; consider future upgrade to Server-Sent Events or WebSocket once backend publishes events.
- To highlight new trades: Keep a Set of newly seen IDs for N milliseconds and apply CSS transition.
- Provide lightweight CSS module for highlight (e.g. fade background color).
- Centralize polling interval constant (e.g. `const POLL_MS = 5000`).
- Backoff: On failure, multiply interval by 2 up to 30000ms; on success reset to base.
- Clean up interval on unmount.

## 🚧 Backend Notes / Alignment
- Ensure `GET /trades` returns `createdAt` (needed for ordering + time column). If absent, add to payload.
- Consider query param `limit` (e.g. 50) to constrain payload size.
- Expose CORS headers for frontend origin if not already.
- Optional SSE endpoint in future: `GET /trades/stream`.

## 📈 Future Enhancements (Backlog)
- Real-time push via WebSocket/SSE.
- Inline row expansion to show audit/version history when trade amendments (future versions) are introduced.
- Color-coding by `isin` or price movement indicator (tick up/down vs previous poll).
- Export to CSV.
- Infinite scroll pagination.

## 🧭 Rationale
Provides a tangible, continuously updating view that validates Stories 2.1–2.5 end-to-end (booking, auto settle derivation, ISIN validation, listing endpoint, synthetic generator). This amplifies demo impact and aids ops monitoring.
