import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Pack Generator",
  description: "Generate professional tech packs from designer sample descriptions and inspiration images",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
