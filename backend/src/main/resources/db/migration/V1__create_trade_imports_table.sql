CREATE TABLE trade_imports (
    id BIGSERIAL PRIMARY KEY,
    import_name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    consolidation_criteria VARCHAR(50),
    original_trade_count INTEGER NOT NULL,
    current_trade_count INTEGER NOT NULL,
    mxml_generated BOOLEAN NOT NULL DEFAULT FALSE,
    pushed_to_murex BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    consolidated_at TIMESTAMP,
    mxml_generated_at TIMESTAMP,
    pushed_to_murex_at TIMESTAMP
);

CREATE INDEX idx_trade_imports_status ON trade_imports(status);
CREATE INDEX idx_trade_imports_created_at ON trade_imports(created_at DESC);
