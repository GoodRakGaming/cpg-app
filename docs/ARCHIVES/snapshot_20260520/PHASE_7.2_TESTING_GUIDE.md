# ✅ PHASE 7.2 PART 1 - TESTING CHECKLIST

**Start Command**: `.\start-all.ps1`  
**Expected Time**: 10-15 minutes  
**Status**: Ready for full testing

---

## 🚀 WHAT TO EXPECT

### When you run `.\start-all.ps1`:

1. **PostgreSQL Check** ✅
   - Should show: "✅ PostgreSQL: OK"

2. **Backend Startup** (5-10 seconds)
   - Terminal window opens
   - Shows: "✅ Backend готов к работе!"

3. **Frontend Startup** (5-10 seconds)
   - Another terminal window opens
   - Shows: "🔥 Запуск frontend сервера..."

4. **Ready for Testing**
   - Open: http://localhost:3001
   - You'll see the login page

---

## 🧪 TESTING SCENARIOS (in order)

### ✅ TEST 1: Login (2 min)
```
Expected: Login works with demo credentials

Steps:
1. Go to http://localhost:3001
2. Email: test@example.com
3. Password: Test123!
4. Click "Войти"

Result:
✅ Redirects to /proposals
✅ Shows "Предложения" page
✅ See demo proposal in list
```

### ✅ TEST 2: View Proposal List (1 min)
```
Expected: List shows proposals

You should see:
✅ Table with columns: Название | Статус | Создано | Действия
✅ At least 1 demo proposal
✅ Status badge (draft/final/archived)
✅ "+" Новое предложение" button
✅ "Редактировать" and "Удалить" buttons
```

### ✅ TEST 3: CREATE NEW PROPOSAL (3 min)
```
Expected: New proposal form works

Steps:
1. Click "+ Новое предложение"
2. Page: http://localhost:3001/proposals/new

Verify:
✅ Template dropdown shows at least 1 template
✅ Title field is empty
✅ Description field is optional
✅ Status defaults to "📝 Черновик"
✅ Form has "✨ Создать предложение" button

Testing:
1. Select template from dropdown
2. Enter Title: "Test Proposal"
3. Enter Description: "This is a test"
4. Leave Status as "draft"
5. Click "✨ Создать предложение"

Expected Result:
✅ Form submits
✅ Auto-redirects to /proposals/[id]
✅ Shows new proposal in editor
```

### ✅ TEST 4: PROPOSAL EDITOR (5 min)
```
Expected: Editor loads and displays proposal

You should see:
✅ Header: "← Back | Proposal Title | Status Badge"
✅ 3 Tabs: 📝 Content | 📚 Версии | 📄 PDF
✅ Currently on "📝 Content" tab

Testing EDIT:
1. Change Title to "Updated Title"
2. Change Status to "✅ Финальный"
3. Click "💾 Сохранить"

Expected Result:
✅ Shows green alert: "✅ Предложение сохранено"
✅ Title updates in header
✅ Status badge changes
✅ Alert disappears after 3 seconds
```

### ✅ TEST 5: VERSION HISTORY (3 min)
```
Expected: Can view and restore versions

Steps:
1. Still in /proposals/[id]
2. Click tab "📚 Версии"

You should see:
✅ Table with columns: Версия | Дата создания | Действие
✅ Multiple versions (v1, v2, etc.)
✅ Each has a date/time
✅ "Восстановить" button on each

Testing RESTORE:
1. Click "Восстановить" on an older version
2. Confirmation dialog appears
3. Click "OK"

Expected Result:
✅ Green alert: "✅ Версия восстановлена"
✅ Page updates with old version data
✅ New version created from restore
✅ Table refreshes showing new version
```

### ✅ TEST 6: PDF GENERATION (3 min)
```
Expected: PDF generation works

Steps:
1. Still in /proposals/[id]
2. Click tab "📄 PDF"

You should see:
✅ Status message: "⏳ PDF еще не генерировался"
✅ "🔄 Генерировать PDF" button
✅ Info: "Система автоматически генерирует PDF..."

Testing GENERATE:
1. Click "🔄 Генерировать PDF"

Expected Result:
✅ Shows: "🔄 PDF генерируется..."
✅ Waits 3-5 seconds
✅ Shows: "✅ PDF готов к скачиванию"
✅ "📥 Скачать PDF" button appears
```

### ✅ TEST 7: PDF DOWNLOAD (2 min)
```
Expected: Can download PDF

Steps:
1. Click "📥 Скачать PDF"

Expected Result:
✅ Browser download starts
✅ File: proposal-[id].pdf
✅ File appears in Downloads folder
✅ File is valid PDF (can open)
```

### ✅ TEST 8: BACK TO LIST (1 min)
```
Expected: Can navigate back

Steps:
1. Click "← Back" or "← Назад"
2. Or go to http://localhost:3001/proposals

Expected Result:
✅ Returns to proposals list
✅ Your new proposal appears in table
✅ Status shows "📝 Черновик" or "✅ Финальный"
✅ Date shows today
```

---

## 🎯 SUCCESS CRITERIA

### All 8 Tests Pass ✅
- [ ] Login works
- [ ] Proposals list displays
- [ ] Create new proposal
- [ ] Proposal editor loads
- [ ] Edit and save works
- [ ] View version history
- [ ] Restore old version
- [ ] Generate and download PDF

### If All Pass:
✅ **Phase 7.2 Part 1 is FULLY FUNCTIONAL** 🎉

---

## ⚠️ TROUBLESHOOTING

### Problem: "Proposal не найдено"
**Solution**: 
- Check URL has valid ID
- Reload page
- Check browser console (F12)

### Problem: "Backend готов не показывается"
**Solution**:
- Check PostgreSQL is running
- Check port 3000 is not in use
- Run: `netstat -ano | findstr "3000"`

### Problem: "Frontend не запускается"
**Solution**:
- Check port 3001 not in use
- Check .env.local exists
- Run: `npm install` in frontend folder

### Problem: "PDF не генерируется"
**Solution**:
- Check backend logs
- PDF storage folder: `backend/storage/pdfs/`
- Check Puppeteer is installed

### Problem: "Версии не показываются"
**Solution**:
- Make changes and save multiple times
- Each save creates new version
- Check API response: `GET /proposals/:id/versions`

---

## 🔍 HOW TO DEBUG

### Browser Console (F12)
```
Press F12 to open Developer Tools
→ Console tab shows errors
→ Network tab shows API calls
→ Check if requests have Authorization header
```

### Backend Logs
```
Check terminal window running backend
Look for errors in output
Check database connection status
```

### Check Tokens
```
F12 → Application → Local Storage
Should have:
- access_token
- refresh_token
- user (JSON object)
```

---

## 📊 EXPECTED RESULTS SUMMARY

| Feature | Status | What You'll See |
|---------|--------|-----------------|
| Login | ✅ Works | Redirects to /proposals |
| List | ✅ Works | Table with proposals |
| Create | ✅ Works | Form → new proposal |
| Edit | ✅ Works | Save button works |
| Versions | ✅ Works | History displays |
| Restore | ✅ Works | Old version restored |
| PDF Gen | ✅ Works | Generates in 3-5s |
| PDF Down | ✅ Works | File downloads |

---

## ✨ TESTING COMPLETE ✅

After all 8 tests pass:
1. ✅ All workflows functional
2. ✅ API integration working
3. ✅ Error handling tested
4. ✅ UI/UX verified
5. ✅ Ready for Part 2

---

## 📞 NEXT STEPS

After testing:
- [ ] All 8 tests passed?
- [ ] Any issues? (Check troubleshooting)
- [ ] Ready for Phase 7.2 Part 2? (Templates + Search)

---

**Start Testing Now!**

```powershell
.\start-all.ps1
```

Then go to: http://localhost:3001

Good luck! 🚀
