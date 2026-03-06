import Link from 'next/link';

interface BlogCtaProps {
  dict: {
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  };
}

export default function BlogCta({ dict }: BlogCtaProps) {
  return (
    <section className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-8 sm:p-12 text-center text-white my-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">{dict.ctaTitle}</h2>
      <p className="text-white/80 mb-6 max-w-xl mx-auto">{dict.ctaDescription}</p>
      <Link
        href="/login"
        className="inline-block bg-secondary text-white px-8 py-3 rounded-full font-medium hover:bg-secondary/90 transition-colors shadow-lg"
      >
        {dict.ctaButton}
      </Link>
    </section>
  );
}
