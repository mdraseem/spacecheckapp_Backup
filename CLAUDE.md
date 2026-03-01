# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SpaceCheck** - A Furniture AR SaaS application that generates 3D models from product photos using AI (Hunyuan3D-2.1 via Replicate) and serves them in augmented reality via Google Model Viewer. The production app lives at `https://spacecheck.app`.

## Development Commands

All commands run from the `landing/` directory:

```bash
cd landing
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

Backend deployment (from repo root):
```bash
modal deploy spacecheck_backend.py   # Deploy Modal.com serverless backend
```

Legacy Streamlit tool (from repo root):
```bash
streamlit run app.py   # Local 3D model resizer/converter utility
```

## Architecture

### System Overview

```
Next.js 16 Frontend (Vercel)
  ├── Landing pages (/[lang]/) - bilingual EN/PL
  ├── Dashboard (/dashboard/) - authenticated model management
  ├── API routes (/api/) - generation triggers, Stripe, analytics
  └── Static AR viewer (/public/viewer.html)
        │
        ├── Supabase (Auth + PostgreSQL + File Storage)
        ├── Stripe (Subscriptions: starter=3/mo, growth=50/mo)
        └── Modal.com Backend (spacecheck_backend.py)
              └── Replicate API (Hunyuan3D-2.1) → Trimesh resize → Blender GLB→USDZ
```

### Generation Pipeline

1. User uploads image + dimensions in `/dashboard/create`
2. Server action `createGeneration()` inserts DB record (status: processing), calls `/api/generate`
3. `/api/generate` fires request to Modal.com backend
4. Modal backend: Replicate generates 3D model → Trimesh resizes to dimensions → Blender converts GLB→USDZ → uploads to Supabase Storage → updates DB status
5. Dashboard polls `/api/generation/[id]` via React Query until status changes
6. User views model in AR via `viewer.html?model=filename.glb`

### Frontend Stack

- **Next.js 16.1.1** with App Router, **React 19**, **TypeScript 5**, **Tailwind CSS 4**
- **TanStack React Query** for server state (polling, caching)
- **Supabase SSR** for auth with cookie-based sessions
- **@google/model-viewer** for 3D/AR rendering
- **Stripe** for checkout and subscription management
- **lucide-react** for icons, **clsx + tailwind-merge** for class utilities

### Key Patterns

- **i18n**: Dynamic `[lang]` route segment with dictionary JSON files in `/dictionaries/`. Landing pages use `getDictionary()` (server-only), dashboard uses `DashboardLanguageContext` for client-side switching.
- **Auth middleware** (`middleware.ts`): Refreshes Supabase sessions, protects `/dashboard` routes, redirects `/login` for authenticated users, adds locale prefix to paths.
- **Supabase clients**: Server-side via `utils/supabase/server.ts` (uses cookies), client-side via `utils/supabase/client.ts` (browser client). Always use the appropriate one based on context.
- **Server Actions** in `app/dashboard/actions.ts`: `createGeneration()`, `retryGeneration()`, `deleteGeneration()` - all verify auth and ownership before operating.
- **Usage enforcement**: `utils/usage-limits.ts` checks monthly generation count against plan limits before allowing new generations.
- **Rate limiting**: `utils/rate-limit.ts` for API endpoint protection.
- **Analytics**: Client-side tracking via `utils/track.ts` → `POST /api/track` → Supabase analytics table. Respects GDPR cookie consent (`utils/cookie-consent.ts`).

### Database Tables (Supabase)

- **generations**: id, user_id, input_image_url, glb_url, usdz_url, status (processing/completed/failed), name, width_cm, height_cm, depth_cm, created_at
- **profiles**: id (FK auth.users), stripe_customer_id, stripe_subscription_id, subscription_status, plan_type (starter/growth)
- **analytics**: event_type, user_id, model_name, metadata (JSONB)
- **contact_submissions**: name, email, subject, message, status

Row-Level Security is enabled - users can only access their own generations.

### API Routes (`landing/app/api/`)

| Route | Purpose |
|-------|---------|
| `generate/` | Triggers 3D generation via Modal backend |
| `generation/[id]/` | Polls generation status |
| `track/` | Logs analytics events |
| `analytics/` | Aggregated analytics (password-protected via `ANALYTICS_PASSWORD`) |
| `analytics/user/` | User-specific analytics |
| `usage/` | Monthly usage limits check |
| `create-checkout/` | Creates Stripe checkout session |
| `create-portal/` | Creates Stripe customer portal session |
| `create-special-checkout/` | Special offer checkout |
| `webhook/` | Stripe webhook handler |
| `contact/` | Contact form submissions |
| `dashboard-dictionary/` | Serves i18n dictionaries to client |

## Environment Variables

Copy `landing/.env.example` to `landing/.env.local`. Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - Supabase
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe
- `NEXT_PUBLIC_STRIPE_PRICE_STARTER`, `NEXT_PUBLIC_STRIPE_PRICE_GROWTH` - Stripe price IDs
- `NEXT_PUBLIC_SITE_URL` - Base URL for API calls (e.g. `http://localhost:3000`)
- `ANALYTICS_PASSWORD` - Password for analytics dashboard access
- `REPLICATE_API_TOKEN` - Replicate API for 3D generation
- `MODAL_API_URL` - Modal.com backend endpoint

## Path Aliases

TypeScript path alias `@/*` maps to the `landing/` root (configured in `tsconfig.json`). Use `@/utils/...`, `@/components/...`, etc.

## Legacy Files

Root-level `index.html`, `generator.html`, `viewer.html`, and `app.py` are legacy/standalone tools. The production application is entirely within the `landing/` directory.
