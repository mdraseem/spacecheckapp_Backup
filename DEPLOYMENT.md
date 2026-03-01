# Furniture AR App - Simple Deployment Guide

## Overview
Clean, working implementation using Hunyuan3D-2.1 for 3D model generation with textures.

## Architecture
- **Frontend**: Next.js 16 (landing/)
- **Backend**: Modal.com (spacecheck_backend.py)
- **Database**: Supabase
- **3D Generation**: Replicate (ndreca/hunyuan3d-2.1)

## Prerequisites
- Node.js 18+
- Modal CLI installed (`pip install modal`)
- Replicate API token
- Supabase account

## Backend Deployment

### 1. Set Modal Secrets
```bash
modal secret create spacecheck-secrets \
  REPLICATE_API_TOKEN=r8_your_token \
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy Backend
```bash
modal deploy spacecheck_backend.py
```

### 3. Get Modal URL
After deployment, Modal will output a URL like:
```
https://<username>--spacecheck-backend-generate.modal.run
```

Save this URL for the frontend.

## Frontend Deployment

### 1. Set Environment Variables
Create `landing/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
MODAL_API_URL=https://your-modal-url.modal.run
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Install Dependencies
```bash
cd landing
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Deploy to Vercel (Optional)
```bash
vercel deploy
```

## Database Setup (Supabase)

### Required Tables

#### `generations` table
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  input_image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  glb_url TEXT,
  usdz_url TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generations_user_status ON generations(user_id, status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
```

**Migration for existing databases:**
If you already have the `generations` table, add the `name` column:
```sql
ALTER TABLE generations ADD COLUMN name TEXT;
```

#### Storage bucket: `uploads`
- Create public bucket named `uploads`
- Enable public access for file URLs

## Pipeline Flow

1. **User uploads image** → Frontend
2. **Image saved to Supabase storage** → `uploads/` bucket
3. **Record created** → `generations` table (status: processing)
4. **API call** → `/api/generate` → Modal backend
5. **Modal generates 3D model** → Hunyuan3D-2.1 on Replicate (single pass with textures)
6. **Model downloaded** → Resized to user dimensions
7. **Converted to USDZ** → Using Blender
8. **Uploaded** → Supabase storage
9. **Database updated** → status: completed, with URLs

## Model Parameters

**Hunyuan3D-2.1** (ndreca/hunyuan3d-2.1):
- Version: 895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f
- Input: image (URL)
- Parameters: steps (50), octree_resolution (256), generate_texture (true), remove_background (false), seed (1234), num_chunks (8000), max_facenum (20000), guidance_scale (7.5)
- Output: GLB file with textures
- Generation time: ~5-10 minutes
- Proven working model

## Retry Functionality

Failed generations show a "Retry Generation" button that:
- Resets status to processing
- Uses default dimensions (100x100x100 cm)
- Re-triggers Modal backend
- Polls for completion

## Cost Estimate

- **Replicate**: ~$0.05-0.10 per generation
- **Modal**: ~$0.01-0.02 per generation
- **Supabase**: Free tier (up to 500MB storage)

## Troubleshooting

### Model 404 Error
- Check model exists: https://replicate.com/ndreca/hunyuan3d-2.1
- Verify API token is correct and has sufficient credit

### Rate Limit (429)
- Add credit to Replicate: https://replicate.com/account/billing
- Wait 60 seconds between requests

### Upload Fails
- Check Supabase storage bucket is public
- Verify CORS settings allow uploads
- Check storage quota

### Generation Stuck
- Check Modal logs: `modal app logs spacecheck-backend`
- Verify Replicate API token has credit
- Check image URL is publicly accessible

## Next Steps (Experiments)

After this working baseline, you can experiment with:
- Different 3D models (TripoSR, Stable-Fast-3D)
- Texture enhancement pipelines
- Custom training/fine-tuning
- Batch processing
- Quality improvements

## Support

- Modal docs: https://modal.com/docs
- Replicate docs: https://replicate.com/docs
- Supabase docs: https://supabase.com/docs
