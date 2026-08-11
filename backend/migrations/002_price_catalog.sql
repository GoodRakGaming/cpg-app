-- Phase 10: каталог цен и подсказки при заполнении КП
-- См. docs/PLANNING/PHASE_10_PRICE_CATALOG_PLAN.md — схема ниже 1-в-1 повторяет финальный SQL
-- из раздела «Схема БД», согласованный после 3 раундов независимой рецензии.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE price_catalog (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_work_name    VARCHAR(500) NOT NULL,
  canonical_work_name VARCHAR(500) NOT NULL,
  category            VARCHAR(255),
  unit                VARCHAR(50) NOT NULL,
  price               NUMERIC(12,2),
  price_qualifier     VARCHAR(20) NOT NULL DEFAULT 'exact',
  currency            VARCHAR(3) NOT NULL DEFAULT 'RUB',
  source_type         VARCHAR(20) NOT NULL,
  source_detail       TEXT,
  observed_date       DATE NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  confidence          VARCHAR(20),
  category_review_flag BOOLEAN NOT NULL DEFAULT FALSE,
  model               VARCHAR(100),
  prompt_version      VARCHAR(50),
  row_hash            VARCHAR(64) NOT NULL,
  raw_extraction      JSONB,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT price_catalog_price_qualifier_check CHECK (price_qualifier IN ('exact', 'from', 'approx', 'on_request')),
  CONSTRAINT price_catalog_status_check CHECK (status IN ('pending_review', 'approved', 'rejected')),
  CONSTRAINT price_catalog_source_type_check CHECK (source_type IN ('own', 'competitor', 'supplier', 'market_scan')),
  CONSTRAINT price_catalog_price_or_qualifier CHECK ((price_qualifier = 'on_request') = (price IS NULL))
);

CREATE UNIQUE INDEX idx_price_catalog_row_hash ON price_catalog(row_hash);
CREATE INDEX idx_price_catalog_status ON price_catalog(status);
CREATE INDEX idx_price_catalog_canonical_work_name_unit ON price_catalog(canonical_work_name, unit);
CREATE INDEX idx_price_catalog_source_type ON price_catalog(source_type);
CREATE INDEX idx_price_catalog_canonical_work_name_trgm ON price_catalog USING gin (canonical_work_name gin_trgm_ops);
CREATE INDEX idx_price_catalog_category_trgm ON price_catalog USING gin (category gin_trgm_ops);

CREATE TABLE price_catalog_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_catalog_id UUID NOT NULL REFERENCES price_catalog(id) ON DELETE CASCADE,
  changed_by      UUID NOT NULL REFERENCES users(id),
  changed_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  before          JSONB NOT NULL,
  after           JSONB NOT NULL
);

CREATE INDEX idx_price_catalog_audit_price_catalog_id ON price_catalog_audit(price_catalog_id);
