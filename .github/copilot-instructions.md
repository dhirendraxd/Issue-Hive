<!--
  Purpose: Short, actionable instructions for AI coding agents working on this repo.
  Keep this file concise (20-50 lines). Only include discoverable patterns and concrete examples.
-->

# Copilot / AI agent instructions — issuehive

This repository is a Vite + React + TypeScript SPA scaffolded around the shadcn-style component set
and Tailwind. The app uses Supabase for backend services and React Query for client data flows.

Key points for quick edits and features
- Project root scripts: `npm run dev` (starts Vite dev server on port 8080), `npm run build`, `npm run preview`, `npm run lint`.
- Vite dev server is configured in `vite.config.ts` (host ::, port 8080). Use these scripts rather than assuming the default port.
- Path alias `@` -> `src` is configured in `tsconfig.json` and `vite.config.ts`. Import like: `import { cn } from "@/lib/utils"`.

Architecture & important locations
- UI components: `src/components/ui/*` — pre-built shadcn-style components. Add new components here following the existing naming and prop patterns.
- App entry: `src/main.tsx` and `src/App.tsx`.
- Pages: `src/pages/` contains route-level components (e.g. `Index.tsx`, `NotFound.tsx`).
- Utilities: `src/lib/utils.ts` contains the `cn` helper (twMerge+clsx) used across components.
- Hooks: `src/hooks/` contains app-specific React hooks (look for `use-` prefix conventions like `use-toast.ts`).
- Integrations: `src/integrations/supabase/` — generated supabase client and types. The client is used via:
  `import { supabase } from "@/integrations/supabase/client";` (the client file is auto-generated; don't edit it manually).
- Supabase config: `supabase/config.toml` (in-repo config for local supabase projects).

Conventions and patterns to follow (concrete)
- Components follow a small, consistent pattern: simple wrapper + props + Tailwind class merging via `cn`. Reuse `cn(...)` in new components.
- Keep UI code under `components/ui` and feature logic inside `src/pages` or `src/hooks` depending on scope.
- Use React Query (`@tanstack/react-query`) for client-side data caching where present; look for existing queries before adding duplicates.
- Linting uses ESLint (`npm run lint`). No test runner is configured in package.json — don't add tests without updating repo scripts.

Examples
- Importing utilities and integrations:
  - `import { cn } from "@/lib/utils"`
  - `import { supabase } from "@/integrations/supabase/client"`

Small warnings
- `src/integrations/supabase/client.ts` is generated (contains the Supabase URL/key for this project). Treat it as generated code and prefer changing the source generation step rather than editing it directly.
- The `lovable-tagger` plugin is enabled in dev mode in `vite.config.ts` — avoid changing component tagger setup unless debugging dev-only features.

If you modify build or dev behaviour
- Update `package.json` scripts accordingly and ensure the `vite.config.ts` alias and `tsconfig.json` paths stay aligned.

If anything here is unclear or missing, tell me which area you want expanded (build, routing, supabase usage, component conventions) and I will iterate.
