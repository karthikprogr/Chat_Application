# 🧪 Privacy System Testing Guide

## Overview
This guide provides step-by-step instructions for testing the complete room privacy system with invite codes, admin approval, and search functionality.

---

## 🎯 Test Scenarios

### ✅ Scenario 1: Create Private Room & Generate Invite Code

**Objective**: Verify room creation with privacy settings and invite code generation

**Steps**:
1. Log in as **User A** (admin)
2. Click **"Create Room"** button in sidebar
3. Fill in:
   - Room Name: "Team Alpha Private"
   - Description: "Private team collaboration space"
   - Privacy: Select **"Private"** (radio button)
4. Click **"Create Room"**

**Expected Results**:
- ✅ Room created successfully
- ✅ Room appears in User A's sidebar
- ✅ Room info panel shows 8-character invite code (e.g., "ABC123XY")
- ✅ "Copy Invite Code" button visible
- ✅ Toast notification: "Room created successfully"
- ✅ User A is automatically added as admin and member

**Firestore Verification**:
```javascript
// Check rooms collection
{
  id: "roomId123",
  name: "Team Alpha Private",
  description: "Private team collaboration space",
  isPrivate: true,
  inviteCode: "ABC123XY",
  members: ["userA_uid"],
  admins: ["userA_uid"],
  createdBy: "userA_uid",
  createdAt: Timestamp
}
```

---

### ✅ Scenario 2: Create Public Room

**Objective**: Verify public room creation (auto-join with code, no approval needed)

**Steps**:
1. Log in as **User A**
2. Click **"Create Room"** button
3. Fill in:
   - Room Name: "General Discussion"
   - Description: "Open to everyone"
   - Privacy: Select **"Public"** (radio button)
4. Click **"Create Room"**

**Expected Results**:
- ✅ Room created successfully
- ✅ Info box shows: "Anyone with invite code can join immediately without approval"
- ✅ Invite code generated (8 characters)
- ✅ Room is public (`isPrivate: false`)

---

### ✅ Scenario 3: Copy Invite Code

**Objective**: Verify invite code can be copied to clipboard

**Steps**:
1. User A opens room "Team Alpha Private"
2. Click **"Copy Invite Code"** button (clipboard icon)

**Expected Results**:
- ✅ Toast notification: "Invite code copied to clipboard!"
- ✅ Code is copied (test by pasting in notepad: should show "ABC123XY")
- ✅ Button shows visual feedback (no errors)

---

### ✅ Scenario 4: Join Private Room with Invite Code (Join Request Flow)

**Objective**: Verify non-member can request to join private room using invite code

**Steps**:
1. Log out User A
2. Sign up/login as **User B** (new user)
3. Click **"Join Room"** button in sidebar
4. Stay on **"Invite Code"** tab
5. Enter invite code: "ABC123XY" (from Scenario 1)
6. Click **"Join Room"** button

**Expected Results**:
- ✅ Input auto-capitalizes letters
- ✅ Toast notification: "Join request sent! Waiting for admin approval."
- ✅ Modal closes automatically
- ✅ Room does NOT appear in User B's sidebar yet (pending approval)

**Firestore Verification**:
```javascript
// Check rooms/roomId123/joinRequests collection
{
  id: "requestId456",
  userId: "userB_uid",
  userName: "User B",
  userAvatar: "https://...",
  status: "pending",
  createdAt: Timestamp
}
```

---

### ✅ Scenario 5: Admin Receives Join Request Notification

**Objective**: Verify admin can see pending join requests

**Steps**:
1. Log out User B
2. Log back in as **User A** (admin)
3. Open room "Team Alpha Private"
4. Look for **"Join Requests"** button in header (user icon with badge)
5. Click **"Join Requests"** button

**Expected Results**:
- ✅ "Join Requests" button visible (only for admins)
- ✅ Badge shows number of pending requests (e.g., "1")
- ✅ Modal opens showing join request:
  - User B's avatar
  - User B's name
  - Timestamp: "2 minutes ago"
  - Green "Approve" button
  - Red "Reject" button

---

### ✅ Scenario 6: Admin Approves Join Request

**Objective**: Verify admin can approve join request and user gains access

**Steps**:
1. User A (admin) in "Join Requests" modal
2. Click **"Approve"** button (green) for User B's request

**Expected Results**:
- ✅ Toast notification: "User approved successfully"
- ✅ Request disappears from pending list
- ✅ User B added to room's `members` array in Firestore
- ✅ Modal shows "No pending requests" (empty state)

**Firestore Verification**:
```javascript
// Check rooms/roomId123
{
  members: ["userA_uid", "userB_uid"], // User B added
  admins: ["userA_uid"]
}

// Check joinRequests/requestId456
{
  status: "approved" // Changed from "pending"
}
```

**User B Verification**:
1. Log in as User B
2. Check sidebar
3. **Expected**: Room "Team Alpha Private" now appears in User B's rooms list
4. Click room → User B can now send messages

---

### ✅ Scenario 7: Admin Rejects Join Request

**Objective**: Verify admin can reject join request

**Setup**:
1. User C requests to join "Team Alpha Private" (repeat Scenario 4)

**Steps**:
1. User A (admin) opens "Join Requests" modal
2. Click **"Reject"** button (red) for User C's request

**Expected Results**:
- ✅ Toast notification: "User rejected"
- ✅ Request disappears from pending list
- ✅ Request status changed to "rejected" in Firestore
- ✅ User C does NOT appear in members array
- ✅ User C cannot see or access room

---

### ✅ Scenario 8: Join Public Room (Auto-Join, No Approval)

**Objective**: Verify users can join public rooms immediately without admin approval

**Setup**:
1. User A has public room "General Discussion" (from Scenario 2)
2. Copy invite code (e.g., "XYZ789AB")

**Steps**:
1. Log in as **User D** (new user)
2. Click **"Join Room"** button
3. Enter invite code: "XYZ789AB"
4. Click **"Join Room"** button

**Expected Results**:
- ✅ Toast notification: "Successfully joined the room!"
- ✅ Modal closes
- ✅ Room **immediately** appears in User D's sidebar
- ✅ User D added directly to `members` array (no join request created)
- ✅ User D can send messages right away
- ✅ NO admin approval needed

**Firestore Verification**:
```javascript
// Check rooms/publicRoomId
{
  isPrivate: false,
  members: ["userA_uid", "userD_uid"] // User D added directly
}

// Check joinRequests collection
// Should be empty (no request created for public rooms)
```

---

### ✅ Scenario 9: Search Rooms by Name

**Objective**: Verify users can search for rooms and copy invite codes

**Steps**:
1. Log in as **User E** (new user)
2. Click **"Join Room"** button
3. Switch to **"Search Rooms"** tab
4. Type in search: "Team"
5. Wait for results to load

**Expected Results**:
- ✅ Search results show matching rooms:
  - "Team Alpha Private" (lock icon, "2 members")
  - Any other rooms with "Team" in name/description
- ✅ Each room card shows:
  - Room name (bold)
  - Description
  - Privacy indicator: 🔒 (private) or 🌐 (public)
  - Member count: "X members"
  - "Use Code" button

---

### ✅ Scenario 10: Use Code from Search Results

**Objective**: Verify "Use Code" button copies invite code to Invite Code tab

**Steps**:
1. User E in "Search Rooms" tab
2. Search results showing "Team Alpha Private"
3. Click **"Use Code"** button on that room card

**Expected Results**:
- ✅ Modal automatically switches to **"Invite Code"** tab
- ✅ Invite code input field auto-filled with code (e.g., "ABC123XY")
- ✅ User can now click "Join Room" to send request
- ✅ Seamless workflow: Search → Use Code → Join

---

### ✅ Scenario 11: Member-Only Room Visibility

**Objective**: Verify users only see rooms they are members of in sidebar

**Setup**:
- User A: Member of "Team Alpha Private" and "General Discussion"
- User B: Member of "Team Alpha Private" only (approved in Scenario 6)
- User E: Not a member of any room

**Steps**:
1. Log in as User A → Check sidebar
2. Log in as User B → Check sidebar
3. Log in as User E → Check sidebar

**Expected Results**:

**User A's Sidebar**:
- ✅ Shows: "Team Alpha Private"
- ✅ Shows: "General Discussion"
- ✅ Total: 2 rooms

**User B's Sidebar**:
- ✅ Shows: "Team Alpha Private"
- ✅ Does NOT show: "General Discussion" (not a member)
- ✅ Total: 1 room

**User E's Sidebar**:
- ✅ Shows: Empty state "No chat rooms yet"
- ✅ Does NOT show any rooms (not a member of any)
- ✅ Total: 0 rooms

---

### ✅ Scenario 12: Non-Member Cannot Access Room Messages

**Objective**: Verify Firestore security rules prevent unauthorized access

**Steps**:
1. Log in as **User F** (new user, not a member)
2. Manually try to access room via URL or direct Firestore query
3. Attempt to read messages from "Team Alpha Private"

**Expected Results**:
- ✅ Firestore query fails with: "Missing or insufficient permissions"
- ✅ User F cannot see room in sidebar
- ✅ User F cannot read messages
- ✅ Security rules block access (even if trying to bypass UI)

---

### ✅ Scenario 13: Non-Admin Cannot See Join Requests Button

**Objective**: Verify join requests button only visible to admins

**Setup**:
- User B is a member but NOT an admin of "Team Alpha Private"

**Steps**:
1. Log in as User B
2. Open "Team Alpha Private" room
3. Look for "Join Requests" button in header

**Expected Results**:
- ✅ "Join Requests" button is NOT visible
- ✅ Only admins see this button
- ✅ User B can send messages normally
- ✅ User B can see invite code in room info

---

### ✅ Scenario 14: Invalid Invite Code Handling

**Objective**: Verify error handling for incorrect invite codes

**Steps**:
1. Log in as User G
2. Click "Join Room" button
3. Enter invalid code: "INVALID1"
4. Click "Join Room"

**Expected Results**:
- ✅ Toast error: "Room not found with this invite code"
- ✅ Modal remains open (user can retry)
- ✅ No crash or unexpected behavior

---

### ✅ Scenario 15: Empty Search Results

**Objective**: Verify UI when no rooms match search query

**Steps**:
1. User in "Search Rooms" tab
2. Type: "NonexistentRoom123"
3. Wait for results

**Expected Results**:
- ✅ Shows empty state: "No rooms found"
- ✅ Message: "Try searching with different keywords"
- ✅ No error or crash

---

### ✅ Scenario 16: Real-Time Join Request Updates

**Objective**: Verify admin sees join requests in real-time without refresh

**Setup**:
1. User A (admin) has "Join Requests" modal open
2. User H sends a join request from another device/browser

**Steps**:
1. User A keeps modal open
2. User H (another browser) requests to join
3. Observe User A's modal

**Expected Results**:
- ✅ User H's request appears **instantly** in User A's modal
- ✅ No page refresh needed
- ✅ Real-time listener working
- ✅ Request shows correct user info and timestamp

---

### ✅ Scenario 17: Multiple Join Requests

**Objective**: Verify admin can manage multiple pending requests

**Setup**:
1. User I, User J, User K all request to join "Team Alpha Private"

**Steps**:
1. User A (admin) opens "Join Requests" modal
2. See 3 pending requests
3. Approve User I
4. Reject User J
5. Approve User K

**Expected Results**:
- ✅ All 3 requests visible in list
- ✅ Each request shows correct user info
- ✅ Can approve/reject individually
- ✅ Requests update in real-time as processed
- ✅ User I and K added to members
- ✅ User J not added to members

---

### ✅ Scenario 18: Logout and Room Persistence

**Objective**: Verify rooms persist after logout/login

**Steps**:
1. User B (member of "Team Alpha Private") logs out
2. Close browser (clear session)
3. Open browser again
4. Log in as User B

**Expected Results**:
- ✅ Room "Team Alpha Private" still in sidebar
- ✅ Previous messages still visible
- ✅ User's membership persisted
- ✅ Can send messages immediately

---

## 🔧 Debugging Common Issues

### Issue 1: "Room not found" Error
**Symptoms**: User enters valid invite code but gets error

**Check**:
1. Is the invite code exactly 8 characters?
2. Is the room document in Firestore?
3. Is `inviteCode` field set correctly?
4. Check browser console for Firestore errors

**Solution**: Verify room creation completed successfully

---

### Issue 2: Join Requests Not Showing
**Symptoms**: Admin doesn't see pending requests

**Check**:
1. Is user actually an admin? (`admins` array in Firestore)
2. Is request status "pending"?
3. Is real-time listener connected?
4. Check browser console for errors

**Solution**: Verify Firestore security rules allow admin to read join requests

---

### Issue 3: Room Not in Sidebar After Approval
**Symptoms**: User B approved but room doesn't show

**Check**:
1. Was User B actually added to `members` array?
2. Does User B need to refresh?
3. Is real-time listener working?
4. Check Firestore security rules

**Solution**: 
```javascript
// Verify in Firestore Console
rooms/roomId123/members: ["userA_uid", "userB_uid"]
```

---

### Issue 4: Cannot Send Messages After Joining
**Symptoms**: User joined room but "Permission denied" on message send

**Check**:
1. Is user in `members` array?
2. Are Firestore security rules correctly set?
3. Is user authenticated?

**Solution**: Apply security rules from PRIVACY_SYSTEM_FIRESTORE_RULES.md

---

### Issue 5: Search Returns No Results
**Symptoms**: Search query returns empty even though rooms exist

**Check**:
1. Are room names/descriptions set?
2. Is search term correct (case-insensitive)?
3. Check browser console for query errors
4. Verify Firestore index for search queries

**Solution**: Ensure rooms have `name` and `description` fields

---

## 📊 Test Checklist

### Core Privacy Features
- [ ] Create private room with invite code
- [ ] Create public room with invite code
- [ ] Copy invite code to clipboard
- [ ] Join private room (creates join request)
- [ ] Join public room (auto-join)
- [ ] Admin approves join request
- [ ] Admin rejects join request
- [ ] Search rooms by name
- [ ] Use code from search results

### Security & Permissions
- [ ] Non-members cannot see rooms in sidebar
- [ ] Non-members cannot access room messages
- [ ] Non-admins cannot see join requests button
- [ ] Non-admins cannot approve/reject requests
- [ ] Invalid invite codes show error
- [ ] Firestore security rules enforce member-only access

### Real-Time Features
- [ ] Join requests appear instantly for admins
- [ ] Approved users see room in sidebar immediately
- [ ] Multiple join requests handled correctly
- [ ] Typing indicators work for members
- [ ] Active users update in real-time

### User Experience
- [ ] Empty states display correctly
- [ ] Loading states show while fetching
- [ ] Toast notifications for all actions
- [ ] Modal close after successful actions
- [ ] Invite code input auto-capitalizes
- [ ] Search results show room details (privacy, member count)

### Data Persistence
- [ ] Rooms persist after logout/login
- [ ] Memberships persist across sessions
- [ ] Join request status persists
- [ ] Admin roles persist

---

## 🚀 Quick Test Script

Run this sequence for a complete end-to-end test (15 minutes):

1. **Setup** (2 min):
   - Create 2 test accounts: Admin (User A), Member (User B)

2. **Room Creation** (3 min):
   - User A creates private room "Test Private"
   - User A creates public room "Test Public"
   - Copy both invite codes

3. **Join Private Room** (3 min):
   - User B uses invite code for "Test Private"
   - Verify join request appears for User A
   - User A approves request
   - Verify User B can access room

4. **Join Public Room** (2 min):
   - User B uses invite code for "Test Public"
   - Verify instant access (no approval needed)

5. **Search & Use Code** (2 min):
   - Create User C
   - Search for "Test"
   - Click "Use Code" for "Test Private"
   - Send join request

6. **Security Check** (3 min):
   - Create User D (no memberships)
   - Verify empty sidebar
   - Verify cannot access rooms via URL
   - Try invalid invite code

✅ **Pass Criteria**: All 6 tests complete without errors

---

## 📱 Mobile Testing

Test on mobile devices (responsive design):
- [ ] "Join Room" button works on mobile
- [ ] Modal displays correctly on small screens
- [ ] Tabs switch smoothly (Invite Code / Search)
- [ ] Search input works with mobile keyboard
- [ ] Approve/Reject buttons easy to tap
- [ ] Toast notifications visible

---

## 🔒 Security Rules Testing

After applying Firestore rules from PRIVACY_SYSTEM_FIRESTORE_RULES.md:

### Test 1: Member-Only Read Access
```javascript
// Should succeed (user is member)
const roomRef = doc(db, 'rooms', 'roomId')
await getDoc(roomRef) // ✅ Success

// Should fail (user not member)
// User logs out, tries to access
await getDoc(roomRef) // ❌ Permission denied
```

### Test 2: Admin-Only Approve
```javascript
// Should succeed (user is admin)
await approveJoinRequest(roomId, requestId, userId) // ✅ Success

// Should fail (user not admin)
// User B tries to approve
await approveJoinRequest(roomId, requestId, userId) // ❌ Permission denied
```

---

## ✅ Success Criteria

**Privacy System is WORKING if**:
✅ Users only see rooms they're members of
✅ Invite codes required to discover rooms
✅ Private rooms require admin approval
✅ Public rooms allow instant joining
✅ Admins can manage join requests
✅ Search functionality works
✅ Real-time updates working
✅ Security rules enforce permissions

---

## 📞 Support

If tests fail, check:
1. **PRIVACY_SYSTEM_FIRESTORE_RULES.md** - Are rules applied?
2. **Firebase Console** - Any errors in Firestore logs?
3. **Browser Console** - Any JavaScript errors?
4. **Network Tab** - Are Firestore queries succeeding?

---

✅ **Testing Complete**: Privacy system fully functional and secure! 🎉
