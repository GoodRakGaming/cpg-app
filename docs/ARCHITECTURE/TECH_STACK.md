# 💻 Tech Stack — Технологии проекта

Полное описание всех технологий и библиотек.

---

## 🎯 Overview

| Слой | Технология | Версия | Язык | Назначение |
|------|-----------|--------|------|-----------|
| **Frontend** | Next.js | 14+ | TypeScript | Web UI |
| **Backend** | Express.js | 4+ | JavaScript | REST API |
| **Database** | PostgreSQL | 12+ | SQL | Data Storage |
| **Authentication** | JWT | - | - | Session Management |
| **PDF** | Puppeteer | 21+ | JavaScript | PDF Generation |

---

## 🎨 Frontend Stack

### Framework & Libraries

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0"
}
```

**Next.js 14+**
- ✅ App Router для маршрутизации
- ✅ Server Components (RSC)
- ✅ Встроенная оптимизация изображений
- ✅ Встроенная поддержка TypeScript
- ✅ Automatic code splitting

**React 18+**
- ✅ Concurrent rendering
- ✅ Automatic batching
- ✅ Suspense API
- ✅ useTransition hook

### Styling

```json
{
  "tailwindcss": "^3.3.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0"
}
```

**Tailwind CSS 3+**
- ✅ Utility-first approach
- ✅ Dark mode support
- ✅ Built-in responsive design
- ✅ Rapid development

### UI Components

- ✅ Custom Button components
- ✅ Form inputs (text, password, email)
- ✅ Table components (proposals list)
- ✅ Navigation components
- ✅ Layout wrappers

### API & Data

```json
{
  "axios": "^1.6.0",
  "swr": "^2.2.0"
}
```

**Centralized API Client** (`lib/api.ts`)
- ✅ Все 20 endpoints
- ✅ Automatic JWT injection
- ✅ Error handling
- ✅ Base URL configuration

**SWR** (опционально для кеширования)
- ✅ Data fetching
- ✅ Automatic revalidation
- ✅ Request deduplication

---

## 🔧 Backend Stack

### Core Framework

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "nodemon": "^3.1.0"
}
```

**Express.js 4+**
- ✅ Lightweight HTTP server
- ✅ Middleware ecosystem
- ✅ Routing capabilities
- ✅ Error handling

**CORS**
- ✅ Allow frontend (localhost:3001) to access backend
- ✅ Credentials support
- ✅ Pre-flight requests

**dotenv**
- ✅ Environment variables loading
- ✅ .env file support
- ✅ Production configuration

**nodemon**
- ✅ Auto-restart on file changes
- ✅ Development convenience
- ✅ Watch mode configuration

### Database & ORM

```json
{
  "sequelize": "^6.37.0",
  "pg": "^8.11.0",
  "pg-hstore": "^2.3.4",
  "uuid": "^11.0.0"
}
```

**PostgreSQL 12+**
- ✅ ACID compliance
- ✅ Full-text search
- ✅ JSONB support (для data полей)
- ✅ Relationship support
- ✅ Indexing capabilities

**Sequelize 6+**
- ✅ ORM для Node.js
- ✅ Type-safe queries
- ✅ Migrations support
- ✅ Association management
- ✅ Query building

**pg**
- ✅ PostgreSQL client
- ✅ Connection pooling
- ✅ Binary data support

**uuid**
- ✅ Primary key generation
- ✅ UUID v4 support

### Security & Authentication

```json
{
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "joi": "^17.13.0",
  "cookie-parser": "^1.4.6"
}
```

**JWT (jsonwebtoken)**
- ✅ Access token generation (15 min)
- ✅ Refresh token generation (7 days)
- ✅ Token verification
- ✅ Symmetric signing

**bcryptjs**
- ✅ Password hashing
- ✅ Rounds: 10 (security vs speed)
- ✅ Salt generation
- ✅ Compare function

**Joi**
- ✅ Schema validation
- ✅ Email validation
- ✅ Password strength
- ✅ Custom rules

**cookie-parser**
- ✅ Parse httpOnly cookies
- ✅ Refresh token storage
- ✅ Secure flag support

### PDF Generation

```json
{
  "puppeteer": "^24.42.0"
}
```

**Puppeteer 21+**
- ✅ Headless Chromium automation
- ✅ HTML to PDF conversion
- ✅ Browser pooling
- ✅ Screenshot capability
- ✅ Performance options

**PDF Generation Features:**
- ✅ Async generation
- ✅ Browser pooling (5-10 instances)
- ✅ Memory optimization
- ✅ Timeout handling (30 sec default)
- ✅ Error recovery

### Utilities

```json
{
  "axios": "^1.6.2"
}
```

**Axios**
- ✅ HTTP client
- ✅ Request/response interceptors
- ✅ Timeout support
- ✅ Cancel token

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key (id)
- Unique email

### Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key (id)
- Foreign key (user_id)
- user_id + is_active (filtering)

### Proposals Table
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  template_id UUID REFERENCES templates(id),
  title VARCHAR(255) NOT NULL,
  data JSONB DEFAULT '{}',
  status ENUM('draft', 'final', 'archived'),
  current_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key (id)
- Foreign keys (user_id, template_id)
- user_id + is_active
- status filtering

### ProposalVersions Table
```sql
CREATE TABLE proposal_versions (
  id UUID PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  version_num INTEGER NOT NULL,
  data JSONB,
  pdf_hash VARCHAR(64),  -- SHA256
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key (id)
- Foreign key (proposal_id)
- proposal_id + version_num (unique)

---

## 🔄 Dependencies Tree

```
commercial_proposal_generator/
├── frontend/
│   ├── Next.js 14+
│   │   ├── React 18+
│   │   ├── TypeScript
│   │   └── Webpack (built-in)
│   ├── Tailwind CSS 3+
│   │   ├── PostCSS
│   │   └── Autoprefixer
│   ├── Axios
│   └── Dev dependencies
│       ├── TypeScript compiler
│       └── ESLint
│
└── backend/
    ├── Express 4+
    │   ├── body-parser (built-in)
    │   └── Middleware ecosystem
    ├── Sequelize 6+
    │   ├── PostgreSQL driver (pg)
    │   └── Connection pooling
    ├── JWT (jsonwebtoken)
    │   └── 9.0+
    ├── bcryptjs (2.4+)
    ├── Joi (17.13+)
    ├── Puppeteer (24.42+)
    │   └── Chromium browser
    ├── dotenv (16.3+)
    └── Development
        ├── nodemon
        └── Test libraries
```

---

## 📊 Версиясы & Совместимость

| Компонент | Версия | LTS | Поддержка до |
|-----------|--------|-----|--------------|
| Node.js | 18+ (14+ min) | 18 LTS | 2025-10 |
| PostgreSQL | 12+ (15+ recommended) | 15 LTS | 2026-11 |
| Next.js | 14+ | Нет | Текущий |
| React | 18+ | Нет | Текущий |

---

## 🚀 Installation

### Backend Dependencies
```bash
cd backend
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

---

## 📦 Size & Performance

### Bundle Sizes
- **Frontend**: ~200KB (gzipped)
- **Backend**: ~50MB (node_modules, with Puppeteer)
- **Database**: ~100MB (empty with schema)

### Runtime Memory
- **Backend**: ~100-300MB (without Puppeteer)
- **Puppeteer**: ~50-100MB per browser instance
- **PostgreSQL**: ~50-100MB (default)

### Performance Characteristics
- **JWT verification**: ~1ms
- **Password hash**: ~50-100ms (intentional slowness for security)
- **Database query**: ~10-50ms (depending on query)
- **PDF generation**: ~2-5 seconds per document
- **Puppeteer pooling overhead**: ~5ms per request

---

## 🔄 Updates & Maintenance

### Security Updates
- Node.js: Follow LTS schedule
- PostgreSQL: Follow LTS schedule
- Dependencies: npm audit & npm update

### Testing Coverage
- ✅ 20/20 API endpoints tested
- ✅ Security tests included
- ✅ Error scenarios covered

---

## 🎓 Learning Resources

- **Express.js:** https://expressjs.com/
- **Sequelize:** https://sequelize.org/
- **Next.js:** https://nextjs.org/
- **Puppeteer:** https://pptr.dev/
- **PostgreSQL:** https://www.postgresql.org/

---

**Последнее обновление:** 2026-05-20  
**Версия:** 1.0
