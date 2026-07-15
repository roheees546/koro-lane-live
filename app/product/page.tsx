"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // 1. Fetch Product
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (prodError) throw prodError;
        if (prodData) {
          setProduct(prodData);
          
          // 2. Fetch Associated Seller
          const { data: sellerData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", prodData.dealer_id)
            .single();
            
          if (sellerData) setSeller(sellerData);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProductDetails();
  }, [productId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-bold text-xs uppercase tracking-widest animate-pulse">Loading Heat...</div>;
  
  if (!product) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white"><p className="mb-4 uppercase font-bold tracking-widest text-sm">Product not found</p><button onClick={() => router.back()} className="text-[#00e599] border border-[#00e599] px-6 py-2 rounded-lg font-bold text-xs uppercase">Go Back</button></div>;

  // Prepare images array
  const images = product.image_urls?.length > 0 ? product.image_urls : [product.image_url].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative selection:bg-[#00e599] selection:text-black pb-28">
      
      {/* 🚀 FLOATING TOP NAV */}
      <header className="fixed top-0 left-0 w-full px-5 py-4 flex justify-between items-center z-50 pointer-events-none">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#00e599] transition pointer-events-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#00e599] transition pointer-events-auto">
          {copied ? (
            <svg className="w-5 h-5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          )}
        </button>
      </header>

      {/* 🚀 IMAGE GALLERY (SNKRS STYLE) */}
      <div className="relative w-full aspect-[4/5] bg-[#121214] max-w-xl mx-auto">
        {product.is_sold && (
          <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-red-600 border-2 border-black text-white text-3xl font-black uppercase px-6 py-2 tracking-widest rotate-[-15deg] shadow-2xl">SOLD OUT</div>
          </div>
        )}
        
        {images.length > 0 ? (
          <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold uppercase">No Image Available</div>
        )}

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
            {images.map((url: any, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-[#00e599] w-6' : 'bg-white/50 hover:bg-white'}`}
              />
            ))}
          </div>
        )}
        {/* Subtle Bottom Gradient */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent z-0"></div>
      </div>

      <div className="px-5 w-full max-w-xl mx-auto pt-6">
        
        {/* 🚀 TITLE & SCARCITY TAGS */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-[#00e599]/20 text-[#00e599] border border-[#00e599]/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm">1-OF-1 ARCHIVE</span>
          {product.category && <span className="bg-[#121214] text-gray-300 border border-gray-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">{product.category}</span>}
          {product.condition && <span className="bg-[#121214] text-gray-300 border border-gray-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">{product.condition}</span>}
        </div>

        <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mb-2">
          {product.title}
        </h1>
        
        <p className="text-xl font-black text-[#00e599] mb-6">₹{product.price?.toLocaleString('en-IN')}</p>

        {/* 🚀 SIZE SELECTOR */}
        <div className="mb-8">
          <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Size Details</h3>
          <div className="w-full bg-[#121214] border border-[#00e599]/50 rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00e599]"></div>
            <div>
              <p className="text-sm font-black text-white">{product.size || 'Free Size'}</p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Verified Measurements</p>
            </div>
            <svg className="w-5 h-5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        {/* 🚀 DESCRIPTION */}
        {product.description && (
          <div className="mb-10">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Product Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* 🚀 SELLER CARD */}
        {seller && (
          <div className="mb-6">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Sourced & Verified By</h3>
            <Link href={`/store/${seller.id}`} className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-600 transition block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black border-2 border-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt="Seller" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-[#00e599] uppercase">{seller.store_name ? seller.store_name.charAt(0) : "S"}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                    {seller.store_name} 
                    <svg className="w-3.5 h-3.5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">Top Rated Dealer</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-gray-800 group-hover:border-[#00e599] group-hover:text-[#00e599] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </Link>
          </div>
        )}

        {/* 🚀 AUTHENTICITY PROMISE */}
        <div className="flex flex-col gap-3 pt-6 border-t border-gray-900 mb-10">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-5 h-5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span className="text-[11px] font-bold uppercase tracking-widest">100% Legit Checked</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[11px] font-bold uppercase tracking-widest">Fast Dispatch</span>
          </div>
        </div>

      </div>

      {/* 🚀 STICKY BOTTOM ACTION BAR (BUY NOW) */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0c]/90 backdrop-blur-lg border-t border-gray-800 z-50 p-4 pb-6 sm:pb-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Price</span>
            <span className="text-lg font-black text-white">₹{product.price?.toLocaleString('en-IN')}</span>
          </div>
          
          <button 
            disabled={product.is_sold}
            className={`flex-1 font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${
              product.is_sold 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-[#00e599] text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(0,229,153,0.3)]'
            }`}
          >
            {product.is_sold ? 'Out of Stock' : 'Buy Now'}
            {!product.is_sold && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
          </button>
        </div>
      </div>

    </div>
  );
}