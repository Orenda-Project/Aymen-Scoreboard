# 👥 Collaboration & Sharing Guide

## Overview

Your recruitment scoreboard now supports real-time collaboration! You can invite others to view or edit your boards with shareable links.

---

## 🚀 How to Share Your Board

### Step 1: Open the Share Panel
Click the **"👥 Share & Collaborate"** button in the top banner (green button)

### Step 2: Choose Access Level

**✏️ Can Edit** (Default)
- Full access to add, edit, and delete candidates
- Can modify positions and columns
- Perfect for team members who actively recruit

**👁️ View Only**
- Can only view the board
- Cannot make any changes
- Perfect for managers or stakeholders who need to monitor progress

### Step 3: Enable Cloud Sync (Optional but Recommended)

**Without Cloud Sync:**
- Share link contains a snapshot of your current data
- No real-time updates
- Recipients get a static copy
- Best for one-time sharing

**With Cloud Sync:** ☁️
- Real-time collaboration
- All changes sync automatically across all devices
- Everyone sees updates within 5 seconds
- Best for active team collaboration

### Step 4: Generate Link
Click **"Generate Link"** button

### Step 5: Share the Link
- Click **"📋 Copy"** to copy the link
- Send it via email, Slack, WhatsApp, or any messaging app
- Anyone with the link can access the board

---

## 🔗 Share Link Examples

### Cloud Sync Link (Real-time)
```
https://your-domain.com/DEMO.html?board=board-abc123xyz&access=edit
```
- Has a board ID
- Syncs in real-time
- Best for teams

### Static Link (One-time)
```
https://your-domain.com/DEMO.html?data=eyJwb3NpdGlvbnMiOlsu...&access=view
```
- Contains encoded data
- No real-time sync
- Best for sharing snapshots

---

## ✨ Features

### Real-Time Sync
- Changes sync automatically every 5 seconds
- No need to refresh the page
- See **"☁️ Synced"** status in the banner

### Access Control
- **Edit Access**: Full control (add/edit/delete)
- **View-Only Access**: Read-only mode (no buttons, no editing)

### Sync Status
Look for the sync indicator in the top banner:
- ☁️ Connected - Cloud sync active
- ☁️ Synced - Latest changes uploaded
- ☁️ Updated from cloud - Received changes from collaborators
- ☁️ Sync error - Connection issue

### Active Collaborators (Coming Soon)
- See who else is viewing the board
- Track recent changes
- Collaboration activity log

---

## 📋 Use Cases

### 1. Team Collaboration
**Scenario:** Multiple recruiters working on the same positions
- **Access:** Edit
- **Cloud Sync:** Enabled ☁️
- **Result:** Everyone sees real-time updates

### 2. Manager Review
**Scenario:** Share with hiring manager for weekly review
- **Access:** View Only 👁️
- **Cloud Sync:** Enabled ☁️
- **Result:** Manager sees live data but can't modify

### 3. External Sharing
**Scenario:** Share with external recruiter
- **Access:** Edit
- **Cloud Sync:** Disabled
- **Result:** They get a copy to work on independently

### 4. Stakeholder Dashboard
**Scenario:** Show C-level executives hiring progress
- **Access:** View Only 👁️
- **Cloud Sync:** Enabled ☁️
- **Result:** They see live metrics without clutter

---

## 🔒 Security & Privacy

### Important Notes

⚠️ **Anyone with the link can access the board**
- Treat share links like passwords
- Only share with trusted individuals
- Links are not password protected

🔐 **To stop sharing:**
1. Open Share panel
2. Click **"Stop Sharing"** button
3. This invalidates the share link
4. Previous link will no longer work

💾 **Your data is safe:**
- Data is stored locally in your browser
- Cloud sync uses browser localStorage simulation
- No external servers are accessed (in this version)

---

## 🛠️ Troubleshooting

### Problem: Collaborators don't see my changes

**Solution:**
- Make sure you enabled Cloud Sync ☁️
- Check sync status shows "Synced"
- Ask them to wait 5-10 seconds for auto-sync
- They may need to refresh the page

### Problem: "Board not found" error

**Solution:**
- The creator must open the share link at least once
- Click "Generate Link" again to initialize cloud storage
- Make sure Cloud Sync was enabled when generating link

### Problem: Changes not saving

**Solution:**
- Check if you're in View-Only mode (orange banner)
- Verify you have Edit access
- Check browser console for errors

### Problem: Link is too long (URL error)

**Solution:**
- This happens with large datasets
- Enable Cloud Sync to use board IDs instead
- Or export/import as backup files instead

---

## 🎯 Best Practices

### For Team Collaboration
1. ✅ Always enable Cloud Sync
2. ✅ Give Edit access to active recruiters only
3. ✅ Use View-Only for stakeholders
4. ✅ Check sync status regularly
5. ✅ Export backups weekly

### For Large Teams (5+ people)
1. ✅ Assign one person as "board owner"
2. ✅ Share from their device
3. ✅ Keep their browser tab open for continuous sync
4. ✅ Schedule regular sync check-ins

### For Security
1. ✅ Don't share links publicly
2. ✅ Stop sharing when project ends
3. ✅ Use View-Only by default
4. ✅ Give Edit access only when needed
5. ✅ Export backups before sharing

---

## 🚀 Quick Start Example

### Scenario: Share with your recruitment team

**Step-by-step:**

1. Open your recruitment scoreboard
2. Click **"👥 Share & Collaborate"** button
3. Select **"✏️ Can Edit"**
4. Check **"☁️ Enable Cloud Sync"**
5. Click **"Generate Link"**
6. Click **"📋 Copy"**
7. Send link to your team:
   ```
   Hi team! Here's our recruitment board:
   [paste link]

   All changes sync automatically. Let me know if you have issues!
   ```

**Result:**
- Your team opens the link
- They see all current candidates
- Any changes sync within 5 seconds
- Everyone stays updated automatically

---

## 📊 Comparison

| Feature | Local Only | Static Link | Cloud Sync Link |
|---------|-----------|-------------|-----------------|
| Real-time sync | ❌ | ❌ | ✅ |
| Automatic updates | ❌ | ❌ | ✅ |
| Works offline | ✅ | ✅ | ❌ |
| No setup needed | ✅ | ✅ | ❌ |
| Team collaboration | ❌ | ❌ | ✅ |
| Data size limit | ∞ | 2MB | ∞ |
| Best for | Solo use | One-time share | Active teams |

---

## 💡 Tips & Tricks

### Tip 1: Keep the creator tab open
The person who creates the share link should keep their browser tab open for best sync performance.

### Tip 2: Export before sharing
Always export a backup before sharing with external parties.

### Tip 3: Use descriptive board names
Rename your positions to clearly indicate what each board is for.

### Tip 4: Test with yourself first
Open the share link in an incognito window to test before sending to others.

### Tip 5: Schedule sync times
For large teams, have everyone sync at specific times (e.g., 9 AM daily) to avoid conflicts.

---

## 🎓 Advanced: Production Deployment

For real production use with multiple teams:

1. **Deploy to a web server** (see DEPLOY_INSTRUCTIONS.txt)
2. **Use a real backend** (replace localStorage with API)
3. **Add authentication** (login system)
4. **Implement WebSockets** (true real-time sync)
5. **Add permissions** (role-based access control)

Current version uses browser localStorage for simplicity. For enterprise use, consider upgrading to:
- Firebase Realtime Database
- Supabase
- Custom Node.js/Django backend

---

## ❓ FAQ

**Q: Can I share with people outside my organization?**
A: Yes, but be careful with sensitive candidate data. Consider using View-Only access.

**Q: How many people can collaborate?**
A: Technically unlimited, but performance is best with 2-10 active editors.

**Q: Does it work on mobile?**
A: Yes! Share links work on any device with a web browser.

**Q: Can I revoke access?**
A: Yes, click "Stop Sharing" to invalidate the link. You'll need to generate a new link.

**Q: What happens if two people edit simultaneously?**
A: Last change wins. The 5-second sync interval minimizes conflicts.

**Q: Can I have multiple boards?**
A: Each position is like a separate board. Share the entire scoreboard or export/import individual positions.

**Q: Is my data secure?**
A: Data is stored locally in your browser. For production use with sensitive data, deploy to a secure server.

---

## 📞 Support

Having issues? Check:
1. Browser console for errors (F12)
2. Network connectivity
3. Browser localStorage is not disabled
4. You're using a modern browser (Chrome, Firefox, Edge, Safari)

---

**Happy Collaborating! 🎉**

Your recruitment team can now work together seamlessly on the same board!
