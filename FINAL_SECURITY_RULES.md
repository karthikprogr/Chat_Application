# 🔐 Final Firebase Security Rules - Complete Fix

## Copy This Exact Code to Firebase Console

Go to [Firebase Console](https://console.firebase.google.com/) → Firestore Database → Rules and paste this:

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
                               .hasOnly(['members', 'admins', 'memberCount', 'adminOnlyChat', 'lastMessage', 'lastMessageAt', 'lastMessageBy', 'lastSeen']))
                        // Anyone can join PUBLIC rooms (members + memberCount + lastSeen)
                        || (!resource.data.isPrivate 
                            && !(request.auth.uid in resource.data.members)
                            && request.resource.data.members.hasAll(resource.data.members.concat([request.auth.uid]))
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'memberCount', 'lastSeen']))
                        // Members can remove themselves (leave room)
                        || (request.auth.uid in resource.data.members 
                            && !request.resource.data.members.hasAll([request.auth.uid])
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'admins', 'memberCount']))
                        // Anyone can update last message fields
                        || request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['lastMessage', 'lastMessageAt', 'lastMessageBy'])
                        // Members can update their own lastSeen timestamp only
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

## 🔑 Key Fix (Line 48-51)

**Changed:**
```javascript
.hasOnly(['members', 'memberCount'])
```

**To:**
```javascript
.hasOnly(['members', 'memberCount', 'lastSeen'])
```

This allows users to join public rooms AND set their lastSeen timestamp in a single operation.

---

## ✅ Apply This Now

1. Go to Firebase Console
2. Firestore Database → Rules
3. **Replace everything** with the code above
4. Click **Publish**
5. Test joining public rooms - should work immediately!
