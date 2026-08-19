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
      // 1. Current user ka session nikalo
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?role=buyer');
        return;
      }

      const userId = session.user.id;

      // 2. Wishlist table se user ke saare product_ids nikalo
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId);

      if (wishlistError) throw wishlistError;

      if (wishlistData && wishlistData.length > 0) {
        const productIds = wishlistData.map(item => item.product_id);

        // 3. Products table se un IDs ka actual data nikalo
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        
        if (productsData) {
          setProducts(productsData);
        }
      } else {
        setProducts([]); // Agar wishlist khali hai
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
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#00e599] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#00e599] text-[10px] font-black uppercase tracking-widest mt-4">Loading Saved Drops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white w-full pb-24 min-h-screen max-w-[450px] mx-auto overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-5 pt-6 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-40 border-b border-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition p-1.5 rounded-full bg-[#121214] border border-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-lg font-black tracking-widest uppercase flex items-center gap-2">
            My <span className="text-[#00e599]">Wishlist</span> ❤️
          </h1>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-[#121214] px-2 py-1 rounded-md border border-gray-800">
          {products.length} Items
        </span>
      </header>

      <div className="pt-6">
        {products.length === 0 ? (
          /* 🛑 EMPTY STATE UI */
          <div className="flex flex-col items-center justify-center pt-24 px-5 text-center animate-fade-in">
            <div className="w-20 h-20 bg-[#121214] border border-gray-800 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl grayscale opacity-50">💔</span>
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-2">No Saved Drops</h2>
            <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest leading-relaxed max-w-[250px]">
              You haven't saved any 1-of-1 pieces yet. Start exploring before they sell out!
            </p>
            <Link href="/shop" className="bg-[#00e599] text-black font-black uppercase tracking-widest text-[10px] px-8 py-3.5 rounded-xl hover:bg-white transition shadow-[0_0_20px_rgba(0,229,153,0.2)]">
              Explore Drops
            </Link>
          </div>
        ) : (
          /* 🛍️ 3-COLUMN WISHLIST GRID */
          <div className="grid grid-cols-3 gap-2 px-5 pb-4 animate-fade-in-up">
            {products.map((product) => (
              <div key={product.id} onClick={() => handleCardClick(product.id)} className="w-full bg-[#0a0a0c] border border-gray-900 rounded-xl overflow-hidden relative cursor-pointer hover:border-gray-700 transition flex flex-col group">
                
                <div className="relative aspect-[4/5] bg-gray-900 overflow-hidden">
                  {/* Image hover zoom effect */}
                  <img src={product.image_urls?.[0] || product.image_url} alt={product.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  
                  {/* Wishlist Button (to unsave) */}
                  <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                    <WishlistButton productId={product.id} onRequireAuth={() => {}} />
                  </div>
                  
                  <span className="absolute top-2 left-2 bg-[#003320] text-[#00e599] text-[7px] font-bold px-1.5 py-0.5 rounded z-10 uppercase tracking-widest shadow-md">
                    {product.category || 'TOP'}
                  </span>
                  
                  {product.is_sold && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1 tracking-widest shadow-xl rotate-[-12deg] rounded-sm">SOLD OUT</div>
                    </div>
                  )}
                </div>

                <div className="p-2 flex flex-col flex-grow justify-between bg-gradient-to-t from-black to-[#0a0a0c]">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase truncate text-gray-200">{product.title}</h4>
                    <p className="text-[8px] text-gray-500 mt-0.5">{product.size || 'Free Size'}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-black text-white">₹{product.price.toLocaleString('en-IN')}</span>
                    {/* Small arrow icon for UI flair */}
                    <svg className="w-3 h-3 text-gray-600 group-hover:text-[#00e599] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}