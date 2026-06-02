# 🔄 Data Recovery Guide

## ⚠️ What Happened

When the multi-workspace feature was added, the data storage format changed. Your old data is still safe in your browser's localStorage, but it needs to be migrated to the new format.

---

## ✅ Automatic Recovery (Fixed!)

I've just added an automatic data migration system to DEMO.html. Here's what to do:

### Step 1: Refresh the Page
1. **Open** [DEMO.html](C:\Users\Taleemabad\Downloads\Scoreboard\DEMO.html)
2. **Press** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to hard refresh
3. **Wait** a few seconds

### Step 2: Check for Recovery Message
You should see a green notification:
```
✅ Your data has been recovered!
```

### Step 3: Verify Your Data
1. Look at the sidebar - you should see "Recruitment Scoreboard" workspace
2. Click on it if not already selected
3. Your positions and candidates should be back!

---

## 🔍 What the Recovery Does

The migration system:
1. ✅ Checks for old data format
2. ✅ Converts it to new workspace format
3. ✅ Preserves all positions
4. ✅ Preserves all candidates
5. ✅ Preserves all custom columns
6. ✅ Preserves all data (resumes, status, dates, etc.)
7. ✅ Creates backup of old data
8. ✅ Shows success notification

---

## 🆘 Manual Recovery (If Automatic Fails)

If the automatic recovery doesn't work, try these steps:

### Option 1: Check Browser Storage

1. **Open DevTools**: Press F12
2. **Go to** "Application" tab (Chrome) or "Storage" tab (Firefox)
3. **Click** "Local Storage" → Your domain
4. **Look for** key: `recruitment_scoreboard_data`
5. **If found**: Copy the value (it's JSON)
6. **Save** to a text file as backup

### Option 2: Import from Backup

If you have a backup file (.json):

1. **Open** DEMO.html
2. **Click** "📤 Import Backup" in top banner
3. **Select** your backup file
4. **Confirm** import
5. **Done!** Data restored

### Option 3: Use Browser Backup

1. **Check** if you have browser backup/sync enabled
2. **Restore** from browser history
3. **Check** different profile/device if synced

---

## 🔧 Technical Details

### Old Format:
```json
{
  "positions": [...],
  "nextPositionId": 3,
  "timestamp": "2024-02-13T..."
}
```

### New Format:
```json
{
  "workspaces": [
    {
      "id": 1,
      "name": "Recruitment Scoreboard",
      "positions": [...],
      "nextPositionId": 3
    }
  ],
  "nextWorkspaceId": 2,
  "currentWorkspaceId": 1
}
```

### Migration Process:
1. Reads old data from `recruitment_scoreboard_data`
2. Wraps it in a workspace structure
3. Saves to `recruitment_scoreboard_workspaces`
4. Creates backup at `recruitment_scoreboard_data_backup`

---

## 📊 Verify Recovery Success

After recovery, verify:

### ✅ Check List:
- [ ] Sidebar shows "Recruitment Scoreboard" workspace
- [ ] All positions are visible (Software Engineer, QA Lead, etc.)
- [ ] All candidates are present
- [ ] All custom columns are there (Status, Date, Resume, etc.)
- [ ] All data values are intact
- [ ] Resume files are accessible
- [ ] Can edit cells normally
- [ ] Can add new candidates

---

## 💾 Prevent Future Data Loss

### 1. Regular Backups
**Export backup weekly:**
- Click "📥 Export Backup" in top banner
- Save to multiple locations (computer, cloud, USB)
- Name with date: `backup_2024-02-13.json`

### 2. Browser Settings
**Prevent accidental data loss:**
- Don't use "Clear data on exit" for this site
- Don't clear localStorage manually
- Don't use incognito mode for permanent work

### 3. Multiple Devices
**Sync your data:**
- Use "👥 Share & Collaborate" with cloud sync
- Access same board from multiple devices
- Real-time sync keeps data safe

### 4. Version Control
**Keep historical versions:**
- Export before major changes
- Keep last 3-5 backups
- Label important milestones

---

## 🐛 Troubleshooting

### Problem: Still no data after refresh
**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages about migration
4. Take screenshot
5. Check if old data exists in localStorage

### Problem: Some data is missing
**Solution:**
1. Check if backup exists: `recruitment_scoreboard_data_backup`
2. Export current state
3. Import the backup key value manually
4. Contact for help if needed

### Problem: Migration keeps running
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Keep localStorage
3. Refresh page (Ctrl+F5)

### Problem: Error during migration
**Solution:**
1. Check browser console for error message
2. Try exporting data manually from localStorage
3. Create new workspace and import

---

## 📞 Emergency Recovery

If all else fails:

### Last Resort Options:

1. **Browser History**
   - Chrome: chrome://history
   - Firefox: about:history
   - Find page from when data was working
   - Try to recover from cached version

2. **System Restore**
   - Windows: System Restore Point
   - Mac: Time Machine
   - Restore to date when data existed

3. **Data Recovery Tools**
   - Browser data recovery software
   - SQLite recovery (for some browsers)
   - Professional data recovery

---

## ✅ Success Story Template

After recovery, you should have:

```
Workspaces (Sidebar):
├── 👥 Recruitment Scoreboard
    ├── 📋 Software Engineer (2 candidates)
    │   ├── John Doe
    │   └── Sarah Smith
    └── 📋 QA Lead (1 candidate)
        └── Michael Chen
```

All data intact:
- ✅ Names
- ✅ Emails
- ✅ Phone numbers
- ✅ Status (Interview, Offered, etc.)
- ✅ Dates
- ✅ Resumes (can view/download)
- ✅ Scores
- ✅ Feedback notes

---

## 🎯 Next Steps After Recovery

Once your data is back:

1. **✅ Verify everything is correct**
2. **📥 Export backup immediately**
3. **💾 Save backup to safe location**
4. **📖 Read** [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md) to understand new features
5. **🎉 Continue working!**

---

## 📝 Recovery Log Template

Use this to track your recovery:

```
Date: _______________
Time: _______________
Browser: _______________
Issue: Lost data after workspace update

Steps Taken:
[ ] Refreshed page (Ctrl+F5)
[ ] Checked for recovery notification
[ ] Verified workspace in sidebar
[ ] Counted positions: ___
[ ] Counted candidates: ___
[ ] Tested editing
[ ] Exported new backup

Result: [ ] Success [ ] Partial [ ] Failed
Notes: _______________
```

---

## 💡 Prevention Tips

### Before Major Updates:
1. Export backup
2. Test in incognito first
3. Keep backup open
4. Verify after update

### Regular Maintenance:
1. Export weekly
2. Rotate 3 backups
3. Test import occasionally
4. Document changes

---

## 🔐 Data Safety Guarantee

Your data is safe because:
- ✅ Old data not deleted, only migrated
- ✅ Backup created automatically
- ✅ localStorage persists across sessions
- ✅ No server involved (all local)
- ✅ Browser protects localStorage
- ✅ Can export anytime

---

## 📞 Need Help?

If automatic recovery didn't work:

1. **Check console** (F12 → Console) for error messages
2. **Export current state** (even if empty)
3. **Check localStorage** for old data key
4. **Try manual import** from backup
5. **Document what happened** for troubleshooting

---

**Your data should be recovered now! Open DEMO.html and check.** 🙏

If you still see "No positions yet", please:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for migration messages
4. Check if any errors appear
5. Let me know what you see
