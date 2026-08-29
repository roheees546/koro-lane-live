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
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] w-full pb-24">
      {/* 🚀 PREMIUM HEADER */}
      <header className="px-5 py-4 flex flex-col gap-2 sticky top-0 bg-[#F6F3EE]/95 backdrop-blur z-30 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-[#111111] transition bg-white p-2 rounded-full border border-gray-200 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-base font-black flex items-center gap-2 text-[#111111]">
            <svg className="w-5 h-5 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            Verified Sellers
          </h1>
        </div>
        <p className="text-[10px] text-gray-500 font-bold ml-12 uppercase tracking-widest">Trusted sellers. Quality thrift.</p>
        
        {/* Top Filters */}
        <div className="flex justify-between items-center mt-3 ml-1">
          <div className="flex gap-2">
            <span className="bg-[#FCECEC] border border-red-200 text-[#FF3B30] text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">All Sellers</span>
          </div>
          <span className="bg-white text-[#111111] text-[9px] font-black px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> {sellers.length} Sellers
          </span>
        </div>
      </header>

      {/* 🚀 SELLERS GRID */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center mt-20">
            <span className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-200 bg-[#FCECEC] px-4 py-2 rounded-full shadow-sm">
              Loading Directory...
            </span>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">No sellers found yet.</p>
            <p className="text-[#FF3B30] text-[9px] uppercase tracking-widest font-black">Onboarding in progress!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sellers.map((seller) => (
              <Link href={`/store/${seller.id}`} key={seller.id} className="bg-white border border-gray-200 rounded-[20px] flex flex-col relative overflow-hidden group block hover:border-[#FF3B30]/50 transition shadow-sm">
                
                {/* Background Image with Light Fade */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  {seller.bgImage ? (
                    <img src={seller.bgImage} className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition duration-500" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-[#F6F3EE]"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="p-3 flex flex-col items-center w-full z-10 pt-6">
                  
                  {/* Seller DP */}
                  <div className="w-14 h-14 bg-[#111111] border-2 border-white rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-md mb-2 relative group-hover:border-[#FF3B30] transition">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt={seller.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-black text-white text-center uppercase">
                        {seller.store_name ? seller.store_name.substring(0, 2) : 'KL'}
                      </span>
                    )}
                  </div>

                  {/* Verified Badge */}
                  <div className="bg-[#FF3B30] text-white text-[7px] font-black px-2 py-0.5 rounded-[3px] uppercase tracking-widest mb-1.5 flex items-center gap-0.5 shadow-sm">
                    VERIFIED <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>
                  
                  {/* Store Name & Address */}
                  <h4 className="text-sm font-black text-[#111111] w-full truncate text-center group-hover:text-[#FF3B30] transition">
                    {seller.store_name || "VERIFIED DEALER"}
                  </h4>
                  <p className="text-[9px] text-gray-500 font-medium mt-1 flex items-center justify-center gap-0.5 w-full truncate px-2">
                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {seller.address || 'Dehradun, Uttarakhand'}
                  </p>
                  
                  {/* Stats Divider */}
                  <div className="mt-4 w-full border-t border-gray-100 pt-3 flex justify-center items-center">
                    <div className="flex items-center gap-2 bg-[#F6F3EE] px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                      <div className="flex flex-col items-start justify-center">
                        <span className="text-[11px] font-black text-[#111111] leading-none mb-[2px]">{seller.productCount}</span>
                        <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest leading-none">Active Drops</span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Store Button */}
                  <div className="w-full mt-4 bg-[#111111] text-white rounded-xl py-2.5 text-[9px] uppercase font-black tracking-widest text-center group-hover:bg-black transition flex items-center justify-center gap-1 shadow-sm">
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