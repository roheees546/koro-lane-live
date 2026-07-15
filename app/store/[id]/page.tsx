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

  // Tab State
  const [activeTab, setActiveTab] = useState("Shop");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", storeId).single();
        if (profile) setStoreProfile(profile);

        // 2. Fetch Products
        const { data: prods } = await supabase.from("products").select("*").eq("dealer_id", storeId).eq("is_sold", false);
        if (prods) setStoreProducts(prods);
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (storeId) fetchData();
  }, [storeId]);

  // Format Join Date from Supabase
  const joinDate = storeProfile?.created_at 
    ? new Date(storeProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : 'Unknown';

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold text-xs uppercase tracking-widest animate-pulse">Loading Store...</div>;
  }

  if (!storeProfile) {
    return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><p className="mb-4">Store not found.</p><button onClick={() => router.back()} className="text-[#00e599] border border-[#00e599] px-4 py-2 rounded">Go Back</button></div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col pb-24 selection:bg-[#00e599] selection:text-black">
      
      {/* 🚀 PREMIUM TOP NAVIGATION */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-[#050505]/90 backdrop-blur-md z-40">
        <div className="flex gap-3 items-center">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121214] border border-gray-800 text-white hover:text-[#00e599] transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Explore Marketplace</span>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121214] border border-gray-800 text-white hover:text-[#00e599] transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121214] border border-gray-800 text-white hover:text-[#00e599] transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
        </div>
      </header>

      <div className="px-5 w-full max-w-xl mx-auto">
        
        {/* 🚀 IDENTITY SECTION */}
        <div className="flex gap-5 items-start mt-2">
          {/* Avatar with Status Ring & Badge */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#00e599] via-emerald-400 to-transparent">
              <div className="w-full h-full bg-black rounded-full overflow-hidden border-2 border-black flex items-center justify-center">
                {storeProfile.avatar_url ? (
                  <img src={storeProfile.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-[#00e599] uppercase">{storeProfile.store_name ? storeProfile.store_name.charAt(0) : "S"}</span>
                )}
              </div>
            </div>
            {/* Blue tick replacement -> Green verified tick */}
            <div className="absolute bottom-0 right-0 bg-[#00e599] border-2 border-[#050505] rounded-full p-1">
              <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 pt-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              {storeProfile.store_name || "VERIFIED DEALER"}
              <svg className="w-5 h-5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
            </h1>
            
            <p className="text-xs text-gray-400 font-medium mt-1 lowercase">
              the one and only {storeProfile.store_name?.split(' ')[0] || "dealer"}
            </p>

            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#003320]/30 border border-[#00e599]/30 px-2 py-1 rounded w-fit">
              <svg className="w-3 h-3 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
              <span className="text-[#00e599] font-bold uppercase tracking-widest text-[8px]">Verified Seller</span>
            </div>
          </div>
        </div>

        {/* 🚀 PILLS ROW (Location, Date, Insta) */}
        <div className="flex flex-wrap gap-2 mt-4">
          {storeProfile.address && (
            <div className="flex items-center gap-1.5 bg-[#121214] border border-gray-800 px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest truncate max-w-[150px]">{storeProfile.address}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#121214] border border-gray-800 px-3 py-1.5 rounded-full">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Joined {joinDate}</span>
          </div>
          {storeProfile.instagram && (
            <a href={`https://instagram.com/${storeProfile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#121214] border border-gray-800 px-3 py-1.5 rounded-full hover:border-pink-500/50 transition">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">@{storeProfile.instagram.replace('@', '')}</span>
            </a>
          )}
        </div>

        {/* 🚀 BIO */}
        <div className="mt-5">
          <p className="text-xs text-gray-300 leading-relaxed">
            {storeProfile.bio || "Curated thrift. Limited pieces. Maximum style. All items are 1 of 1. When it's gone, it's gone."}
          </p>
          <button className="text-[#00e599] text-xs font-bold mt-1 hover:underline">See more</button>
        </div>

        {/* 🚀 ACTION BUTTONS */}
        <div className="flex gap-3 mt-5">
          <button className="flex-1 bg-[#00e599] text-black font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-emerald-400 transition flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Follow
          </button>
          <button className="flex-1 bg-[#121214] border border-gray-800 text-white font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-gray-900 transition flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            Message
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-[#121214] border border-gray-800 rounded-xl hover:text-[#00e599] transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
          </button>
        </div>

        {/* 🚀 STRICT 0-BASED STATS GRID */}
        <div className="border border-gray-800 bg-[#0a0a0c] rounded-2xl p-4 mt-6 flex justify-between items-center text-center">
          {/* Followers (Fake blocked, real counts from 0) */}
          <div className="flex flex-col items-center">
            <svg className="w-4 h-4 text-[#00e599] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-sm font-black text-white">0</span>
            <span className="text-[8px] text-gray-500 mt-0.5">Followers</span>
          </div>
          <div className="w-px h-8 bg-gray-800"></div>
          
          {/* Products (Real Live Data) */}
          <div className="flex flex-col items-center">
            <svg className="w-4 h-4 text-[#00e599] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-sm font-black text-white">{storeProducts.length}</span>
            <span className="text-[8px] text-gray-500 mt-0.5">Products</span>
          </div>
          <div className="w-px h-8 bg-gray-800"></div>
          
          {/* Rating (0-based setup) */}
          <div className="flex flex-col items-center">
            <svg className="w-4 h-4 text-yellow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            <span className="text-sm font-black text-white">0.0</span>
            <span className="text-[8px] text-gray-500 mt-0.5">(0 reviews)</span>
          </div>
          <div className="w-px h-8 bg-gray-800"></div>
          
          {/* Views */}
          <div className="flex flex-col items-center">
            <svg className="w-4 h-4 text-[#00e599] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <span className="text-sm font-black text-white">0</span>
            <span className="text-[8px] text-gray-500 mt-0.5">Views</span>
          </div>
          <div className="w-px h-8 bg-gray-800"></div>
          
          {/* Response Rate */}
          <div className="flex flex-col items-center">
            <svg className="w-4 h-4 text-[#00e599] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-sm font-black text-white">0%</span>
            <span className="text-[8px] text-gray-500 mt-0.5">Response</span>
          </div>
        </div>

        {/* 🚀 FAST DROPS ALERT */}
        <div className="mt-4 bg-[#003320]/10 border border-[#00e599]/20 rounded-xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#003320]/20 transition">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-[#00e599] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Fast Drops Alert</h4>
              <p className="text-[9px] text-gray-400 mt-1">New pieces drop every week. Follow to stay updated!</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-[#00e599] group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </div>

        {/* 🚀 TABS */}
        <div className="flex gap-6 mt-6 border-b border-gray-800 hide-scrollbar overflow-x-auto">
          {['Shop', 'About', 'Reviews (0)', 'Policies'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition relative whitespace-nowrap ${activeTab === tab ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00e599]"></div>}
            </button>
          ))}
        </div>

        {/* 🚀 FILTERS BAR */}
        <div className="flex justify-between items-center py-4">
          <button className="flex items-center gap-2 bg-[#121214] border border-gray-800 px-4 py-2 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:border-gray-600 transition">
            All Products <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <button className="flex items-center gap-2 bg-[#121214] border border-gray-800 px-4 py-2 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:border-gray-600 transition">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg> Newest First <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

        {/* 🚀 PRODUCTS GRID (Grailed Vibe) */}
        {activeTab === 'Shop' && (
          <div className="grid grid-cols-2 gap-3 mt-2 pb-10">
            {storeProducts.length > 0 ? storeProducts.map((p) => (
              <div key={p.id} className="group relative rounded-xl overflow-hidden bg-[#0a0a0c] border border-gray-900 cursor-pointer">
                
                {/* Product Image & Dark Bottom Gradient */}
                <div className="relative aspect-[4/5] bg-gray-900">
                  <img src={p.image_urls?.[0] || p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-[#00e599]/20 text-[#00e599] border border-[#00e599]/30 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">NEW</span>
                </div>
                <button className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:text-red-500 transition border border-white/10">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>

                {/* Info & Buy Content (Overlaid on Bottom Gradient) */}
                <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col z-20">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider truncate shadow-black drop-shadow-md mb-0.5">{p.title}</h4>
                  <p className="text-[8px] text-gray-300 font-medium tracking-wide shadow-black drop-shadow-md mb-2">{p.size ? `Size: ${p.size}` : 'Free Size'}</p>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[13px] font-black text-[#00e599] shadow-black drop-shadow-md">₹{p.price.toLocaleString('en-IN')}</span>
                    <button className="border border-white/20 hover:border-[#00e599] hover:bg-[#00e599]/10 text-white hover:text-[#00e599] text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition backdrop-blur-md">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-16 border border-dashed border-gray-800 rounded-xl bg-[#0a0a0c]">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No active drops right now.</p>
                <p className="text-[#00e599] text-[8px] uppercase tracking-widest mt-1">Seller is preparing new heat.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🚀 TRUST BADGES FOOTER */}
      <footer className="mt-auto border-t border-gray-900 bg-[#0a0a0c] py-4 w-full">
        <div className="max-w-xl mx-auto px-5 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Top Rated</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Authentic</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Returns</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}