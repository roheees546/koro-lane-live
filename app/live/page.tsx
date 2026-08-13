"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DropsReelsFeed() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [sellersMap, setSellersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 📱 Full Screen Reel View State
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);

  // 🔴 Interactions States
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [activeCommentsReel, setActiveCommentsReel] = useState<string | null>(null);
  
  // 🟢 LIVE COMMENTS STATE (Replaced Dummy Comments)
  const [realComments, setRealComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // 🟢 FETCH MAIN FEED
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data: reelsData, error: reelsError } = await supabase
          .from('reels')
          .select('*')
          .order('created_at', { ascending: false });

        if (reelsError) throw reelsError;

        if (reelsData && reelsData.length > 0) {
          const productIds = new Set<string>();
          const sellerIds = new Set<string>();

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

  // 🟢 FETCH REAL COMMENTS (Jab Modal khule)
  useEffect(() => {
    if (!activeCommentsReel) return;
    
    const fetchComments = async () => {
      setIsLoadingComments(true);
      const { data, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', activeCommentsReel)
        .order('created_at', { ascending: true }); // Purane upar, naye neeche

      if (!error && data) {
        setRealComments(data);
      }
      setIsLoadingComments(false);
    };

    fetchComments();
  }, [activeCommentsReel]);

  // Full Screen open hone par clicked reel par scroll scroll down
  useEffect(() => {
    if (selectedReelIndex !== null && fullScreenContainerRef.current) {
      const targetElement = fullScreenContainerRef.current.children[selectedReelIndex] as HTMLElement;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'instant' });
      }
    }
  }, [selectedReelIndex]);

  // Handlers
  const toggleLike = (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation();
    setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
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

  // 🟢 REAL POST COMMENT LOGIC
  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newComment.trim() || !activeCommentsReel) return;

    const currentText = newComment;
    setNewComment(""); // Clear input instantly for snappy UI

    // Optimistic Update: Show immediately on UI
    const tempComment = { id: Date.now(), user_name: "You", comment_text: currentText };
    setRealComments(prev => [...prev, tempComment]);

    // Save to Supabase
    const { error } = await supabase
      .from('reel_comments')
      .insert({
        reel_id: activeCommentsReel,
        user_name: "Thrift Lover", // TODO: Replace with real user's name later
        comment_text: currentText
      });

    if (error) {
      console.error("Error posting comment:", error);
    }
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

      {/* 📱 1. 3-COLUMN GRID FEED (Main Page) */}
      <div className="grid grid-cols-3 gap-0.5 bg-zinc-900 w-full">
        {reels.map((reel, index) => {
          const pinnedProductId = reel.parsed_product_ids?.[0];
          const product = pinnedProductId ? productsMap[pinnedProductId] : null;
          const seller = sellersMap[reel.dealer_id];

          return (
            <div 
              key={reel.id} 
              onClick={() => setSelectedReelIndex(index)}
              className="relative aspect-[9/16] bg-black group overflow-hidden cursor-pointer"
            >
              <video 
                src={reel.video_url}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>

              {seller && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gray-900 border border-[#00e599]/50 overflow-hidden shadow-lg">
                    {seller.store_logo ? (
                      <img src={seller.store_logo} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[8px] font-black">{seller.store_name?.charAt(0) || "S"}</span>
                    )}
                  </div>
                </div>
              )}

              {product && (
                <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col gap-0.5 pointer-events-none">
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

      {/* 🎬 2. FULL SCREEN SWIPEABLE REELS OVERLAY (Opens on Click) */}
      {selectedReelIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black max-w-[450px] mx-auto overflow-hidden animate-fade-in">
          
          <button 
            onClick={() => setSelectedReelIndex(null)}
            className="absolute top-4 right-4 z-50 w-9 h-9 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white text-base active:scale-90 transition"
          >
            ✕
          </button>

          <div 
            ref={fullScreenContainerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
          >
            {reels.map((reel) => {
              const pinnedProductId = reel.parsed_product_ids?.[0];
              const product = pinnedProductId ? productsMap[pinnedProductId] : null;
              const seller = sellersMap[reel.dealer_id];
              const isLiked = likedReels[reel.id];

              return (
                <div 
                  key={reel.id} 
                  className="relative w-full h-[100dvh] snap-start bg-zinc-950 flex-shrink-0 flex items-center justify-center overflow-hidden"
                >
                  <video 
                    src={reel.video_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

                  <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 flex justify-between items-start pointer-events-none">
                    <div 
                      onClick={(e) => handleStoreClick(e, reel.dealer_id)}
                      className="flex items-center gap-3 pointer-events-auto cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg border-2 border-[#00e599] overflow-hidden group-active:scale-95 transition">
                        {seller?.store_logo ? (
                          <img src={seller.store_logo} alt="Store" className="w-full h-full object-cover" />
                        ) : (
                          seller?.store_name?.charAt(0) || "S"
                        )}
                      </div>
                      <div className="flex flex-col drop-shadow-md">
                        <div className="flex items-center gap-1 group-active:scale-95 transition">
                          <span className="font-bold text-sm text-white">{seller?.store_name || "Unknown Store"}</span>
                          <svg className="w-3.5 h-3.5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        </div>
                        <span className="text-[10px] text-gray-300">Live Thrift Drop 🌿</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-32 right-4 z-30 flex flex-col items-center gap-6 pointer-events-auto">
                    <button onClick={(e) => toggleLike(e, reel.id)} className="flex flex-col items-center gap-1 group active:scale-95 transition">
                      <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition">
                        <svg className={`w-6 h-6 transition ${isLiked ? 'text-red-500 fill-red-500 animate-bounce' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{isLiked ? '1' : '0'}</span>
                    </button>

                    <button onClick={(e) => handleCommentClick(e, reel.id)} className="flex flex-col items-center gap-1 group active:scale-95 transition">
                      <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">Chat</span>
                    </button>

                    <button onClick={(e) => handleShare(e, reel.id)} className="flex flex-col items-center gap-1 group active:scale-95 transition">
                      <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
                    </button>
                  </div>

                  {product && (
                    <div 
                      className="absolute bottom-24 left-4 z-30 pointer-events-auto cursor-pointer animate-fade-in-up" 
                      onClick={(e) => handleProductClick(e, product.id)}
                    >
                      <div className="w-[140px] bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col shadow-2xl hover:border-[#00e599]/50 transition-all duration-300">
                        
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${product.status === 'available' ? 'bg-[#00e599]' : 'bg-red-500'}`}></span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${product.status === 'available' ? 'text-[#00e599]' : 'text-red-500'}`}>
                            {product.status === 'on_hold' ? 'ON HOLD' : product.status === 'sold' ? 'SOLD OUT' : 'NOW SHOWING'}
                          </span>
                        </div>
                        
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 relative bg-zinc-900 border border-white/5">
                          <img 
                            src={product.image_url || "https://placehold.co/400x400/121214/00e599?text=No+Image"} 
                            alt={product.title} 
                            className={`w-full h-full object-cover transition duration-500 ${product.status !== 'available' ? 'grayscale opacity-40' : ''}`} 
                          />
                          {product.status !== 'available' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                              <span className="text-[10px] font-black text-white px-2 py-1 bg-black/80 rounded border border-white/10">
                                {product.status === 'on_hold' ? 'HELD' : 'SOLD'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="px-1 pb-1">
                          <h3 className="text-[10px] font-bold leading-tight text-white mb-1 line-clamp-1">{product.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-black ${product.status === 'available' ? 'text-white' : 'text-gray-500 line-through'}`}>
                              ₹{product.price}
                            </span>
                            {product.status === 'available' && (
                              <div className="bg-[#00e599] text-black rounded-full p-1.5 shadow-[0_0_10px_rgba(0,229,153,0.3)]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 w-full h-[150px] bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none"></div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 💬 3. COMMENTS BOTTOM SHEET MODAL (Works in Full Screen too) */}
      {activeCommentsReel && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCommentsReel(null)}></div>
          
          <div className="relative w-full h-[60%] bg-[#121214] rounded-t-3xl border-t border-gray-800 flex flex-col animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-[450px] mx-auto">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                Comments
              </h3>
              <button onClick={() => setActiveCommentsReel(null)} className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:text-white">✕</button>
            </div>

            {/* 🟢 REAL COMMENTS LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {isLoadingComments ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#00e599] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : realComments.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-xs font-bold">Be the first to comment!</p>
                </div>
              ) : (
                realComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500">{comment.user_name || "User"}</span>
                      <p className="text-xs text-white mt-0.5">{comment.comment_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

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
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
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