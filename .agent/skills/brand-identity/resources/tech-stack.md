# Preferred Tech Stack & Implementation Rules

When generating code or UI components for ARyCP, you **MUST** strictly adhere to the following technology choices.

## Core Stack
* **Framework:** Next.js 15 (App Router) with TypeScript
* **Styling Engine:** Tailwind CSS (Mandatory. Do not use plain CSS or styled-components unless explicitly asked.)
* **Component Library:** shadcn/ui (Use these primitives as the base for all new components.)
* **Icons:** Lucide React
* **Backend/Database:** Supabase (Auth, Postgres, Storage)
* **Deployment:** Vercel

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` (e.g., use `bg-primary text-primary-foreground` instead of hardcoded hex values).
* **Dark Mode:** Not currently implemented. Use light mode only.
* **Module Colors:** Each module has a thematic color — use it for headers, badges, and accents within that module's pages.

### 2. Component Patterns
* **Buttons:** Primary actions must use the solid Primary color (emerald/green). Secondary actions should use the 'Ghost' or 'Outline' variants from shadcn/ui.
* **Cards:** Use shadcn/ui `Card` with subtle gradients (`bg-gradient-to-br from-{color}-50 to-{color}-100/50`) for module cards.
* **Forms:** Labels must always be placed *above* input fields. Use standard Tailwind spacing (e.g., `gap-4` between form items).
* **Layout:** Use Flexbox and CSS Grid via Tailwind utilities for all layout structures.
* **Navigation:** The dashboard has a sticky header provided by `layout.tsx`. Module pages must NOT add their own sticky header.

### 3. Supabase Patterns
* **Client-side:** Use `createClient()` from `@/lib/supabase/client` for client components.
* **Server-side:** Use `createClient()` from `@/lib/supabase/server` for server components and API routes.
* **Admin operations:** Use `createAdminClient()` from `@/lib/supabase/admin` for privileged operations (bypasses RLS).
* **Auth:** Always check `supabase.auth.getUser()` before data operations.

### 4. Forbidden Patterns
* Do NOT use jQuery.
* Do NOT use Bootstrap classes.
* Do NOT create separate CSS files; keep styles in component files via Tailwind.
* Do NOT add `min-h-screen` wrappers or duplicate sticky headers inside dashboard module pages.
* Do NOT use `styled-components` or CSS Modules.
