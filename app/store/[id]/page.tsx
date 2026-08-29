"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function MiniStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Follow States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState("Shop");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 2. Fetch Store Profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", storeId).single();
        if (profile) setStoreProfile(profile);

        // 3. Fetch Store Products (Including ON HOLD & SOLD items)
        const { data: prods } = await supabase.from("products").select("*").eq("dealer_id", storeId).order('created_at', { ascending: false });
        
        if (prods) {
          const { data: pendingOrders } = await supabase
            .from("orders")
            .select("product_id")
            .eq("status", "pending");

          const pendingIds = pendingOrders?.map(o => o.product_id) || [];

          const enrichedProds = prods.map(p => ({
            ...p,
            isOnHold: p.is_sold && pendingIds.includes(p.id)
          }));
          
          setStoreProducts(enrichedProds);
        }

        // 4. Fetch Followers Count
        const { count: followersData } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq('following_id', storeId);
        setFollowersCount(followersData || 0);

        // 5. Fetch Following Count
        const { count: followingData } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq('follower_id', storeId);
        setFollowingCount(followingData || 0);

        // 6. Check if Current User is already following
        if (user) {
          const { data: followCheck } = await supabase.from("follows").select("id").eq('follower_id', user.id).eq('following_id', storeId).maybeSingle();
          if (followCheck) setIsFollowing(true);
        }

      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (storeId) fetchData();
  }, [storeId]);

  // 🚀 FOLLOW / UNFOLLOW HANDLER
  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert("Please login to follow this store.");
      return;
    }
    
    if (currentUser.id === storeId) {
      alert("You cannot follow your own store.");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq('follower_id', currentUser.id).eq('following_id', storeId);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: storeId });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const joinDate = storeProfile?.created_at 
    ? new Date(storeProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : 'Unknown';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-bold text-xs uppercase tracking-widest animate-pulse">Loading Store...</div>;
  if (!storeProfile) return <div className="min-h-screen bg-[#F6F3EE] flex flex-col items-center justify-center text-[#111111]"><p className="mb-4">Store not found.</p><button onClick={() => router.back()} className="text-[#FF3B30] border border-[#FF3B30] px-4 py-2 rounded-xl">Go Back</button></div>;

  // Data Sync Helper Variables
  const displayLogo = storeProfile.store_logo || storeProfile.avatar_url;
  const displayName = storeProfile.store_name || "VERIFIED DEALER";

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] font-sans flex flex-col pb-24 selection:bg-[#FF3B30] selection:text-white relative">
      
      {/* 🚀 PREMIUM TOP NAVIGATION */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-[#F6F3EE]/95 backdrop-blur-md z-40 border-b border-gray-200">
        <div className="flex gap-3 items-center">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#111111] hover:text-[#FF3B30] transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Explore Marketplace</span>
        </div>
        <div className="flex gap-2">
          {/* Share Icon */}
          <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#111111] hover:text-[#FF3B30] transition active:scale-95 shadow-sm">
            {copied ? (
              <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            )}
          </button>
        </div>
      </header>

      <div className="px-5 w-full max-w-xl mx-auto">
        
        {/* 🚀 IDENTITY SECTION */}
        <div className="flex gap-5 items-center mt-4">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FF3B30] via-red-400 to-transparent">
              <div className="w-full h-full bg-[#111111] rounded-full overflow-hidden border-2 border-white flex items-center justify-center shadow-md">
                {displayLogo ? (
                  <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white uppercase">{displayName.charAt(0)}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-[#FF3B30] border-2 border-white rounded-full p-1 shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111] flex items-center gap-2 truncate">
              {displayName}
              <svg className="w-5 h-5 text-[#FF3B30] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1 lowercase truncate">
              the one and only {displayName.split(' ')[0]}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#FCECEC] border border-red-100 px-2 py-1 rounded-[4px] w-fit shrink-0 shadow-sm">
              <svg className="w-3 h-3 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <span className="text-[#FF3B30] font-bold uppercase tracking-widest text-[8px]">Verified Seller</span>
            </div>
          </div>
        </div>

        {/* 🚀 JOINED PILL */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Joined {joinDate}</span>
          </div>
        </div>

        {/* 🚀 ACTION BUTTONS */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={handleFollowToggle}
            disabled={followLoading}
            className={`flex-1 font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm ${
              isFollowing 
                ? 'bg-transparent border border-[#111111] text-[#111111] hover:bg-gray-100' 
                : 'bg-[#111111] text-white hover:bg-black'
            }`}
          >
            {followLoading ? (
              <span className="animate-pulse">Wait...</span>
            ) : isFollowing ? (
              <><svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Following</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg> Follow</>
            )}
          </button>
          
          <button onClick={handleShare} className="flex-1 bg-white border border-gray-200 text-[#111111] font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm">
            {copied ? (
              <><svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Copied!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> Share Store</>
            )}
          </button>
        </div>

        {/* 🚀 STATS GRID */}
        <div className="border border-gray-200 bg-white rounded-[20px] p-4 mt-6 flex justify-between items-center text-center shadow-sm">
          <div className="flex flex-col items-center flex-1">
            <svg className="w-4 h-4 text-[#FF3B30] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-sm font-black text-[#111111] transition-all">{followersCount}</span>
            <span className="text-[8px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">Followers</span>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>

          <div className="flex flex-col items-center flex-1">
            <svg className="w-4 h-4 text-[#FF3B30] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
            <span className="text-sm font-black text-[#111111]">{followingCount}</span>
            <span className="text-[8px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">Following</span>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          
          <div className="flex flex-col items-center flex-1">
            <svg className="w-4 h-4 text-[#FF3B30] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-sm font-black text-[#111111]">{storeProducts.length}</span>
            <span className="text-[8px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">Products</span>
          </div>
        </div>

        {/* 🚀 FAST DROPS ALERT */}
        <div className="mt-4 bg-[#FCECEC] border border-red-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-red-50 transition shadow-sm">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-[#FF3B30] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <div>
              <h4 className="text-xs font-black text-[#111111] uppercase tracking-widest">Fast Drops Alert</h4>
              <p className="text-[9px] text-gray-600 mt-1 font-medium">New pieces drop every week. Follow to stay updated!</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-[#FF3B30] group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </div>

        {/* 🚀 TABS LOGIC */}
        <div className="flex gap-6 mt-6 border-b border-gray-200 hide-scrollbar overflow-x-auto">
          {['Shop', 'About', 'Policies'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-[11px] font-black tracking-widest uppercase transition relative whitespace-nowrap ${activeTab === tab ? 'text-[#FF3B30]' : 'text-gray-400 hover:text-gray-700'}`}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF3B30]"></div>}
            </button>
          ))}
        </div>

        {/* 🚀 TAB: SHOP */}
        {activeTab === 'Shop' && (
          <>
            <div className="flex justify-between items-center py-4 relative">
              <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black text-[#111111] uppercase tracking-widest hover:border-gray-300 transition shadow-sm">
                All Products <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filterDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path></svg>
              </button>
              {filterDropdownOpen && (
                <div className="absolute top-12 left-0 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2 text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#111111] cursor-pointer rounded m-1 transition">Tops</div>
                  <div className="p-2 text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#111111] cursor-pointer rounded m-1 transition">Bottoms</div>
                </div>
              )}

              <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black text-[#111111] uppercase tracking-widest hover:border-gray-300 transition shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg> Newest First <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path></svg>
              </button>
              {sortDropdownOpen && (
                <div className="absolute top-12 right-0 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2 text-[10px] font-black text-[#FF3B30] hover:bg-gray-100 cursor-pointer rounded m-1 transition">Newest First</div>
                  <div className="p-2 text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#111111] cursor-pointer rounded m-1 transition">Price: Low to High</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pb-10">
              {storeProducts.length > 0 ? storeProducts.map((p) => {
                const isNew = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) <= 7;
                return (
                  <Link href={`/product/${p.id}`} key={p.id} className="group relative rounded-[16px] overflow-hidden bg-white border border-gray-200 cursor-pointer block shadow-sm hover:shadow-md transition">
                    <div className="relative aspect-[4/5] bg-gray-100">
                      <img src={p.image_urls?.[0] || p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                      
                      {/* 🔥 ON HOLD / SOLD OUT BADGES HERE */}
                      {p.isOnHold ? (
                        <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm">ON HOLD</div>
                        </div>
                      ) : p.is_sold ? (
                        <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-[#111111] text-white text-[10px] font-black uppercase px-3 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm">SOLD OUT</div>
                        </div>
                      ) : null}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
                    </div>
                    {isNew && !p.is_sold && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#111111] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-[4px] shadow-sm">NEW</span>
                      </div>
                    )}
                    <button onClick={(e) => {e.preventDefault();}} className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-[#111111] hover:text-[#FF3B30] transition border border-gray-200 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </button>
                    <div className="p-3 bg-white flex flex-col justify-between">
                      <h4 className="text-[11px] font-black uppercase text-[#111111] truncate mb-1">{p.title}</h4>
                      <p className="text-[10px] text-gray-500 font-medium mb-2">{p.size ? `Size: ${p.size}` : 'Free Size'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-black text-[#111111]">₹{p.price.toLocaleString('en-IN')}</span>
                        
                        {/* 🔥 DYNAMIC CARD BUTTON */}
                        <div className={`border text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[4px] transition backdrop-blur-md ${p.isOnHold ? 'border-yellow-400 text-yellow-600 bg-yellow-50' : p.is_sold ? 'border-gray-300 text-gray-500 bg-gray-100' : 'border-gray-200 bg-gray-50 text-[#111111]'}`}>
                          {p.isOnHold ? 'ON HOLD' : p.is_sold ? 'SOLD' : 'BUY NOW'}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="col-span-2 text-center py-16 border border-dashed border-gray-300 rounded-2xl bg-white shadow-sm">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No drops available.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 🚀 TAB: ABOUT (Bio, Location, Insta) */}
        {activeTab === 'About' && (
          <div className="py-6 space-y-4 animate-in fade-in duration-300">
            {/* Bio Section */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-[#FF3B30] font-black uppercase tracking-widest text-[11px] mb-3">About the Seller</h3>
              <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                {storeProfile.bio || "Curated thrift. Limited pieces. Maximum style. All items are 1 of 1. When it's gone, it's gone."}
              </p>
            </div>

            {/* Address & Insta details */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 space-y-4 shadow-sm">
              <h3 className="text-[#111111] font-black uppercase tracking-widest text-[11px] mb-2">Seller Details</h3>
              
              {storeProfile.address && storeProfile.address !== "Address not set" && (
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</p>
                    <p className="text-[10px] text-gray-800 mt-0.5 font-medium">{storeProfile.address}</p>
                  </div>
                </div>
              )}

              {storeProfile.instagram && (
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instagram</p>
                    <a href={`https://instagram.com/${storeProfile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FF3B30] font-bold hover:underline mt-0.5 inline-block">
                      @{storeProfile.instagram.replace('@', '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🚀 TAB: POLICIES */}
        {activeTab === 'Policies' && (
          <div className="py-6 space-y-4 animate-in fade-in duration-300">
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-[#FF3B30] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Strict No Return & No Exchange
              </h3>
              <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                All items curated in this store are exclusive, 1-of-1 thrifted or vintage finds. Due to the unique nature and limited availability of our inventory, we operate on a strict no-return, no-exchange, and no-cancellation policy. Once an order is successfully placed and processed, it is considered final. We urge all buyers to carefully review the provided size measurements, detailed descriptions, and product images before completing a purchase to ensure a confident buying experience.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-[#111111] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Quality Assurance
              </h3>
              <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                We uphold a rigorous quality assurance process before any item is dispatched. Because these are pre-loved garments, minor signs of wear are natural and add to the vintage character. Any significant flaws, marks, or defects will always be transparently highlighted in the product description and images. You are guaranteed to receive the exact authentic piece showcased on our platform.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-[#111111] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                Shipping & Dispatch
              </h3>
              <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                Orders are typically processed and dispatched within 24-48 hours of successful payment confirmation. We ensure secure packaging so your exclusive drops reach you safely and in pristine condition.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 🚀 TRUST BADGES FOOTER */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-4 w-full shadow-sm">
        <div className="max-w-xl mx-auto px-5 flex justify-center gap-12 items-center">
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Top Rated</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Authentic</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}