"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DropsReelsFeed() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReelsAndProducts = async () => {
      try {
        // 1. Fetch saari reels database se (latest first)
        const { data: reelsData, error: reelsError } = await supabase
          .from('reels')
          .select('*')
          .order('created_at', { ascending: false });

        if (reelsError) throw reelsError;

        if (reelsData && reelsData.length > 0) {
          setReels(reelsData);

          // 2. Saare unique product IDs nikal lo jo reels mein pin hain
          const productIds = new Set<string>();
          reelsData.forEach(reel => {
            if (reel.product_ids && reel.product_ids.length > 0) {
              reel.product_ids.forEach((id: string) => productIds.add(id));
            }
          });

          // 3. Un sabhi products ka data fetch kar lo
          if (productIds.size > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('id, title, price, image_url, status')
              .in('id', Array.from(productIds));

            if (!productsError && productsData) {
              const pMap: Record<string, any> = {};
              productsData.forEach(p => {
                pMap[p.id] = p;
              });
              setProductsMap(pMap);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching feed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReelsAndProducts();
  }, []);

  // 🎯 THE MAGIC ROUTER: Seedha tere existing product/checkout page pe bhejne ke liye
  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#00e599] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#00e599] text-xs font-black uppercase tracking-widest mt-4">Loading Drops...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-black text-gray-500 uppercase">No Drops Yet</h2>
        <p className="text-xs text-gray-600 mt-2">Check back later for new thrift items.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[100dvh] bg-black font-sans text-white overflow-y-scroll snap-y snap-mandatory hide-scrollbar max-w-[450px] mx-auto"
    >
      {reels.map((reel) => {
        // Reel ka pehla pinned product utha rahe hain
        const pinnedProductId = reel.product_ids?.[0];
        const product = pinnedProductId ? productsMap[pinnedProductId] : null;

        return (
          <div key={reel.id} className="relative w-full h-[100dvh] snap-start bg-zinc-950 flex-shrink-0">
            
            {/* 🎥 THE VIDEO PLAYER */}
            <video 
              src={reel.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

            {/* 🚀 TOP HEADER */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-safe-top flex justify-between items-start pointer-events-none">
              <div className="flex items-center gap-3 pointer-events-auto">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-black text-xs shrink-0 shadow-lg">
                  KL
                </div>
                <div className="flex flex-col drop-shadow-md">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm">KoRo Lane</span>
                    <svg className="w-3.5 h-3.5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  <span className="text-xs text-gray-300">Live Thrift Drop 🌿</span>
                </div>
              </div>
            </div>

            {/* 🛍️ "NOW SHOWING" MAGIC WIDGET */}
            {product && (
              <div 
                className="absolute top-24 right-4 z-30 pointer-events-auto cursor-pointer group animate-fade-in-up" 
                onClick={() => handleProductClick(product.id)}
              >
                <div className="w-[110px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col shadow-2xl hover:border-[#00e599]/50 transition-all duration-300">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span>
                    <span className="text-[#00e599] text-[7px] font-black uppercase tracking-widest">
                      {product.status === 'on_hold' ? 'ON HOLD' : product.status === 'sold' ? 'SOLD OUT' : 'NOW SHOWING'}
                    </span>
                  </div>
                  
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 relative bg-zinc-900">
                    <img src={product.image_url || "https://placehold.co/100"} alt="Current Item" className={`w-full h-full object-cover transition duration-500 ${product.status !== 'available' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    {product.status !== 'available' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-[10px] font-black text-white px-2 py-1 bg-black/80 rounded backdrop-blur-sm">
                          {product.status === 'on_hold' ? 'HELD' : 'SOLD'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-[9px] font-black uppercase leading-tight text-white mb-1 line-clamp-1">{product.title}</h3>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[11px] font-black ${product.status === 'available' ? 'text-[#00e599]' : 'text-gray-500 line-through'}`}>
                      ₹{product.price}
                    </span>
                    {product.status === 'available' && (
                      <div className="bg-[#00e599] text-black rounded-full p-1 group-hover:scale-110 transition">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 💬 BOTTOM ENGAGEMENT UI */}
            <div className="absolute bottom-20 right-4 z-20 flex flex-col items-center gap-4 pointer-events-auto">
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-95 transition">
                  <svg className="w-5 h-5 text-white group-hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">1.2k</span>
              </button>
              
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-95 transition">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Share</span>
              </button>
            </div>

            <div className="absolute bottom-6 left-4 right-20 z-20 pointer-events-auto">
               <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 text-xs text-gray-300">
                  Awesome thrift drop! 🔥 Add a comment...
               </div>
            </div>

          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}