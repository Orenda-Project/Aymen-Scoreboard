# Feedback Reminder Feature - Implementation Plan

## Feature Overview

Add a Feedback Reminder system that helps track and remind collaborators to submit feedback for candidates in active positions.

## Requirements

1. **Active Position Indicator**: Display ⭐ for positions marked as "Active"
2. **Missing Feedback Detection**: Highlight cells where Feedback is empty in active positions
3. **Send Reminder Button**: Allow authorized users to send reminders
4. **Notification System**: Display popup notifications to remind collaborators

---

## UI Design

### 1. Active Position Indicator

**Location**: Position header (next to position name)

```
┌─────────────────────────────────────────────────┐
│ ⭐ Software Engineer                 2 candidates │
│    [Active Position]                              │
└─────────────────────────────────────────────────┘
```

**Visual Design**:
- ⭐ icon appears only for active positions
- Small "Active" badge with green background
- Toggle button in position settings to mark as Active/Inactive

### 2. Missing Feedback Highlighting

**Visual States**:

| State | Visual Treatment | Description |
|-------|-----------------|-------------|
| **Has Feedback** | Normal white background | Feedback column has content |
| **Missing (Active)** | Yellow/orange background `#fff7e6` with ⚠️ icon | Feedback empty in active position |
| **Missing (Inactive)** | Normal background | Feedback empty but position is inactive (no alert) |

**Example Cell Rendering**:
```
┌────────────────────────────────────────┐
│ ⚠️ Feedback missing                    │
│ [🔔 Send Reminder]                     │
└────────────────────────────────────────┘
```

### 3. Send Reminder Button

**Button Design**:
- **Label**: "🔔 Send Reminder"
- **Style**: Small, secondary button with blue outline
- **Position**: Inside the highlighted feedback cell
- **Visibility**: Only shown when:
  - Position is marked as Active
  - Feedback column is empty
  - User has permission (Admin or assigned collaborator)

**Button States**:
```css
.reminder-btn {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.reminder-btn:hover {
    background: #bae7ff;
}

.reminder-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### 4. Notification System

#### a) In-App Notification Toast

**Design**:
```
┌─────────────────────────────────────────────────┐
│ 🔔 Reminder Sent!                            [×] │
│                                                   │
│ Feedback reminder sent to:                       │
│ • Sarah Johnson (sarah@company.com)              │
│                                                   │
│ For: John Doe - Software Engineer                │
│                                                   │
│ [View Details]                       [Dismiss]    │
└─────────────────────────────────────────────────┘
```

**Position**: Top-right corner, slides in from right
**Duration**: 5 seconds auto-dismiss (or manual close)

#### b) Notification Center

**Location**: Top navigation bar

```
[🔔 3] ← Notification bell icon with count badge
```

**Dropdown Panel**:
```
┌─────────────────────────────────────────────────┐
│ 🔔 Notifications                    [Clear All] │
├─────────────────────────────────────────────────┤
│ ⚠️ Feedback reminder                           │
│    John Doe - Software Engineer                 │
│    Missing feedback for 3 days                  │
│    [Add Feedback]                    2 hours ago│
├─────────────────────────────────────────────────┤
│ ✅ Feedback submitted                          │
│    Sarah Smith - QA Lead                        │
│    Feedback added by @mike                      │
│    [View]                            5 hours ago│
├─────────────────────────────────────────────────┤
│ 🔔 Reminder sent                               │
│    You sent a reminder to @sarah                │
│                                      1 day ago  │
└─────────────────────────────────────────────────┘
```

#### c) Reminder Confirmation Modal

**Shown when user clicks "Send Reminder"**:

```
┌─────────────────────────────────────────────────┐
│ Send Feedback Reminder                      [×] │
├─────────────────────────────────────────────────┤
│                                                   │
│ You're about to send a reminder for:             │
│                                                   │
│ 👤 Candidate: John Doe                          │
│ 📋 Position: Software Engineer                   │
│ 📝 Missing: Feedback                             │
│                                                   │
│ Send reminder to:                                │
│ ┌───────────────────────────────────────────┐   │
│ │ ☑ Sarah Johnson (sarah@company.com)       │   │
│ │ ☑ Mike Chen (mike@company.com)            │   │
│ │ ☐ All collaborators                       │   │
│ └───────────────────────────────────────────┘   │
│                                                   │
│ 💬 Custom message (optional):                   │
│ ┌───────────────────────────────────────────┐   │
│ │ Please review John's interview and        │   │
│ │ provide your feedback.                    │   │
│ └───────────────────────────────────────────┘   │
│                                                   │
│ ☑ Send email notification                        │
│                                                   │
│ [Cancel]                    [🔔 Send Reminder]   │
└─────────────────────────────────────────────────┘
```

---

## Data Structure Changes

### 1. Position Object (Update)

```javascript
{
  id: number,
  name: string,
  description: string,
  color: string,
  collapsed: boolean,
  isActive: boolean,              // NEW: Mark position as active
  columns: [...],
  candidates: [...],
  nextCandidateId: number,
  nextColumnId: number,
  customStatuses: [],
  assignedCollaborators: [        // NEW: List of users assigned to this position
    {
      id: string,
      name: string,
      email: string,
      role: 'admin' | 'collaborator' | 'viewer'
    }
  ]
}
```

### 2. Candidate Object (Update)

```javascript
{
  id: number,
  data: {
    Name: string,
    Email: string,
    Phone: string,
    Status: string,
    Feedback: string,
    // ... other columns
  },
  assignedTo: string,              // NEW: User ID of assigned collaborator
  feedbackReminders: [             // NEW: Track reminder history
    {
      id: string,
      sentBy: string,
      sentTo: string[],
      timestamp: string,
      message: string,
      read: boolean
    }
  ]
}
```

### 3. Notification Object (New)

```javascript
{
  id: string,                      // Unique notification ID
  type: 'reminder' | 'feedback_added' | 'status_changed',
  timestamp: string,
  read: boolean,
  data: {
    candidateName: string,
    positionName: string,
    message: string,
    actionUrl: string,              // Link to candidate row
    sentBy: string,
    priority: 'low' | 'medium' | 'high'
  }
}
```

### 4. User/Collaborator Object (New)

```javascript
{
  id: string,
  name: string,
  email: string,
  role: 'admin' | 'collaborator' | 'viewer',
  avatar: string,                   // Optional avatar URL
  notificationPreferences: {
    email: boolean,
    inApp: boolean,
    muteAll: boolean
  }
}
```

---

## Implementation Steps

### Phase 1: Foundation (Data Structure & UI)

#### Step 1.1: Add Active Position Toggle

**File**: `DEMO.html`

**Location**: Position header (around line 1550-1565)

Add toggle button next to position name:

```html
<div class="position-header">
    <span class="position-name">
        ${position.isActive ? '⭐' : ''} ${position.name}
        ${position.isActive ? '<span class="active-badge">Active</span>' : ''}
    </span>
    <button class="btn-toggle-active" onclick="togglePositionActive(${position.id})">
        ${position.isActive ? '✓ Active' : 'Mark Active'}
    </button>
</div>
```

**Function**:
```javascript
function togglePositionActive(positionId) {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    position.isActive = !position.isActive;
    saveWorkspaceData();
    renderAll();
    showNotification(position.isActive
        ? `✅ ${position.name} marked as Active`
        : `Position ${position.name} marked as Inactive`
    );
}
```

**CSS**:
```css
.active-badge {
    display: inline-block;
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    margin-left: 8px;
    font-weight: 500;
}

.btn-toggle-active {
    background: transparent;
    border: 1px solid #d9d9d9;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.btn-toggle-active:hover {
    border-color: #1890ff;
    color: #1890ff;
}
```

#### Step 1.2: Highlight Missing Feedback Cells

**File**: `DEMO.html` - Modify `renderCell()` function (around line 1752)

```javascript
function renderCell(type, value, columnName, position = null, candidate = null) {
    // Existing code...

    // Special handling for Feedback column in active positions
    if (columnName === 'Feedback' && position && position.isActive) {
        if (!value || value.trim() === '') {
            // Missing feedback in active position
            return `
                <div class="missing-feedback-cell">
                    <div class="missing-feedback-alert">
                        ⚠️ Feedback missing
                    </div>
                    <button class="btn-send-reminder"
                            onclick="showReminderModal(event, ${position.id}, ${candidate.id})">
                        🔔 Send Reminder
                    </button>
                </div>
            `;
        }
    }

    // Rest of existing renderCell logic...
}
```

**CSS**:
```css
.missing-feedback-cell {
    background: #fff7e6;
    border-left: 3px solid #faad14;
    padding: 8px;
    min-height: 60px;
}

.missing-feedback-alert {
    color: #d46b08;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
}

.btn-send-reminder {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-send-reminder:hover {
    background: #bae7ff;
    border-color: #40a9ff;
}

.btn-send-reminder:active {
    background: #91d5ff;
}
```

### Phase 2: Reminder Modal

#### Step 2.1: Create Reminder Modal HTML

**File**: `DEMO.html` - Add to modals section (around line 1100)

```html
<!-- Reminder Modal -->
<div id="reminderModal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <span>Send Feedback Reminder</span>
            <span class="close" onclick="closeReminderModal()">&times;</span>
        </div>

        <div style="padding: 24px;">
            <div class="reminder-candidate-info">
                <p><strong>👤 Candidate:</strong> <span id="reminderCandidateName"></span></p>
                <p><strong>📋 Position:</strong> <span id="reminderPositionName"></span></p>
                <p><strong>📝 Missing:</strong> Feedback</p>
            </div>

            <div style="margin-top: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                    Send reminder to:
                </label>
                <div id="reminderCollaboratorList" class="collaborator-list">
                    <!-- Will be populated dynamically -->
                </div>
            </div>

            <div style="margin-top: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                    💬 Custom message (optional):
                </label>
                <textarea id="reminderMessage"
                          placeholder="Add a custom message for the reminder..."
                          style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
                </textarea>
            </div>

            <div style="margin-top: 16px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="reminderSendEmail" style="margin-right: 8px;">
                    <span>Send email notification</span>
                </label>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeReminderModal()">Cancel</button>
            <button class="btn btn-primary" onclick="sendReminder()">🔔 Send Reminder</button>
        </div>
    </div>
</div>
```

**CSS**:
```css
.reminder-candidate-info {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    line-height: 1.8;
}

.reminder-candidate-info p {
    margin: 4px 0;
}

.collaborator-list {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 12px;
    max-height: 200px;
    overflow-y: auto;
}

.collaborator-item {
    display: flex;
    align-items: center;
    padding: 8px;
    margin-bottom: 4px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.collaborator-item:hover {
    background: #f5f5f5;
}

.collaborator-item input[type="checkbox"] {
    margin-right: 12px;
}

.collaborator-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #1890ff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-weight: 600;
}

.collaborator-info {
    flex: 1;
}

.collaborator-name {
    font-weight: 500;
    display: block;
}

.collaborator-email {
    font-size: 12px;
    color: #999;
}
```

#### Step 2.2: Reminder Modal JavaScript Functions

```javascript
let currentReminderContext = null;

function showReminderModal(event, positionId, candidateId) {
    event.stopPropagation();

    const position = positions.find(p => p.id === positionId);
    const candidate = position?.candidates.find(c => c.id === candidateId);

    if (!position || !candidate) {
        showNotification('⚠️ Error loading reminder data', 'error');
        return;
    }

    currentReminderContext = { position, candidate };

    // Populate modal
    document.getElementById('reminderCandidateName').textContent = candidate.data.Name || 'Unknown';
    document.getElementById('reminderPositionName').textContent = position.name;

    // Populate collaborator list
    const collaboratorList = document.getElementById('reminderCollaboratorList');
    const collaborators = position.assignedCollaborators || getDefaultCollaborators();

    collaboratorList.innerHTML = collaborators.map(collab => `
        <label class="collaborator-item">
            <input type="checkbox" value="${collab.id}" checked>
            <div class="collaborator-avatar">${collab.name.charAt(0).toUpperCase()}</div>
            <div class="collaborator-info">
                <span class="collaborator-name">${collab.name}</span>
                <span class="collaborator-email">${collab.email}</span>
            </div>
        </label>
    `).join('');

    // Clear previous message
    document.getElementById('reminderMessage').value = '';
    document.getElementById('reminderSendEmail').checked = false;

    // Show modal
    document.getElementById('reminderModal').style.display = 'block';
}

function closeReminderModal() {
    document.getElementById('reminderModal').style.display = 'none';
    currentReminderContext = null;
}

function getDefaultCollaborators() {
    // Return default collaborators if none assigned
    return [
        {
            id: 'user1',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            role: 'collaborator'
        },
        {
            id: 'user2',
            name: 'Mike Chen',
            email: 'mike@company.com',
            role: 'collaborator'
        }
    ];
}

function sendReminder() {
    if (!currentReminderContext) return;

    const { position, candidate } = currentReminderContext;

    // Get selected collaborators
    const checkboxes = document.querySelectorAll('#reminderCollaboratorList input[type="checkbox"]:checked');
    const selectedCollaborators = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCollaborators.length === 0) {
        alert('⚠️ Please select at least one collaborator to send the reminder to.');
        return;
    }

    // Get custom message
    const customMessage = document.getElementById('reminderMessage').value.trim();
    const sendEmail = document.getElementById('reminderSendEmail').checked;

    // Create reminder record
    const reminder = {
        id: Date.now().toString(),
        sentBy: 'current_user', // Replace with actual user ID
        sentTo: selectedCollaborators,
        timestamp: new Date().toISOString(),
        message: customMessage,
        read: false,
        candidateId: candidate.id,
        positionId: position.id
    };

    // Store reminder in candidate data
    if (!candidate.feedbackReminders) {
        candidate.feedbackReminders = [];
    }
    candidate.feedbackReminders.push(reminder);

    // Create notifications for each selected collaborator
    selectedCollaborators.forEach(collabId => {
        createNotification({
            type: 'reminder',
            candidateName: candidate.data.Name,
            positionName: position.name,
            message: customMessage || 'Please provide feedback for this candidate',
            sentBy: 'current_user',
            recipientId: collabId
        });
    });

    // Save data
    saveWorkspaceData();

    // Show success notification
    const collaboratorNames = selectedCollaborators.length === 1
        ? 'Sarah Johnson'
        : `${selectedCollaborators.length} collaborators`;

    showNotification(`✅ Reminder sent to ${collaboratorNames}!`);

    // Close modal
    closeReminderModal();

    // Optional: Send email if enabled
    if (sendEmail) {
        console.log('Email notification would be sent here');
        // This would require backend integration
    }
}
```

### Phase 3: Notification System

#### Step 3.1: Notification Bell in Header

**File**: `DEMO.html` - Update header (around line 30)

```html
<div class="header">
    <h1>👥 Recruitment Scoreboard</h1>
    <div class="header-actions">
        <button class="notification-bell" onclick="toggleNotificationPanel()">
            🔔
            <span id="notificationCount" class="notification-badge">0</span>
        </button>
        <!-- Other header buttons -->
    </div>
</div>

<!-- Notification Panel -->
<div id="notificationPanel" class="notification-panel">
    <div class="notification-panel-header">
        <span style="font-weight: 600;">🔔 Notifications</span>
        <button class="btn-text" onclick="clearAllNotifications()">Clear All</button>
    </div>
    <div id="notificationList" class="notification-list">
        <!-- Notifications will be inserted here -->
    </div>
</div>
```

**CSS**:
```css
.notification-bell {
    position: relative;
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
}

.notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #ff4d4f;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    display: none;
}

.notification-badge.has-notifications {
    display: block;
}

.notification-panel {
    position: fixed;
    top: 70px;
    right: 24px;
    width: 400px;
    max-height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    display: none;
    z-index: 1000;
}

.notification-panel.open {
    display: block;
}

.notification-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.notification-list {
    max-height: 500px;
    overflow-y: auto;
}

.notification-item {
    padding: 16px 20px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
}

.notification-item:hover {
    background: #fafafa;
}

.notification-item.unread {
    background: #e6f7ff;
}

.notification-icon {
    display: inline-block;
    font-size: 20px;
    margin-right: 12px;
}

.notification-content {
    display: inline-block;
    vertical-align: top;
    width: calc(100% - 40px);
}

.notification-title {
    font-weight: 600;
    margin-bottom: 4px;
}

.notification-message {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}

.notification-time {
    font-size: 11px;
    color: #999;
}

.notification-actions {
    margin-top: 8px;
}

.notification-actions button {
    font-size: 12px;
    padding: 4px 12px;
    margin-right: 8px;
}

.btn-text {
    background: transparent;
    border: none;
    color: #1890ff;
    cursor: pointer;
    font-size: 13px;
}

.btn-text:hover {
    text-decoration: underline;
}
```

#### Step 3.2: Notification System JavaScript

```javascript
// Initialize notification system
let notifications = [];

function loadNotifications() {
    const saved = localStorage.getItem('recruitment_notifications');
    if (saved) {
        notifications = JSON.parse(saved);
        updateNotificationBadge();
    }
}

function saveNotifications() {
    localStorage.setItem('recruitment_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function createNotification(data) {
    const notification = {
        id: Date.now().toString(),
        type: data.type,
        timestamp: new Date().toISOString(),
        read: false,
        data: {
            candidateName: data.candidateName,
            positionName: data.positionName,
            message: data.message,
            sentBy: data.sentBy,
            recipientId: data.recipientId,
            priority: data.priority || 'medium'
        }
    };

    notifications.unshift(notification); // Add to beginning
    saveNotifications();
    renderNotifications();

    // Show toast notification
    showToastNotification(notification);
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('open');

    if (panel.classList.contains('open')) {
        renderNotifications();
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #999;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔔</div>
                <p>No notifications</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(notif => {
        const timeAgo = getTimeAgo(notif.timestamp);
        const icon = getNotificationIcon(notif.type);

        return `
            <div class="notification-item ${notif.read ? '' : 'unread'}"
                 onclick="handleNotificationClick('${notif.id}')">
                <span class="notification-icon">${icon}</span>
                <div class="notification-content">
                    <div class="notification-title">
                        ${getNotificationTitle(notif)}
                    </div>
                    <div class="notification-message">
                        ${notif.data.message}
                    </div>
                    <div class="notification-time">${timeAgo}</div>
                    ${notif.type === 'reminder' ? `
                        <div class="notification-actions">
                            <button class="btn btn-sm btn-primary"
                                    onclick="handleAddFeedback(event, '${notif.id}')">
                                Add Feedback
                            </button>
                            <button class="btn btn-sm btn-secondary"
                                    onclick="dismissNotification(event, '${notif.id}')">
                                Dismiss
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'reminder': '⚠️',
        'feedback_added': '✅',
        'status_changed': '📊'
    };
    return icons[type] || '🔔';
}

function getNotificationTitle(notif) {
    const titles = {
        'reminder': `Feedback reminder for ${notif.data.candidateName}`,
        'feedback_added': `Feedback submitted for ${notif.data.candidateName}`,
        'status_changed': `Status updated for ${notif.data.candidateName}`
    };
    return titles[notif.type] || 'Notification';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');

    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.add('has-notifications');
    } else {
        badge.classList.remove('has-notifications');
    }
}

function handleNotificationClick(notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    // Mark as read
    notif.read = true;
    saveNotifications();
    renderNotifications();
}

function handleAddFeedback(event, notifId) {
    event.stopPropagation();

    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    // TODO: Navigate to candidate row and focus feedback cell
    // For now, just dismiss
    dismissNotification(event, notifId);

    showNotification('✍️ Opening feedback editor...');
}

function dismissNotification(event, notifId) {
    event.stopPropagation();

    const index = notifications.findIndex(n => n.id === notifId);
    if (index > -1) {
        notifications.splice(index, 1);
        saveNotifications();
        renderNotifications();
    }
}

function clearAllNotifications() {
    if (confirm('Clear all notifications?')) {
        notifications = [];
        saveNotifications();
        renderNotifications();
        showNotification('✅ All notifications cleared');
    }
}

// Toast notification
function showToastNotification(notification) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-header">
            <span>${getNotificationIcon(notification.type)} ${getNotificationTitle(notification)}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="toast-body">${notification.data.message}</div>
    `;

    document.body.appendChild(toast);

    // Slide in
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});
```

**Toast CSS**:
```css
.toast-notification {
    position: fixed;
    top: 80px;
    right: -400px;
    width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transition: right 0.3s ease;
}

.toast-notification.show {
    right: 24px;
}

.toast-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #1890ff;
    color: white;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
}

.toast-header button {
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.toast-body {
    padding: 16px;
    color: #333;
}
```

---

## Usage Workflow

### 1. Admin Marks Position as Active

```
Admin clicks "Mark Active" button on position header
→ Position shows ⭐ indicator
→ System now tracks feedback for this position
```

### 2. System Detects Missing Feedback

```
Active position has candidates
→ System checks Feedback column
→ Empty cells get yellow highlight + ⚠️ icon
→ "Send Reminder" button appears
```

### 3. Sending a Reminder

```
User clicks "Send Reminder" button
→ Modal opens with candidate info
→ User selects collaborators to notify
→ (Optional) Adds custom message
→ Clicks "Send Reminder"
→ Notifications created for selected users
→ Toast notification confirms reminder sent
```

### 4. Receiving a Reminder

```
Collaborator sees notification badge (🔔 1)
→ Clicks bell icon to open notification panel
→ Sees "Feedback reminder" notification
→ Clicks "Add Feedback" button
→ System navigates to candidate row
→ User adds feedback
→ Notification dismissed automatically
```

---

## Testing Checklist

### UI Testing
- [ ] ⭐ Active indicator appears for active positions
- [ ] Active badge shows green styling
- [ ] Toggle button switches between Active/Inactive
- [ ] Yellow highlight appears for missing feedback in active positions
- [ ] "Send Reminder" button only shows for missing feedback in active positions
- [ ] Reminder modal opens correctly
- [ ] Collaborator list populates
- [ ] Custom message textarea works
- [ ] Email checkbox toggles

### Functionality Testing
- [ ] Reminder data saved to candidate object
- [ ] Notifications created for selected collaborators
- [ ] Notification badge updates count
- [ ] Notification panel opens/closes
- [ ] Toast notification appears and auto-dismisses
- [ ] "Add Feedback" button in notification works
- [ ] "Dismiss" button removes notification
- [ ] "Clear All" removes all notifications
- [ ] Notification persistence across page reloads

### Edge Cases
- [ ] No collaborators assigned (uses defaults)
- [ ] All collaborators selected
- [ ] No collaborators selected (shows error)
- [ ] Very long custom messages
- [ ] Multiple reminders for same candidate
- [ ] Position switched from Active to Inactive
- [ ] Feedback added (notification should update)

---

## Future Enhancements

### Phase 4 (Optional)
1. **Email Integration**
   - Backend service to send actual emails
   - Email templates
   - Unsubscribe functionality

2. **Collaborator Management**
   - Add/edit collaborators
   - Role-based permissions
   - Profile avatars

3. **Advanced Notifications**
   - Scheduled reminders (e.g., 3 days after interview)
   - Escalation (remind again if no response)
   - Batch reminders

4. **Analytics**
   - Track reminder response time
   - Dashboard showing pending feedback
   - Collaborator performance metrics

5. **Mobile Notifications**
   - Push notifications
   - SMS reminders

---

## Summary

This Feedback Reminder feature provides a comprehensive system to:
- ✅ Track active positions with visual indicators
- ✅ Highlight missing feedback automatically
- ✅ Send targeted reminders to collaborators
- ✅ Manage notifications in-app
- ✅ Maintain audit trail of reminders

The implementation is designed to be:
- **User-friendly**: Clear visual cues and simple workflows
- **Non-intrusive**: Notifications can be dismissed or ignored
- **Flexible**: Custom messages and selective recipient lists
- **Scalable**: Can be extended with email, scheduling, etc.

The feature integrates seamlessly with the existing recruitment scoreboard while adding powerful feedback management capabilities.
