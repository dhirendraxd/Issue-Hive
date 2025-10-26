IssueHive — student issues and support
=====================================

IssueHive is a simple, mobile‑friendly app where students can:

- Submit issues with title, description, category, and optional attachment URL
- View all issues in a clean, card‑based feed
- Support issues with upvotes
- Track status from Received → In Progress → Resolved

This repository currently uses localStorage for persistence and React Query for client data flows. No backend is configured.

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

