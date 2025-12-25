# 🔥 Update Firebase Security Rules - IMPORTANT

## Issue Fixed
Non-admin users were unable to leave rooms because Firestore security rules were blocking the update.

## Action Required
You need to update your Firestore Security Rules in the Firebase Console.

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chatapp-karthik-bb40a**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. **Replace the entire rules** with the code below
6. Click **Publish**

### Updated Security Rules:

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
                        // Members can remove themselves (leave room)
                        || (request.auth.uid in resource.data.members 
                            && !request.resource.data.members.hasAll([request.auth.uid])
                            && request.resource.data.diff(resource.data).affectedKeys()
                               .hasOnly(['members', 'admins', 'memberCount']))
                        // Anyone can update last message fields
                        || request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['lastMessage', 'lastMessageAt', 'lastMessageBy'])
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
    }
  }
}
```

## What Changed?

The `allow update` rule for rooms now includes:

1. **Room creator** - Can update anything
2. **Admins** - Can update members, admins, memberCount, adminOnlyChat, and message fields
3. **Members** - Can remove themselves from the room (leave room functionality)
4. **Anyone** - Can update last message fields

This allows non-admin users to successfully leave rooms by removing themselves from the `members` and `admins` arrays.

## Test After Update

1. Log in as a non-admin user
2. Join a room
3. Click the 3-dot menu → Leave Room
4. Confirm the action
5. You should see "Left room successfully" message

---

**Important:** After updating the rules, wait a few seconds for them to propagate, then test the leave room functionality.
