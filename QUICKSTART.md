# 🚀 QUICK START GUIDE

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase

**a) Create Firebase Project:**
- Go to: https://console.firebase.google.com/
- Click "Add project"
- Name it: "chatapp-yourname"
- Click "Create project"

**b) Enable Authentication:**
- Click "Authentication" → "Get Started"
- Enable "Email/Password" ✅
- Enable "Google" ✅ (add your email as support email)

**c) Create Firestore Database:**
- Click "Firestore Database" → "Create database"
- Choose "Start in test mode"
- Select your region
- Click "Enable"

**d) Get Your Config:**
- Click ⚙️ (Settings) → "Project settings"
- Scroll down to "Your apps"
- Click Web icon `</>`
- Register app: name it "ChatApp"
- Copy the config values

### 3. Configure Environment

Create `.env` file (copy from `.env.example`):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Add Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /rooms/{roomId} {
      allow read, create, update: if request.auth != null;
      
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null 
                      && request.resource.data.userId == request.auth.uid;
      }
    }
  }
}
```

Click "Publish"

### 5. Run the App

```bash
npm run dev
```

Open: http://localhost:3000

---

## First Time Usage

1. **Sign Up**: Click "Sign up for free"
2. **Create Account**: Enter name, email, password
3. **Create Room**: Click "Create New Room"
4. **Start Chatting**: Send your first message!

---

## Troubleshooting

### "Firebase config is missing"
→ Check your `.env` file exists and has all variables

### "Permission denied" errors
→ Make sure you published the Firestore security rules

### "Port 3000 already in use"
→ Change port in `vite.config.js` or kill the process

### Can't login after signup
→ Check Firebase Console → Authentication to verify user was created

---

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
firebase deploy
```

---

## Project Structure

```
src/
├── components/       # UI components
├── context/         # State management
├── firebase/        # Firebase config
├── pages/           # Main pages
├── utils/           # Helper functions
└── App.jsx          # Root component
```

---

## Need Help?

1. Check README.md for detailed documentation
2. Review Firebase Console for any errors
3. Check browser console for error messages
4. Verify all environment variables are set

---

**You're all set! Start building! 🎉**
