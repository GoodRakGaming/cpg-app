-- Phase 10B: метрики/состояние n8n-пайплайна приёма прайсов (Level 0).
-- См. docs/PLANNING/PHASE_10B_level0_ingestion_plan.md, раздел «Метрики — таблица в БД».
-- Схема прошла 4 раунда независимой рецензии — партиальный уникальный индекс на status='running'
-- (не IN (...) — раунд 3, C3) реализует глобальный слот на одну GPU; failed_rows отдельно от
-- error_summary (раунд 4, E1) — машиночитаемый список для resume, не парсинг свободного текста.

CREATE TABLE n8n_ingest_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_filename      VARCHAR(500) NOT NULL,
  nextcloud_file_id    VARCHAR(64),
  resumed_from_run_id  UUID REFERENCES n8n_ingest_runs(id),
  trigger_type         VARCHAR(20) NOT NULL,
  status                VARCHAR(40) NOT NULL,
  rows_total            INTEGER,
  rows_processed         INTEGER NOT NULL DEFAULT 0,
  rows_success           INTEGER NOT NULL DEFAULT 0,
  rows_failed             INTEGER NOT NULL DEFAULT 0,
  failed_rows              INTEGER[],
  error_summary            TEXT,
  started_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at                TIMESTAMP,
  CONSTRAINT n8n_ingest_runs_trigger_type_check
    CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'watchdog')),
  CONSTRAINT n8n_ingest_runs_status_check
    CHECK (status IN ('running', 'ingest_completed_archive_pending', 'completed',
                       'completed_with_errors', 'failed', 'abandoned'))
);

-- Раунд 3 (C3): уникальность на одно значение 'running', не на IN (...) — только это
-- действительно даёт «не более одного активного прогона», защищает единственную GPU.
CREATE UNIQUE INDEX n8n_ingest_runs_single_active
  ON n8n_ingest_runs (status)
  WHERE status = 'running';

CREATE INDEX n8n_ingest_runs_status_started_idx
  ON n8n_ingest_runs (status, started_at DESC);

CREATE INDEX n8n_ingest_runs_file_id_idx ON n8n_ingest_runs (nextcloud_file_id);

-- Раунд 3 (I3): nextcloud_file_id может остаться NULL, если Nextcloud не отдаёт oc:fileid без
-- явного PROPFIND — source_filename тогда основной путь поиска активного/предыдущего прогона.
CREATE INDEX n8n_ingest_runs_filename_idx ON n8n_ingest_runs (source_filename);
