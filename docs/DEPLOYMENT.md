# 🚀 Деплой (Phase 8) — Proxmox / cp.profstroi74.ru

**Статус:** приложение развёрнуто и работает на продакшн-домене.
**Обновлено:** 2026-07-15

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
- ⚠️ **`migrations/run.js` не существует** — скрипт `npm run migrate` из `package.json`/старой документации никогда не был реализован. Если появятся новые миграции — накатывать вручную через `psql`, либо сначала написать реальный migration runner.
- ⚠️ **Пароль `cpg_app` засветился в истории чата** (сессия, где настраивался деплой) — рекомендовано сменить: `ALTER USER cpg_app WITH PASSWORD '...'` + обновить `DATABASE_PASSWORD`/`DATABASE_URL` в `backend/.env` на сервере + `pm2 restart cpg-backend`.

---

## Деплой: push-to-deploy без GitHub в цепочке

GitHub (`YuraSukhanov/commercial_proposal_generator`, приватный) остаётся как бэкап/история, но **не участвует в деплое**. Схема — прямой git push с dev-машины на bare-репозиторий на сервере:

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
origin      https://github.com/YuraSukhanov/commercial_proposal_generator.git
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

- [ ] Сменить пароль PostgreSQL `cpg_app` (см. выше)
- [ ] Добавить LXC 106 в еженедельный бэкап Proxmox (снимок, вс 03:00, вместе с 101/102/104)
- [ ] Написать нормальный migration runner вместо ручного накатывания SQL, если появятся новые миграции
- [ ] `npm audit` показывает 8 (backend) + 4 (frontend) уязвимостей, не разбирали подробно — стоит прогнать `npm audit` и оценить, что критично
- [ ] Push в GitHub (`origin`) нужно делать с машины/сессии, где есть сохранённые GitHub-credentials — в сессии, где настраивался деплой (WSL), их не было
- [ ] LVM thin-pool на хосте Proxmox (`local-lvm`) overprovisioned: 158 GB виртуальных дисков на пул 141 GB при 16 GB свободных в VG. Реальное заполнение пула ~48%, autoextend защита настроена (`thin_pool_autoextend_threshold=80`, `_percent=10`), но стоит периодически проверять `lvs`/`vgs`, особенно с ростом БД
