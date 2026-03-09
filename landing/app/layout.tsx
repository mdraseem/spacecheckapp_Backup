import "./globals.css";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang } = await params;

  return (
    <html lang={lang || 'en'}>
      <head />
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
