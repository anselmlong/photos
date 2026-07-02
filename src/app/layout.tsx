import "@/styles/globals.css";

import { type Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";

export const metadata: Metadata = {
  title: "Anselm Long — Photography",
  description: "Portraits, weddings, events, and motion work by Anselm Long",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Anselm Long — Photography",
    description: "Capturing authentic moments with warmth and artistry",
    type: "website",
  },
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["300", "400", "500"],
});

const ecosystemFooterLinkStyle = {
  color: "#888",
  fontSize: "0.8rem",
  textDecoration: "none",
  opacity: 0.8,
  letterSpacing: "0.02em",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${playfair.variable} ${sourceSans.variable}`}>
      <body className="bg-background text-foreground min-h-screen">
        {children}
        <div style={{ textAlign: "center", padding: "2rem 1rem 1.5rem" }}>
          <a
            href="https://anselmlong.com?from=photos"
            style={ecosystemFooterLinkStyle}
          >
            &larr; part of anselmlong.com
          </a>
        </div>
      </body>
    </html>
  );
}
