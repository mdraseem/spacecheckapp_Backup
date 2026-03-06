import { Metadata } from 'next';
import { getDictionary } from '../../../get-dictionary';
import { getAllPosts } from '@/utils/blog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogPostCard from '@/components/blog/BlogPostCard';
import BlogCta from '@/components/blog/BlogCta';

type Props = {
  params: Promise<{ lang: 'en' | 'pl' }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const url = `https://spacecheck.app/${lang}/blog`;

  return {
    title: `${dict.blog.pageTitle} | SpaceCheck`,
    description: dict.blog.pageDescription,
    alternates: {
      canonical: url,
      languages: {
        en: 'https://spacecheck.app/en/blog',
        pl: 'https://spacecheck.app/pl/blog',
      },
    },
    openGraph: {
      title: dict.blog.pageTitle,
      description: dict.blog.pageDescription,
      url,
      siteName: 'SpaceCheck.app',
      locale: lang === 'pl' ? 'pl_PL' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogListingPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const posts = getAllPosts(lang);

  return (
    <main className="min-h-screen bg-white">
      <Navbar dict={dict} lang={lang} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
            {dict.blog.pageTitle}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.blog.pageDescription}
          </p>
        </header>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-16">{dict.blog.noPosts}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-8 mb-12">
            {posts.map((post) => (
              <BlogPostCard
                key={post.slug}
                post={post}
                lang={lang}
                dict={dict.blog}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <BlogCta dict={dict.blog} />
      </div>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'pl' }];
}
