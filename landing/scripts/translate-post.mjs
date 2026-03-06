#!/usr/bin/env node

/**
 * Blog Post Translation Script
 *
 * Translates an English MDX blog post to Polish, preserving:
 * - YAML frontmatter (translates title, description, author — keeps date, tags, coverImage)
 * - Markdown/MDX syntax (headings, links, bold, italic, lists, code blocks)
 * - Internal links and URLs untouched
 *
 * Usage:
 *   npm run translate -- ar-revolutionizing-furniture-retail
 *   npm run translate -- --all
 *
 * Requirements:
 *   google-translate-api-x (devDependency — already installed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'google-translate-api-x';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '..', 'content', 'blog');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Split an MDX file into frontmatter object and body string.
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const fmBlock = match[1];
  const body = match[2];

  // Simple YAML-like parser (handles our flat frontmatter)
  const frontmatter = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays like ["tag1", "tag2"]
    if (value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch {
        // keep as string
      }
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Serialize frontmatter back to YAML string.
 */
function serializeFrontmatter(fm) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Translate a string from English to Polish using Google Translate.
 * Retries up to 3 times on failure.
 */
async function translateText(text, retries = 3) {
  if (!text || text.trim() === '') return text;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await translate(text, { from: 'en', to: 'pl' });
      return result.text;
    } catch (err) {
      if (attempt === retries) {
        console.error(`  ⚠ Failed to translate chunk after ${retries} attempts:`, err.message);
        return text; // Return original on failure
      }
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return text;
}

/**
 * Translate MDX body content line by line / block by block.
 * Preserves markdown syntax while translating text content.
 */
async function translateBody(body) {
  const lines = body.split('\n');
  const translated = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code block state
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      translated.push(line);
      continue;
    }

    // Don't translate code blocks
    if (inCodeBlock) {
      translated.push(line);
      continue;
    }

    // Don't translate empty lines
    if (line.trim() === '') {
      translated.push(line);
      continue;
    }

    // Don't translate horizontal rules
    if (line.trim() === '---') {
      translated.push(line);
      continue;
    }

    // Don't translate lines that are only links/images
    if (/^\s*!\[/.test(line) || /^\s*\[.*\]\(.*\)\s*$/.test(line)) {
      translated.push(line);
      continue;
    }

    // For lines with markdown formatting, we translate the text but preserve syntax
    let translatedLine = line;

    // Extract and preserve leading markdown markers
    const leadingMatch = line.match(/^(\s*(?:#{1,6}\s|[-*]\s|\d+\.\s|>\s)*)(.*)/);
    if (leadingMatch) {
      const prefix = leadingMatch[1];
      const content = leadingMatch[2];

      if (content.trim() === '') {
        translated.push(line);
        continue;
      }

      // Translate the text content
      // Protect inline markdown elements during translation
      const protections = [];
      let protectedContent = content;

      // Protect inline code
      protectedContent = protectedContent.replace(/`[^`]+`/g, (match) => {
        protections.push(match);
        return `{{P${protections.length - 1}}}`;
      });

      // Protect links [text](url) — translate text, keep url
      protectedContent = protectedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        protections.push({ type: 'link', url });
        return `[${text}]({{P${protections.length - 1}}})`;
      });

      // Protect bold markers but keep text for translation
      // (Google Translate usually handles **text** fine, but let's be safe)

      const translatedContent = await translateText(protectedContent);

      // Restore protected elements
      let restored = translatedContent;
      for (let j = 0; j < protections.length; j++) {
        const protection = protections[j];
        if (typeof protection === 'string') {
          restored = restored.replace(`{{P${j}}}`, protection);
        } else if (protection.type === 'link') {
          restored = restored.replace(`{{P${j}}}`, protection.url);
        }
      }

      translatedLine = prefix + restored;
    }

    translated.push(translatedLine);

    // Progress indicator
    if (i % 10 === 0 && i > 0) {
      process.stdout.write(`  Translating... ${Math.round((i / lines.length) * 100)}%\r`);
    }
  }

  console.log('  Translating... 100%');
  return translated.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function translatePost(slug) {
  const postDir = path.join(BLOG_DIR, slug);
  const enPath = path.join(postDir, 'en.mdx');
  const plPath = path.join(postDir, 'pl.mdx');

  if (!fs.existsSync(enPath)) {
    console.error(`  ✗ English source not found: ${enPath}`);
    return false;
  }

  if (fs.existsSync(plPath)) {
    console.log(`  ⚠ Polish version already exists. Overwriting: ${plPath}`);
  }

  console.log(`\n  Translating: ${slug}`);
  console.log(`  Source: ${enPath}`);

  const raw = fs.readFileSync(enPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  // Translate frontmatter fields
  console.log('  Translating frontmatter...');
  const translatedFm = { ...frontmatter };

  if (frontmatter.title) {
    translatedFm.title = await translateText(frontmatter.title);
  }
  if (frontmatter.description) {
    translatedFm.description = await translateText(frontmatter.description);
  }
  if (frontmatter.author) {
    translatedFm.author = await translateText(frontmatter.author);
  }
  // Keep date, tags, coverImage as-is

  // Translate body
  console.log('  Translating body...');
  const translatedBody = await translateBody(body);

  // Write output
  const output = serializeFrontmatter(translatedFm) + '\n' + translatedBody;
  fs.writeFileSync(plPath, output, 'utf-8');

  console.log(`  ✓ Polish version saved: ${plPath}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Blog Post Translation Script (EN → PL)

Usage:
  npm run translate -- <slug>     Translate a specific post
  npm run translate -- --all      Translate all posts missing a Polish version

Examples:
  npm run translate -- ar-revolutionizing-furniture-retail
  npm run translate -- --all
`);
    process.exit(0);
  }

  console.log('\n━━━ SpaceCheck Blog Translator (EN → PL) ━━━');

  if (args[0] === '--all') {
    // Translate all posts that don't have a Polish version (or re-translate all)
    const slugs = fs.readdirSync(BLOG_DIR).filter((name) => {
      const fullPath = path.join(BLOG_DIR, name);
      return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'en.mdx'));
    });

    if (slugs.length === 0) {
      console.log('  No English posts found to translate.');
      process.exit(0);
    }

    console.log(`  Found ${slugs.length} post(s) to translate.\n`);

    let success = 0;
    for (const slug of slugs) {
      const ok = await translatePost(slug);
      if (ok) success++;
    }

    console.log(`\n  Done. Translated ${success}/${slugs.length} post(s).\n`);
  } else {
    const slug = args[0];
    await translatePost(slug);
    console.log('');
  }
}

main().catch((err) => {
  console.error('Translation failed:', err);
  process.exit(1);
});
