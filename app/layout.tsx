import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav"; // 🔥 NEW: Bottom Navigation Import

// Preserving your exact Google Font
const inter = Inter({ subsets: ["latin"] });

// Preserving your exact Metadata
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
      {/* 
        Merged classes: 
        1. inter.className (Your font)
        2. Outer Background (Dark grey) & centering logic for App Shell 
      */}
      <body className={`${inter.className} bg-[#050505] text-white flex justify-center min-h-screen selection:bg-[#00e599] selection:text-black`}>
        
        {/* 🔥 THE MOBILE APP SHELL (Max Width 450px) */}
        <div className="w-full max-w-[450px] bg-black min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-x-hidden border-x border-gray-900/50">
          
          {/* Main Application Container */}
          <main className="flex-grow pb-24">
            {children}
          </main>

          {/* 🔥 GLOBAL APP NAVIGATION */}
          <BottomNav />
          
        </div>
      </body>
    </html>
  );
}