"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MiniStorePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", storeId).single();
      if (profile) setStoreProfile(profile);

      // 2. Fetch Products
      const { data: prods } = await supabase.from("products").select("*").eq("dealer_id", storeId);
      if (prods) setStoreProducts(prods);
    };
    fetchData();
  }, [storeId]);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <header className="mb-10 text-center">
         <h1 className="text-4xl font-black uppercase">{storeProfile?.store_name || "Loading Store..."}</h1>
         <p className="text-[#00e599] font-bold uppercase tracking-widest text-xs mt-2">Authorized Dealer</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {storeProducts.map((p) => (
          <div key={p.id} className="bg-[#0a0a0c] border border-gray-900 rounded-xl p-3">
            <img src={p.image_urls?.[0] || p.image_url} className="w-full aspect-[3/4] object-cover rounded-lg" />
            <h4 className="text-xs font-bold uppercase mt-3">{p.title}</h4>
            <p className="text-sm font-black text-[#00e599] mt-1">₹{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}