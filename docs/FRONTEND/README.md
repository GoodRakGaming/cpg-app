# 💻 Frontend Documentation

React/Next.js frontend для Commercial Proposal Generator.

---

## 📚 Frontend Фазы

| Фаза | Название | Статус | Документ |
|------|----------|--------|----------|
| 7 | Core | ⏳ | [PHASE_7.md](PHASES/PHASE_7.md) |
| 7.2 | Extended | ⏳ | [PHASE_7.2.md](PHASES/PHASE_7.2.md) |

---

## 🎯 Phase 7: Frontend Core (IN PROGRESS)

### ⚠️ Текущий статус
- ✅ **Authentication Pages**
  - Login page (`/login`)
  - Register page (`/register`)
  - Protected routes middleware

- ⚠️ **Dashboard Layout**
  - Main layout с навигацией — работает
  - Protected route wrapper — работает
  - User session management — работает

- ⚠️ **Proposals Management**
  - Proposals list page (`/proposals`) — работает, но требует проверки и правок
  - Table с CRUD кнопками — реализованы
  - Edit/Delete functionality — реализовано

- ⚠️ **Extended Pages**
  - Proposal Editor (`/proposals/[id]`) — реализован, но в активном тестировании
  - Create Proposal (`/proposals/new`) — реализован, но в активном тестировании
  - Templates route (`/templates`) — пока отсутствует

- ✅ **API Integration**
  - API client (`lib/api.ts`) подключен к бекенду
  - Все 20 backend endpoints доступны
  - JWT token management — реализовано
  - Error handling — базово реализовано

### Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI:** Custom React components

---

## 🔄 Phase 7.2: Frontend Extended (IN PROGRESS)

### ⏳ На разработке
- Proposal Editor (`/proposals/[id]`)
- Create Proposal (`/proposals/new`)
- Templates Manager (`/templates`)
- PDF preview
- Version history

---

## 🚀 Quick Start

### Installation
```bash
cd frontend
npm install
npm run dev
```

### Access
```
http://localhost:3001
```

### Demo Credentials
```
Email: test@example.com
Password: Test123!
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Home (redirect)
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Register page
│   ├── proposals/
│   │   ├── page.tsx             # Proposals list
│   │   ├── layout.tsx           # Protected layout
│   │   ├── [id]/page.tsx        # Editor (TODO)
│   │   └── new/page.tsx         # Create (TODO)
│   ├── templates/ (TODO)
│   └── layout.tsx               # Root layout
├── lib/
│   ├── api.ts                   # API client
│   └── auth.ts                  # Auth utilities
├── components/                  # Reusable components
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## 🔗 API Integration

All 20 backend endpoints accessible via `lib/api.ts`:

```typescript
// Example usage
import { api } from '@/lib/api';

const proposals = await api.getProposals();
const proposal = await api.getProposal(id);
const response = await api.updateProposal(id, data);
```

---

## 🎨 Components

- **Button** — Custom button component
- **Form** — Form wrapper
- **Table** — Data table (proposals list)
- **Navigation** — Main navigation
- **Layout** — Page layouts

---

## ✅ Pages Status

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ |
| Register | `/register` | ✅ |
| Proposals List | `/proposals` | ✅ |
| Proposal Editor | `/proposals/[id]` | ⏳ |
| Create Proposal | `/proposals/new` | ⏳ |
| Templates | `/templates` | ⏳ |

---

## 📚 Documentation

- [PHASE_7.md](PHASES/PHASE_7.md) — Core implementation
- [PHASE_7.2.md](PHASES/PHASE_7.2.md) — Extended features

---

## 🔧 Development Commands

```bash
npm run dev         # Start dev server (port 3001)
npm run build       # Build for production
npm start           # Run production build
npm run lint        # Run ESLint
```

---

**[← Back to main docs](../README.md)**
