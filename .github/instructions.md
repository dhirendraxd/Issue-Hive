# GitHub Copilot Chat Instructions for IssueHive Project

## Project Overview
- **Project Name:** IssueHive
- **Type:** College-focused issue submission and tracking platform
- **Tech Stack:** React + TypeScript (frontend), Firebase (backend planned later)
- **Purpose:** Allow students to submit issues/concerns, support issues, and track their status. Simple, user-friendly, and mobile-responsive MVP.
- **Scope for MVP:** 
  - Submit issues (title, description, category, optional image)
  - View issue feed with cards showing title, category, upvotes, and status
  - Upvote/support issues
  - Track status visually (Received → In Progress → Resolved)
  - Basic responsive navigation (Home, Submit Issue, My Issues, About)

## Coding & Style Preferences
- Use **React functional components** with **TypeScript**
- Use **props and state properly**, avoid unnecessary re-renders
- Keep code **modular**, reusable, and readable
- Follow **clean UI/UX principles** (minimalist, mobile-first, intuitive)
- Use **consistent naming conventions**:
  - Components: PascalCase (e.g., `IssueCard`)
  - Variables: camelCase (e.g., `issueList`)
- Use **CSS-in-JS or Tailwind** for styling if needed
- Include **comments for clarity** where logic is non-trivial

## Workflow & Guidance for Copilot
- Assume **frontend focus only** unless otherwise mentioned
- Generate **React/TS code for MVP components** only
- Include **basic form validation** and error handling
- Provide **default UI placeholders** (text, dummy images) where necessary
- Suggest **responsive design layouts** (cards, grids, navbars)
- Avoid backend logic; for now, assume **data will come from Firebase later**
- Give **short explanations** for non-obvious implementations
- Suggest **file/folder structure** for scalable frontend
- Offer **MVP-first solutions**; advanced features (analytics, notifications, discussions) can be suggested separately
- Prioritize **clarity, usability, and maintainability** over complex optimizations

## Example Components Copilot Should Know
- `App.tsx` → Main container, routing setup
- `Navbar.tsx` → Navigation bar
- `IssueForm.tsx` → Issue submission form
- `IssueCard.tsx` → Single issue display
- `IssueList.tsx` → Feed of all issues
- `FilterBar.tsx` → Filtering and sorting controls
- `StatusBadge.tsx` → Status indicator for issues

## Design & UX Notes
- Use **cards for issue feed** for readability
- Use **color-coded status badges**:
  - Received → Grey
  - In Progress → Yellow
  - Resolved → Green
- Provide **feedback messages** for actions (e.g., “Issue submitted successfully”)
- Prioritize **mobile-first design**
- Keep **forms simple and clean**, minimal fields

## Behavior & Interaction
- Upvote button increments count (frontend simulation only for now)
- Anonymous toggle for submissions (UI only)
- Status badges are **read-only** for students
- Filter/sort options should update the issue feed visually
- Navigation should allow switching between pages seamlessly

## Notes for Copilot Chat
- Respond as a **React/TS frontend assistant**
- Suggest **best practices** and **modern React patterns**
- Prefer **MVP-first solutions**, breaking tasks into small, implementable chunks
- Provide **explanations and comments** with each code snippet
- If suggesting advanced features, clearly mark them as **future/optional**

---

