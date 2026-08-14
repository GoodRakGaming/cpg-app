# Техническое ревью архитектуры n8n Level 0

## Статус

**APPROVE WITH CHANGES**

Архитектура в целом жизнеспособна и не требует переписывания с нуля. Основная структура правильная: Nextcloud → n8n → LLM → существующий `price-catalog/ingest`, два независимых способа запуска, watchdog и Error Trigger.

Однако перед реализацией необходимо закрыть несколько архитектурных вопросов, прежде всего конкурентный запуск, file-level идемпотентность и семантику частичного сбоя.

---

# 1. Общая оценка

| Область | Оценка |
|---|---:|
| Общая архитектура | 8.5/10 |
| Разделение workflow | 9/10 |
| Надёжность | 6.5/10 |
| Идемпотентность | 5/10 |
| Error handling | 7/10 |
| Безопасность | 6/10 |
| Observability | 7/10 |
| Производительность | 6/10 |
| Тест-план | 6.5/10 |
| Готовность к реализации | 7/10 |

**Вывод:** хороший план с несколькими существенными архитектурными дырками. Не отклонять, но внести изменения перед генерацией production-ready workflow.

---

# 2. Что в архитектуре сделано хорошо

## 2.1. Разделение trigger и processing

Предлагаемая схема:

```text
Webhook ────────┐
                ├──> Process file
Manual ─────────┤
                │
Schedule ───────┘
```

правильная.

Вся логика обработки находится в одном sub-workflow, а разные способы запуска только передают ему работу.

**Оставить.**

## 2.2. Модель папок Nextcloud

```text
На анализ/
    ↓ ручное перемещение
В очереди/
    ↓ автоматическая обработка
Архив/
```

Хорошо, что дорогой pipeline не запускается от любого файла. Permission-based gate является хорошей защитой от случайного дорогого запуска.

**Оставить.**

## 2.3. Manual + Schedule как Plan B

Manual Trigger удобен как operational escape hatch, а Schedule Trigger — как страховка от потерянного webhook.

Оба должны использовать тот же processing workflow.

**Оставить.**

## 2.4. Existing `ingest` как source of truth

n8n должен быть orchestration layer, а backend — business logic.

Не следует переносить бизнес-логику price catalog в n8n.

**Оставить.**

## 2.5. Structured JSON Schema для LLM

Использование JSON Schema:

```text
source_work_name
unit
price
price_qualifier
confidence
```

значительно надёжнее свободного текстового ответа.

**Оставить.**

## 2.6. `raw_extraction.snippet`

Сохранение исходного `row_text` рядом с результатом LLM — очень хорошее решение.

Получается цепочка:

```text
исходная строка
    ↓
LLM extraction
    ↓
структурированный результат
    ↓
ingest
```

Это сильно помогает при расследовании ошибок и защите от проблем с данными.

**Оставить.**

## 2.7. `row_hash`

`row_hash` полезен как **DB-level deduplication**.

Но ниже важно отличить его от полноценной идемпотентности workflow.

---

# 3. 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА №1 — конкурентный запуск

Сейчас существуют два пути:

```text
Webhook
   │
   └── обработать file.xlsx


Schedule
   │
   └── List "В очереди"
          │
          └── обработать file.xlsx
```

Сценарий:

```text
T=0
Файл появляется в "В очереди"

T=1
Webhook начинает обработку

T=60s
Schedule запускается

Schedule видит тот же файл в "В очереди"

→ второй processing
```

В результате:

```text
              ┌── LLM → ingest
alpha.xlsx ───┤
              └── LLM → ingest
```

`row_hash` может защитить БД от дублей, но **не предотвращает повторный LLM-прогон**.

То есть:

```text
DB idempotency
        ≠
workflow idempotency
        ≠
job deduplication
```

Это необходимо исправить.

---

# 4. Рекомендуемое решение — `В обработке/`

Добавить четвёртую папку:

```text
На анализ/
В очереди/
В обработке/
Архив/
```

Состояния:

| Папка | Состояние |
|---|---|
| На анализ | пользователь подготовил файл |
| В очереди | ждёт обработки |
| В обработке | pipeline владеет файлом |
| Архив | успешно обработан |

Первым шагом processor должен сделать claim:

```text
В очереди/alpha.xlsx
        ↓ atomic move
В обработке/alpha.xlsx
```

После этого Schedule уже не видит файл в очереди.

При успехе:

```text
В обработке/alpha.xlsx
        ↓
Архив/alpha.xlsx
```

При временной ошибке:

```text
В обработке/alpha.xlsx
        ↓
В очереди/alpha.xlsx
```

При окончательной ошибке:

```text
В обработке/alpha.xlsx
        ↓
Ошибки/alpha.xlsx
```

Это одновременно решает:

- конкурентный запуск;
- видимость состояния;
- watchdog;
- recovery;
- повторный LLM-прогон из-за параллельного запуска;
- диагностику зависших файлов.

**Это главный рекомендуемый change.**

---

# 5. 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА №2 — partial failure

Пример:

```text
545 строк

1–400 → OK
401 → Ollama timeout
```

Файл остаётся в `В очереди`.

Через час Schedule запускает его снова.

Получаем:

```text
1 → LLM
2 → LLM
...
400 → LLM
401 → ...
```

Да, `row_hash` может не создать дублей в БД.

Но 400 успешных LLM-вызовов будут выполнены повторно.

Это особенно важно при сотнях строк.

Поэтому требуется **file/job-level idempotency**, а не только row-level dedup.

---

# 6. Разделить два уровня идемпотентности

## Уровень 1 — row-level

Уже есть:

```text
row_hash
```

Он защищает БД от дублей.

## Уровень 2 — file/job-level

Нужен идентификатор конкретной версии файла:

```text
file_id
+
etag
```

или, при необходимости, SHA-256 файла.

Минимально следует иметь:

```text
job_id
file_id
etag
status
started_at
finished_at
```

Для MVP необязательно сразу создавать отдельную backend-таблицу jobs. Сначала можно решить проблему через claim/state в Nextcloud.

Но нельзя считать `row_hash` полной защитой pipeline.

---

# 7. 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА №3 — не определена семантика partial failure

Нужно формально решить, что делать с:

```text
544 / 545 строк успешны
1 строка упала
```

Предлагаемый вариант:

```text
transient error
    ↓
retry
    ↓
если не помогло
    ↓
Ошибки/
```

А не бесконечный возврат в `В очереди`.

Нужно отличать:

### Transient

- Ollama timeout;
- Ollama unavailable;
- HTTP 502/503;
- временная недоступность backend;
- временная недоступность Nextcloud.

→ retry.

### Permanent / data error

- corrupted XLSX;
- неправильные колонки;
- HTTP 400 validation;
- HTTP 401;
- невозможное значение данных.

→ не retry бесконечно, отправить в `Ошибки/`.

---

# 8. 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА №4 — webhook authentication

Сейчас логика:

```text
Nextcloud Flow
      ↓
Webhook
```

Но нужно явно определить:

**кто имеет право вызвать webhook?**

Минимум:

```text
shared secret / authentication
```

Например, специальный header.

Кроме authentication, webhook должен валидировать:

```text
event type
file_id
path
file existence
file type
file location
```

Не следует доверять только path из входящего payload.

---

# 9. Не доверять path из webhook

Вместо:

```json
{
  "path": "/В очереди/foo.xlsx"
}
```

предпочтительно передавать:

```json
{
  "file_id": "...",
  "path": "/В очереди/foo.xlsx",
  "event": "created"
}
```

И processing workflow должен самостоятельно проверить:

```text
файл существует?
это файл?
он действительно в /В очереди/?
разрешённый MIME/type?
```

File ID предпочтительнее как идентификатор сущности, чем только path.

---

# 10. 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА №5 — ошибка перемещения в Archive

Сценарий:

```text
ingest всех строк → OK

move → Архив → FAILED
```

Получаем:

```text
данные уже в БД
файл всё ещё в queue
```

Schedule повторно обработает файл.

`row_hash` снова спасёт БД, но LLM снова будет вызван.

С `В обработке/` это решается намного чище:

```text
job status = COMPLETED
archive move pending
```

и watchdog может отдельно исправить именно этап архивации.

Не нужно повторять весь LLM pipeline.

---

# 11. Error Trigger — хорош, но alert ≠ recovery

Схема:

```text
Error Trigger
      ↓
Telegram
```

правильная.

Но Error Trigger только сообщает об ошибке.

Нужно отдельно определить recovery strategy.

Рекомендуемый минимум для уведомления:

```text
Workflow:
Execution ID:
Job ID:
File:
File ID:
Current stage:
Row:
Attempt:
Error:
Started:
Duration:
```

Тогда сообщение пригодно для реальной эксплуатации.

---

# 12. Retry policy должна быть явной

Рекомендуемая базовая политика:

| Ошибка | Retry |
|---|---|
| Ollama timeout | 2–3 |
| HTTP 502/503 | 2–3 |
| connection refused | 2–3 |
| Nextcloud unavailable | 2–3 |
| invalid LLM JSON | 1–2 |
| HTTP 401 | нет |
| HTTP 400 validation | нет |
| corrupted XLSX | нет |
| неправильные колонки | нет |
| move → Archive failed | отдельно retry |

Для retry желательно использовать backoff, а не мгновенные повторные запросы.

---

# 13. LLM `confidence`

`confidence` полезен, но важно не трактовать его как математически калиброванную вероятность.

```text
LLM confidence
    ≠
P(result is correct)
```

Если модель говорит:

```json
{
  "confidence": 0.98
}
```

это не означает доказанную вероятность правильности 98%.

Использовать confidence можно для:

- сортировки на ручную проверку;
- аналитики;
- поиска подозрительных результатов.

Но не для критичных автоматических решений без отдельной калибровки на реальных данных.

---

# 14. Добавить `source_row`

Рекомендуется сохранять номер строки исходного Excel:

```json
{
  "source_row": 137
}
```

или хотя бы держать его в n8n execution metadata.

Это сильно упрощает поиск исходной строки в XLSX при разборе ошибок.

---

# 15. Производительность

545 строк × отдельный LLM request может быть очень дорого по времени.

Не следует просто запускать полный 545-row pipeline и считать полученное время нормой.

Перед production провести benchmark:

```text
5 строк
10 строк
25 строк
50 строк
```

Измерять:

```text
cold start
warm request
average latency
p50
p95
error rate
```

После этого проверить контролируемый concurrency:

```text
1
2
4
```

Только после benchmark выбрать оптимальное значение.

Не запускать 545 запросов одновременно.

Для начала разумно иметь явный лимит, например:

```text
MAX_CONCURRENCY = 2
```

и затем скорректировать по результатам измерений.

---

# 16. n8n execution size и retention

Workflow потенциально содержит:

```text
XLSX
↓
545 items
↓
row_text
↓
LLM result
↓
ingest response
```

Если n8n сохраняет execution data полностью, размер execution может оказаться существенным.

Нужно проверить:

- размер execution для 545 строк;
- сохранение binary data;
- retention;
- storage execution DB;
- поведение после restart/backup.

Это следует проверить до полного production-прогона.

---

# 17. `source_type`

Не стоит в долгосрочной перспективе выводить `source_type` из имени файла.

Для MVP ручное:

```text
supplier
own
```

нормально.

Но production лучше использовать явную конфигурацию:

```text
supplier
own
competitor
unknown
```

Имя файла не является надёжным источником семантики.

---

# 18. `source_detail`

Вместо статического:

```text
Прайс Альфа групп (n8n Level 0, xlsx)
```

желательно иметь хотя бы:

```text
n8n Level 0 | Альфа групп | filename.xlsx
```

В будущем полезно иметь структурированные поля:

```text
supplier
filename
workflow
job_id
```

Это улучшит аналитику и расследование ошибок.

---

# 19. Summary-файл в Archive

На первом этапе отдельный текстовый summary-файл я бы **не добавлял**.

n8n Executions уже содержат большую часть необходимой информации.

Создание отдельного файла требует:

- download;
- append;
- upload;
- формат;
- дополнительные race conditions;
- дополнительную ротацию.

Сначала использовать:

```text
job_id
+
n8n execution
+
ingest metadata
```

Если позже появится реальная потребность пользователя — добавить summary.

---

# 20. Credentials и Git

`X-API-Key` и другие секреты следует хранить в n8n Credentials.

Не рекомендуется вставлять секреты непосредственно в workflow JSON.

Поскольку workflow JSON коммитятся в GitHub, перед коммитом нужно убедиться, что там отсутствуют:

```text
API keys
passwords
tokens
webhook secrets
Telegram bot tokens
```

---

# 21. IP-адреса LXC

Текущие:

```text
Ollama:
http://192.168.1.106:11434

Backend:
http://192.168.1.105:3000
```

для текущей инфраструктуры допустимы.

Но лучше вынести их в configuration:

```text
OLLAMA_URL
PRICE_CATALOG_URL
```

чтобы смена IP не требовала правки workflow JSON.

---

# 22. `Extract From File`

Нужно обязательно проверить на реальном XLSX предположение:

```text
1 item = 1 row
```

Вся дальнейшая логика mapping зависит от этого.

Это должно быть частью первого smoke test.

---

# 23. Ручной mapping колонок

Для первого реального файла:

```text
Set → !! ЗАПОЛНИ
```

нормально.

Не стоит сейчас автоматически определять колонки через ещё один LLM.

В будущем, если появится много поставщиков, можно перейти к:

```text
supplier → mapping profile
```

Но для MVP явный mapping лучше.

---

# 24. Рекомендуемая итоговая архитектура

```text
                       Nextcloud
                           │
                           │
                    На анализ/
                           │
                     ручной move
                           │
                           ▼
                       В очереди/
                           │
             ┌─────────────┴──────────────┐
             │                            │
         Webhook                       Schedule
             │                            │
             └─────────────┬──────────────┘
                           │
                           ▼
                  Validate / Claim
                           │
                           ▼
                     В обработке/
                           │
                           ▼
                     Download XLSX
                           │
                           ▼
                  Extract rows
                           │
                           ▼
                  row mapping
                           │
                           ▼
                  LLM extraction
                           │
                           ▼
                  price-catalog ingest
                           │
                 ┌─────────┴─────────┐
                 │                   │
              SUCCESS             FAILURE
                 │                   │
                 ▼                   ▼
             Архив/              retry?
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                       yes                   no
                         │                   │
                         ▼                   ▼
                    В очереди/            Ошибки/
```

Поверх этого:

```text
Error Trigger ───────────→ Telegram
Watchdog ────────────────→ Telegram
job_id ──────────────────→ everywhere
```

---

# 25. Тест-план

Текущего smoke test недостаточно. Перед production желательно проверить:

### T1
Один файл → полный success.

### T2
Webhook не сработал → Schedule успешно подхватывает файл.

### T3
Webhook + Schedule одновременно → **только один processing**.

### T4
Ollama падает после ~100-й строки → recovery.

### T5
Backend падает после ~100-й строки → recovery.

### T6
Archive move падает после успешного ingest.

### T7
Один и тот же файл запускается дважды.

### T8
Два разных файла одновременно.

### T9
Повторный move/copy одного файла.

### T10
Некорректный XLSX.

### T11
Пустой XLSX.

### T12
XLSX с неизвестными колонками.

### T13
Одна битая строка среди 545.

### T14
LLM возвращает некорректное значение `price`.

### T15
Webhook с неправильным path/file ID.

### T16
Webhook без authentication.

### T17
n8n перезапускается во время обработки.

### T18
Ollama перезапускается во время обработки.

---

# 26. Что обязательно изменить до реализации

## 🔴 Blockers

1. Добавить `В обработке/` и механизм claim/lock файла.
2. Разделить row-level dedup и file/job-level idempotency.
3. Определить partial failure и retry semantics.
4. Защитить webhook authentication + validation.
5. Определить поведение при ошибке перемещения в Archive.

## 🟠 Желательно

6. Добавить `job_id`.
7. Добавить `source_row`.
8. Сделать явный retry policy.
9. Провести LLM concurrency benchmark.
10. Проверить execution size/retention.
11. Использовать n8n Credentials для секретов.
12. Вынести IP endpoint'ов в configuration.

---

# 27. Что НЕ нужно делать

Не следует сейчас усложнять систему:

- Redis;
- RabbitMQ;
- Kafka;
- отдельный worker-service;
- Kubernetes;
- отдельный orchestration backend;
- сложная distributed locking system;
- Prometheus/Grafana только ради этого pipeline;
- отдельная job-таблица в backend без реальной необходимости.

Для 545 строк и текущего масштаба n8n вполне подходит как orchestration layer.

---

# 28. Архитектурные решения, которые стоит зафиксировать

### 1. Permission gate

Обычный сотрудник:

```text
На анализ/
```

Доверенный пользователь:

```text
В очереди/
```

Это хороший бизнес-фильтр от случайного дорогого запуска.

### 2. Shared processing workflow

```text
Webhook
Schedule
Manual
      ↓
Process file
```

Одна реализация обработки, без дублирования.

### 3. Existing ingest как source of truth

```text
n8n
=
orchestration

backend
=
business logic
```

Не переносить бизнес-логику price catalog в n8n.

---

# 29. Финальный verdict

**Не переписывать архитектуру.**

Использовать:

> **APPROVE WITH CHANGES**

Главная ошибка текущего плана — несколько раз принимать локальную гарантию за системную:

```text
row_hash
    ↓
«pipeline идемпотентен»
```

```text
Error Trigger
    ↓
«ошибки обработаны»
```

```text
Schedule
    ↓
«webhook надёжен»
```

```text
move to Archive
    ↓
«job завершён»
```

На самом деле это разные уровни системы.

После добавления:

```text
В обработке/
+
claim
+
job_id
+
retry semantics
+
file-level idempotency
```

архитектура становится значительно крепче при минимальном увеличении сложности.

**Самое важное изменение — `В обработке/`.**

Оно одновременно решает конкурентный запуск, watchdog, понимание состояния, recovery после падения и значительную часть проблемы повторного LLM-прогона после частичного сбоя.
