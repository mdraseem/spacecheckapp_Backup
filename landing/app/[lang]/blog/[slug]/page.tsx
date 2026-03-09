import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { getDictionary } from '../../../../get-dictionary';
import { getPostBySlug, getAllPostSlugs } from '@/utils/blog';
import { mdxComponents } from '@/components/blog/MdxComponents';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogCta from '@/components/blog/BlogCta';
import BlogPageTracker from '@/components/blog/BlogPageTracker';

type Props = {
  params: Promise<{ lang: 'en' | 'pl'; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = getPostBySlug(slug, lang);

  if (!post) return { title: 'Post Not Found' };

  const url = `https://spacecheck.app/${lang}/blog/${slug}`;

  return {
    title: `${post.title} | SpaceCheck Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: {
      canonical: url,
      languages: {
        en: `https://spacecheck.app/en/blog/${slug}`,
        pl: `https://spacecheck.app/pl/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: 'SpaceCheck.app',
      locale: lang === 'pl' ? 'pl_PL' : 'en_US',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.coverImage && {
        images: [{ url: `https://spacecheck.app${post.coverImage}`, width: 1200, height: 675 }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(post.coverImage && {
        images: [`https://spacecheck.app${post.coverImage}`],
      }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const post = getPostBySlug(slug, lang);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString(
    lang === 'pl' ? 'pl-PL' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // BreadcrumbList JSON-LD for Google search breadcrumbs
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `https://spacecheck.app/${lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `https://spacecheck.app/${lang}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://spacecheck.app/${lang}/blog/${slug}`,
      },
    ],
  };

  // Article JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SpaceCheck',
      url: 'https://spacecheck.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://spacecheck.app/${lang}/blog/${slug}`,
    },
    inLanguage: lang === 'pl' ? 'pl' : 'en',
    keywords: post.tags.join(', '),
    ...(post.coverImage && {
      image: `https://spacecheck.app${post.coverImage}`,
    }),
  };

  return (
    <main className="min-h-screen bg-white">
      <BlogPageTracker slug={slug} title={post.title} />
      <Navbar dict={dict} lang={lang} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Back link */}
        <Link
          href={`/${lang}/blog`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-secondary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          {dict.blog.backToBlog}
        </Link>

        {/* Post header */}
        <header className="mb-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/10 text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            {post.description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {post.readingTime}
            </span>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative rounded-xl overflow-hidden mt-6 bg-gray-50">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={720}
                height={405}
                className="w-full h-auto rounded-xl"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}
        </header>

        {/* MDX Content */}
        <div className="prose-spacecheck">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        {/* CTA */}
        <BlogCta dict={dict.blog} />
      </article>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  const params: { lang: string; slug: string }[] = [];

  for (const slug of slugs) {
    params.push({ lang: 'en', slug });
    params.push({ lang: 'pl', slug });
  }

  return params;
}
