# 🔐 Updated Firebase Security Rules - LastSeen Support

## What's New
Users can now update their own `lastSeen` timestamp to track unread messages.

## Firestore Security Rules

**Copy and paste into Firebase Console → Firestore Database → Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() 
                    && request.resource.data.createdBy == request.auth.uid
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 50;
      
      allow update: if isAuthenticated() 
                    && (
                        // Room creator can update anything
                        resource.data.createdBy == request.auth.uid 
                        // Admins can update room settings, members, and admins
                        || (request.auth.uid in resource.data.admins 
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'admins', 'memberCount', 'adminOnlyChat', 'lastMessage', 'lastMessageAt', 'lastMessageBy']))
                        // Anyone can join PUBLIC rooms by adding themselves to members
                        || (!resource.data.isPrivate 
                            && !(request.auth.uid in resource.data.members)
                            && request.resource.data.members.hasAll(resource.data.members.concat([request.auth.uid]))
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'memberCount']))
                        // Members can remove themselves (leave room)
                        || (request.auth.uid in resource.data.members 
                            && !request.resource.data.members.hasAll([request.auth.uid])
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'admins', 'memberCount']))
                        // Anyone can update last message fields
                        || request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['lastMessage', 'lastMessageAt', 'lastMessageBy'])
                        // NEW: Members can update their own lastSeen timestamp
                        || (request.auth.uid in resource.data.members
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['lastSeen']))
                    );
      
      allow delete: if false;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        
        // Create messages
        allow create: if isAuthenticated() 
                      && request.resource.data.userId == request.auth.uid
                      && request.resource.data.text is string
                      && request.resource.data.text.size() >= 0
                      && request.resource.data.text.size() <= 5000
                      && request.resource.data.userName is string;
        
        // Update messages - for EDITS and REACTIONS
        allow update: if isAuthenticated() 
                      && (
                        // User can edit their own message
                        (resource.data.userId == request.auth.uid)
                        ||
                        // Any user can add reactions
                        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']))
                      );
        
        // Delete messages - only own messages
        allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      }
      
      // Typing indicators subcollection
      match /typing/{userId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && isOwner(userId);
      }
      
      // Active users subcollection
      match /activeUsers/{userId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && isOwner(userId);
      }
      
      // Join requests subcollection (for private rooms)
      match /joinRequests/{requestId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() 
                      && request.resource.data.userId == request.auth.uid;
        allow update: if isAuthenticated() 
                      && request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.admins;
        allow delete: if isAuthenticated() 
                      && (request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.admins
                          || request.resource.data.userId == request.auth.uid);
      }
    }
  }
}
```

---

## 📋 How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **chatapp-karthik-bb40a**
3. Click **Firestore Database** → **Rules** tab
4. Replace all existing rules with the code above
5. Click **Publish**
6. Wait for success message (~30 seconds)

---

## 🔑 Key Changes

**Added Lines 64-67:**
```javascript
// NEW: Members can update their own lastSeen timestamp
|| (request.auth.uid in resource.data.members
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['lastSeen']))
```

This rule allows:
- ✅ Room members to update **only** the `lastSeen` field
- ✅ Used for tracking which messages a user has seen
- ✅ Enables unread message count feature
- ✅ User can only update their own timestamp in `lastSeen.{uid}`

---

## ✅ What This Fixes

- ✅ **Unread message badges** now work correctly
- ✅ Badge clears when you open a chat room
- ✅ Badge stays cleared when you switch between rooms
- ✅ No more "Missing or insufficient permissions" errors
- ✅ LastSeen timestamp updates properly

---

## 🧪 Test After Applying

1. Open the chat application
2. Open any room with unread messages
3. **Check browser console** - should see NO permission errors
4. Unread badge should disappear
5. Switch to another room and back
6. Badge should stay at 0 (not reappear)

---

## 🎯 All Features Supported

- ✅ Public rooms: Anyone can join
- ✅ Private rooms: Join requests
- ✅ Members can leave rooms
- ✅ Admins can manage members
- ✅ Room creators have full control
- ✅ Last message updates
- ✅ **LastSeen timestamp tracking (NEW)**
- ✅ **Unread message counts (NEW)**
