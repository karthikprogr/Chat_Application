# Firebase Security Rules

## Firestore Security Rules

Copy and paste these rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is owner
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if isAuthenticated();
      
      // Users can only write their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Prevent deletion
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      // Any authenticated user can read rooms
      allow read: if isAuthenticated();
      
      // Any authenticated user can create rooms
      allow create: if isAuthenticated() 
                    && request.resource.data.createdBy == request.auth.uid
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 50;
      
      // Only room creator can update room details
      allow update: if isAuthenticated() 
                    && (resource.data.createdBy == request.auth.uid 
                        || request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['lastMessage', 'lastMessageAt', 'lastMessageBy']));
      
      // No one can delete rooms
      allow delete: if false;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Any authenticated user can read messages
        allow read: if isAuthenticated();
        
        // Users can create messages with their own userId
        allow create: if isAuthenticated() 
                      && request.resource.data.userId == request.auth.uid
                      && request.resource.data.text is string
                      && request.resource.data.text.size() > 0
                      && request.resource.data.text.size() <= 5000
                      && request.resource.data.userName is string
                      && request.resource.data.createdAt == request.time;
        
        // No one can update or delete messages (can be modified later)
        allow update: if false;
        allow delete: if false;
      }
      
      // Typing indicators subcollection
      match /typing/{userId} {
        // Anyone can read typing status
        allow read: if isAuthenticated();
        
        // Users can only update their own typing status
        allow write: if isAuthenticated() && isOwner(userId);
      }
    }
  }
}
```

## Storage Rules (If you add file uploads later)

Copy and paste these rules in Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User avatars
    match /avatars/{userId}/{fileName} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      
      // Allow upload only for own avatar
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Chat attachments
    match /chat_files/{roomId}/{fileName} {
      // Allow read for authenticated users
      allow read: if request.auth != null;
      
      // Allow upload with size limit
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                   && (request.resource.contentType.matches('image/.*')
                       || request.resource.contentType.matches('video/.*')
                       || request.resource.contentType.matches('application/pdf'));
    }
  }
}
```

## How to Apply These Rules

### For Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left menu
4. Click on the **Rules** tab
5. Delete existing rules
6. Copy and paste the Firestore rules above
7. Click **Publish**

### For Storage:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Storage** in the left menu
4. Click on the **Rules** tab
5. Copy and paste the Storage rules above
6. Click **Publish**

## Security Best Practices

### 1. Never Trust Client Data
- Always validate on server side (Firestore rules)
- Check user authentication
- Verify user permissions

### 2. Principle of Least Privilege
- Users can only access what they need
- No one can delete critical data
- Messages can only be created by their author

### 3. Input Validation
- Message length limits (5000 chars)
- Room name limits (50 chars)
- File size limits (5-10MB)
- Content type restrictions

### 4. Audit and Monitor
- Check Firestore usage in Firebase Console
- Monitor failed authentication attempts
- Review security rule logs

## Testing Security Rules

### Test in Firebase Console:

1. Go to Firestore Database → Rules
2. Click **Rules Playground**
3. Test different scenarios:

```
Location: /rooms/test-room-id/messages/test-message-id
Operation: get
Authentication: Authenticated user with uid: test-user-123
Result: Should be allowed
```

### Test in Your App:

```javascript
// This should fail (trying to write with wrong userId)
await addDoc(collection(db, 'rooms', roomId, 'messages'), {
  text: 'Test',
  userId: 'someone-else-uid', // ❌ Will fail
  userName: 'Test',
  createdAt: serverTimestamp()
})

// This should succeed (correct userId)
await addDoc(collection(db, 'rooms', roomId, 'messages'), {
  text: 'Test',
  userId: currentUser.uid, // ✅ Will succeed
  userName: currentUser.displayName,
  createdAt: serverTimestamp()
})
```

## Common Security Issues to Avoid

### ❌ DON'T DO THIS:
```javascript
// This allows anyone to read/write everything
match /{document=**} {
  allow read, write: if true;
}
```

### ✅ DO THIS:
```javascript
// This properly restricts access
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}
```

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Security Rules Simulator](https://firebase.google.com/docs/rules/simulator)

---

**Always test your security rules thoroughly before deploying to production!**
