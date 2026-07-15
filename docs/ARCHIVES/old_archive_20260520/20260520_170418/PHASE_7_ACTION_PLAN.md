# 🎯 NEXT STEPS: DETAILED ACTION PLAN

**Created**: 2026-05-19  
**Priority**: Complete Phase 7.2 Part 2 (Templates Management)

---

## 📊 CURRENT STATE SUMMARY

### ✅ What's Working
- Backend: 100% complete (20 endpoints, all tested)
- Frontend: 50% complete (7.1 foundation + 7.2 Part 1 editor)
- **Login**: Just fixed! ✅
- Database: PostgreSQL fully operational
- API Client: All 20 methods implemented

### 🔴 What's Broken (JUST FIXED!)
- ❌→✅ Login redirect issue - **RESOLVED**
  - Added `credentials: 'include'` to fetch
  - Backend now sends accessToken cookie
  - Middleware checks proper cookie
  - API client reads token from localStorage

### 🟡 What's Not Tested
- Create proposal form (created but not fully tested)
- PDF generation
- Version history restore

---

## 🚀 PHASE 7.2 PART 2: TEMPLATES MANAGEMENT

### Strategy
We need to build 2 pages + improve API client for template features.

### Priority 1: **Templates List Page** 
```
File: frontend/app/templates/page.tsx (300 LOC)
Dependency: Proposal editor (Part 1) - DONE ✅
Complexity: Medium
Time Estimate: 1.5 hours
```

**What to Implement**:
1. Load templates from `GET /api/templates`
2. Display in a table with columns:
   - Name
   - Description
   - Version
   - Created Date
   - Actions (Edit, Delete, Duplicate)
3. Add buttons:
   - "+ New Template"
   - Edit (goes to /templates/[id])
   - Delete (with confirmation)
   - Duplicate (creates copy)
4. Empty state ("No templates yet")
5. Loading spinner
6. Error handling

**UI Components Needed**:
- Table component (Tailwind CSS)
- Action buttons
- Confirmation dialog
- Loading spinner
- Error message display

**Design Pattern**:
```typescript
interface Template {
  id: string;
  name: string;
  description?: string;
  version: number;
  data: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
```

---

### Priority 2: **Template Editor Page**
```
File: frontend/app/templates/[id]/page.tsx (350 LOC)
Dependency: Templates list (Priority 1)
Complexity: High (JSONB editor is tricky)
Time Estimate: 2-2.5 hours
```

**What to Implement**:
1. Load template data from `GET /api/templates/:id`
2. Form fields:
   - Name input
   - Description textarea
   - Version display (read-only)
   - Created by (read-only)
3. **JSONB Editor** for template data (CHALLENGING!)
   - Option A: Monaco Editor (complex, powerful)
   - Option B: Simple textarea with JSON.stringify
   - Option C: Visual form builder (future)
4. Save changes to `PUT /api/templates/:id`
5. Delete button (confirmation)
6. Back button to /templates

**Most Complex Part**: JSONB Editor
- Templates store arbitrary JSON data
- Need to display it in editable format
- Validate JSON before save
- Show pretty errors

**Suggested Approach for JSONB Editor**:
```typescript
// Simple approach first:
<textarea
  value={JSON.stringify(templateData, null, 2)}
  onChange={(e) => setTemplateData(JSON.parse(e.target.value))}
/>

// Add error handling for invalid JSON
// Later upgrade to Monaco if needed
```

---

### Priority 3: **Test Full Workflow**
```
Time Estimate: 1 hour
Steps:
1. Create new template
2. Edit template
3. Create proposal using template
4. Edit proposal
5. Verify everything works
```

---

## 🔧 IMPLEMENTATION ORDER (RECOMMENDED)

### **Day 1: Part 2a - Templates List Page**

**Step 1**: Create templates list page (1 hour)
```
frontend/app/templates/page.tsx
- Load templates
- Display in table
- Add CRUD buttons
```

**Step 2**: Fix any API client issues (30 min)
```
lib/api.ts
- Verify getTemplates() works
- Check error handling
```

**Step 3**: Test templates list (30 min)
```
- Start app
- Navigate to /templates
- Verify UI loads
- Check data displays
```

### **Day 2: Part 2b - Template Editor Page**

**Step 1**: Create template editor page (1 hour)
```
frontend/app/templates/[id]/page.tsx
- Load template data
- Build form
- Add JSONB editor
```

**Step 2**: Implement save/delete (1 hour)
```
- Handle PUT request
- Show success/error
- Implement delete with confirmation
```

**Step 3**: Test editor (1 hour)
```
- Load existing template
- Edit and save
- Delete and verify
- Test error cases
```

### **Day 3: Part 2c - Full Workflow Testing**

**Step 1**: Test complete user flow (1.5 hours)
```
1. Register new user
2. Create new template
3. Create proposal using template
4. Edit proposal
5. Test all features end-to-end
```

**Step 2**: Fix bugs (1 hour)
```
- Debug any issues
- Improve error messages
- Fix UI problems
```

**Step 3**: Documentation (30 min)
```
- Update README
- Create test guide
- Document new features
```

---

## 📋 CODE TEMPLATE: Templates List Page

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description?: string;
  version: number;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTemplates();
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      setDeleting(id);
      const response = await apiClient.deleteTemplate(id);
      if (response.success) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Link href="/templates/new" className="btn btn-primary">
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No templates yet</p>
          <Link href="/templates/new" className="btn btn-primary">
            Create First Template
          </Link>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left">Name</th>
              <th className="text-left">Description</th>
              <th className="text-left">Version</th>
              <th className="text-left">Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id} className="border-b hover:bg-gray-50">
                <td className="py-4">{template.name}</td>
                <td className="py-4">{template.description}</td>
                <td className="py-4">v{template.version}</td>
                <td className="py-4">
                  {new Date(template.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 text-right space-x-2">
                  <Link href={`/templates/${template.id}`} className="btn btn-sm">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 🎯 IMMEDIATE ACTION ITEMS

### **RIGHT NOW (Next 30 min)**:
- [ ] Review Phase 7.2 Part 2 plan
- [ ] Verify login is fully working
- [ ] Test create proposal form
- [ ] Test PDF generation

### **TODAY (Next 2 hours)**:
- [ ] Start building templates list page
- [ ] Test templates API
- [ ] Create UI mockups

### **THIS WEEK**:
- [ ] Complete templates list page
- [ ] Build template editor
- [ ] Test full workflow
- [ ] Document changes

### **NEXT WEEK**:
- [ ] Phase 7.2 Part 3 (search, filters)
- [ ] Phase 8 (deployment)

---

## ✅ SUCCESS CRITERIA

### For Phase 7.2 Part 2 Complete:
- [x] Login working ✅
- [ ] Templates list page works
- [ ] Template editor works
- [ ] User can create/edit/delete templates
- [ ] User can create proposals using templates
- [ ] All CRUD operations tested
- [ ] No console errors
- [ ] Good error messages

---

## 📚 USEFUL REFERENCES

### Backend API for Templates
```bash
GET    /api/templates                # Get all templates
POST   /api/templates                # Create
GET    /api/templates/:id            # Get one
PUT    /api/templates/:id            # Update
DELETE /api/templates/:id            # Delete
```

### API Client Methods
```typescript
getTemplates(limit?: number, offset?: number)
createTemplate(data: object)
getTemplate(id: string)
updateTemplate(id: string, data: object)
deleteTemplate(id: string)
```

### Quick Test
```powershell
# These endpoints are already available
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Headers @{Authorization="Bearer YOUR_TOKEN"}
```

---

## 🎬 FINAL NOTES

**We're at a critical point!** 🚀
- Backend: 100% ready
- Frontend: 50% ready
- Login: Just fixed!

The next 2-3 days will complete Phase 7.2 and get the application to MVP status.

**Then we can focus on**:
- Advanced features (search, filter)
- Deployment (Docker)
- Performance optimization
- Security audit

Let's keep the momentum! 💪
