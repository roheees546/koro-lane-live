import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Korolane Vault | Premium Surplus",
  description: "Exclusive curated surplus marketplace for dealers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Main Application Container */}
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}