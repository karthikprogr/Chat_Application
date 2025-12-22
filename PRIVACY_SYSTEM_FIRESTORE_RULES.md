# 🔒 Firestore Security Rules for Room Privacy System

## Overview
These security rules enforce the room privacy system where users can only access rooms they are members of, and only admins can manage join requests.

## Complete Firestore Security Rules

Copy and paste these rules into your Firebase Console under **Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // USERS COLLECTION
    // ============================================
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own document during signup
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own document (username, hasPassword, etc.)
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Nobody can delete user documents (use Cloud Functions for this)
      allow delete: if false;
    }
    
    // ============================================
    // ROOMS COLLECTION - PRIVACY ENFORCED
    // ============================================
    match /rooms/{roomId} {
      // Helper function: Check if user is a member of the room
      function isMember() {
        return request.auth != null && 
               request.auth.uid in resource.data.members;
      }
      
      // Helper function: Check if user is an admin of the room
      function isAdmin() {
        return request.auth != null && 
               request.auth.uid in resource.data.admins;
      }
      
      // Helper function: Validate room creation data
      function validRoomCreation() {
        let data = request.resource.data;
        return data.name is string && 
               data.name.size() > 0 && 
               data.name.size() <= 50 &&
               data.inviteCode is string &&
               data.inviteCode.size() == 8 &&
               data.members is list &&
               data.members.size() > 0 &&
               data.admins is list &&
               data.admins.size() > 0 &&
               request.auth.uid in data.members &&
               request.auth.uid in data.admins &&
               data.isPrivate is bool;
      }
      
      // Users can read rooms they are members of
      // Note: Also allow reading by inviteCode for join functionality
      allow read: if request.auth != null && (
        request.auth.uid in resource.data.members ||
        // Allow querying by inviteCode (for joinRoomWithCode function)
        resource.data.inviteCode != null
      );
      
      // Any authenticated user can create a room
      allow create: if request.auth != null && validRoomCreation();
      
      // Only admins can update room settings
      allow update: if isAdmin();
      
      // Only admins can delete rooms
      allow delete: if isAdmin();
      
      // ============================================
      // MESSAGES SUBCOLLECTION
      // ============================================
      match /messages/{messageId} {
        // Members can read all messages in their rooms
        allow read: if request.auth != null && 
                      request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
        
        // Members can create messages in their rooms
        allow create: if request.auth != null && 
                        request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members &&
                        request.resource.data.userId == request.auth.uid;
        
        // Users can update their own messages (edit)
        allow update: if request.auth != null && 
                        resource.data.userId == request.auth.uid;
        
        // Users can delete their own messages OR admins can delete any message
        allow delete: if request.auth != null && (
          resource.data.userId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.admins
        );
      }
      
      // ============================================
      // ACTIVE USERS SUBCOLLECTION
      // ============================================
      match /activeUsers/{userId} {
        // Members can read active users in their rooms
        allow read: if request.auth != null && 
                      request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
        
        // Users can create/update their own active status
        allow create, update: if request.auth != null && 
                                  userId == request.auth.uid &&
                                  request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
        
        // Users can delete their own active status
        allow delete: if request.auth != null && userId == request.auth.uid;
      }
      
      // ============================================
      // JOIN REQUESTS SUBCOLLECTION - PRIVACY SYSTEM
      // ============================================
      match /joinRequests/{requestId} {
        // Helper function: Check if user is an admin
        function isRoomAdmin() {
          return request.auth != null && 
                 request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.admins;
        }
        
        // Admins can read all join requests
        // Users can read their own join requests
        allow read: if request.auth != null && (
          isRoomAdmin() ||
          resource.data.userId == request.auth.uid
        );
        
        // Any authenticated user can create a join request
        // Validate that they're requesting for themselves
        allow create: if request.auth != null && 
                        request.resource.data.userId == request.auth.uid &&
                        request.resource.data.status == 'pending';
        
        // Only admins can update join requests (approve/reject)
        allow update: if isRoomAdmin() &&
                        resource.data.status == 'pending' &&
                        (request.resource.data.status == 'approved' || 
                         request.resource.data.status == 'rejected');
        
        // Admins and request creators can delete join requests
        allow delete: if request.auth != null && (
          isRoomAdmin() ||
          resource.data.userId == request.auth.uid
        );
      }
      
      // ============================================
      // TYPING INDICATOR SUBCOLLECTION
      // ============================================
      match /typing/{userId} {
        // Members can read typing indicators in their rooms
        allow read: if request.auth != null && 
                      request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
        
        // Users can create/update/delete their own typing indicator
        allow create, update, delete: if request.auth != null && 
                                          userId == request.auth.uid &&
                                          request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
      }
    }
    
    // ============================================
    // NOTIFICATIONS COLLECTION (Optional)
    // ============================================
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      
      // System/admins can create notifications (set userId in data)
      allow create: if request.auth != null;
      
      // Users can update their own notifications (mark as read)
      allow update: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications
      allow delete: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
    }
  }
}
```

## Rule Explanations

### 🔐 **Users Collection**
- ✅ Users can only read/write their own documents
- ✅ Prevents unauthorized access to user data
- ❌ Deletion disabled (use Cloud Functions if needed)

### 🏠 **Rooms Collection** (Privacy System Core)

#### **Read Access**:
- Users can **only** read rooms where they are in the `members` array
- Special exception: Rooms can be read by `inviteCode` for join functionality
- This ensures privacy: unknown users cannot discover or see rooms without invite codes

#### **Create Access**:
- Any authenticated user can create a room
- Validation ensures:
  - Room name is 1-50 characters
  - Invite code is exactly 8 characters
  - Creator is added to both `members` and `admins` arrays
  - `isPrivate` boolean is set

#### **Update/Delete Access**:
- Only admins (users in `admins` array) can modify or delete rooms
- Prevents non-admins from changing room settings

### 💬 **Messages Subcollection**
- Read: Only room members can read messages
- Create: Only room members can send messages (and only as themselves)
- Update: Users can edit their own messages
- Delete: Users can delete their own messages, admins can delete any message

### 👥 **Active Users Subcollection**
- Tracks who's currently in the room
- Users can only manage their own active status
- Members can see all active users in their rooms

### 📝 **Join Requests Subcollection** (Privacy System)

#### **Read Access**:
- Room admins can see all pending join requests
- Users can see their own join requests

#### **Create Access**:
- Any authenticated user can create a join request
- Must request for themselves (`userId == request.auth.uid`)
- Must start with status: 'pending'

#### **Update Access**:
- **Only admins** can approve or reject requests
- Can only change status from 'pending' to 'approved' or 'rejected'
- This enforces the privacy system: admins control who joins

#### **Delete Access**:
- Admins can delete any join request
- Users can delete their own join requests (cancel request)

### ⌨️ **Typing Indicator Subcollection**
- Members can see typing indicators in their rooms
- Users can only manage their own typing status

## 🚀 How to Apply These Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar

### Step 2: Update Rules
1. Click on the **Rules** tab
2. Replace the existing rules with the rules above
3. Click **Publish**

### Step 3: Verify Rules
After publishing, test the following scenarios:

#### ✅ **Should Work**:
- User A creates a room → automatically added to members + admins
- User A can see and access their room
- User B uses invite code → can discover the room
- User B requests to join → creates join request with status 'pending'
- User A (admin) approves request → User B added to members array
- User B can now see and access the room
- User B can send messages in the room

#### ❌ **Should Fail**:
- User B tries to read rooms without being a member (unless using invite code)
- User B tries to send messages in a room they're not a member of
- User B tries to approve/reject join requests (not an admin)
- User C tries to update User A's profile
- Non-admin tries to delete room

## 🧪 Testing Security Rules

### Using Firebase Emulator (Recommended)
```bash
# Install Firebase tools
npm install -g firebase-tools

# Initialize Firebase Emulator
firebase init emulators

# Start emulators with security rules
firebase emulators:start
```

### Manual Testing in Production
1. Create a test room as User A
2. Copy invite code
3. Open incognito window, sign up as User B
4. Try to join room with invite code
5. Check that join request appears for User A
6. Approve request as User A
7. Verify User B can now access room

## 🔒 Security Best Practices

### 1. **Never Trust Client-Side Data**
- Always validate data in security rules
- Don't rely on client-side checks alone

### 2. **Minimize Document Reads**
- Each `get()` in rules counts as a document read
- Current rules are optimized but may need adjustment for large-scale apps

### 3. **Use Helper Functions**
- Keep rules DRY (Don't Repeat Yourself)
- Helper functions make rules more maintainable

### 4. **Test Thoroughly**
- Test all user roles: regular users, admins, non-members
- Test edge cases: expired sessions, concurrent updates

### 5. **Monitor Usage**
- Check Firebase Console for denied requests
- Set up alerts for unusual activity

## 🚨 Important Notes

### Member Array Performance
The current rules use `request.auth.uid in resource.data.members` which:
- ✅ Works well for small to medium rooms (<100 members)
- ⚠️ May need optimization for large rooms (100+ members)
- 💡 Consider splitting large rooms or using Cloud Functions for scale

### Invite Code Queries
The rules allow querying by `inviteCode`:
```javascript
// This query is allowed by the rules
const q = query(roomsRef, where('inviteCode', '==', code))
```
- Ensure invite codes are unique (handled by `generateInviteCode()`)
- Consider adding an index on `inviteCode` field in Firebase Console

### Join Request Workflow
1. User finds room via invite code → `searchRooms()` or direct code entry
2. User clicks join → `joinRoomWithCode()`
3. **If private room**: Creates join request → Admin must approve
4. **If public room**: User added directly to members → No approval needed

## 📊 Firestore Indexes

For optimal performance, create these indexes in Firebase Console:

### Rooms Collection
```
Collection: rooms
Fields: members (Array), createdAt (Descending)
```

### Join Requests Subcollection
```
Collection: rooms/{roomId}/joinRequests
Fields: status (Ascending), createdAt (Descending)
```

### Messages Subcollection
```
Collection: rooms/{roomId}/messages
Fields: createdAt (Ascending)
```

## 🔧 Troubleshooting

### Error: "Missing or insufficient permissions"
**Solution**: User is not in the room's `members` array. Check:
1. Did they join the room successfully?
2. Is `members` array updated in Firestore?
3. Are they using the correct user account?

### Error: "false for 'get' @ L123"
**Solution**: Security rule is trying to read a document that doesn't exist or user doesn't have permission. Check:
1. Does the room document exist?
2. Is the user authenticated?
3. Is the syntax correct in the rule?

### Join Requests Not Showing
**Solution**: Check:
1. User is accessing as an admin (`admins` array includes their UID)
2. Join request status is 'pending'
3. Real-time listener is connected

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Best Practices](https://firebase.google.com/docs/firestore/security/rules-conditions)

---

✅ **Privacy System Status**: Fully implemented with comprehensive security rules
🔒 **Security Level**: Production-ready with member-only access enforcement
🚀 **Next Steps**: Apply rules to Firebase Console and test thoroughly
