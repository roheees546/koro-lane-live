"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ⏳ NEW: LIVE COUNTDOWN COMPONENT
const ReelCountdown = ({ createdAt }: { createdAt: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!createdAt) return;

    const calculateTime = () => {
      const expiresAt = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;
      const diff = expiresAt - new Date().getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-[#FF3B30]/40 text-[#FF3B30] px-1.5 py-0.5 rounded-[4px] shadow-sm">
      <svg className="w-2.5 h-2.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span className="text-[9px] font-black tracking-widest">{timeLeft}</span>
    </div>
  );
};

export default function DropsReelsFeed() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [sellersMap, setSellersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 📱 Full Screen Reel View State
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);

  // 🔊 GLOBAL SOUND STATE FOR REELS
  const [isMuted, setIsMuted] = useState(true);

  // 🔴 Interactions States
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [activeCommentsReel, setActiveCommentsReel] = useState<string | null>(null);
  
  // 🟢 LIVE COMMENTS STATE
  const [realComments, setRealComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // 🟢 LOAD LIKES FROM LOCAL STORAGE ON MOUNT
  useEffect(() => {
    const savedLikes = localStorage.getItem("koro_liked_reels");
    if (savedLikes) {
      try {
        setLikedReels(JSON.parse(savedLikes));
      } catch (e) {
        console.error("Error loading likes:", e);
      }
    }
  }, []);

  // 🟢 FETCH MAIN FEED (WITH 48 HOUR FILTER)
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const { data: reelsData, error: reelsError } = await supabase
          .from('reels')
          .select('*')
          .gte('created_at', fortyEightHoursAgo)
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
              .select('id, title, price, image_url, is_sold') 
              .in('id', Array.from(productIds));

            if (productsData) {
              const pMap: Record<string, any> = {};
              productsData.forEach((p: any) => {
                p.status = p.is_sold ? 'sold' : 'available';
                pMap[p.id] = p;
              });

              const allProductIds = productsData.map((p: any) => p.id);
              if (allProductIds.length > 0) {
                 const { data: ordersData } = await supabase
                   .from("orders")
                   .select("product_id, status")
                   .in("product_id", allProductIds)
                   .neq("status", "cancelled"); 
                   
                 if (ordersData) {
                    ordersData.forEach(order => {
                       if (order.status === 'delivered' || order.status === 'dispatched') {
                          pMap[order.product_id].status = 'sold';
                       } else {
                          pMap[order.product_id].status = 'on_hold';
                       }
                    });
                 }
              }
              setProductsMap({...pMap});
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
        } else {
          setReels([]);
        }
      } catch (err) {
        console.error("Error fetching feed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  // 🟢 FETCH REAL COMMENTS
  useEffect(() => {
    if (!activeCommentsReel) return;
    
    const fetchComments = async () => {
      setIsLoadingComments(true);
      const { data, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', activeCommentsReel)
        .order('created_at', { ascending: true }); 

      if (!error && data) {
        setRealComments(data);
      }
      setIsLoadingComments(false);
    };

    fetchComments();
  }, [activeCommentsReel]);

  useEffect(() => {
    if (selectedReelIndex !== null && fullScreenContainerRef.current) {
      const targetElement = fullScreenContainerRef.current.children[selectedReelIndex] as HTMLElement;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'instant' });
      }
    }
  }, [selectedReelIndex]);

  // Handlers
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const toggleLike = (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation();
    setLikedReels(prev => {
      const newState = { ...prev, [reelId]: !prev[reelId] };
      localStorage.setItem("koro_liked_reels", JSON.stringify(newState));
      return newState;
    });
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

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newComment.trim() || !activeCommentsReel) return;

    const currentText = newComment;
    setNewComment(""); 

    const tempComment = { id: Date.now(), user_name: "You", comment_text: currentText };
    setRealComments(prev => [...prev, tempComment]);

    const { error } = await supabase
      .from('reel_comments')
      .insert({
        reel_id: activeCommentsReel,
        user_name: "Thrift Lover", 
        comment_text: currentText
      });

    if (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#F6F3EE] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#FF3B30] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest mt-4">Loading Feed...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#F6F3EE] flex flex-col items-center justify-center text-[#111111]">
        <h2 className="text-lg font-black text-gray-500 uppercase">No Drops Yet</h2>
        <p className="text-xs text-gray-600 mt-2">Check back later for new thrift items.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#F6F3EE] font-sans text-[#111111] pb-[80px] max-w-[450px] mx-auto overflow-x-hidden">
      
      {/* 🟢 TOP HEADER */}
      <div className="sticky top-0 z-40 bg-[#F6F3EE]/95 backdrop-blur-md p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-black tracking-wide flex items-center gap-2 text-[#111111]">
          LIVE DROPS <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] animate-pulse"></span>
        </h1>
        <span className="text-xs font-bold text-gray-500">{reels.length} Active</span>
      </div>

      {/* 📱 1. 3-COLUMN GRID FEED (Main Page) */}
      <div className="grid grid-cols-3 gap-0.5 bg-gray-200 w-full">
        {reels.map((reel, index) => {
          const pinnedProductId = reel.parsed_product_ids?.[0];
          const product = pinnedProductId ? productsMap[pinnedProductId] : null;
          const seller = sellersMap[reel.dealer_id];

          return (
            <div 
              key={reel.id} 
              onClick={() => setSelectedReelIndex(index)}
              className="relative aspect-[9/16] bg-white group overflow-hidden cursor-pointer"
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
                  <div className="w-5 h-5 rounded-full bg-white border border-[#FF3B30]/50 overflow-hidden shadow-lg">
                    {seller.store_logo ? (
                      <img src={seller.store_logo} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[8px] font-black text-[#111111]">{seller.store_name?.charAt(0) || "S"}</span>
                    )}
                  </div>
                </div>
              )}

              {product && (
                <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col gap-0.5 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${product.status === 'available' ? 'bg-[#FF3B30] animate-pulse' : 'bg-gray-400'}`}></span>
                    <span className="text-[9px] font-bold text-white drop-shadow-md truncate leading-tight">
                      {product.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-[11px] font-black drop-shadow-md ${product.status === 'available' ? 'text-white' : 'text-gray-300 line-through'}`}>
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
            onClick={() => {
              setSelectedReelIndex(null);
              setIsMuted(true);
            }}
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
                    muted={isMuted}
                    playsInline
                    onClick={toggleMute}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none"></div>

                  <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 flex justify-between items-start pointer-events-none">
                    <div 
                      onClick={(e) => handleStoreClick(e, reel.dealer_id)}
                      className="flex items-center gap-3 pointer-events-auto cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#111111] font-black text-xs shrink-0 shadow-lg border-2 border-[#FF3B30] overflow-hidden group-active:scale-95 transition">
                        {seller?.store_logo ? (
                          <img src={seller.store_logo} alt="Store" className="w-full h-full object-cover" />
                        ) : (
                          seller?.store_name?.charAt(0) || "S"
                        )}
                      </div>
                      <div className="flex flex-col drop-shadow-md">
                        <div className="flex items-center gap-1 group-active:scale-95 transition">
                          <span className="font-bold text-sm text-white">{seller?.store_name || "Unknown Store"}</span>
                          <svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        </div>
                        
                        {/* 🔥 COUNTDOWN TIMER INSERTED HERE */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-200 font-medium">Live Thrift Drop 🌿</span>
                          <ReelCountdown createdAt={reel.created_at} />
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* 🔥 ACTIONS COLUMN */}
                  <div className="absolute bottom-32 right-4 z-30 flex flex-col items-center gap-6 pointer-events-auto">
                    
                    {/* 🔊 SOUND TOGGLE BUTTON */}
                    <button onClick={toggleMute} className="flex flex-col items-center gap-1 group active:scale-95 transition">
                      <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition">
                        {isMuted ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{isMuted ? 'Muted' : 'Sound'}</span>
                    </button>

                    <button onClick={(e) => toggleLike(e, reel.id)} className="flex flex-col items-center gap-1 group active:scale-95 transition">
                      <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition">
                        <svg className={`w-6 h-6 transition ${isLiked ? 'text-[#FF3B30] fill-[#FF3B30] animate-bounce' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  {/* 🔥 PRODUCT CARD OVERLAY */}
                  {product && (
                    <div 
                      className="absolute bottom-24 left-4 z-30 pointer-events-auto cursor-pointer animate-fade-in-up" 
                      onClick={(e) => handleProductClick(e, product.id)}
                    >
                      <div className="w-[140px] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-[16px] p-2 flex flex-col shadow-2xl transition-all duration-300">
                        
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${product.status === 'available' ? 'bg-[#FF3B30]' : 'bg-gray-400'}`}></span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${product.status === 'available' ? 'text-[#FF3B30]' : 'text-gray-500'}`}>
                            {product.status === 'on_hold' ? 'ON HOLD' : product.status === 'sold' ? 'SOLD OUT' : 'NOW SHOWING'}
                          </span>
                        </div>
                        
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 relative bg-gray-100 border border-gray-200">
                          <img 
                            src={product.image_url || "https://placehold.co/400x400/F6F3EE/111111?text=No+Image"} 
                            alt={product.title} 
                            className={`w-full h-full object-cover transition duration-500 ${product.status !== 'available' ? 'grayscale opacity-40' : ''}`} 
                          />
                          {product.status !== 'available' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                              <span className="text-[10px] font-black text-[#111111] px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
                                {product.status === 'on_hold' ? 'HELD' : 'SOLD'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="px-1 pb-1">
                          <h3 className="text-[10px] font-bold leading-tight text-[#111111] mb-1 line-clamp-1">{product.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-black ${product.status === 'available' ? 'text-[#111111]' : 'text-gray-400 line-through'}`}>
                              ₹{product.price}
                            </span>
                            {product.status === 'available' && (
                              <div className="bg-[#111111] text-white rounded-full p-1.5 shadow-sm">
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

      {/* 💬 3. COMMENTS BOTTOM SHEET MODAL */}
      {activeCommentsReel && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCommentsReel(null)}></div>
          
          <div className="relative w-full h-[60%] bg-white rounded-t-3xl border-t border-gray-200 flex flex-col animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-w-[450px] mx-auto text-[#111111]">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-black text-sm text-[#111111] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
              </h3>
              <button onClick={() => setActiveCommentsReel(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-[#111111]">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {isLoadingComments ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : realComments.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-xs font-bold">Be the first to comment!</p>
                </div>
              ) : (
                realComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-700 shrink-0">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500">{comment.user_name || "User"}</span>
                      <p className="text-xs text-[#111111] mt-0.5 font-medium">{comment.comment_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-[#F6F3EE]">
              <form onSubmit={postComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-xs text-[#111111] outline-none focus:border-[#FF3B30] font-medium"
                />
                <button type="submit" disabled={!newComment.trim()} className="w-9 h-9 bg-[#111111] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-400 shadow-sm">
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