-- Второй раунд UI-правок Phase 10: показывать ревьюеру, НА ЧТО именно похожа новая
-- категория/каноническое имя (не только флаг да/нет), чтобы не искать вручную вслепую.

ALTER TABLE price_catalog
  ADD COLUMN category_review_details JSONB;

COMMENT ON COLUMN price_catalog.category_review_details IS
  'Заполняется библиотекарём вместе с category_review_flag: {"category": {"value": "...", "similarity": 0.82}, "canonical_work_name": {"value": "...", "similarity": 0.65}} — какие существующие значения показались похожими и с какой похожестью (0..1, pg_trgm).';
