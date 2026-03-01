import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://spacecheck.app'),
  title: "SpaceCheck.app | AR for Furniture Retailers",
  description: "Turn 2D product photos into 3D AR models instantly. Boost sales and reduce returns with SpaceCheck's AI-powered AR visualization platform.",
  keywords: ["AR for furniture", "3D model generator", "ecommerce AR", "augmented reality for retail", "Shopify AR", "WooCommerce AR"],
  openGraph: {
    title: "SpaceCheck.app | Turn Photos into AR Sales Machines",
    description: "Automated 3D model generation for furniture retailers. No 3D skills required.",
    url: 'https://spacecheck.app',
    siteName: 'SpaceCheck.app',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SpaceCheck.app | AR for Furniture",
    description: "Boost conversion by 40% with instant AR visualization.",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const lang = (await params).lang;
  
  // JSON-LD for Software Application
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SpaceCheck",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "AI-powered platform that converts 2D furniture photos into 3D Augmented Reality models for e-commerce.",
    "featureList": "AI 3D Generation, AR Viewer, GLB/USDZ Conversion, Analytics",
    "screenshot": "https://spacecheck.app/screenshot.jpg"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'pl' }];
}
