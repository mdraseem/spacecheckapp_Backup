'use client';

import Link from 'next/link';
import { Menu, Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ dict, lang }: { dict: any, lang: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = newLang; // Assuming /en/... or /pl/...
    const newPath = segments.join('/');
    router.push(newPath);
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
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.features}</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.howItWorks}</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition-colors">{dict.nav.pricing}</Link>
            
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

          <div className="md:hidden">
            <button className="text-gray-600">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}