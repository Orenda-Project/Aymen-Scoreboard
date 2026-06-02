# 🗂️ Multi-Workspace Guide

## Overview

Your recruitment scoreboard now supports **multiple independent workspaces**! Create separate boards for different purposes, teams, or projects.

---

## 🎯 What are Workspaces?

Workspaces are **isolated boards** where each workspace has its own:
- Positions
- Candidates
- Custom columns
- Settings

Think of them like separate project folders - completely independent from each other.

---

## 🚀 Quick Start

### Creating Your First Additional Workspace

1. **Look at the left sidebar** - You'll see "Workspaces" section
2. **Click "+ New Workspace"** button at the bottom
3. **Fill in details**:
   - Name: e.g., "Open Positions", "Internship Program"
   - Description: Brief note about this workspace
   - Icon: Choose an emoji (👥, 📋, 🎯, etc.)
   - Color: Pick a theme color
4. **Click "Create Workspace"**
5. **Done!** Your new workspace is ready

---

## 📋 Workspace Examples

### Example 1: Recruitment Scoreboard
**Purpose:** Track active candidates
- **Icon:** 👥
- **Color:** Blue
- **Positions:** Software Engineer, Product Manager, Designer
- **Use for:** Current recruitment pipeline

### Example 2: Open Positions
**Purpose:** Manage job openings
- **Icon:** 📊
- **Color:** Green
- **Positions:** New roles to be published
- **Use for:** Planning future hires

### Example 3: Internship Program
**Purpose:** Track interns
- **Icon:** 🎓
- **Color:** Purple
- **Positions:** Summer Interns, Winter Interns
- **Use for:** Separate intern recruitment

### Example 4: Archived Candidates
**Purpose:** Keep past candidates
- **Icon:** 📁
- **Color:** Gray
- **Positions:** 2024 Q1, 2024 Q2, etc.
- **Use for:** Historical records

---

## 🔄 Switching Between Workspaces

### Method 1: Click Sidebar
- Click any workspace in the left sidebar
- The active workspace is highlighted in blue
- Content instantly switches

### Method 2: Keyboard (Coming Soon)
- Ctrl/Cmd + 1-9 to switch to workspace 1-9

---

## ✏️ Managing Workspaces

### Rename Workspace
1. **Hover** over workspace in sidebar
2. **Click** ✏️ (pencil icon)
3. **Enter** new name
4. **Press Enter**

### Delete Workspace
1. **Hover** over workspace in sidebar
2. **Click** 🗑️ (trash icon)
3. **Confirm** deletion
4. **Note:** Cannot delete if it's the only workspace

⚠️ **Warning:** Deleting a workspace permanently removes all its positions and candidates!

---

## 💾 Backup & Export

### Export All Workspaces
1. Click **"📥 Export Backup"** in top banner
2. Saves all workspaces to one JSON file
3. File named: `[workspace-name]_backup_YYYY-MM-DD_HH-MM.json`

### Export Single Workspace (Manual)
Currently exports all workspaces. To export just one:
1. Switch to the workspace
2. Copy all positions to a temporary workspace
3. Delete other workspaces temporarily
4. Export backup
5. Re-import main backup to restore

### Import Backups

**New Format (v2.0 - Multiple Workspaces):**
- Replaces all current workspaces
- Imports all workspaces from backup

**Old Format (v1.0 - Single Board):**
- Creates a new workspace called "Imported Board"
- Imports the old data as a new workspace
- Keeps existing workspaces intact

---

## 👥 Workspace Collaboration

Each workspace can be shared independently:

1. **Switch to workspace** you want to share
2. **Click "👥 Share & Collaborate"**
3. **Enable Cloud Sync**
4. **Generate Link**
5. **Share** - Only that workspace is shared!

**Important:** Each workspace has its own share link. Sharing one doesn't share others.

---

## 🎨 Customization

### Workspace Icons
Choose from 8 emoji icons:
- 👥 People (default for recruitment)
- 📋 Clipboard (for tasks/checklists)
- 🎯 Target (for goals/objectives)
- 💼 Briefcase (for business/corporate)
- 🚀 Rocket (for growth/new projects)
- 📊 Chart (for analytics/metrics)
- 🏢 Building (for departments/offices)
- ⭐ Star (for favorites/priorities)

### Workspace Colors
Choose from 8 theme colors:
- **Blue** (#1890ff) - Professional, calm
- **Green** (#52c41a) - Success, growth
- **Red** (#ff4d4f) - Urgent, important
- **Purple** (#722ed1) - Creative, unique
- **Orange** (#fa8c16) - Energetic, warm
- **Cyan** (#13c2c2) - Modern, tech
- **Pink** (#eb2f96) - Friendly, approachable
- **Gold** (#faad14) - Premium, valuable

---

## 📊 Workspace Statistics

Each workspace shows:
- **Position count**: Number of job positions
- **Candidate count**: Total candidates across all positions
- **Last modified**: When data was last changed (coming soon)

View in sidebar under workspace name.

---

## 🔍 Use Cases by Industry

### Tech Startups
1. **Engineering Recruitment** - Track dev candidates
2. **Product Team** - PM and designer hiring
3. **Contractor Pool** - Freelance developers

### HR Agencies
1. **Client A - Acme Corp** - All positions for Acme
2. **Client B - TechCo** - All positions for TechCo
3. **Internal Hiring** - Own team recruitment

### Large Enterprises
1. **Marketing Department** - Marketing roles
2. **Sales Department** - Sales roles
3. **Engineering Department** - Tech roles
4. **Internship Program** - All intern positions

### Recruitment Firms
1. **Active Searches** - Current open positions
2. **Candidate Pipeline** - Potential placements
3. **Placed Candidates** - Success tracking
4. **Client Archive** - Historical data

---

## 💡 Best Practices

### 1. Organize by Purpose
Create workspaces based on:
- **Team/Department** (Engineering, Sales, Marketing)
- **Timeline** (Q1 2024, Q2 2024)
- **Status** (Active, On Hold, Archived)
- **Client** (for agencies)

### 2. Use Descriptive Names
✅ Good: "Engineering Recruitment 2024"
❌ Bad: "Board 1"

✅ Good: "Internship Summer Program"
❌ Bad: "Interns"

### 3. Choose Relevant Icons
Match icon to workspace purpose:
- Recruitment → 👥
- Tracking metrics → 📊
- High priority → ⭐
- Archives → 📁

### 4. Regular Backups
- Export backups weekly
- Store in multiple locations
- Include date in filename

### 5. Archive Old Data
Instead of deleting:
1. Create "Archive 2024" workspace
2. Move old positions there
3. Keep for future reference

---

## 🔐 Data Isolation

### What's Separate Per Workspace:
✅ Positions
✅ Candidates
✅ Custom columns
✅ Position-specific settings
✅ Share links

### What's Global (All Workspaces):
- Auto-save settings
- Export/Import
- UI preferences (coming soon)

---

## ⚙️ Technical Details

### Storage
- Each workspace: ~50-500 KB (depending on candidates & resumes)
- Browser limit: ~10 MB total (plenty for 20+ workspaces)
- Stored in: localStorage (local to your browser)

### Performance
- Switching workspaces: Instant (<100ms)
- No limit on workspace count (practical limit ~50)
- Each workspace loads independently

### Sync
- Each workspace syncs independently
- Shared workspaces don't affect private ones
- Cloud sync uses separate keys per workspace

---

## 🐛 Troubleshooting

### Problem: Can't see sidebar
**Solution:** Refresh the page (Ctrl/Cmd + R)

### Problem: Workspace not saving
**Solution:**
- Check browser localStorage is enabled
- Check available storage space
- Try exporting backup first

### Problem: Lost workspace after refresh
**Solution:**
- Check localStorage not cleared
- Import from backup if available
- Check browser's "Clear data on exit" setting

### Problem: Can't delete last workspace
**Solution:** This is by design - you must have at least one workspace

---

## 🆚 Comparison: Single vs Multi-Workspace

| Feature | Single Workspace (Old) | Multi-Workspace (New) |
|---------|----------------------|---------------------|
| Organization | All in one board | Separate boards |
| Navigation | Scroll through all | Switch between boards |
| Sharing | Share everything | Share specific boards |
| Clarity | Can get cluttered | Clean & organized |
| Backups | One big file | All workspaces in one |
| Best for | Small teams, few roles | Large teams, many roles |

---

## 📈 Migration from Old Version

If you have data from the old single-workspace version:

1. **Your data is safe!** It's now in "Recruitment Scoreboard" workspace
2. **Create new workspaces** for different purposes
3. **Move positions** by recreating them (copy data manually)
4. **Future:** Import/export positions between workspaces (coming soon)

---

## 🎓 Tutorial: Setting Up Multi-Team Recruitment

Let's set up workspaces for a company with 3 departments:

### Step 1: Create Engineering Workspace
```
Name: Engineering Team
Description: All engineering positions
Icon: 💻
Color: Blue
```

### Step 2: Create Marketing Workspace
```
Name: Marketing Team
Description: Marketing & creative roles
Icon: 📢
Color: Orange
```

### Step 3: Create Sales Workspace
```
Name: Sales Team
Description: Sales & account management
Icon: 📈
Color: Green
```

### Step 4: Add Positions to Each
- Switch to Engineering → Add "Senior Developer", "QA Lead"
- Switch to Marketing → Add "Content Manager", "Designer"
- Switch to Sales → Add "Account Executive", "SDR"

### Result:
Clean separation by team, easy to switch, no clutter!

---

## 🚀 Coming Soon

Features planned for future updates:

- [ ] Move positions between workspaces
- [ ] Copy workspace (duplicate)
- [ ] Workspace templates
- [ ] Keyboard shortcuts (Ctrl+1-9)
- [ ] Workspace search
- [ ] Sort/filter workspaces
- [ ] Workspace-specific permissions
- [ ] Workspace analytics dashboard
- [ ] Export single workspace

---

## 📞 FAQ

**Q: Can I have unlimited workspaces?**
A: Technically yes, but recommended max is 20-30 for performance.

**Q: Will this slow down my board?**
A: No! Each workspace loads independently. Actually faster than one huge board.

**Q: Can I move positions between workspaces?**
A: Currently manual (copy data). Auto-move coming soon!

**Q: What happens to my old data?**
A: It's automatically in "Recruitment Scoreboard" workspace. Nothing lost!

**Q: Can I share multiple workspaces with one link?**
A: No, each workspace has its own share link for security.

**Q: Can I rename the default workspace?**
A: Yes! Hover over it and click the ✏️ icon.

---

**Enjoy your organized, multi-workspace recruitment system! 🎉**
