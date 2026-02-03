import { getDictionary } from '../../get-dictionary';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Omnichannel from '@/components/Omnichannel';
import DemoSection from '@/components/DemoSection';
import PricingWithCheckout from '@/components/PricingWithCheckout';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default async function Home({ params }: { params: { lang: 'en' | 'pl' } }) {
  const lang = (await params).lang;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-white">
      <Navbar dict={dict} lang={lang} />
      <Hero dict={dict} lang={lang} />
      <Features dict={dict} />
      <HowItWorks dict={dict} />
      <Omnichannel dict={dict} />
      <DemoSection dict={dict} />
      <PricingWithCheckout dict={dict} />
      <FAQ dict={dict} />
      <Footer dict={dict} lang={lang} />
    </main>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'pl' }];
}
