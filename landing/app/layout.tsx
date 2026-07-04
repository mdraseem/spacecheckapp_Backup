import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="antialiased dark">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
