"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellersAndStats();
  }, []);

  const fetchSellersAndStats = async () => {
    try {
      // 1. Fetch all profiles with role 'dealer'
      const { data: dealers, error: dealerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'dealer');
      
      if (dealerError) throw dealerError;

      if (dealers && dealers.length > 0) {
        // 2. Fetch active products for these dealers to get count & background image
        const dealerIds = dealers.map(d => d.id);
        const { data: products } = await supabase
          .from('products')
          .select('id, dealer_id, image_url, image_urls')
          .eq('is_sold', false)
          .in('dealer_id', dealerIds);

        // 3. Map products to their respective dealers
        const enhancedDealers = dealers.map(dealer => {
          const sellerProducts = products?.filter(p => p.dealer_id === dealer.id) || [];
          const latestProduct = sellerProducts[0];
          const bgImage = latestProduct?.image_urls?.[0] || latestProduct?.image_url || null;

          return {
            ...dealer,
            productCount: sellerProducts.length,
            bgImage: bgImage
          };
        });

        // 🔥 SMART FILTER: Remove duplicate/dummy copies automatically
        // Agar ek hi naam ke multiple store hain, toh usko rakhega jisme products zyada hain.
        const uniqueSellersMap = new Map();
        enhancedDealers.forEach(dealer => {
          const storeName = (dealer.store_name || "VERIFIED DEALER").toLowerCase().trim();
          
          if (!uniqueSellersMap.has(storeName) || uniqueSellersMap.get(storeName).productCount < dealer.productCount) {
            uniqueSellersMap.set(storeName, dealer);
          }
        });

        // Convert Map back to array
        const finalSellers = Array.from(uniqueSellersMap.values());
        setSellers(finalSellers);
      } else {
        setSellers([]);
      }
    } catch (error) {
      console.error("Error fetching sellers data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full pb-24">
      {/* 🚀 PREMIUM HEADER */}
      <header className="px-5 py-4 flex flex-col gap-2 sticky top-0 bg-black/95 backdrop-blur z-30 border-b border-gray-900">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition bg-[#121214] p-2 rounded-full border border-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-base font-black flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
            Verified Sellers
          </h1>
        </div>
        <p className="text-[10px] text-gray-500 font-medium ml-12">Trusted sellers. Quality thrift.</p>
        
        {/* Top Filters */}
        <div className="flex justify-between items-center mt-3 ml-1">
          <div className="flex gap-2">
            <span className="bg-[#003320]/30 border border-[#00e599]/30 text-[#00e599] text-[9px] font-bold px-3 py-1.5 rounded-full">All Sellers</span>
          </div>
          <span className="bg-[#121214] text-gray-300 text-[9px] font-bold px-3 py-1.5 rounded-full border border-gray-800 flex items-center gap-1">
            <svg className="w-3 h-3 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> {sellers.length} Sellers
          </span>
        </div>
      </header>

      {/* 🚀 SELLERS GRID */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center mt-20">
            <span className="text-[#00e599] text-[10px] font-bold uppercase tracking-widest animate-pulse border border-[#00e599]/30 bg-[#003320]/20 px-4 py-2 rounded-full">
              Loading Directory...
            </span>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">No sellers found yet.</p>
            <p className="text-[#00e599] text-[9px] uppercase tracking-widest">Onboarding in progress!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sellers.map((seller) => (
              <Link href={`/store/${seller.id}`} key={seller.id} className="bg-[#0a0a0c] border border-gray-800 rounded-2xl flex flex-col relative overflow-hidden group block hover:border-[#00e599]/50 transition shadow-lg">
                
                {/* Background Image with Dark Fade */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  {seller.bgImage ? (
                    <img src={seller.bgImage} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition duration-500" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent"></div>
                </div>

                {/* Heart Icon (Top Right) */}
                <button onClick={(e) => e.preventDefault()} className="absolute top-3 right-3 z-20 text-gray-400 hover:text-[#00e599] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>

                {/* Content Container */}
                <div className="p-3 flex flex-col items-center w-full z-10 pt-6">
                  
                  {/* Seller DP */}
                  <div className="w-14 h-14 bg-black border-2 border-gray-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)] mb-2 relative group-hover:border-[#00e599]/50 transition">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt={seller.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-black text-gray-400 text-center uppercase">
                        {seller.store_name ? seller.store_name.substring(0, 2) : 'KL'}
                      </span>
                    )}
                  </div>

                  {/* Verified Badge */}
                  <div className="bg-[#003320] border border-[#00e599]/30 text-[#00e599] text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest mb-1.5 flex items-center gap-0.5 shadow-sm">
                    VERIFIED <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  
                  {/* Store Name & Address */}
                  <h4 className="text-sm font-black text-white w-full truncate text-center group-hover:text-[#00e599] transition">
                    {seller.store_name || "VERIFIED DEALER"}
                  </h4>
                  <p className="text-[8px] text-gray-400 mt-1 flex items-center justify-center gap-0.5 w-full truncate px-2">
                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {seller.address || 'Dehradun, Uttarakhand'}
                  </p>
                  
                  {/* Stats Divider (FIXED GAP) */}
                  <div className="mt-4 w-full border-t border-gray-800/80 pt-3 flex justify-center items-center">
                    <div className="flex items-center gap-2 bg-[#0a0a0c]/80 px-3 py-1.5 rounded-full border border-gray-800">
                      <svg className="w-3.5 h-3.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                      <div className="flex flex-col items-start justify-center">
                        <span className="text-[11px] font-black text-white leading-none mb-[2px]">{seller.productCount}</span>
                        <span className="text-[6px] text-gray-400 uppercase tracking-widest leading-none">Active Drops</span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Store Button */}
                  <div className="w-full mt-4 border border-gray-800 text-gray-300 rounded-lg py-2.5 text-[9px] uppercase font-bold tracking-widest text-center group-hover:bg-[#00e599]/10 group-hover:border-[#00e599]/40 group-hover:text-[#00e599] transition flex items-center justify-center gap-1">
                    Visit Store →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}