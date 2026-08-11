"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DropsReelsFeed() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [sellersMap, setSellersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 🔴 RESTORED: All your original Interactions States
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [activeCommentsReel, setActiveCommentsReel] = useState<string | null>(null);
  const [dummyComments, setDummyComments] = useState<any[]>([
    { id: 1, user: "Aman", text: "Bhai kya price hai iska?" },
    { id: 2, user: "Sneha", text: "Looks dope! 🔥" },
    { id: 3, user: "Rahul", text: "Is this size L?" }
  ]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // 1. Fetch reels
        const { data: reelsData, error: reelsError } = await supabase
          .from('reels')
          .select('*')
          .order('created_at', { ascending: false });

        if (reelsError) throw reelsError;

        if (reelsData && reelsData.length > 0) {
          const productIds = new Set<string>();
          const sellerIds = new Set<string>();

          // Process each reel
          reelsData.forEach(reel => {
            sellerIds.add(reel.dealer_id);
            
            let pIds: string[] = [];
            if (Array.isArray(reel.product_ids)) {
              pIds = reel.product_ids.map((id: any) => String(id));
            } else if (typeof reel.product_ids === 'string') {
              pIds = reel.product_ids.replace(/[\[\]"]/g, '').split(',');
            }
            
            pIds = pIds.filter(id => id.length === 36 && id.includes('-'));
            pIds.forEach((id: string) => productIds.add(id));
            reel.parsed_product_ids = pIds; 
          });

          setReels(reelsData);

          // 2. Fetch Products
          if (productIds.size > 0) {
            const { data: productsData } = await supabase
              .from('products')
              .select('id, title, price, image_url, status')
              .in('id', Array.from(productIds));

            if (productsData) {
              const pMap: Record<string, any> = {};
              productsData.forEach(p => { pMap[p.id] = p; });
              setProductsMap(pMap);
            }
          }

          // 3. Fetch Sellers (Profile)
          if (sellerIds.size > 0) {
            const { data: sellersData } = await supabase
              .from('profiles')
              .select('id, store_name, store_logo')
              .in('id', Array.from(sellerIds));

            if (sellersData) {
              const sMap: Record<string, any> = {};
              sellersData.forEach(s => { sMap[s.id] = s; });
              setSellersMap(sMap);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching feed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  // 🔴 RESTORED: All your original Handlers
  const toggleLike = (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation(); // Prevents opening the product when clicking like
    setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleStoreClick = (e: React.MouseEvent, dealerId: string) => {
    e.stopPropagation();
    router.push(`/store/${dealerId}`);
  };

  const handleCommentClick = (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation();
    setActiveCommentsReel(reelId);
  };

  const handleShare = async (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation();
    const shareData = {
      title: 'Koro Lane Drop',
      text: 'Check out this awesome thrift drop!',
      url: window.location.href, 
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.log("Error sharing", err);
    }
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newComment.trim()) return;
    setDummyComments([...dummyComments, { id: Date.now(), user: "You", text: newComment }]);
    setNewComment("");
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#00e599] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#00e599] text-[10px] font-black uppercase tracking-widest mt-4">Loading Grid...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-lg font-black text-gray-500 uppercase">No Drops Yet</h2>
        <p className="text-xs text-gray-600 mt-2">Check back later for new thrift items.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-black font-sans text-white pb-[80px] max-w-[450px] mx-auto overflow-x-hidden">
      
      {/* 🟢 TOP HEADER */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md p-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-lg font-black tracking-wide flex items-center gap-2">
          LIVE DROPS <span className="w-2.5 h-2.5 rounded-full bg-[#00e599] animate-pulse"></span>
        </h1>
        <span className="text-xs font-bold text-gray-400">{reels.length} Active</span>
      </div>

      {/* 📱 3-COLUMN GRID FEED */}
      <div className="grid grid-cols-3 gap-0.5 bg-zinc-900 w-full">
        {reels.map((reel) => {
          const pinnedProductId = reel.parsed_product_ids?.[0];
          const product = pinnedProductId ? productsMap[pinnedProductId] : null;
          const seller = sellersMap[reel.dealer_id];
          const isLiked = likedReels[reel.id];

          return (
            <div 
              key={reel.id} 
              onClick={() => pinnedProductId && handleProductClick(pinnedProductId)}
              className="relative aspect-[9/16] bg-black group overflow-hidden cursor-pointer"
            >
              {/* 🎥 VIDEO MINI PLAYER */}
              <video 
                src={reel.video_url}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
              
              {/* Dark Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

              {/* 🏪 SELLER AVATAR (Top Left) */}
              {seller && (
                <div 
                  className="absolute top-2 left-2 z-20 flex items-center gap-1 active:scale-90 transition-transform"
                  onClick={(e) => handleStoreClick(e, reel.dealer_id)}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-900 border border-[#00e599]/50 overflow-hidden shadow-lg">
                    {seller.store_logo ? (
                      <img src={seller.store_logo} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[10px] font-black">{seller.store_name?.charAt(0) || "S"}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 💬 MINI ACTION BUTTONS (Right Side) - RESTORED */}
              <div className="absolute top-1/2 -translate-y-1/2 right-1 z-20 flex flex-col items-center gap-3">
                {/* Like */}
                <button onClick={(e) => toggleLike(e, reel.id)} className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full active:scale-90 transition">
                  <svg className={`w-3.5 h-3.5 transition ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
                {/* Comment */}
                <button onClick={(e) => handleCommentClick(e, reel.id)} className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full active:scale-90 transition">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </button>
                {/* Share */}
                <button onClick={(e) => handleShare(e, reel.id)} className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full active:scale-90 transition">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                </button>
              </div>

              {/* 🛍️ PRODUCT INFO (Bottom) */}
              {product && (
                <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${product.status === 'available' ? 'bg-[#00e599] animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-[9px] font-bold text-white drop-shadow-md truncate leading-tight">
                      {product.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-[11px] font-black drop-shadow-md ${product.status === 'available' ? 'text-[#00e599]' : 'text-red-400 line-through'}`}>
                      ₹{product.price}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔴 RESTORED: 💬 COMMENTS BOTTOM SHEET MODAL */}
      {activeCommentsReel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          {/* Backdrop Click to close */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCommentsReel(null)}></div>
          
          <div className="relative w-full h-[60%] bg-[#121214] rounded-t-3xl border-t border-gray-800 flex flex-col animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-[450px] mx-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                Comments
              </h3>
              <button onClick={() => setActiveCommentsReel(null)} className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {dummyComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                    {comment.user.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500">{comment.user}</span>
                    <p className="text-xs text-white mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0c]">
              <form onSubmit={postComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-[#1a1a1d] border border-gray-800 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-[#00e599]/50"
                />
                <button type="submit" disabled={!newComment.trim()} className="w-9 h-9 bg-[#00e599] rounded-full flex items-center justify-center text-black disabled:opacity-50 disabled:bg-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}