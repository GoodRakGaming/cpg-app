#!/usr/bin/env bash
#
# Регистрация/обновление/удаление Nextcloud webhook_listeners для Phase 10B (n8n Level 0).
# Выполнять НА СЕРВЕРЕ Nextcloud (там же, где работает `snap run nextcloud.occ`).
#
# Секреты (пароль админа, shared-secret) НИКУДА не пишутся в открытом виде за пределы этого
# сервера — пароль спрашивается интерактивно (не сохраняется), shared-secret генерируется и
# кладётся в локальный файл с правами 600. Ничего из этого нельзя присылать ассистенту —
# только структуру ответов сервера (можно заменить сами значения звёздочками).
#
# Использование:
#   ./setup_nextcloud_webhook.sh register   — создать новую регистрацию (POST)
#   ./setup_nextcloud_webhook.sh update ID  — обновить существующую по id (PUT)
#   ./setup_nextcloud_webhook.sh delete ID  — удалить по id (DELETE)
#   ./setup_nextcloud_webhook.sh list       — показать текущие регистрации (occ, без сети)
#   ./setup_nextcloud_webhook.sh show-secret — показать сохранённый shared-secret

set -euo pipefail

command -v jq >/dev/null || { echo "Нужен jq: sudo apt install -y jq" >&2; exit 1; }

# ── Конфигурация (поправь под себя один раз) ────────────────────────────────
NEXTCLOUD_HOST="nextcloud.profstroi74.ru"   # публичный домен — используется только как Host/SNI
NEXTCLOUD_LOCAL_PORT="80"                    # локальный порт Nextcloud на этом сервере (см. `ss -tlnp`)
N8N_WEBHOOK_URI="http://192.168.1.103:5678/webhook/file-import"
# Одинарный бэкслеш — jq сам экранирует до нужного двойного при сериализации в JSON (см. заметку
# про WATCH_FOLDER_REGEX ниже — то же рассуждение применимо и здесь). Раньше здесь стояло двойное
# экранирование — это было правильно ТОЛЬКО для старой ручной heredoc-сборки, теперь лишнее.
EVENT_CLASS='OCP\Files\Events\Node\NodeRenamedEvent'
# Первая попытка eventFilter (heredoc, ручное экранирование) не матчила вообще — job не
# создавался. Причина, скорее всего: JSON decode `\/` -> `/` снимает ровно один уровень
# экранирования, а PCRE с разделителем `/` требует, чтобы после ЭТОГО decode остался `\/`
# (экранированный слэш) — то есть в самом JSON-тексте нужно было `\\/`, а не `\/` (см. пример
# в официальной доке: `"/^\\/.*\\/files\\/Special folder\\//"`). Дальше используем `jq` для
# сборки payload — он сам добавляет нужный уровень экранирования при сериализации, поэтому здесь
# просто ОДИНАРНЫЙ `\/` — то, что PHP должен получить ПОСЛЕ decode, не то, что писать в JSON-текст
# руками. Не путать эти два уровня — именно на этом мы уже один раз сломались.
WATCH_FOLDER_REGEX='^\/[^\/]+\/files\/Price-extractor\/queue(?:\/.*)?$'
HEADER_NAME="X-Shared-Secret"
SECRET_FILE="${HOME}/.nextcloud_webhook_shared_secret"
PAYLOAD_FILE="/tmp/webhook_payload.json"

# ── Вспомогательные функции ──────────────────────────────────────────────────

ensure_secret() {
  if [[ -f "$SECRET_FILE" ]]; then
    SHARED_SECRET="$(cat "$SECRET_FILE")"
  else
    SHARED_SECRET="$(openssl rand -hex 32)"
    umask 077
    echo -n "$SHARED_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    echo "Сгенерирован новый shared-secret, сохранён в $SECRET_FILE (права 600)." >&2
  fi
}

ask_admin_creds() {
  read -rp "Nextcloud admin username: " NC_USER
  read -rsp "Nextcloud admin app password: " NC_PASS
  echo >&2
}

build_payload() {
  ensure_secret
  # jq сериализует JSON сам — не нужно вручную считать уровни экранирования бэкслешей/слэшей,
  # именно ручной heredoc-сборкой мы уже один раз всё сломали.
  jq -n \
    --arg uri "$N8N_WEBHOOK_URI" \
    --arg event "$EVENT_CLASS" \
    --arg regex "/${WATCH_FOLDER_REGEX}/" \
    --arg headerName "$HEADER_NAME" \
    --arg secret "$SHARED_SECRET" \
    '{
      httpMethod: "POST",
      uri: $uri,
      event: $event,
      eventFilter: {
        "event.target.path": $regex
      },
      headers: {
        ($headerName): $secret,
        "Content-Type": "application/json"
      }
    }' > "$PAYLOAD_FILE"
}

curl_ocs() {
  local method="$1"; shift
  curl -sS -i -u "${NC_USER}:${NC_PASS}" -X "$method" \
    --resolve "${NEXTCLOUD_HOST}:${NEXTCLOUD_LOCAL_PORT}:127.0.0.1" \
    -H "OCS-APIRequest: true" \
    -H "Content-Type: application/json; charset=utf-8" \
    "$@"
}

# ── Команды ──────────────────────────────────────────────────────────────────

cmd_register() {
  ask_admin_creds
  build_payload
  echo "→ Тело запроса ($PAYLOAD_FILE):" >&2
  cat "$PAYLOAD_FILE" >&2
  echo >&2
  curl_ocs POST \
    "http://${NEXTCLOUD_HOST}/ocs/v2.php/apps/webhook_listeners/api/v1/webhooks?format=json" \
    --data-binary "@${PAYLOAD_FILE}"
}

cmd_update() {
  local id="${1:?Укажи id: ./setup_nextcloud_webhook.sh update ID}"
  ask_admin_creds
  build_payload
  curl_ocs PUT \
    "http://${NEXTCLOUD_HOST}/ocs/v2.php/apps/webhook_listeners/api/v1/webhooks/${id}?format=json" \
    --data-binary "@${PAYLOAD_FILE}"
}

cmd_delete() {
  local id="${1:?Укажи id: ./setup_nextcloud_webhook.sh delete ID}"
  ask_admin_creds
  curl_ocs DELETE \
    "http://${NEXTCLOUD_HOST}/ocs/v2.php/apps/webhook_listeners/api/v1/webhooks/${id}?format=json"
}

cmd_list() {
  sudo snap run nextcloud.occ webhook_listeners:list --output=json_pretty
}

cmd_show_secret() {
  if [[ -f "$SECRET_FILE" ]]; then
    echo "Shared-secret (впиши это же значение в узел «Проверка shared-secret» workflow #2 в n8n):"
    cat "$SECRET_FILE"
    echo
  else
    echo "Секрет ещё не сгенерирован — запусти register или update." >&2
    exit 1
  fi
}

# ── Точка входа ──────────────────────────────────────────────────────────────

case "${1:-}" in
  register)    cmd_register ;;
  update)      cmd_update "${2:-}" ;;
  delete)      cmd_delete "${2:-}" ;;
  list)        cmd_list ;;
  show-secret) cmd_show_secret ;;
  *)
    echo "Использование: $0 {register|update ID|delete ID|list|show-secret}" >&2
    exit 1
    ;;
esac
