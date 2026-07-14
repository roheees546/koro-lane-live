"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      // Fetching all profiles that have the role 'dealer'
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'dealer');
      
      if (error) throw error;
      if (data) setSellers(data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full pb-24">
      {/* 🚀 HEADER */}
      <header className="px-5 py-4 flex items-center gap-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-900">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-[#00e599] transition bg-[#121214] p-2 rounded-full border border-gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
          <span className="text-[#00e599]">🏪</span> Verified Sellers
        </h1>
      </header>

      {/* 🚀 SELLERS LIST */}
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex justify-center mt-20">
            <span className="text-[#00e599] text-[10px] font-bold uppercase tracking-widest animate-pulse border border-[#00e599]/30 bg-[#003320]/20 px-4 py-2 rounded-full">
              Loading Sellers...
            </span>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">No sellers found yet.</p>
            <p className="text-[#00e599] text-[9px] uppercase tracking-widest">More verified sellers coming soon!</p>
          </div>
        ) : (
          sellers.map((seller) => (
            <Link href={`/store/${seller.id}`} key={seller.id} className="bg-[#121214] border border-gray-800 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden hover:border-[#00e599]/50 transition group block">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#003320]/20 to-transparent pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-black border border-gray-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                <span className="text-[12px] font-black text-gray-400 text-center uppercase group-hover:text-white transition">
                  {seller.store_name ? seller.store_name.substring(0, 2) : 'KL'}
                </span>
              </div>
              
              <div className="flex-grow">
                <span className="bg-[#003320] text-[#00e599] text-[7px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mb-1.5 inline-block">Verified</span>
                <h4 className="text-sm font-black text-white flex items-center gap-1 group-hover:text-[#00e599] transition">
                  {seller.store_name || "VERIFIED DEALER"} <svg className="w-3 h-3 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </h4>
                <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">{seller.address || 'Dehradun, Uttarakhand'}</p>
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-[9px] text-yellow-500 font-bold flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> 5.0</span>
                  <span className="text-gray-700 text-[8px]">•</span>
                  <span className="text-[9px] text-[#00e599] font-black uppercase tracking-widest group-hover:underline">Visit Store →</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}