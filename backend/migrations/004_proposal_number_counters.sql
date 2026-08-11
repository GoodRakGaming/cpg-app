-- Счётчик номеров КП по году (формат "YYYY-NNN", напр. "2026-014"). Одна строка на год,
-- атомарно инкрементируется через ON CONFLICT DO UPDATE — безопасно при одновременном создании
-- нескольких КП разными сотрудниками. См. backend/src/services/proposalNumberService.js.

CREATE TABLE proposal_number_counters (
  year        INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
