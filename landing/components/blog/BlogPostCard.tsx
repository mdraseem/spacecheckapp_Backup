import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPostMeta } from '@/utils/blog';

interface BlogPostCardProps {
  post: BlogPostMeta;
  lang: string;
  dict: {
    readMore: string;
    readingTime: string;
  };
}

export default function BlogPostCard({ post, lang, dict }: BlogPostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString(
    lang === 'pl' ? 'pl-PL' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-secondary/20 transition-all duration-300">
      {/* Cover image */}
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-secondary/10 relative overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-6xl opacity-20 select-none">📐</div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/10 text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors leading-tight">
          <Link href={`/${lang}/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {post.readingTime}
            </span>
          </div>

          <Link
            href={`/${lang}/blog/${post.slug}`}
            className="flex items-center gap-1 text-secondary font-medium hover:gap-2 transition-all"
          >
            {dict.readMore}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
