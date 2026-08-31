"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WishlistButton({ productId, onRequireAuth }: { productId: string, onRequireAuth: () => void }) {
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchWishlistData(); 
  }, [productId]);

  const fetchWishlistData = async () => {
    // 1. Total Likes Count nikal lo
    const { count } = await supabase
      .from('wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);
    
    setLikesCount(count || 0);

    // 2. Check karo agar logged-in user ne save kiya hai
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('wishlist').select('id').eq('user_id', session.user.id).eq('product_id', productId).maybeSingle();
    if (data) setIsSaved(true);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the product card
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      onRequireAuth(); // Triggers global auth modal if not logged in
      return;
    }

    setLoading(true);
    if (isSaved) {
      await supabase.from('wishlist').delete().eq('user_id', session.user.id).eq('product_id', productId);
      setIsSaved(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('wishlist').insert([{ user_id: session.user.id, product_id: productId }]);
      setIsSaved(true);
      setLikesCount(prev => prev + 1);

      // 🔥 TERA NOTIFICATION JADOO YAHAN HAI
      try {
        const { data: product } = await supabase
          .from('products')
          .select('dealer_id, title')
          .eq('id', productId)
          .single();

        if (product && product.dealer_id) {
          await supabase.from('notifications').insert([{
            user_id: product.dealer_id,
            title: "New Like! ❤️",
            message: `Kisine aapka "${product.title}" wishlist mein save kiya hai!`
          }]);
        }
      } catch (error) {
        console.error("Notification fire hone mein error aaya:", error);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <button 
        onClick={toggleWishlist} 
        disabled={loading}
        className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition shadow-sm border 
          ${isSaved ? 'bg-white text-[#FF3B30] border-gray-200' : 'bg-white/80 text-[#111111] hover:text-[#FF3B30] hover:bg-white border-white/40'}`}
      >
        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
      </button>
      {/* 🔥 Like Count with light text shadow for visibility on dark images */}
      <span className="text-[10px] font-black text-[#111111] drop-shadow-[0_0_3px_rgba(255,255,255,1)]">{likesCount}</span>
    </div>
  );
}