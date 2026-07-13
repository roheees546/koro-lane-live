"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WishlistButton({ productId, onRequireAuth }: { productId: string, onRequireAuth: () => void }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkWishlist(); }, []);

  const checkWishlist = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('wishlist').select('id').eq('user_id', session.user.id).eq('product_id', productId).single();
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
    } else {
      await supabase.from('wishlist').insert([{ user_id: session.user.id, product_id: productId }]);
      setIsSaved(true);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={toggleWishlist} 
      disabled={loading}
      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition z-10 
        ${isSaved ? 'bg-[#00e599]/20 text-[#00e599]' : 'bg-black/40 text-white hover:bg-black/60'}`}
    >
      <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
    </button>
  );
}