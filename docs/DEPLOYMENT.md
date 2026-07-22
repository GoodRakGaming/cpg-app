# 🚀 Деплой (Phase 8) — Proxmox / cp.profstroi74.ru

**Статус:** приложение развёрнуто, работает на продакшн-домене, вручную протестировано end-to-end (логин, управление пользователями, шаблоны, КП, версии, PDF). Публичная регистрация закрыта 2026-07-22 — см. [STATUS.md](STATUS.md). Работа над Phase 8 сознательно приостановлена — базовая инфраструктура готова, оставшиеся пункты (см. чек-лист внизу) не блокируют использование.
**Обновлено:** 2026-07-22

---

## Инфраструктура

Домашний сервер на Proxmox VE (узел `pve`), IP хоста `192.168.1.2`.

| Сервис | Где | Адрес |
|---|---|---|
| **Commercial Proposal Generator** | LXC **106**, Debian 12, unprivileged | `192.168.1.105` |
| Nginx Proxy Manager | LXC 101 | `192.168.1.100` (админка :81) |
| Pi-hole + unbound (DNS) | LXC 102 | `192.168.1.102` |
| n8n | LXC 104 | `192.168.1.103:5678` |
| OnlyOffice DS | LXC 105 | `192.168.1.104` |
| Nextcloud | VM (qemu) 100 | `192.168.1.101` |
| Windows Server 2025 (1С RDP) | VM 103 | — |

### Контейнер 106 (cpg-app)

- 4 CPU, 6144 MB RAM, 512 MB swap, 32 GB диск на `local-lvm`
- Статический IP `192.168.1.105/24`, gw `192.168.1.1`, DNS `192.168.1.102` (Pi-hole)
- Node.js 24.18.0, PostgreSQL (пакет из Debian 12 репозитория), pm2 (systemd unit `pm2-deploy.service`, автозапуск включён)
- Firewall (ufw): 22/3000/3001 разрешены только из `192.168.1.0/24` и VPN-подсети `10.10.10.0/24`
- Nginx **не** установлен в контейнере — роутинг `/` и `/api` делает NPM снаружи (см. ниже)

### Домен и прокси

`cp.profstroi74.ru` (+ punycode-синоним `кп.профстрой74.рф`) → Nginx Proxy Manager (101) → Let's Encrypt, публичный доступ (Publicly Accessible — сервисом пользуются клиенты извне, не только сотрудники).

Custom Locations в NPM:
- `/` → `http://192.168.1.105:3001` (frontend, Next.js)
- `/api` → `http://192.168.1.105:3000` (backend, Express)

Единый домен для фронта и бэка выбран специально: JWT refresh-token лежит в httpOnly cookie, а на одном origin это работает без плясок с CORS/cross-site cookies. CORS на backend (`backend/src/server.js`) настроен на `process.env.FRONTEND_URL` (было `origin: true` — небезопасно, отражало любой Origin вместе с `credentials: true`; исправлено).

### PostgreSQL

- БД `proposals`, пользователь `cpg_app`
- Схема накатана вручную из `backend/migrations/001_initial_schema.sql` (единственный файл, `CREATE TABLE IF NOT EXISTS` — идемпотентен)
- ✅ `migrations/run.js` реализован — простой runner на `pg`: применяет `.sql`-файлы из `backend/migrations/` по алфавиту, отслеживает применённые в таблице `schema_migrations`, оборачивает каждую миграцию в транзакцию. Встроен обратно в `deploy.sh`, выполняется на каждом деплое автоматически. Чтобы добавить новую миграцию — просто положите файл `002_....sql` в `backend/migrations/`, закоммитьте и запушьте.
- ✅ Пароль `cpg_app` (изначально засветившийся в истории чата на этапе первичной настройки) сменён — новый сгенерирован и применён скриптом прямо на сервере, нигде не отображался.

---

## Деплой: push-to-deploy без GitHub в цепочке

GitHub (`GoodRakGaming/cpg-app`, приватный, доступ по SSH-ключу `~/.ssh/github_yura`) остаётся как бэкап/история, но **не участвует в деплое**. Схема — прямой git push с dev-машины на bare-репозиторий на сервере:

```
рабочая машина (WSL)  --git push production main-->  bare repo на 192.168.1.105
                                                        (/home/deploy/repos/app.git)
                                                                  |
                                                          post-receive hook
                                                                  |
                                              git checkout -f main → /home/deploy/apps/app
                                                                  |
                                                            ./deploy.sh
                                          (npm ci backend, npm ci + build frontend, pm2 reload)
```

**Ремоуты в репозитории:**
```
origin      git@github.com:GoodRakGaming/cpg-app.git
production  ssh://cpg-deploy/home/deploy/repos/app.git
```

**SSH:** алиас `cpg-deploy` в `~/.ssh/config` (на dev-машине), ключ `~/.ssh/deploy_cpg_app` (ed25519, отдельный, не тот что для GitHub). На сервере в `authorized_keys` пользователя `deploy` ключ ограничен `command="git-shell ..."` — годится только для git-операций, не даёт интерактивный shell.

**Чтобы задеплоить обновление:**
```bash
git push production main
```
Всё остальное (install/build/restart) делает `deploy.sh` + `ecosystem.config.js` (pm2) автоматически.

**Файлы в репозитории, отвечающие за деплой:**
- `deploy.sh` — install/build/restart, вызывается хуком
- `ecosystem.config.js` — конфиг pm2 (`cpg-backend` на 3000, `cpg-frontend` на 3001)

**Не в git (создаются вручную на сервере, переживают `git checkout -f`):**
- `backend/.env` — DB-креды, JWT-секреты, `FRONTEND_URL=https://cp.profstroi74.ru`, `API_URL=https://cp.profstroi74.ru/api`
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=https://cp.profstroi74.ru/api` (важно: эта переменная зашивается в JS-бандл на этапе `next build`, не читается в рантайме)

Если контейнер придётся пересоздавать с нуля — эти два файла нужно будет воссоздать заново (значения см. в истории чата с настройкой, либо перегенерировать секреты/пароль БД).

---

## Известные незакрытые вопросы (Phase 8, продолжение)

- [x] Пароль PostgreSQL `cpg_app` сменён (сгенерирован и применён прямо на сервере, никогда не показывался в чате)
- [x] LXC 106 добавлен в еженедельный бэкап Proxmox и в watchdog-workflow в n8n (сделано пользователем самостоятельно)
- [x] Migration runner написан (`backend/migrations/run.js` + `schema_migrations`), встроен в `deploy.sh`
- [x] `npm audit` разобран — исправлено 7/8 (backend) и 3/4 (frontend) безопасными патчами. Осталось намеренно: `uuid` (backend, force-фикс откатил бы sequelize на 3 мажора назад) и `postcss` (frontend, force-фикс откатил бы next с 16 до 9.3.3) — обе низкого практического риска для того, как эти пакеты используются в проекте
- [x] Push в GitHub — решено: выделенный SSH-ключ `~/.ssh/github_yura`, `origin` теперь `git@github.com:GoodRakGaming/cpg-app.git` (репозиторий пересоздан под новым аккаунтом `GoodRakGaming` после удаления старого `YuraSukhanov`; вся история перенесена)
- [ ] LVM thin-pool на хосте Proxmox (`local-lvm`) overprovisioned: 158 GB виртуальных дисков на пул 141 GB при 16 GB свободных в VG. Реальное заполнение пула ~48%, autoextend защита настроена (`thin_pool_autoextend_threshold=80`, `_percent=10`), но стоит периодически проверять `lvs`/`vgs`, особенно с ростом БД
