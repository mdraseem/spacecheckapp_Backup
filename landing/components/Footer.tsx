import Link from 'next/link';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer({ dict, lang }: { dict: any, lang: string }) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
             <Link href={`/${lang}`} className="text-2xl font-bold text-primary tracking-tight mb-4 block">
              SpaceCheck<span className="text-secondary">.app</span>
            </Link>
            <p className="text-gray-500 text-sm mb-6">
              {dict.footer.description}
            </p>
            <div className="flex space-x-4">
                <a href="https://twitter.com/spacecheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-secondary transition-colors"><Twitter size={20} /></a>
                <a href="https://linkedin.com/company/spacecheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-secondary transition-colors"><Linkedin size={20} /></a>
                <a href="https://instagram.com/spacecheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-secondary transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-primary mb-4">{dict.footer.product}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href={`/${lang}#features`} className="hover:text-secondary">Features</Link></li>
                <li><Link href={`/${lang}#pricing`} className="hover:text-secondary">Pricing</Link></li>
                <li><Link href={`/${lang}#demo`} className="hover:text-secondary">Demo</Link></li>
                <li><Link href="/login" className="hover:text-secondary">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-primary mb-4">{dict.footer.company}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="mailto:support@spacecheck.app" className="hover:text-secondary">Contact</a></li>
                <li><Link href="/privacy" className="hover:text-secondary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-secondary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {dict.footer.rights}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/terms" className="hover:text-secondary">Terms</Link>
                <Link href="/privacy" className="hover:text-secondary">Privacy</Link>
                <a href="mailto:support@spacecheck.app" className="hover:text-secondary">Contact</a>
            </div>
        </div>
      </div>
    </footer>
  );
}