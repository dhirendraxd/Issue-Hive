IssueHive — student issues and support
=====================================

IssueHive is a simple, mobile‑friendly app where students can:

- Submit issues with title, description, category, and optional attachment URL
- View all issues in a clean, card‑based feed
- Support issues with upvotes
- Track status from Received → In Progress → Resolved

This repository supports both **localStorage** (default) and **Firebase** (cloud backend) for data persistence.

🔥 **NEW: Firebase Backend Available!**

- Cloud-based data storage with Firestore
- User authentication (Email/Password + Google OAuth)
- File uploads with Firebase Storage
- Real-time capabilities ready to use

Firebase setup (dev)
--------------------

1. Enable providers

- Firebase Console → Build → Authentication → Sign-in method
	- Enable Email/Password
	- Enable Google

1. Authorized domains (fixes `auth/unauthorized-domain`)

- Firebase Console → Authentication → Settings → Authorized domains → Add:
	- `localhost`
	- `127.0.0.1`
	- Your LAN IP if you open the Network URL from Vite (e.g. `192.168.x.x`)
	- Any deployed domains (e.g. `your-app.vercel.app`)
	- Note: Ports don’t matter; only hostnames are checked.

1. Add env vars

- Copy `.env.example` to `.env.local` and fill with your Firebase Web App config.
- Restart `npm run dev` after editing.

1. Optional: use localhost only

- If you don’t want to add your LAN IP, open the Local URL (<http://localhost:8080> or <http://localhost:8081>) instead of the Network URL.

Run locally
-----------

```bash
npm install
npm run dev
```

Open <http://localhost:8080>.

Tech stack
----------

- Vite + React + TypeScript
- Tailwind + shadcn‑style components
- React Router
- React Query (client‑side cache with optimized defaults)
- Firebase (optional backend - Auth, Firestore, Storage)
- PWA support with offline capabilities

Security & Performance
---------------------

**Security features:**
- Content Security Policy (CSP) headers
- Environment variable validation
- Input sanitization for all user content
- Firestore security rules (owner-only updates/deletes)
- Rate limiting for API operations

**Performance optimizations:**
- Code splitting with React.lazy
- Manual chunk splitting for better caching
- React Query with 5min stale time
- Image optimization pipeline
- Production console.log stripping

**PWA features:**
- Offline support with service worker
- App manifest for installability
- Optimized for mobile devices

