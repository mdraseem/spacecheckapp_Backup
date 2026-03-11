import type { Metadata } from "next";
import CookieBanner from '@/components/CookieBanner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://spacecheck.app'),
  title: "SpaceCheck.app | AR for Furniture Retailers",
  description: "Turn 2D product photos into 3D AR models instantly. Boost sales and reduce returns with SpaceCheck's AI-powered AR visualization platform.",
  keywords: ["AR for furniture", "3D model generator", "ecommerce AR", "augmented reality for retail", "Shopify AR", "WooCommerce AR", "furniture visualization tool", "AI 3D generation", "product AR viewer", "furniture e-commerce tool", "photo to 3D model", "AR SaaS platform"],
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
  
  // JSON-LD for Software Application — optimized for GEO / LLM citation
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SpaceCheck",
    "url": "https://spacecheck.app",
    "applicationCategory": "BusinessApplication, E-commerce Tool, Augmented Reality",
    "applicationSubCategory": "3D Model Generator for Furniture Retail",
    "operatingSystem": "Web",
    "description": "SpaceCheck is an AI-powered SaaS platform that converts 2D furniture photos into photorealistic 3D AR models. Furniture retailers embed AR viewers on Shopify, WooCommerce, or Magento product pages and print QR posters for showrooms — increasing conversion by 40% and reducing returns.",
    "featureList": [
      "AI 3D model generation from a single product photo",
      "AR viewer for iOS (Quick Look) and Android (Scene Viewer) — no app required",
      "Automatic GLB and USDZ file conversion",
      "QR code poster generation for in-store displays",
      "Shopify, WooCommerce, and Magento integration via embed code",
      "Custom branding for AR viewer",
      "Analytics dashboard for AR engagement tracking",
      "Secure CDN-hosted 3D assets"
    ],
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "49",
      "priceCurrency": "USD",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter",
          "price": "0",
          "priceCurrency": "USD",
          "description": "3 product uploads per month, standard resolution, web AR viewer, community support"
        },
        {
          "@type": "Offer",
          "name": "Growth",
          "price": "49",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "49",
            "priceCurrency": "USD",
            "billingDuration": "P1M"
          },
          "description": "50 product uploads per month, 4K textures, custom branding, analytics dashboard, priority email support"
        },
        {
          "@type": "Offer",
          "name": "Enterprise",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Unlimited uploads, API access, white-label solution, dedicated success manager, SLA guarantee — custom pricing"
        }
      ]
    },
    "provider": {
      "@type": "Organization",
      "name": "SpaceCheck",
      "url": "https://spacecheck.app",
      "sameAs": [
        "https://twitter.com/spacecheck",
        "https://linkedin.com/company/spacecheck",
        "https://instagram.com/spacecheck"
      ]
    },
    "inLanguage": ["en", "pl"]
  };

  // JSON-LD for FAQ — matches landing page FAQ section
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What do I need to create an AR model with SpaceCheck?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Just a clear product photo and the furniture dimensions (width, height, depth). Upload the photo through the dashboard, enter dimensions in centimeters or inches, and SpaceCheck's AI generates the 3D model automatically. No 3D scanning equipment or technical skills required."
        }
      },
      {
        "@type": "Question",
        "name": "How do I share AR models with customers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Two options: 1) Download a QR code poster to print and display on furniture in your physical store, or 2) Copy HTML embed code to add an AR button to your website. Both work on iPhone and Android without requiring any app download."
        }
      },
      {
        "@type": "Question",
        "name": "Can customers use SpaceCheck AR on their phones?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. SpaceCheck generates USDZ files for iPhones (Apple AR Quick Look) and GLB files for Android (Google Scene Viewer). Customers scan a QR code or tap the AR button on your product page to visualize furniture in their space — no app download needed."
        }
      },
      {
        "@type": "Question",
        "name": "What happens to my models if I cancel my subscription?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your 3D models remain accessible even after cancellation. All AR links, QR codes, and embedded viewers continue working indefinitely. You can still view and share existing models. The only limitation is you'll be restricted to the Starter plan's 3 model uploads per month for new models."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {children}
      <CookieBanner lang={lang} />
    </>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'pl' }];
}
