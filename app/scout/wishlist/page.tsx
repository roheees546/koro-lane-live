"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton"; 

export default function BuyerWishlistPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?role=buyer');
        return;
      }

      const userId = session.user.id;

      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId);

      if (wishlistError) throw wishlistError;

      if (wishlistData && wishlistData.length > 0) {
        const productIds = wishlistData.map(item => item.product_id);

        // 🔥 FILTER: Added is_sold = false to only show available drops
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_sold', false) 
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        
        // Ensure we also filter out items that might be shipped/delivered in orders table
        if (productsData && productsData.length > 0) {
           const fetchedIds = productsData.map(p => p.id);
           const { data: ordersData } = await supabase
            .from("orders")
            .select("product_id, status")
            .in("product_id", fetchedIds)
            .neq("status", "cancelled");

           const orderMap: Record<string, string> = {};
           if (ordersData) {
             ordersData.forEach(o => { orderMap[o.product_id] = o.status; });
           }

           const filteredProds = productsData.filter((p) => {
             const status = orderMap[p.id];
             if (status === 'delivered' || status === 'dispatched' || status === 'shipped') {
               return false;
             }
             return true;
           }).map((p) => ({
             ...p,
             isOnHold: !!orderMap[p.id]
           }));

           setProducts(filteredProds);
        } else {
           setProducts([]);
        }

      } else {
        setProducts([]); 
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (productId: string) => { 
    router.push(`/product/${productId}`); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-bold tracking-widest text-xs uppercase animate-pulse">
        Loading Saved Drops...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] font-sans pb-24 relative selection:bg-[#FF3B30] selection:text-white">
      
      {/* 🚀 HEADER */}
      <header className="px-5 pt-4 pb-3 sticky top-0 bg-[#F6F3EE]/95 backdrop-blur-md z-40 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#111111] hover:text-[#FF3B30] transition shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-1.5">
            SAVED <span className="text-[#FF3B30]">DROPS</span>
          </h1>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-1 rounded-[4px] border border-gray-200 shadow-sm uppercase tracking-widest">
          {products.length} Items
        </span>
      </header>

      <div className="pt-6">
        {products.length === 0 ? (
          /* 🛑 EMPTY STATE UI */
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center animate-fade-in border border-dashed border-gray-300 rounded-2xl mx-5 bg-white shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#111111] mb-1">No Saved Drops</h2>
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest leading-relaxed px-6">
              You haven't saved any 1-of-1 pieces yet. Start exploring before they sell out!
            </p>
            <Link href="/shop" className="bg-[#111111] text-white font-black uppercase tracking-widest text-[10px] px-8 py-3.5 rounded-xl hover:bg-black transition shadow-md">
              Explore Drops
            </Link>
          </div>
        ) : (
          /* 🛍️ 2-COLUMN WISHLIST GRID (Consistent with Home/Shop UI) */
          <div className="grid grid-cols-2 gap-4 px-5 pb-4 animate-fade-in-up">
            {products.map((product) => (
              <div key={product.id} onClick={() => handleCardClick(product.id)} className="w-full h-full flex flex-col bg-[#FFFFFF] border border-gray-200 rounded-[16px] overflow-hidden relative cursor-pointer hover:shadow-md transition">
                
                <div className="relative w-full pt-[125%] bg-gray-100 flex-none overflow-hidden">
                  <div className="absolute inset-0 w-full h-full">
                    
                    <img src={product.image_urls?.[0] || product.image_url} alt={product.title} className="w-full h-full object-cover transition duration-700 hover:scale-105" />
                    
                    <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                      <WishlistButton productId={product.id} onRequireAuth={() => {}} />
                    </div>
                    
                    <span className="absolute top-2 left-2 bg-[#111111] text-white text-[8px] font-black px-2 py-1 rounded-[4px] z-10 uppercase tracking-widest">{product.category || 'TOP'}</span>
                    
                    {product.isOnHold && (
                      <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm">ON HOLD</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col flex-1 bg-white">
                  <h4 className="text-[11px] font-bold uppercase text-[#111111] line-clamp-2 leading-tight mb-0.5">{product.title}</h4>
                  <p className="text-[10px] text-gray-500 font-medium mb-1.5">{product.size || 'M'}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[14px] font-black text-[#FF3B30]">₹{product.price.toLocaleString('en-IN')}</span>
                    <svg className="w-4 h-4 text-gray-400 hover:text-[#111111] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        body, html { background-color: #F6F3EE !important; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}