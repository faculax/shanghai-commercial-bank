CREATE TABLE mxml_files (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    import_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (import_id) REFERENCES trade_imports(id) ON DELETE CASCADE
);

CREATE INDEX idx_mxml_files_import_id ON mxml_files(import_id);
