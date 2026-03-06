import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  coverImage: string;
  readingTime: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

/**
 * Get all blog post slugs (directory names under content/blog/)
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((name) => {
    const fullPath = path.join(BLOG_DIR, name);
    return fs.statSync(fullPath).isDirectory();
  });
}

/**
 * Check which languages are available for a given post
 */
export function getAvailableLanguages(slug: string): string[] {
  const postDir = path.join(BLOG_DIR, slug);
  if (!fs.existsSync(postDir)) return [];
  return fs
    .readdirSync(postDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''));
}

/**
 * Get a single blog post by slug and language.
 * Falls back to English if the requested language is not available.
 */
export function getPostBySlug(slug: string, lang: 'en' | 'pl'): BlogPost | null {
  const postDir = path.join(BLOG_DIR, slug);

  // Try requested language first, then fall back to English
  let filePath = path.join(postDir, `${lang}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(postDir, 'en.mdx');
  }
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    author: data.author ?? '',
    tags: data.tags ?? [],
    coverImage: data.coverImage ?? '',
    readingTime: stats.text,
    content,
  };
}

/**
 * Get all posts for a given language, sorted by date descending.
 */
export function getAllPosts(lang: 'en' | 'pl'): BlogPostMeta[] {
  const slugs = getAllPostSlugs();

  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug, lang);
      if (!post) return null;
      // Strip content from listing — only return metadata
      const { content: _, ...meta } = post;
      return meta;
    })
    .filter((p): p is BlogPostMeta => p !== null);

  // Sort newest first
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Get all unique tags across all posts for a language.
 */
export function getAllTags(lang: 'en' | 'pl'): string[] {
  const posts = getAllPosts(lang);
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
