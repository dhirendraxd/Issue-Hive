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

See [`docs/FIREBASE-README.md`](docs/FIREBASE-README.md) for setup instructions.

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
- React Query (client‑side cache)
- Firebase (optional backend - Auth, Firestore, Storage)

