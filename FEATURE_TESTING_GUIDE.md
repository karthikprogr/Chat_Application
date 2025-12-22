# 🧪 Feature Testing Guide

## Complete Feature Testing Checklist

This guide helps you verify that all features work correctly before submission.

---

## 🔐 Authentication Features

### 1. Username Uniqueness Validation
**Steps:**
1. Go to Sign Up page
2. Enter a username (minimum 3 characters)
3. **Expected**: Green checkmark appears if username is available
4. Try registering with same username in another tab
5. **Expected**: Red X appears with "Username already taken" message

**Test Cases:**
- ✅ Username < 3 characters shows no validation
- ✅ Available username shows green checkmark
- ✅ Taken username shows red X
- ✅ Real-time feedback while typing

### 2. Email/Password Sign Up
**Steps:**
1. Navigate to `/signup`
2. Fill in all fields with valid data
3. Click "Create Account"
4. **Expected**: Redirect to `/chat` with user logged in

### 3. Google OAuth
**Steps:**
1. Click "Continue with Google"
2. Select Google account
3. **Expected**: Redirect to chat with profile photo

---

## 💬 Chat Features

### 4. Room Creation
**Steps:**
1. Click "+" button in sidebar
2. Enter room name and description
3. Click "Create Room"
4. **Expected**: New room appears in sidebar and becomes active

### 5. Real-Time Messaging
**Steps:**
1. Open two browser windows/tabs
2. Login with different accounts in each
3. Join the same room
4. Send message from Tab 1
5. **Expected**: Message appears instantly in Tab 2

**Test Cases:**
- ✅ Message appears immediately
- ✅ Timestamp shows "just now"
- ✅ Sender name displayed correctly
- ✅ Auto-scroll to latest message

### 6. Join/Leave Room Messages
**Steps:**
1. User A is in a room
2. User B joins the room
3. **Expected**: Gray bubble shows "User B joined the room"
4. User B leaves (closes tab or switches room)
5. **Expected**: "User B left the room" appears

**Test Cases:**
- ✅ Join message appears when entering room
- ✅ Leave message appears when exiting
- ✅ System messages centered with gray background
- ✅ Different styling from regular messages

### 7. Active Users List
**Steps:**
1. In a room, click the user group icon (top right)
2. **Expected**: Dropdown shows all active users with:
   - Profile photo or initial
   - Username
   - Green online indicator
3. Open another tab/window with different user
4. **Expected**: New user appears in active list
5. Close second tab
6. **Expected**: User removed from active list

**Test Cases:**
- ✅ Shows count badge (e.g., "3")
- ✅ Real-time updates when users join/leave
- ✅ Green dot for online status
- ✅ Scrollable if many users

---

## 🔔 Notification Features

### 8. Browser Desktop Notifications
**Initial Setup:**
1. On first visit, browser asks for notification permission
2. Click "Allow"

**Testing:**
1. Join a room
2. Switch to another tab or minimize browser
3. Have another user send a message
4. **Expected**: Desktop notification appears with:
   - Title: "Sender Name in Room Name"
   - Body: Message preview
   - App icon
5. Click notification
6. **Expected**: Tab focuses and opens chat

**Test Cases:**
- ✅ Notification shows when tab is hidden
- ✅ NO notification when tab is active
- ✅ NO notification for own messages
- ✅ Notification auto-dismisses after 5 seconds
- ✅ Clicking notification focuses tab

### 9. Sound Notifications
**Steps:**
1. Join a room
2. Have another user send a message
3. **Expected**: Notification sound plays
4. Sound plays even if tab is visible
5. NO sound for own messages

**Test Cases:**
- ✅ Sound plays for incoming messages
- ✅ Sound volume is reasonable (30%)
- ✅ No sound for system messages
- ✅ No sound for own messages

### 10. Unread Message Counter
**Steps:**
1. Join a room and switch to another tab
2. Receive 3 new messages
3. Look at browser tab title
4. **Expected**: Title shows "(3) ChatApp"
5. Switch back to chat tab
6. **Expected**: Counter resets to "ChatApp"

**Test Cases:**
- ✅ Counter increments for each message
- ✅ Resets when tab becomes visible
- ✅ Only counts messages while tab hidden

---

## 🎨 UI/UX Features

### 11. Message Formatting
**Steps:**
1. Type message: `Hello *world* this is **bold**`
2. Send message
3. **Expected**: 
   - "world" appears in italic
   - "bold" appears in bold

**Test Cases:**
- ✅ `*text*` renders as italic
- ✅ `**text**` renders as bold
- ✅ URLs auto-convert to clickable links

### 12. Typing Indicators
**Steps:**
1. Two users in same room
2. User A starts typing (don't send)
3. **Expected**: User B sees "User A is typing..." at bottom
4. User A stops typing for 2 seconds
5. **Expected**: Indicator disappears

### 13. Responsive Design
**Steps:**
1. Open app on desktop (1920x1080)
2. Resize to tablet (768px)
3. Resize to mobile (375px)
4. **Expected**: Layout adapts smoothly

**Test Cases:**
- ✅ Desktop: Sidebar always visible
- ✅ Mobile: Sidebar collapses, hamburger menu
- ✅ Messages readable on all sizes
- ✅ Input fields adapt to screen width

---

## 🔒 Security Features

### 14. Authentication Protection
**Steps:**
1. Logout
2. Try to access `/chat` directly via URL
3. **Expected**: Redirect to `/login`

### 15. Input Validation
**Steps:**
1. Try to sign up with:
   - Empty username
   - Email without @
   - Password < 6 characters
   - Mismatched confirm password
2. **Expected**: Error messages for each field

### 16. XSS Prevention
**Steps:**
1. Send message: `<script>alert('XSS')</script>`
2. **Expected**: Displays as plain text, no alert pops up

---

## 🚀 Performance Tests

### 17. Load Time
**Steps:**
1. Clear browser cache
2. Open app
3. **Expected**: 
   - First load < 3 seconds
   - Subsequent loads < 1 second

### 18. Message Load
**Steps:**
1. Create room with 100+ messages
2. Switch to that room
3. **Expected**: All messages load within 2 seconds

### 19. Real-Time Latency
**Steps:**
1. Send message
2. Measure time until visible in other tab
3. **Expected**: < 500ms latency

---

## 📊 Testing Checklist Summary

Copy this checklist and mark completed tests:

### Authentication
- [ ] Username uniqueness validation
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Google OAuth login
- [ ] Logout functionality

### Core Chat
- [ ] Create room
- [ ] Join room
- [ ] Send message
- [ ] Real-time message sync
- [ ] Join/leave notifications
- [ ] Active users list

### Notifications
- [ ] Desktop notifications
- [ ] Sound alerts
- [ ] Unread counter
- [ ] Notification permissions

### UI/UX
- [ ] Message formatting (bold, italic)
- [ ] Typing indicators
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling

### Security
- [ ] Route protection
- [ ] Input validation
- [ ] XSS prevention
- [ ] Username impersonation prevention

---

## 🐛 Common Issues & Solutions

### Issue: Notifications not showing
**Solution**: 
1. Check browser permissions: Settings → Site Settings → Notifications
2. Ensure notification permission was granted
3. Check if tab is actually hidden (switch to different tab)

### Issue: Join/leave messages not appearing
**Solution**:
1. Refresh both browser tabs
2. Check browser console for errors
3. Verify Firebase connection

### Issue: Active users not updating
**Solution**:
1. Check Firestore rules allow read/write to activeUsers
2. Ensure both users are in the same room
3. Check network tab for real-time connection

### Issue: Sound not playing
**Solution**:
1. Check browser audio permissions
2. Ensure speakers/volume not muted
3. Try different browser (Chrome recommended)

### Issue: Username still says "taken" after registration
**Solution**:
1. This is a bug - refresh page
2. Clear browser cache
3. Try different username

---

## 🎯 Success Criteria

Your app passes testing if:

✅ All authentication flows work without errors
✅ Messages sync in real-time (< 1 second)
✅ Notifications appear when tab is hidden
✅ Join/leave messages display correctly
✅ Active users list updates in real-time
✅ No console errors during normal usage
✅ Mobile layout works on phones
✅ Security rules prevent unauthorized access

---

## 📝 Testing Report Template

```
# Testing Report - [Date]

## Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [1920x1080/etc]

## Test Results

### Authentication (5/5 passed)
- [x] Username uniqueness: PASS
- [x] Email signup: PASS
- [x] Google OAuth: PASS
- [x] Login: PASS
- [x] Logout: PASS

### Chat Features (6/6 passed)
- [x] Room creation: PASS
- [x] Real-time messaging: PASS
- [x] Join/leave messages: PASS
- [x] Active users: PASS
- [x] Message formatting: PASS
- [x] Typing indicators: PASS

### Notifications (3/3 passed)
- [x] Desktop notifications: PASS
- [x] Sound alerts: PASS
- [x] Unread counter: PASS

### UI/UX (3/3 passed)
- [x] Responsive design: PASS
- [x] Loading states: PASS
- [x] Error handling: PASS

## Issues Found
[None / List any issues]

## Overall Grade: 🟢 PASS / 🔴 FAIL
```

---

**Happy Testing! 🚀**
