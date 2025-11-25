CREATE TABLE trades (
    id BIGSERIAL PRIMARY KEY,
    trade_id VARCHAR(255) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,
    side VARCHAR(10) NOT NULL,
    counterparty VARCHAR(255) NOT NULL,
    book VARCHAR(255) NOT NULL,
    import_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (import_id) REFERENCES trade_imports(id) ON DELETE CASCADE
);

CREATE INDEX idx_trades_import_id ON trades(import_id);
CREATE INDEX idx_trades_currency_pair ON trades(currency_pair);
CREATE INDEX idx_trades_counterparty ON trades(counterparty);
CREATE INDEX idx_trades_book ON trades(book);
