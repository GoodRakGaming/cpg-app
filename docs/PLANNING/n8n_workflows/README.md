# n8n Level 0 — workflow-файлы для импорта

Черновики, сгенерированные по [`PHASE_10B_level0_ingestion_plan.md`](../PHASE_10B_level0_ingestion_plan.md)
(план прошёл 4 раунда независимого технического ревью — все блокеры C1-C4/D1-D3 закрыты в логике
ниже). Это рабочие черновики, не готовый к прогону без донастройки продукт — везде, где нужно
значение, которое ассистент не должен видеть или не может знать заранее (credentials, X-API-Key,
реальные колонки xlsx, id workflow после импорта), стоит `=ЗАМЕНИ: ...`. Часть node-параметров
(особенно в #1 — самом сложном) может потребовать поправки под конкретную версию n8n после
импорта — структура и порядок шагов проверены против плана построчно, но точный вид полей у
некоторых узлов (`switch`, `httpRequest` c `onError`) в UI может отличаться версия от версии.

## Порядок импорта

1. **`1_process_file.json`** — sub-workflow «Обработать файл прайса» (ядро). Импортировать первым
   — остальные workflow ссылаются на его `id`.
2. **`5_error_alert.json`** — Error Trigger. Импортировать вторым, чтобы можно было сразу выставить
   его как «Error Workflow» у всех остальных (см. ниже).
3. **`2_webhook_trigger.json`**, **`3_nightly_sweep.json`**, **`4_planb_watchdog.json`** — в любом
   порядке. В узлах «Execute Workflow #1» вписать `id` workflow #1 (полученный на шаге 1).

## Обязательно после импорта (легко забываемые настройки — раунд 2/3/4)

- [ ] **Error Workflow → #5** у всех пяти workflow (Settings каждого workflow → Error Workflow).
      По умолчанию не выставлено ни у одного.
- [ ] **`Loop Over Items` в #1** — размер батча берётся из `Config.BATCH_SIZE` (25) через
      expression в параметре `batchSize` узла `6. Loop Over Items`. Проверить, что n8n принимает
      expression в этом поле (в части версий batchSize — только число, тогда впиши `25` напрямую).
- [ ] **`source_folder` передаётся в Execute Workflow** при вызове #1 из #2 и #4 — без этого
      claim для файлов из `postponed/` тихо не работает (раунд 4, D2).
- [ ] **Nextcloud credential** — во всех nextCloud-узлах во всех 5 workflow.
- [ ] **Telegram credential** — во всех telegram-узлах, плюс `chat_id` получателя.
- [ ] **`X-API-Key`** — во всех httpRequest-узлах, обращающихся к `/api/price-catalog/...`. Значение
      не проси у ассистента и не пиши в чат — впиши сам прямо в n8n (или заведи Header Auth
      credential и переиспользуй).
- [ ] **`OLLAMA_URL`/`INGEST_URL`/`RUNS_URL`** в узле `Config` workflow #1 — проверить актуальность
      адресов по `docs/PLANNING/PHASE_10A_llm_infra_plan.md`/`docs/DEPLOYMENT.md`.
- [ ] **Пути к папкам Nextcloud** (`На анализ/`, `queue/`, `processing/`, `postponed/`,
      `archive/`, `errors/`, `unsupported/`) — везде, где встречается `=ЗАМЕНИ: путь к папке`.
- [ ] **`!! ЗАПОЛНИ` в #1** — реальные колонки xlsx, `source_type`, `source_detail`. Донастроить
      после первого тестового запуска (`Execute Node` на реальном файле — см. тест 3/4 плана).
- [ ] **`WATCHDOG_THRESHOLD_SECONDS`** — оставить пустым/0 до калибровочного теста (~60 строк,
      раздел «Бенчмарк» плана), затем вписать **в двух местах**: `Config` workflow #1 и `Config`
      workflow #4 — держать синхронно.
- [ ] **Регистрация webhook в Nextcloud** — `./setup_nextcloud_webhook.sh register` на сервере
      Nextcloud (см. тест №0 ниже, уже пройден — если webhook перерегистрируется заново, свериться
      с этим же скриптом, не собирать payload вручную). Значение shared-secret из
      `./setup_nextcloud_webhook.sh show-secret` — в узел «Проверка shared-secret» workflow #2.

## Тест №0 — ✅ пройден на проде

Механизм оказался не Nextcloud Flow (в этой версии Nextcloud его нет), а приложение
`webhook_listeners`, подписка регистрируется через OCS API — см.
`docs/PLANNING/n8n_workflows/setup_nextcloud_webhook.sh` и раздел «Триггеры» в плане. Оба критерия
C1 подтверждены: событие приходит на `move` **в** `queue/`, отсутствует на `move` **из** неё.
`oc:fileid` не используется — `source_filename`/`target.path` остаются основным путём (I3), это
уже заложено в бэкенд-роутах и в `2_webhook_trigger.json`.

## Известные упрощения черновика (проверить/доработать при сборке)

- **Аккумулятор `rows_success`/`rows_failed`/`failed_rows`/`error_summary`** в #1 реализован через
  `$getWorkflowStaticData('node')`, ключ — `$execution.id`. Это рабочий, документированный n8n-приём,
  но проверить на живом импорте, что `$execution.id` доступен в контексте Code-нод в используемой
  версии n8n — если нет, заменить на любой другой способ пронести аккумулятор через итерации
  `Loop Over Items` (например, через дополнительное поле на возвращаемых из `Loop Over Items` items).
- **IF/Switch-узлы** используют `typeVersion` из актуальной на момент написания версии n8n (2.2/3.2)
  — при импорте в другую версию n8n может предложить миграцию параметров, это нормально.
- **`onError: continueErrorOutput`** на `1. Claim` и `POST /ingest-runs` — второй output этих узлов
  используется как «ветка ошибки». Проверить после импорта, что у узла реально появился второй
  output (в части версий n8n эта опция называется иначе в UI, хотя JSON-параметр тот же).
