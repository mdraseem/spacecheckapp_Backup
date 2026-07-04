'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ dict, lang }: { dict: any, lang: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchLanguage = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = newLang;
    const newPath = segments.join('/');
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300">
      <div 
        className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-lg border-slate-100/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] py-3' 
            : 'bg-white/40 backdrop-blur-md border-transparent py-4'
        }`}
      >
        <div className="px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href={`/${lang}`} className="font-display font-black text-2xl tracking-tight text-slate-900 flex items-center gap-1 group"><span>spacecheck.app</span></Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{dict.nav.features}</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{dict.nav.howItWorks}</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{dict.nav.pricing}</Link>
            <Link href={`/${lang}/blog`} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{dict.blog?.title ?? 'Blog'}</Link>



            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">{dict.nav.login}</Link>
            <Link 
              href="/login" 
              className="glow-btn bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-950/10 hover:bg-secondary hover:shadow-secondary/25 transition-all"
            >
              {dict.nav.getStarted}
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden">
            <button
              className="text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-6 pb-6 pt-4 space-y-4 border-t border-slate-100/80 mt-3">
            <Link href="#features" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1">
              {dict.nav.features}
            </Link>
            <Link href="#how-it-works" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1">
              {dict.nav.howItWorks}
            </Link>
            <Link href="#pricing" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1">
              {dict.nav.pricing}
            </Link>
            <Link href={`/${lang}/blog`} onClick={() => setIsOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1">
              {dict.blog?.title ?? 'Blog'}
            </Link>



            <div className="border-t border-slate-100 pt-4 space-y-3">
              <Link href="/login" onClick={() => setIsOpen(false)} className="block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1">
                {dict.nav.login}
              </Link>
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)} 
                className="block text-center glow-btn bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-950/10 hover:bg-secondary transition-all"
              >
                {dict.nav.getStarted}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}