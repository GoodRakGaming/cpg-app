# 📋 PHASE 7.2: Frontend Pages Development

**Status**: 🚀 IN PROGRESS  
**Date Started**: 2026-05-18  
**Estimated Duration**: 3-4 weeks

---

## 🎯 ФАЗА ЗАДАЧИ

### High Priority (Критические - 2 недели)

#### 1. ✅ Proposal Editor (`/proposals/[id]`) - НАЧНЁМ ОТСЮДА
**Importance**: ⭐⭐⭐⭐⭐ (САМОЕ ГЛАВНОЕ)  
**API Endpoints Used**:
- `GET /proposals/:id` - загрузка данных
- `GET /templates/:id` - загрузка шаблона
- `PUT /proposals/:id` - сохранение изменений
- `GET /proposals/:id/versions` - история версий
- `POST /proposals/:id/versions/:versionId/restore` - восстановление версии
- `POST /pdf/generate/:proposalId` - генерация PDF
- `GET /pdf/:proposalId` - скачивание PDF
- `GET /pdf/status/:proposalId` - статус генерации

**Features**:
- [ ] Загрузка и отображение данных КП
- [ ] Редактируемая форма (title, status, data)
- [ ] Таб с версиями предложения
- [ ] Кнопка восстановления старых версий
- [ ] Генерация PDF
- [ ] Скачивание PDF
- [ ] Сохранение изменений
- [ ] Удаление версий

**Components Needed**:
- `ProposalEditorForm` - форма редактирования
- `VersionHistory` - таблица версий
- `PDFPreview` - превью PDF

**File Location**: `frontend/app/proposals/[id]/page.tsx`

---

#### 2. ✅ Create Proposal Form (`/proposals/new`)
**Importance**: ⭐⭐⭐⭐  
**API Endpoints Used**:
- `GET /templates` - список шаблонов
- `POST /proposals` - создание КП

**Features**:
- [ ] Dropdown выбора шаблона
- [ ] Поле title (название КП)
- [ ] Поле description (описание)
- [ ] Выбор статуса (draft/final)
- [ ] Кнопка "Создать"
- [ ] Валидация формы
- [ ] Редирект на editor после создания

**File Location**: `frontend/app/proposals/new/page.tsx`

---

#### 3. ✅ PDF Download Integration
**Importance**: ⭐⭐⭐⭐  
**Features**:
- [ ] Кнопка "Generate PDF" в editor
- [ ] Индикатор процесса генерации
- [ ] Кнопка "Download PDF"
- [ ] Обработка ошибок генерации

---

### Medium Priority (Дополнительные - 1 неделя)

#### 4. ⏳ Template Management (`/templates`)
**Importance**: ⭐⭐⭐  
**Files**:
- `frontend/app/templates/page.tsx` - список шаблонов
- `frontend/app/templates/[id]/page.tsx` - редактор шаблона

**Features**:
- [ ] Список всех шаблонов
- [ ] Кнопка "Создать шаблон"
- [ ] Редактирование шаблона (JSON editor)
- [ ] Удаление шаблона
- [ ] Превью шаблона

---

#### 5. ⏳ Search & Filter
**Importance**: ⭐⭐⭐  
**Features**:
- [ ] Поиск по названию КП
- [ ] Фильтр по статусу
- [ ] Сортировка по дате
- [ ] Пагинация (если много КП)

---

### Low Priority (Улучшения)

#### 6. Редактор JSONB данных
- [ ] Visual JSON editor для данных КП
- [ ] Live preview

#### 7. Export/Import
- [ ] Экспорт КП как JSON
- [ ] Импорт из JSON

---

## 📊 ARCHITECTURE PLAN

### Data Flow для Proposal Editor

```
User clicks proposal in list
        ↓
/proposals/[id] page loads
        ↓
useEffect: GET /proposals/:id
        ↓
Display form with proposal data
        ↓
User edits title/data
        ↓
User clicks "Save"
        ↓
PUT /proposals/:id
        ↓
Show success message
        ↓
Update local state
```

### Component Structure

```
ProposalEditorPage
├── LoadingSpinner (while fetching)
├── ErrorAlert (if error)
└── ProposalEditor (main content)
    ├── ProposalEditorForm
    │   ├── TitleInput
    │   ├── StatusSelect
    │   └── DataEditor
    ├── VersionHistoryTab
    │   ├── VersionTable
    │   └── RestoreButton
    └── PDFTab
        ├── GenerateButton
        └── DownloadButton
```

---

## 🛠️ IMPLEMENTATION STEPS

### Week 1: Core Editor
1. Create `/proposals/[id]/page.tsx` with data loading
2. Build ProposalEditorForm component
3. Implement save functionality
4. Add error handling

### Week 2: Versioning & PDF
1. Add VersionHistory tab
2. Implement restore functionality
3. Add PDF generation/download
4. Test all features

### Week 3: Create Form & Polish
1. Create `/proposals/new/page.tsx`
2. Implement create functionality
3. Validation and error handling
4. UI polish and responsiveness

### Week 4: Templates & Extras
1. Templates management UI (optional)
2. Search/filter (optional)
3. Full integration testing
4. Documentation

---

## 📝 BACKEND API REFERENCE

### Already Verified Working ✅

```typescript
// Get all proposals
GET /proposals
Response: Proposal[]

// Get single proposal
GET /proposals/:id
Response: Proposal with all fields

// Create proposal
POST /proposals
Body: { templateId, title, status }
Response: Proposal

// Update proposal
PUT /proposals/:id
Body: { title, status, data }
Response: Proposal

// Get versions
GET /proposals/:id/versions
Response: ProposalVersion[]

// Restore version
POST /proposals/:id/versions/:versionId/restore
Response: Proposal

// Generate PDF
POST /pdf/generate/:proposalId
Response: { success, message, proposalId }

// Download PDF
GET /pdf/:proposalId
Response: PDF file

// Get PDF status
GET /pdf/status/:proposalId
Response: { status, url?, error? }

// Delete proposal
DELETE /proposals/:id
Response: { success }
```

---

## 🧩 REUSABLE COMPONENTS TO BUILD

### 1. Form Components
- `Input` - text input wrapper
- `Select` - dropdown wrapper
- `TextArea` - long text wrapper
- `FormGroup` - grouped form fields

### 2. Data Display
- `StatusBadge` - colored status indicator
- `DateFormatter` - formatted date display
- `Table` - reusable table component

### 3. Modal/Dialog
- `ConfirmDialog` - for deletions
- `LoadingModal` - for processing

### 4. Tabs
- `Tabs` - tabbed interface
- `TabPanel` - individual tab content

---

## 💾 STATE MANAGEMENT

### Using React Hooks

```typescript
// Proposal editor state
const [proposal, setProposal] = useState<Proposal | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState('content'); // content | versions | pdf

// Form state
const [formData, setFormData] = useState({
  title: '',
  status: 'draft',
  data: {}
});

// Versions state
const [versions, setVersions] = useState<ProposalVersion[]>([]);

// PDF state
const [pdfGenerating, setPdfGenerating] = useState(false);
const [pdfUrl, setPdfUrl] = useState<string | null>(null);
```

---

## 🎨 UI/UX GUIDELINES

### Proposal Editor Layout

```
┌─────────────────────────────────────┐
│  ← Back | Proposal Title | Save    │  ← Header with navigation
├─────────────────────────────────────┤
│  Tab: Content | Versions | PDF      │  ← Tabs
├─────────────────────────────────────┤
│                                     │
│  [Form fields for editing]          │  ← Main content area
│  - Title input                      │
│  - Status selector                  │
│  - Data JSON editor                 │
│                                     │
│  [Save button]                      │  ← Action buttons
│                                     │
└─────────────────────────────────────┘
```

### Create Proposal Form

```
┌─────────────────────────────────────┐
│  Create New Proposal                │
├─────────────────────────────────────┤
│                                     │
│  Template: [Select dropdown ▼]      │
│  Title: [Input field]               │
│  Description: [Textarea]            │
│  Status: [Draft/Final dropdown]     │
│                                     │
│  [Cancel]  [Create]                 │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ TESTING CHECKLIST

### Proposal Editor
- [ ] Page loads and fetches data
- [ ] Form displays with proposal data
- [ ] Can edit title
- [ ] Can change status
- [ ] Save updates proposal
- [ ] Error messages display
- [ ] Version history shows all versions
- [ ] Can restore old version
- [ ] PDF generates successfully
- [ ] Can download PDF
- [ ] Responsive on mobile

### Create Form
- [ ] Templates dropdown populates
- [ ] Can select template
- [ ] Can enter title
- [ ] Can select status
- [ ] Create button works
- [ ] Redirects to editor after create
- [ ] Validation works

### Integration
- [ ] Can create → edit → download flow
- [ ] Multiple proposals work independently
- [ ] No token errors
- [ ] API errors handled gracefully

---

## 📚 DEPENDENCIES ALREADY INSTALLED

```json
{
  "react": "^19.2.4",
  "next": "^14+",
  "typescript": "^5",
  "tailwindcss": "^4",
  "react-hook-form": "^7" // for forms
}
```

---

## 🎬 STARTING NOW

### First: Create the Proposal Editor page

**File**: `frontend/app/proposals/[id]/page.tsx`

**Size**: ~300-400 lines

**Contains**:
- Data loading via API
- Editable form
- Version history
- PDF integration

---

## 📞 REFERENCE DOCS

- API Types: `frontend/lib/api.ts`
- Auth Flow: `frontend/lib/auth.ts`
- Existing Page Example: `frontend/app/proposals/page.tsx`
- Layout Example: `frontend/app/dashboard/layout.tsx`

---

**Next Action**: 🚀 Start building ProposalEditor
