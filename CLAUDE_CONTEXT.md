# Furnite AR App - Context Summary

## Application Overview
This is a **Furniture AR (Augmented Reality) SaaS Application** that generates 3D models from furniture photos for AR visualization on mobile devices. Users upload product images with dimensions, and the app creates AR-compatible 3D assets.

## Tech Stack

### Frontend
- **Next.js 16.1.1** + **React 19.2.3** + **TypeScript**
- **Tailwind CSS 4** for styling
- **TanStack React Query** for state management
- **Supabase SSR** for auth and database
- **Google Model Viewer** for 3D visualization
- Deployed on Vercel (optional)

### Backend
- **Modal.com** - Serverless compute for ML workloads
- **Python 3.10** - Backend runtime
- **Blender 3.6.5** - 3D file conversion (GLB → USDZ for iOS)
- **Trimesh** - 3D mesh processing
- Entry point: `spacecheck_backend.py`

### AI/ML
- **Replicate API** hosting **Hunyuan3D-2.1** model (`ndreca/hunyuan3d-2.1`)
- Generates 3D models with textures from single images
- Model version pinned for stability (recent commits: 9a6e5af, c714063)

### Data & Storage
- **Supabase** - PostgreSQL database, authentication, file storage
- Schema: `generations` table tracking model creation jobs (includes product name field)
- Storage buckets for images and 3D models (GLB/USDZ)

## Core Features

### 1. Dashboard (`/dashboard`)
- User authentication (Supabase Auth)
- Gallery of generated 3D models with professional product names
- Model cards with enhanced actions:
  - **View in AR** - Opens model in AR viewer (primary action)
  - **QR Code** - Generates shareable QR code for AR viewer
  - **Stats** - Shows model-specific analytics (views, AR activations, devices)
  - **Download GLB** - Direct model file download
- Model management (retry failed generations)
- Real-time status tracking (processing/completed/failed)

### 2. Model Creation (`/dashboard/create`)
- Image upload (drag & drop)
- Product name input field (required)
- Real-world dimensions input (width/height/depth in cm)
- AI-powered 3D generation with textures
- Automatic dimension scaling
- GLB + USDZ format output

### 3. AR Viewer (`/public/viewer.html`)
- Interactive 3D model viewing
- AR Quick Look activation (iOS/Android)
- Sharable via QR codes
- Analytics tracking

### 4. Analytics Dashboard (`/[lang]/analytics`)
- Password-protected metrics
- Tracks AR activations, device types, model popularity
- Events: view_page, model_loaded, ar_activated

### 5. Generator Tool (`/[lang]/generator`)
- Legacy QR code generator
- Creates marketing materials with AR links
- Multi-language support (EN/PL)

## System Flow

```
Image Upload → Supabase Storage → DB Record (status: processing)
    ↓
/api/generate triggers Modal Backend
    ↓
Replicate API (Hunyuan3D-2.1) → GLB with textures
    ↓
Trimesh (resize to user dimensions) → Blender (GLB → USDZ)
    ↓
Upload to Supabase Storage → DB Update (status: completed)
    ↓
Dashboard displays model → User views in AR
```

## Project Structure

```
/landing/                    # Next.js app
  /app/
    /api/                   # API routes (generate, status, analytics)
    /dashboard/             # User dashboard & creation UI
    /[lang]/                # i18n routes (generator, analytics)
    /auth/ /login/          # Authentication
  /components/              # React components
  /public/                  # Static assets (viewer.html, etc.)
  /utils/                   # Helpers
  /dictionaries/            # EN/PL translations
spacecheck_backend.py       # Modal backend for 3D generation
requirements.txt            # Python deps
DEPLOYMENT.md              # Deployment instructions
ANALYTICS_SETUP.md         # Analytics configuration
```

## Key Files

- `spacecheck_backend.py:1-200` - Main backend logic for 3D generation
- `landing/app/api/generate/route.ts` - Generation trigger endpoint
- `landing/app/api/generation/[id]/route.ts` - Status polling endpoint
- `landing/app/api/analytics/route.ts` - Analytics API with model filtering
- `landing/app/dashboard/page.tsx` - Model gallery UI
- `landing/app/dashboard/create/page.tsx` - Upload & creation UI (includes product name field)
- `landing/app/dashboard/actions.ts:13` - createGeneration action (handles name)
- `landing/components/dashboard/ModelCard.tsx` - Enhanced model card with AR/QR/Analytics buttons
- `landing/components/dashboard/QRCodeModal.tsx` - QR code generator modal
- `landing/components/dashboard/ModelAnalyticsModal.tsx` - Per-model analytics modal
- `landing/public/viewer.html` - AR viewer interface (accepts ?model= param)

## Current State

**Status**: Production-ready SaaS application
- ✅ Complete authentication system
- ✅ Working 3D generation pipeline with textures
- ✅ GLB + USDZ format support (iOS AR compatibility)
- ✅ Real-time status tracking
- ✅ Analytics framework
- ✅ Multi-language support
- ✅ Retry mechanism for failed generations

**Recent Focus** (Git history):
- Pinning Hunyuan3D-2.1 model version for stability
- Fixing texture generation issues
- Optimizing model parameters

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Replicate
REPLICATE_API_TOKEN=

# Modal
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
```

## Deployment

- **Frontend**: Vercel or any Next.js host
- **Backend**: Modal.com (`modal deploy spacecheck_backend.py`)
- **Database**: Supabase cloud
- See `DEPLOYMENT.md` for full instructions

## Notes for Future Iterations

- This app is actively maintained and recently updated
- Focus has been on stable AI model integration
- Backend uses serverless architecture (Modal) for cost efficiency
- 3D generation takes 2-5 minutes per model
- Uses polling for status updates (no webhooks yet)
- Analytics are password-protected (not fully auth-gated)
- **Recent additions**: Product name field, enhanced model cards with QR codes, per-model analytics
- Database schema includes `name` column for professional product names
- Viewer URL format: `/viewer.html?model=filename.glb`
- Analytics track model-specific metrics (views, AR activations, devices)
