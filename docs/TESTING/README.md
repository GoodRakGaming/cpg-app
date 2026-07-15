# ✅ Тестирование проекта

Документация по тестированию Commercial Proposal Generator.

---

## 📚 Тестирование разделы

| Документ | Время | Аудитория |
|----------|-------|-----------|
| [QUICK_TEST_5_MIN.md](QUICK_TEST_5_MIN.md) | ⚡ 5 мин | Быстрая проверка |
| [CHECKLIST.md](CHECKLIST.md) | 📋 1 час | Полный QA |
| [BACKEND_PHASES_TESTS.md](BACKEND_PHASES_TESTS.md) | 📊 Отчет | Unit тесты |

---

## 🎯 Тесты по категориям

### Auth API Tests
- ✅ Register (новый пользователь)
- ✅ Login (существующий пользователь)
- ✅ Logout (выход)
- ✅ Refresh token (обновление токена)

**Статус:** 4/4 passed

### Templates API Tests
- ✅ Create template
- ✅ Get templates list
- ✅ Get single template
- ✅ Update template
- ✅ Delete template

**Статус:** 5/5 passed

### Proposals API Tests
- ✅ Create proposal
- ✅ Get proposals list
- ✅ Get single proposal
- ✅ Update proposal
- ✅ Delete proposal
- ✅ Get versions history
- ✅ Restore version

**Статус:** 7/7 passed

### PDF Generation Tests
- ✅ Generate PDF
- ✅ Download PDF
- ✅ Export PDF
- ✅ Check PDF status

**Статус:** 4/4 passed

---

## ⚡ Quick Test (5 minutes)

See [QUICK_TEST_5_MIN.md](QUICK_TEST_5_MIN.md) for a 5-minute smoke test of all functions.

**Steps:**
1. Start the application (`.\start-all.ps1`)
2. Open http://localhost:3001
3. Login with `test@example.com` / `Test123!`
4. Check proposals list
5. Verify all buttons work

---

## 📋 Full QA Checklist

See [CHECKLIST.md](CHECKLIST.md) for comprehensive testing checklist.

**Sections:**
- Pre-Testing Setup
- Authentication Tests
- Templates Tests
- Proposals Tests
- PDF Generation Tests
- UI/UX Tests
- Security Tests
- Performance Tests
- Bug Tracking

---

## 📊 Test Reports

- **Backend Unit Tests:** [BACKEND_PHASES_TESTS.md](BACKEND_PHASES_TESTS.md)
- **Phase Coverage:** All 5 phases tested
- **Pass Rate:** 100% (20/20 endpoints)

---

## 🧪 Testing Tools

### Frontend Testing
- Browser DevTools (F12)
- Network tab for API calls
- Console for error messages

### Backend Testing
- curl or Postman for API
- PowerShell for automation
- Database queries for verification

### Database Testing
- psql for direct DB queries
- Verify data consistency
- Check relationships

---

## 📈 Test Coverage

| Component | Coverage | Status |
|-----------|----------|--------|
| Backend API | 100% (20/20) | ✅ |
| Authentication | 100% (4/4) | ✅ |
| Templates | 100% (5/5) | ✅ |
| Proposals | 100% (7/7) | ✅ |
| PDF Generation | 100% (4/4) | ✅ |

---

## 🚀 Test Execution

### Automated (Backend)
```bash
cd backend
npm test
```

### Manual (Frontend + API)
```powershell
.\start-all.ps1
# Follow steps in QUICK_TEST_5_MIN.md
```

---

## 📞 Reporting Issues

If you find bugs:
1. Document the steps to reproduce
2. Note expected vs actual results
3. Check [TROUBLESHOOTING/COMMON_ISSUES.md](../TROUBLESHOOTING/COMMON_ISSUES.md)
4. Report with full details

---

**[← Back to main docs](../README.md)**
