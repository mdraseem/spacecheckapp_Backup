# SpaceCheck Blog — Author Guide

## Quick Start

1. Create a folder for your post under `content/blog/`:
   ```
   content/blog/your-post-slug/
   ```
2. Write your English post as `en.mdx`
3. Auto-translate to Polish:
   ```bash
   npm run translate -- your-post-slug
   ```
4. Deploy — the post appears on `/en/blog/your-post-slug` and `/pl/blog/your-post-slug`

---

## Directory Structure

```
landing/
├── content/
│   └── blog/
│       ├── ar-revolutionizing-furniture-retail/
│       │   ├── en.mdx          ← English version (source)
│       │   └── pl.mdx          ← Polish version (auto-generated or manual)
│       ├── your-next-post/
│       │   ├── en.mdx
│       │   └── pl.mdx
│       └── ...
├── app/[lang]/blog/
│   ├── page.tsx                ← Blog listing page
│   └── [slug]/page.tsx         ← Individual post page
├── components/blog/            ← Blog UI components
├── utils/blog.ts               ← Post loading utilities
└── scripts/translate-post.mjs  ← Translation automation
```

---

## Creating a New Post

### Step 1: Create the Post Folder

The folder name becomes the URL slug. Use lowercase with hyphens:

```bash
mkdir content/blog/my-new-article
```

This will produce URLs:
- `https://spacecheck.app/en/blog/my-new-article`
- `https://spacecheck.app/pl/blog/my-new-article`

### Step 2: Write the English Version

Create `content/blog/my-new-article/en.mdx` with this structure:

```mdx
---
title: "Your Post Title Here"
description: "A 1-2 sentence summary for SEO and social sharing. Keep under 160 characters."
date: "2026-03-15"
author: "SpaceCheck Team"
tags: ["AR", "furniture", "e-commerce"]
coverImage: "/blog/your-image.jpg"
---

# Your Post Title Here

Opening paragraph that hooks the reader...

## Section Heading

Body content with **bold text**, *italics*, and [links](https://example.com).

### Subsection

- Bullet points work
- As do numbered lists

1. First item
2. Second item

> Blockquotes for emphasis or citations.

---

*Call to action at the end. [Try SpaceCheck free](/login).*
```

### Step 3: Frontmatter Reference

| Field         | Required | Description                                          |
|---------------|----------|------------------------------------------------------|
| `title`       | Yes      | Post title. Appears in `<title>` tag and Open Graph. |
| `description` | Yes      | SEO meta description. Keep under 160 characters.     |
| `date`        | Yes      | Publication date in `YYYY-MM-DD` format.             |
| `author`      | Yes      | Author name displayed on the post.                   |
| `tags`        | Yes      | Array of tags. Used for display and structured data.  |
| `coverImage`  | No       | Path to cover image (relative to `/public/`).         |

### Step 4: Generate the Polish Translation

Run the translation script:

```bash
# Translate a single post
npm run translate -- my-new-article

# Translate ALL posts that have en.mdx
npm run translate -- --all
```

The script will:
- Read `en.mdx` from the post folder
- Translate the title, description, author, and body text to Polish
- Preserve all Markdown syntax, links, code blocks, and formatting
- Write `pl.mdx` in the same folder

If `pl.mdx` already exists, it will be overwritten.

> **Tip:** After auto-translation, review `pl.mdx` for accuracy. Machine
> translation is good but may need minor adjustments for natural phrasing.

### Step 5: Deploy

Commit and push. The build process will automatically:
- Generate static pages for both `/en/blog/slug` and `/pl/blog/slug`
- Add the post to the blog listing page
- Update the sitemap at `/sitemap.xml`
- Include JSON-LD structured data for Google

---

## Writing Tips for SEO

### Title
- Include your primary keyword near the beginning
- Keep between 50-60 characters
- Make it compelling — this appears in Google search results

### Description
- Summarize what the reader will learn
- Include the primary keyword naturally
- Keep under 160 characters to avoid truncation in search results

### Content Structure
- Use `##` headings to break the article into scannable sections
- Each section should target a related keyword or question
- Aim for 800-2000 words per post for SEO value
- Include internal links to your product pages (`/login`, `/#features`, etc.)

### Tags
- Use 2-5 tags per post
- Reuse tags across posts for consistency (e.g., always use `"AR"` not `"augmented reality"` and `"AR"` interchangeably)
- Tags appear in Open Graph metadata and JSON-LD structured data

### Suggested Topics for Furniture AR

- "How to reduce furniture return rates with AR"
- "AR vs traditional product photography: ROI comparison"
- "Setting up AR for your Shopify furniture store"
- "How customers use AR to buy furniture online"
- "The cost of furniture returns and how to prevent them"
- "QR codes in furniture showrooms: bridging online and offline"
- "3D model generation: from photo to AR in minutes"

---

## Adding Images

Place images in `public/blog/` and reference them in frontmatter:

```yaml
coverImage: "/blog/my-image.jpg"
```

Or inline in the body:

```mdx
![Alt text description](/blog/my-image.jpg)
```

Recommended:
- Use `.jpg` or `.webp` for photos, `.png` for diagrams
- Optimize images before committing (aim for < 200KB)
- Always include descriptive alt text for accessibility and SEO

---

## MDX Features

MDX lets you write JSX inside Markdown. The blog supports standard Markdown plus:

### Tables

```mdx
| Feature     | Starter | Growth  |
|-------------|---------|---------|
| Uploads/mo  | 3       | 50      |
| Resolution  | Standard| 4K      |
```

### Code Blocks

````mdx
```javascript
const viewer = document.querySelector('model-viewer');
viewer.src = 'model.glb';
```
````

### Blockquotes

```mdx
> AR visualization increases conversion rates by an average of 40%.
```

---

## Bilingual Behavior

- English (`en.mdx`) is the **source of truth**
- Polish (`pl.mdx`) can be auto-translated or manually written
- If a Polish version doesn't exist, the blog **falls back to the English version** for Polish-language visitors
- The URL structure is always `/{lang}/blog/{slug}` regardless of which version is served
- `hreflang` alternates are automatically set, linking EN and PL versions for search engines

---

## NPM Commands Reference

```bash
# Development
npm run dev              # Start dev server — preview at localhost:3000/en/blog

# Translation
npm run translate -- <slug>   # Translate specific post EN → PL
npm run translate -- --all    # Translate all posts EN → PL

# Build
npm run build            # Production build — verifies all posts compile
```
