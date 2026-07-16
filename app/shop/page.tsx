"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Filter States
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Tops", "Bottoms", "Hoodies", "Jackets", "Y2K", "Vintage"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .order("created_at", { ascending: false });

      if (prods) {
        const { data: pendingOrders } = await supabase
          .from("orders")
          .select("product_id")
          .eq("status", "pending");

        const pendingIds = pendingOrders?.map((o) => o.product_id) || [];

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

  // 🔥 THE MAGIC ENGINE 2.0: Super Smart Filtering logic
  const filteredProducts = products.filter((p) => {
    // 1. Category Filter Match (Smart plural/singular detection)
    let matchesCategory = false;
    if (activeCategory === "All") {
      matchesCategory = true;
    } else {
      const dbCat = (p.category || "").toLowerCase();
      const uiCat = activeCategory.toLowerCase();
      // Remove 's' from UI category to match database (Tops -> top, Bottoms -> bottom)
      const baseUiCat = uiCat.endsWith('s') ? uiCat.slice(0, -1) : uiCat; 
      
      // Check if DB category matches the base UI category
      if (dbCat && (dbCat.includes(baseUiCat) || uiCat.includes(dbCat))) {
        matchesCategory = true;
      }
    }
    
    // 2. Search Query Match (Checks Title OR Seller Name safely)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.title && p.title.toLowerCase().includes(searchLower)) || 
      (p.profiles?.store_name && p.profiles.store_name.toLowerCase().includes(searchLower));
      
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase animate-pulse">
        Loading Archive...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative selection:bg-[#00e599] selection:text-black">
      
      {/* 🚀 TOP NAV */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-[#050505]/90 backdrop-blur-md z-40">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          KORO<span className="text-white">LANE</span>
        </h1>
      </header>

      {/* 🚀 SEARCH BAR */}
      <div className="px-5 mt-1">
        <div className="bg-[#121214] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search rare pieces, sellers, styles..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
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

      {/* 🚀 MAIN GRID */}
      <div className="px-5 mt-6">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isNew = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) <= 7;
              
              return (
                <div key={p.id} onClick={() => handleCardClick(p.id)} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl overflow-hidden cursor-pointer group hover:border-gray-800 transition flex flex-col">
                  
                  <div className="relative aspect-[4/5] bg-[#121214] overflow-hidden">
                    <img src={p.image_urls?.[0] || p.image_url} alt={p.title} className={`w-full h-full object-cover transition duration-700 group-hover:scale-105 ${p.is_sold && !p.isOnHold ? 'grayscale opacity-40' : ''}`} />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                    <div className="absolute top-2 right-2 z-20">
                      <WishlistButton productId={p.id} onRequireAuth={() => {}} />
                    </div>

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

                    {p.is_sold && !p.isOnHold && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg">SOLD OUT</h3>
                        <p className="text-[8px] text-gray-300 mt-1 uppercase tracking-widest">Piece is gone.</p>
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
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Authentic
                      </span>
                      <span className="text-[9px] text-[#00e599] bg-[#003320]/30 px-2 py-0.5 rounded font-bold tracking-widest">1-OF-1</span>
                    </div>
                    
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
        ) : (
          /* 🔥 PREMIUM "NO RESULTS" STATE */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-2xl bg-[#121214]/50">
            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Drops Found</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center px-6">
              Try searching a different style, seller, or clear your filters.
            </p>
            <button onClick={() => {setSearchQuery(""); setActiveCategory("All");}} className="mt-6 text-[10px] text-[#00e599] border border-[#00e599]/30 px-4 py-2 rounded-lg font-bold uppercase tracking-widest hover:bg-[#00e599]/10 transition">
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 🚀 BOTTOM INFO BANNER */}
      <div className="mt-8 px-5">
        <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Only 1 piece per item. When it's gone, it's gone.</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}