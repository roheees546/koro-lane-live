"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MiniStorePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", storeId).single();
      if (profile) setStoreProfile(profile);

      // 2. Fetch Products
      const { data: prods } = await supabase.from("products").select("*").eq("dealer_id", storeId);
      if (prods) setStoreProducts(prods);
    };
    fetchData();
  }, [storeId]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative selection:bg-[#00e599] selection:text-black">
      
      {/* 🔥 SUBTLE NAVIGATION: Koro Lane Watermark (Top Left) */}
      <div className="absolute top-5 left-5 z-20">
        <Link href="/" className="text-[9px] text-gray-700 hover:text-[#00e599] font-black uppercase tracking-widest transition flex items-center gap-1.5 opacity-60 hover:opacity-100">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Koro Lane
        </Link>
      </div>

      <div className="p-6 flex-grow max-w-6xl mx-auto w-full pt-20">
        {/* 🏪 DEALER IDENTITY HEADER */}
        <header className="mb-14 flex flex-col items-center text-center">
          {/* Store Logo/Avatar */}
          <div className="w-20 h-20 bg-[#003320] border-2 border-[#00e599] rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(0,229,153,0.15)] mb-4">
            {storeProfile?.logo_url ? (
              <img src={storeProfile.logo_url} alt="Store Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-[#00e599] uppercase">{storeProfile?.store_name ? storeProfile.store_name.charAt(0) : "S"}</span>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">{storeProfile?.store_name || "Loading Store..."}</h1>
          <div className="mt-3 inline-flex items-center gap-2 bg-[#003320]/40 border border-[#00e599]/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,229,153,0.1)]">
            <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span>
            <p className="text-[#00e599] font-bold uppercase tracking-widest text-[9px]">Verified Dealer</p>
          </div>
        </header>

        {/* 👕 PRODUCT GRID (Premium Look) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {storeProducts.length > 0 ? storeProducts.map((p) => (
            <div key={p.id} className="bg-[#0a0a0c] border border-gray-900 rounded-xl overflow-hidden cursor-pointer hover:border-[#00e599]/50 transition group flex flex-col relative">
              {p.is_sold && (
                 <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center backdrop-blur-sm">
                   <span className="bg-red-600/20 text-red-500 text-[10px] font-black uppercase px-3 py-1 tracking-widest rotate-12 border border-red-500/50 rounded shadow-[0_0_15px_rgba(239,68,68,0.3)]">SOLD OUT</span>
                 </div>
              )}
              <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden">
                <img src={p.image_urls?.[0] || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={p.title} />
              </div>
              <div className="p-3 flex flex-col flex-grow justify-between">
                <div>
                  <h4 className="text-[11px] font-bold uppercase line-clamp-2 text-gray-200">{p.title}</h4>
                  <p className="text-[9px] text-gray-500 mt-1 italic">1-of-1 Condition</p>
                </div>
                <div className="mt-3 flex justify-between items-end">
                  <span className="text-sm font-black text-white">₹{p.price.toLocaleString('en-IN')}</span>
                  {/* Dummy Buy Button for visual appeal */}
                  <span className="text-[#00e599] text-[8px] font-black uppercase tracking-widest border border-[#00e599]/30 px-2 py-1 rounded">View</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No active drops right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔥 SUBTLE FOOTER */}
      <footer className="border-t border-gray-900 py-8 mt-10 text-center bg-[#050505]">
        <Link href="/" className="text-[9px] text-gray-700 hover:text-[#00e599] font-bold uppercase tracking-widest transition">
          Explore the full Koro Lane Marketplace
        </Link>
      </footer>
    </div>
  );
}