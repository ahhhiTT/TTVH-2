@AGENTS.md

# TTVH2 OS

Internal management system for UpBase's Operations Center 2 (TTVH2). Short term:
TTVH2 only; long term: an E-commerce Operating System for the whole Ecom division.
Three axes — department, people, brands/stores — each running Planning → Execution
(checklist, SLA) → Report, plus career path / L&D.

## Stack
- Next.js 16 (App Router, Cache Components on), TypeScript, Tailwind v4.
- No database yet: sample data in `src/lib/data/seed.ts`, read through
  `src/lib/data/repo.ts`. Planned: PostgreSQL + Prisma, swapped in behind `repo.ts`.
- Auth is a demo cookie (`src/lib/session.ts`). Planned: Auth.js + Lark OAuth.
- Bilingual vi/en via `src/lib/i18n/dictionaries.ts` (cookie `ttvh2_locale`).
  Every user-visible string goes in both dictionaries — no hard-coded text.

## Rules
- **Sample data only** until UpBase security signs off. Never commit real brand,
  revenue or employee data.
- **Every page goes through `requireUser()` and the `rbac.ts` helpers.** Never read
  `seed`/`repo` lists directly in a page without filtering by `visibleStoreIds` /
  `visibleUserIds`. Out-of-scope records return `notFound()` (same as missing).
- KPI formulas live only in `src/lib/metrics.ts` and are **provisional** until the
  Director confirms definitions (GMV, NMV, CR, AOV, ROI, roll-up rules).
- Design tokens follow `docs/DESIGN.md`: colors are CSS variables in `globals.css`;
  black is the only CTA color; Inter 600 for headings; 8px buttons, 12px cards.
  Status is never color-only (icon + label).

## Commands
- `npm run dev` — local dev at http://localhost:3000
- `npm run build` — must pass before any deploy
- `npm run lint`

## Deploy
Vercel. Set `DEMO_PASSWORD` to enable the site-wide password gate in `src/proxy.ts`.
