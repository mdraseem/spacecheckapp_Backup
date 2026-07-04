import Link from 'next/link';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer({ dict, lang }: { dict: any, lang: string }) {
  return (
    <footer className="relative bg-slate-50/70 border-t border-slate-100 pt-20 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href={`/${lang}`} className="font-display font-black text-2xl tracking-tight text-slate-900 flex items-center gap-0.5 group">
              <span>spacecheck.app</span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              {dict.footer.description}
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://twitter.com/spacecheck" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary/30 flex items-center justify-center transition-all shadow-sm"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a 
                href="https://linkedin.com/company/spacecheck" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary/30 flex items-center justify-center transition-all shadow-sm"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a 
                href="https://instagram.com/spacecheck" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary/30 flex items-center justify-center transition-all shadow-sm"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-slate-900 text-sm mb-4 tracking-wide uppercase">{dict.footer.product}</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-500">
              <li><Link href={`/${lang}#features`} className="hover:text-slate-900 transition-colors">Features</Link></li>
              <li><Link href={`/${lang}#pricing`} className="hover:text-slate-900 transition-colors">Pricing</Link></li>
              <li><Link href={`/${lang}#demo`} className="hover:text-slate-900 transition-colors">Demo</Link></li>
              <li><Link href={`/${lang}/blog`} className="hover:text-slate-900 transition-colors">Blog</Link></li>
              <li><Link href="/login" className="hover:text-slate-900 transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-slate-900 text-sm mb-4 tracking-wide uppercase">{dict.footer.company}</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-500">
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wide gap-4">
          <p className="normal-case">&copy; {new Date().getFullYear()} {dict.footer.rights}</p>
          <div className="flex space-x-6">
            <Link href="/terms" className="hover:text-slate-950 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-950 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-slate-950 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}