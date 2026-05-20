-- Фаза 2: Начальная схема БД
-- Файл: 001_initial_schema.sql
-- Создает основные таблицы для приложения

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user', -- 'user' или 'admin'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица шаблонов КП
CREATE TABLE IF NOT EXISTS "templates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  data JSONB NOT NULL, -- Структура шаблона с placeholders
  created_by UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица коммерческих предложений
CREATE TABLE IF NOT EXISTS "proposals" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'final', 'archived'
  template_id UUID NOT NULL REFERENCES "templates"(id),
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  current_version_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица версий КП (история изменений)
CREATE TABLE IF NOT EXISTS "proposal_versions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES "proposals"(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL, -- Полный снимок КП
  comment VARCHAR(500), -- Комментарий при сохранении
  changed_by UUID NOT NULL REFERENCES "users"(id),
  pdf_hash VARCHAR(64), -- SHA256 для кэширования PDF
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(proposal_id, version_number)
);

-- Индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"(email);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON "templates"(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON "templates"(is_active);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON "proposals"(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON "proposals"(status);
CREATE INDEX IF NOT EXISTS idx_proposals_template_id ON "proposals"(template_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON "proposal_versions"(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_changed_by ON "proposal_versions"(changed_by);

-- Комментарии для документации (опционально)
COMMENT ON TABLE "users" IS 'Таблица пользователей приложения';
COMMENT ON TABLE "templates" IS 'Шаблоны коммерческих предложений';
COMMENT ON TABLE "proposals" IS 'Коммерческие предложения';
COMMENT ON TABLE "proposal_versions" IS 'История версий коммерческих предложений';

COMMENT ON COLUMN "templates".data IS 'JSON структура шаблона с полями и placeholder''ами';
COMMENT ON COLUMN "proposals".status IS 'Статус КП: draft (черновик), final (финальный), archived (архивирован)';
COMMENT ON COLUMN "proposal_versions".data IS 'Снимок всех данных КП в момент сохранения версии';
COMMENT ON COLUMN "proposal_versions".pdf_hash IS 'SHA256 хеш HTML для определения необходимости пересоздания PDF';

-- Вывод успешного выполнения
\echo 'Миграция 001: Начальная схема БД успешно создана!'
