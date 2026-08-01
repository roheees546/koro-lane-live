"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BuyerLiveView() {
  const params = useParams();
  const router = useRouter();
  const dealerId = params.id as string;

  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);

  // Fetch active pinned product for this dealer from Supabase
  useEffect(() => {
    const fetchActivePin = async () => {
      if (!dealerId) return;
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('dealer_id', dealerId)
        .limit(1)
        .single();
      
      if (data) setPinnedProduct(data);
    };
    fetchActivePin();
  }, [dealerId]);

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black">
      
      {/* 🎥 LIVE STREAM VIDEO BACKGROUND */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* 🔴 TOP BAR */}
      <div className="absolute top-0 w-full p-4 pt-safe-top flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            LIVE
          </div>
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-300 border border-white/10">
            👀 124 watching
          </div>
        </div>

        <button onClick={() => window.history.back()} className="w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* 🛍️ PINNED PRODUCT OVERLAY (Yahan Click se Tera Purana Flow Khulega) */}
      {pinnedProduct && (
        <div className="absolute bottom-24 w-full px-4 z-20 animate-in slide-in-from-bottom-5">
          <div 
            onClick={() => router.push(`/product/${pinnedProduct.id}`)} 
            className="bg-[#121214]/90 backdrop-blur-xl border border-[#00e599]/60 rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer hover:border-[#00e599] transition shadow-[0_10px_30px_rgba(0,0,0,0.8)] group"
          >
            <div className="relative">
              <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Pinned" className="w-14 h-14 rounded-xl object-cover bg-gray-900 border border-white/10" />
              <div className="absolute -top-2 -left-2 bg-[#00e599] text-black text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Hot 🔥
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-ping"></span>
                <span className="text-[9px] font-black uppercase text-[#00e599] tracking-widest">Pinned by Host</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00e599] transition">{pinnedProduct.title}</h4>
              <p className="text-base font-black text-white mt-0.5">₹{pinnedProduct.price}</p>
            </div>

            <button className="bg-[#00e599] hover:bg-[#00c987] text-black font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition shadow-[0_0_15px_rgba(0,229,153,0.3)] shrink-0">
              Buy Now
            </button>
          </div>
        </div>
      )}

      {/* 💬 CHAT FEED */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex flex-col justify-end h-32">
        <div className="space-y-1.5 text-xs">
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl inline-block border border-white/5">
            <span className="font-bold text-[#00e599] mr-2">Aman_99:</span>
            <span>Bhai quality kaisi hai iski? 🔥</span>
          </div>
        </div>
      </div>

    </div>
  );
}