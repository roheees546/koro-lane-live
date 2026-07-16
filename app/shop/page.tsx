"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Tops", "Bottoms", "Hoodies", "Jackets", "Y2K", "Vintage"];
  const filters = ["Price", "Newest", "Size", "Condition", "Sellers"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // 1. Fetch all products
      const { data: prods } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .order("created_at", { ascending: false });

      if (prods) {
        // 2. Fetch pending orders to calculate ON HOLD status
        const { data: pendingOrders } = await supabase
          .from("orders")
          .select("product_id")
          .eq("status", "pending");

        const pendingIds = pendingOrders?.map((o) => o.product_id) || [];

        // 3. Attach isOnHold
        const enrichedProds = prods.map((p) => ({
          ...p,
          isOnHold: p.is_sold && pendingIds.includes(p.id),
        }));

        setProducts(enrichedProds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase animate-pulse">
        Loading Archive...
      </div>
    );
  }

  // Derived states for UI
  const justDropped = products.slice(0, 5); // First 5 items for the top row

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative selection:bg-[#00e599] selection:text-black">
      
      {/* 🚀 TOP NAV & LOGO */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-[#050505]/90 backdrop-blur-md z-40">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          KORO<span className="text-gray-300">LANE</span>
        </h1>
        <div className="flex gap-4 items-center">
          <button className="relative text-gray-300 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#00e599] rounded-full border border-black"></span>
          </button>
          <button className="text-gray-300 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </button>
        </div>
      </header>

      {/* 🚀 SEARCH BAR */}
      <div className="px-5 mt-1">
        <div className="bg-[#121214] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search rare pieces, sellers, styles..." className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500" />
          <button className="bg-[#1a1a1c] p-1.5 rounded-lg border border-gray-700 text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </button>
        </div>
      </div>

      {/* 🚀 CATEGORY PILLS */}
      <div className="mt-4 px-5">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap text-xs font-bold ${
                activeCategory === cat
                  ? "bg-[#003320]/20 border-[#00e599] text-white"
                  : "bg-[#121214] border-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              {cat === "All" && activeCategory === "All" && (
                <svg className="w-3.5 h-3.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              )}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 SECONDARY FILTERS */}
      <div className="mt-2 px-5">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {filters.map((filter) => (
            <button key={filter} className="bg-[#0a0a0c] border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] text-gray-300 font-bold uppercase tracking-widest whitespace-nowrap hover:bg-[#121214] transition">
              {filter}
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 JUST DROPPED (Horizontal Scroll) */}
      <div className="mt-6">
        <div className="px-5 flex justify-between items-center mb-3">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span className="text-[#00e599]">⚡</span> Just Dropped
          </h2>
          <button className="text-[10px] text-[#00e599] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
            View All <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
          {justDropped.map((item, idx) => (
            <div key={idx} onClick={() => handleCardClick(item.id)} className="w-[100px] shrink-0 snap-start flex flex-col items-center cursor-pointer group">
              <div className="w-full aspect-square bg-[#121214] rounded-xl border border-gray-800 relative overflow-hidden group-hover:border-gray-600 transition">
                <img src={item.image_urls?.[0] || item.image_url} className="w-full h-full object-cover" alt="" />
                {/* Live Green Dot */}
                {!item.is_sold && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#00e599] rounded-full shadow-[0_0_8px_rgba(0,229,153,1)]"></div>
                )}
              </div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mt-2">{Math.floor(Math.random() * 59) + 1}m ago</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 MAIN GRID */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-4">
        {products.map((p) => {
          const isNew = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) <= 7;
          
          return (
            <div key={p.id} onClick={() => handleCardClick(p.id)} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl overflow-hidden cursor-pointer group hover:border-gray-800 transition flex flex-col">
              
              <div className="relative aspect-[4/5] bg-[#121214] overflow-hidden">
                <img src={p.image_urls?.[0] || p.image_url} alt={p.title} className={`w-full h-full object-cover transition duration-700 group-hover:scale-105 ${p.is_sold && !p.isOnHold ? 'grayscale opacity-40' : ''}`} />
                
                {/* Background Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                {/* Wishlist Button (absolute top right) */}
                <div className="absolute top-2 right-2 z-20">
                  <WishlistButton productId={p.id} onRequireAuth={() => {}} />
                </div>

                {/* 🔥 SMART BADGES (Top Left) */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {p.isOnHold ? (
                    <div className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      ON HOLD <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                  ) : p.is_sold ? (
                    <div className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg">
                      SOLD OUT
                    </div>
                  ) : isNew ? (
                    <div className="bg-[#00e599] text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg">
                      NEW
                    </div>
                  ) : null}
                </div>

                {/* Sold out big text overlay */}
                {p.is_sold && !p.isOnHold && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg">SOLD OUT</h3>
                    <p className="text-[8px] text-gray-300 mt-1 uppercase tracking-widest">This piece is already gone.</p>
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col flex-grow bg-[#0a0a0c]">
                <h3 className="text-xs font-bold text-white truncate mb-1">{p.title}</h3>
                <p className="text-sm font-black text-[#00e599] mb-1">₹{p.price.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1 mb-3">
                  <p className="text-[10px] text-gray-500 truncate">{p.profiles?.store_name || "Verified Dealer"}</p>
                  <svg className="w-3 h-3 text-[#00e599] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
                </div>
                
                <div className="flex justify-between items-center mt-auto border-t border-gray-900 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      <span className="text-[9px] font-bold">{Math.floor(Math.random() * 300) + 50}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                      <span className="text-[9px] font-bold">5.0</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-600 font-bold tracking-widest">1-of-1</span>
                </div>
                
                {/* Notify Me Button if Sold Out */}
                {p.is_sold && !p.isOnHold && (
                  <button onClick={(e) => { e.stopPropagation(); alert("Added to waitlist! We'll notify you if a similar item drops."); }} className="mt-3 w-full border border-[#00e599]/30 text-[#00e599] text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg hover:bg-[#00e599]/10 transition">
                    Notify Me
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 BOTTOM INFO BANNER */}
      <div className="mt-8 px-5">
        <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Only 1 piece per item. When it's gone, it's gone.</p>
          </div>
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </div>
      </div>

      {/* 🚀 FLOATING ACTION BUTTON (Filters) */}
      <button className="fixed bottom-24 right-5 w-14 h-14 bg-[#00e599] text-black rounded-full shadow-[0_0_20px_rgba(0,229,153,0.4)] flex items-center justify-center hover:scale-105 transition z-40 active:scale-95">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
      </button>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}