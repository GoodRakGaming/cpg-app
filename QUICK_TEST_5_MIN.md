# 🚀 QUICK TEST GUIDE - Phase 7.2 Part 1

**Start**: `.\start-all.ps1`  
**Browser**: http://localhost:3001  
**Credentials**: test@example.com / Test123!

---

## 🎯 5-MINUTE QUICK TEST

### 1️⃣ Login (30 sec)
```
URL: http://localhost:3001/login
Email: test@example.com
Password: Test123!
✅ Should see: Proposals list
```

### 2️⃣ Create Proposal (1 min)
```
Button: "+ Новое предложение"
Form:
  Template: Select any
  Title: "Test KP"
  Status: "Черновик"
Click: "✨ Создать предложение"
✅ Auto-redirects to /proposals/[id]
```

### 3️⃣ Edit & Save (1 min)
```
URL: /proposals/[id]
Change: Title → "Updated Test KP"
Change: Status → "Финальный"
Click: "💾 Сохранить"
✅ Green message appears
```

### 4️⃣ View Versions (1 min)
```
Click Tab: "📚 Версии"
You see: Version history table
Click: "Восстановить" on any version
✅ Version restores, message shows
```

### 5️⃣ Generate PDF (1.5 min)
```
Click Tab: "📄 PDF"
Click: "🔄 Генерировать PDF"
Wait: 3-5 seconds
✅ "📥 Скачать PDF" appears
Click: Download
✅ PDF file downloads
```

---

## 📍 KEY URLs TO TEST

```
http://localhost:3001                  Home (redirects to /login or /proposals)
http://localhost:3001/login            Login page
http://localhost:3001/proposals         List of proposals
http://localhost:3001/proposals/new     Create new proposal
http://localhost:3001/proposals/[id]   Edit proposal (replace [id] with real ID)
http://localhost:3000/health           Backend health check
```

---

## 🎮 WHAT EACH TAB DOES

### 📝 Content Tab (Editor)
- Edit title
- Change status
- View JSON data
- Click "Сохранить"

### 📚 Versions Tab
- See all past versions
- Click "Восстановить" to restore

### 📄 PDF Tab
- Click "🔄 Генерировать PDF"
- Wait for generation
- Click "📥 Скачать PDF"

---

## ✅ SUCCESS SIGNALS

Look for:
✅ Green success messages
✅ Page updates
✅ Auto-redirects
✅ Tabs switch content
✅ Forms accept input
✅ Buttons are responsive
✅ No red errors
✅ Console clean (F12)

---

## ❌ ERROR SIGNALS (if you see these)

❌ Red error message - check console (F12)
❌ Blank page - wait 2-3 seconds
❌ Form doesn't submit - check required fields
❌ PDF stuck "генерируется" - wait 5 more seconds
❌ 404 error - wrong URL or proposal doesn't exist

---

## 🔧 QUICK FIXES

**If stuck:**
1. Refresh page (F5)
2. Check console (F12) for errors
3. Check backend still running
4. Try logging out and back in
5. Close and reopen browser

**If PDF doesn't work:**
1. Try refresh
2. Wait longer for generation
3. Check backend logs
4. Ensure you saved proposal first

---

## 📊 TESTING CHECKLIST

Complete all 5 tests:
- [ ] Login works
- [ ] Create new proposal
- [ ] Edit & save works
- [ ] Versions show & restore works
- [ ] PDF generates & downloads

**All checked?** → **Phase 7.2 Part 1 ✅ WORKS!**

---

**Commands:**
```powershell
# Start
.\start-all.ps1

# Stop
# Close both PowerShell windows

# Test API
.\test-api.ps1
```

---

💡 **Tip**: Open browser DevTools (F12) while testing to see API calls in Network tab
