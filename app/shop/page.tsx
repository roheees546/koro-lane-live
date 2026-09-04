"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";

export default function ShopPage() { // Renamed to ShopPage for clarity, change to Home if needed
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Filter States
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 NAYE FILTERS (Gender add kar diya list mein)
  const categories = ["All", "Tops", "Bottoms", "Male", "Female", "Unisex", "Hoodies", "Jackets", "Vintage"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // 🔥 FILTER 1: Sirf wahi products laaye jinka is_sold 'false' hai
      const { data: prods } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .eq("is_sold", false) 
        .order("created_at", { ascending: false });

      if (prods && prods.length > 0) {
        const productIds = prods.map((p) => p.id);
        const { data: ordersData } = await supabase
          .from("orders")
          .select("product_id, status")
          .in("product_id", productIds)
          .neq("status", "cancelled");

        const orderMap: Record<string, string> = {};
        if (ordersData) {
          ordersData.forEach(o => { orderMap[o.product_id] = o.status; });
        }

        const filteredProds = prods.filter((p) => {
          const status = orderMap[p.id];
          // 🔥 FILTER 2: Agar order dispatch ya deliver ho chuka hai, toh Shop Page se uda do
          if (status === 'delivered' || status === 'dispatched' || status === 'shipped') {
            return false;
          }
          return true;
        }).map((p) => ({
          ...p,
          isOnHold: !!orderMap[p.id] // Pending order hai toh 'ON HOLD'
        }));

        setProducts(filteredProds);
      } else {
        setProducts([]);
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
    let matchesCategory = false;
    
    if (activeCategory === "All") {
      matchesCategory = true;
    } else {
      const dbCat = (p.category || "").toLowerCase();
      const dbGender = (p.gender || "").toLowerCase(); // 🔥 Gender check
      const uiCat = activeCategory.toLowerCase();
      const baseUiCat = uiCat.endsWith('s') ? uiCat.slice(0, -1) : uiCat; 
      
      // Check if UI active filter matches DB Category OR DB Gender
      if (
        (dbCat && (dbCat.includes(baseUiCat) || uiCat.includes(dbCat))) ||
        (dbGender && dbGender === uiCat)
      ) {
        matchesCategory = true;
      }
    }
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.title && p.title.toLowerCase().includes(searchLower)) || 
      (p.profiles?.store_name && p.profiles.store_name.toLowerCase().includes(searchLower)) ||
      (p.gender && p.gender.toLowerCase().includes(searchLower)); // 🔥 Search bar bhi ab gender padh sakta hai!
      
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-bold tracking-widest text-xs uppercase animate-pulse">
        Loading Archive...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] font-sans pb-24 relative selection:bg-[#FF3B30] selection:text-white">
      
      {/* 🚀 TOP NAV */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-[#F6F3EE]/95 backdrop-blur-md z-40 border-b border-gray-200">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-1.5">
          KORO<span className="text-[#FF3B30]">LANE</span>
        </h1>
      </header>

      {/* 🚀 SEARCH BAR */}
      <div className="px-5 mt-3">
        <div className="bg-[#FFFFFF] border border-gray-300 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search items, sellers, styles..." 
            className="bg-transparent border-none outline-none text-sm text-[#111111] w-full placeholder-gray-400 font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-[#111111]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </div>
        </div>
      </div>

      {/* 🚀 CATEGORY PILLS */}
      <div className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition whitespace-nowrap text-xs font-bold shadow-sm ${
                activeCategory === cat
                  ? "bg-white border-[#FF3B30] text-[#FF3B30]"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 MAIN GRID */}
      <div className="px-5 mt-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{filteredProducts.length} items</p>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 cursor-pointer text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
            <svg className="w-4 h-4 cursor-pointer hover:text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isNew = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) <= 7;
              
              return (
                <div key={p.id} onClick={() => handleCardClick(p.id)} className="bg-[#FFFFFF] border border-gray-200 rounded-[16px] overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col">
                  
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    <img src={p.image_urls?.[0] || p.image_url} alt={p.title} className={`w-full h-full object-cover transition duration-700 group-hover:scale-105`} />
                    
                    <div className="absolute top-2 right-2 z-30">
                      <WishlistButton productId={p.id} onRequireAuth={() => {}} />
                    </div>

                    <span className="absolute top-2 left-2 bg-[#111111] text-white text-[8px] font-black px-2 py-1 rounded-[4px] z-10 uppercase tracking-widest">{p.category || 'TOP'}</span>

                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {p.isOnHold && (
                        <div className="bg-yellow-400 text-black text-[10px] font-black uppercase px-2.5 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm mt-6">
                          ON HOLD
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1 bg-white">
                    <h4 className="text-[11px] font-bold uppercase text-[#111111] line-clamp-2 leading-tight mb-0.5">{p.title}</h4>
                    <p className="text-[10px] text-gray-500 font-medium mb-1.5">{p.size || 'M'}</p>
                    
                    <span className="text-[14px] font-black text-[#FF3B30] mb-1">₹{p.price.toLocaleString('en-IN')}</span>
                    
                    <div className="flex items-center gap-1 mt-auto">
                      <span className="text-[10px] text-[#111111] truncate font-medium">{p.profiles?.store_name || "Verified Seller"}</span>
                      <svg className="w-3 h-3 text-[#FF3B30] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 rounded-2xl bg-white shadow-sm">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            <h3 className="text-sm font-black text-[#111111] uppercase tracking-widest mb-1">No Drops Found</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center px-6">
              Try searching a different style, seller, or clear your filters.
            </p>
            <button onClick={() => {setSearchQuery(""); setActiveCategory("All");}} className="mt-6 text-[10px] text-white bg-[#111111] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-black transition shadow-sm">
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}