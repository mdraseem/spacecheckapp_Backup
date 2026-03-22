'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ dict, lang }: { dict: any, lang: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = newLang;
    const newPath = segments.join('/');
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={`/${lang}`} className="text-2xl font-bold text-primary tracking-tight">
              SpaceCheck<span className="text-secondary">.app</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.features}</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.howItWorks}</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.pricing}</Link>
            <Link href={`/${lang}/blog`} className="text-gray-600 hover:text-primary transition-colors">{dict.blog?.title ?? 'Blog'}</Link>

            {/* Language Switcher */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 border-l border-gray-300 pl-6">
                <Globe size={16} />
                <button
                    onClick={() => switchLanguage('en')}
                    className={`hover:text-primary ${lang === 'en' ? 'font-bold text-primary' : ''}`}
                >
                    EN
                </button>
                <span>/</span>
                <button
                    onClick={() => switchLanguage('pl')}
                    className={`hover:text-primary ${lang === 'pl' ? 'font-bold text-primary' : ''}`}
                >
                    PL
                </button>
            </div>

            <Link href="/login" className="text-gray-600 hover:text-primary transition-colors font-medium">{dict.nav.login}</Link>
            <Link href="/login" className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
              {dict.nav.getStarted}
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden">
            <button
              className="text-gray-600 p-1"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link href="#features" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-primary transition-colors py-2">
            {dict.nav.features}
          </Link>
          <Link href="#how-it-works" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-primary transition-colors py-2">
            {dict.nav.howItWorks}
          </Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-primary transition-colors py-2">
            {dict.nav.pricing}
          </Link>
          <Link href={`/${lang}/blog`} onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-primary transition-colors py-2">
            {dict.blog?.title ?? 'Blog'}
          </Link>

          {/* Language Switcher */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <Globe size={16} />
            <button
              onClick={() => switchLanguage('en')}
              className={`hover:text-primary ${lang === 'en' ? 'font-bold text-primary' : ''}`}
            >
              EN
            </button>
            <span>/</span>
            <button
              onClick={() => switchLanguage('pl')}
              className={`hover:text-primary ${lang === 'pl' ? 'font-bold text-primary' : ''}`}
            >
              PL
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <Link href="/login" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-primary transition-colors font-medium py-2">
              {dict.nav.login}
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="block text-center bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
              {dict.nav.getStarted}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}