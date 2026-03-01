# Analytics Dashboard Setup Guide

## Overview

A password-protected analytics dashboard has been created to track AR furniture scanning metrics. The dashboard displays real-time insights about user behavior, device usage, model popularity, and AR activation rates.

## Accessing the Dashboard

**URLs:**
- Local: `http://localhost:3000/en/analytics` or `http://localhost:3000/pl/analytics`
- Production: `https://yourdomain.com/en/analytics`

## Setup Instructions

### 1. Set Analytics Password

Add the following environment variable to your Vercel project or `.env.local` file:

```bash
ANALYTICS_PASSWORD=your_secure_password_here
```

**To set in Vercel:**
1. Go to your project settings on Vercel
2. Navigate to Environment Variables
3. Add `ANALYTICS_PASSWORD` with your desired password
4. Redeploy the application

### 2. Required Environment Variables

The dashboard requires these existing variables (already configured for analytics tracking):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_api_key
```

### 3. Supabase Database Schema

Your Supabase `analytics` table should have this structure:

```sql
CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR,
  user_id VARCHAR,
  model_name VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_model_name ON analytics(model_name);
```

## Features

### 📊 Key Metrics
- **Total Events**: Count of all tracked events
- **Unique Users**: Number of distinct users
- **AR Activations**: Successful AR experiences
- **AR Success Rate**: Conversion rate from click to activation

### 🎯 AR Experience Funnel
- AR Button Clicks
- AR Activations (successes)
- AR Errors
- AR Not Available (device limitations)

### 📱 Device Distribution
- iOS devices
- Android devices
- Desktop browsers

### 🌍 Language Preferences
- User language breakdown
- Helps understand audience demographics

### 🪑 Model Analytics
- Most viewed 3D models
- Model popularity ranking
- Usage patterns

### 📈 Event Tracking
All event types with counts:
- `view_page` - Page loads
- `model_loaded` - 3D model successfully loaded
- `click_ar_view` - AR button clicked
- `ar_activated_success` - AR launched successfully
- `ar_not_available` - AR not supported on device
- `ar_activation_error` - Error during AR launch
- `model_load_error` - Model failed to load
- `toggle_language` - Language switched

### 🕐 Recent Activity
Real-time table showing:
- Event timestamp
- Event type
- Model name
- Device type
- User language

## API Endpoints

### GET `/api/analytics`

Fetches analytics data from Supabase with aggregated statistics.

**Authentication:**
- Query parameter: `?password=your_password`
- OR Header: `Authorization: Bearer your_password`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalEvents": 1234,
    "uniqueUsers": 567,
    "eventCounts": { ... },
    "modelViews": { ... },
    "devices": { ... },
    "languages": { ... },
    "arStats": {
      "clicks": 100,
      "activations": 75,
      "errors": 5,
      "notAvailable": 20,
      "conversionRate": "75.00"
    },
    "recentEvents": [...],
    "timeline": { ... }
  },
  "rawData": [...]
}
```

## Security

- **Password Protection**: Dashboard requires password authentication
- **Session Storage**: Password stored in browser session (cleared on logout)
- **No public access**: Analytics endpoint protected by password
- **CORS enabled**: API accessible from your frontend

## Usage Tips

1. **First Login**: Enter your password to access the dashboard
2. **Refresh Data**: Click the "Refresh" button to get latest analytics
3. **Session Persistence**: Password stored in session - no need to re-enter on page refresh
4. **Logout**: Click "Logout" to clear stored credentials

## Maintenance

### Update Password
1. Change `ANALYTICS_PASSWORD` in Vercel environment variables
2. Redeploy the application
3. All users will need the new password

### Add New Metrics
Edit `/api/analytics.js` function `processAnalytics()` to add custom aggregations.

### Customize UI
Edit `/landing/app/[lang]/analytics/page.tsx` to modify dashboard layout and components.

## Troubleshooting

### "Invalid password" error
- Verify `ANALYTICS_PASSWORD` is set in Vercel
- Check for typos in the password
- Ensure you redeployed after adding the variable

### "Failed to fetch analytics"
- Check Supabase credentials are correct
- Verify the `analytics` table exists
- Check browser console for detailed error messages

### No data showing
- Confirm analytics tracking is working in `viewer.html`
- Check Supabase table has records
- Verify API endpoint returns data (check Network tab)

## Development

### Local Testing
```bash
# Create .env.local in /landing directory
echo "ANALYTICS_PASSWORD=test123" >> landing/.env.local
echo "SUPABASE_URL=your_url" >> landing/.env.local
echo "SUPABASE_KEY=your_key" >> landing/.env.local

# Run development server
cd landing
npm run dev

# Visit http://localhost:3000/en/analytics
```

### Production Deployment
Already configured to work with Vercel. The dashboard will automatically be available at `/[lang]/analytics` route.

## Data Privacy

- User IDs are anonymous (generated client-side)
- No personally identifiable information is stored
- UserAgent strings stored for analytics purposes
- Consider GDPR compliance for your region

---

**Dashboard Version:** 1.0
**Created:** January 2026
**Framework:** Next.js 16 + TailwindCSS
