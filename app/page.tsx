"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "../components/WishlistButton"; 

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [featuredSellers, setFeaturedSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsLoggedIn(true);
      const role = session.user.user_metadata?.role || 'scout';
      setUserRole(role);
    }
  };

  const fetchInitialData = async () => {
    try {
      const { data: sellers } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "dealer")
        .limit(5);
        
      if (sellers) setFeaturedSellers(sellers);

      let { data: prods } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .order("created_at", { ascending: false })
        .limit(8);

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
        setProducts(enrichedProds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { role: 'scout' } } });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
      setIsLoggedIn(true);
      setUserRole('scout');
      setIsAuthModalOpen(false);
      setAuthEmail(""); setAuthPassword("");

      if (selectedProduct) { 
          router.push(`/product/${selectedProduct.id}`);
      }
    } catch (error: any) { alert("Auth Error: " + error.message); } finally { setAuthLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!authEmail) return alert("Please enter your email in the box first! 📩");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
    if (error) alert(error.message); else alert("Reset link sent! Check your email. 🚀");
  };

  const handleCardClick = (product: any) => { 
    router.push(`/product/${product.id}`); 
  };

  const handleBuyNowClick = (e: any, product: any) => {
    e.stopPropagation(); 
    if(!isLoggedIn) { 
        setSelectedProduct(product); 
        setAuthMode('signup'); 
        setIsAuthModalOpen(true); 
        return; 
    }
    router.push(`/product/${product.id}`); 
  };

  if (loading) return <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-bold tracking-widest text-xs uppercase">Loading Platform...</div>;

  return (
    <div className="bg-[#F6F3EE] text-[#111111] w-full pb-24 min-h-screen font-sans">
      
      {/* 🚀 HEADER */}
      <header className="px-5 pt-4 pb-3 sticky top-0 bg-[#F6F3EE]/95 backdrop-blur-md z-40 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-1.5">
            KORO<span className="text-[#FF3B30]">LANE</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/scout/wishlist" className="text-[#111111] hover:text-[#FF3B30] transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </Link>
            <button onClick={() => alert("Notifications coming soon! 🔔")} className="relative text-[#111111] hover:text-[#FF3B30] transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span className="absolute top-0 right-0.5 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-[1.5px] border-[#F6F3EE]"></span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 mb-4">
          <svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <p className="text-[11px] font-medium text-[#111111]">dehradun next day delivery</p>
        </div>

        <Link href="/shop" className="bg-[#FFFFFF] w-full text-gray-500 border border-gray-300 hover:border-gray-400 transition px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Search drops & sellers...
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        </Link>
      </header>

      {/* VERIFIED SELLERS BANNER */}
      <section className="px-5 pt-5 pb-6">
        <div className="bg-[#FCECEC] border border-red-100 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-8 h-8 bg-[#FF3B30] rounded-full flex items-center justify-center mb-3 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-xs font-black uppercase tracking-tight text-[#111111] mb-1">ONLY VERIFIED SELLERS</h2>
            <p className="text-[10px] text-gray-700 font-medium leading-relaxed max-w-[180px]">We're growing with trust. More verified sellers coming soon!</p>
          </div>
          {/* Custom Minimalist Graphic (Building) */}
          <div className="absolute right-4 bottom-2 opacity-80 z-0">
             <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect x="55" y="35" width="25" height="50" rx="2" stroke="#111111" strokeWidth="2"/>
               <line x1="60" y1="45" x2="65" y2="45" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
               <line x1="70" y1="45" x2="75" y2="45" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
               <line x1="60" y1="55" x2="65" y2="55" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
               <line x1="70" y1="55" x2="75" y2="55" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
               <path d="M62 85 V70 C62 67.2386 64.2386 65 67 65 C69.7614 65 72 67.2386 72 70 V85" stroke="#111111" strokeWidth="2"/>
               <line x1="45" y1="85" x2="90" y2="85" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
               {/* Sparkles */}
               <path d="M40 25 L42 20 L44 25 L49 27 L44 29 L42 34 L40 29 L35 27 Z" fill="#FF3B30" opacity="0.6"/>
               <path d="M85 15 L86 12 L87 15 L90 16 L87 17 L86 20 L85 17 L82 16 Z" fill="#FF3B30" opacity="0.6"/>
               <path d="M25 65 L26 62 L27 65 L30 66 L27 67 L26 70 L25 67 L22 66 Z" fill="#FF3B30" opacity="0.6"/>
               <path d="M90 65 Q85 60 85 55 Q85 60 80 65" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
             </svg>
          </div>
        </div>
      </section>

      {/* 🚀 DYNAMIC FEATURED SELLERS */}
      <section className="pt-2 pb-8">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-[13px] font-black uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
            <span className="text-[#FF3B30] text-lg">🔥</span> FEATURED SELLERS
          </h3>
          <Link href="/sellers" className="text-[10px] text-[#FF3B30] font-black uppercase tracking-widest hover:underline">VIEW ALL</Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-3 snap-x snap-mandatory pb-2">
          {featuredSellers.length === 0 ? (
            <div className="w-full bg-[#FFFFFF] border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-2xl mb-2 block opacity-50 grayscale">🏪</span>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111111] mb-1">No Sellers Found</h4>
              <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">Onboarding in progress.</p>
            </div>
          ) : (
            featuredSellers.map((seller) => (
              <Link key={seller.id} href={`/store/${seller.id}`} className="w-[260px] shrink-0 snap-start bg-[#FFFFFF] border border-gray-200 rounded-[20px] p-4 flex items-center gap-4 relative overflow-hidden block shadow-sm hover:shadow-md transition">
                <div className="w-[52px] h-[52px] bg-[#111111] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt={seller.store_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-white text-center leading-tight">
                      {seller.store_name ? seller.store_name.substring(0, 3).toUpperCase() : 'NEW'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="bg-[#FF3B30] text-white text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest mb-1 inline-block">VERIFIED</span>
                  <h4 className="text-[13px] font-black text-[#111111] truncate flex items-center gap-1">
                    {seller.store_name || "New Seller"} 
                    <svg className="w-3.5 h-3.5 text-[#FF3B30] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{seller.bio ? seller.bio.substring(0, 35) + '...' : 'visit and buy our exclusive things'}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 🚀 LATEST DROPS */}
      <section className="pb-8">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-[13px] font-black uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
             <span className="text-[#FF3B30] text-lg">⚡</span> LATEST DROPS
          </h3>
          <Link href="/shop" className="text-[10px] text-[#FF3B30] font-black uppercase tracking-widest hover:underline">VIEW ALL</Link>
        </div>
        
        {/* 🔥 FIX: Flex & h-full implemented on grid children so cards match height exactly */}
        <div className="grid grid-cols-2 gap-4 px-5 pb-4">
          {products.length === 0 ? (
            <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center w-full col-span-2 py-4">No drops available.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} onClick={() => handleCardClick(product)} className="w-full h-full flex flex-col bg-[#FFFFFF] border border-gray-200 rounded-[16px] overflow-hidden relative cursor-pointer hover:shadow-md transition">
                <div className="relative aspect-[4/5] bg-gray-100 shrink-0">
                  <div className="absolute top-2 right-2 z-30">
                    <WishlistButton productId={product.id} onRequireAuth={() => setIsAuthModalOpen(true)} />
                  </div>
                  
                  <span className="absolute top-2 left-2 bg-[#111111] text-white text-[8px] font-black px-2 py-1 rounded-[4px] z-10 uppercase tracking-widest">{product.category || 'TOP'}</span>
                  
                  {product.isOnHold ? (
                    <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm">ON HOLD</div>
                    </div>
                  ) : product.is_sold ? (
                    <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="bg-[#111111] text-white text-[10px] font-black uppercase px-3 py-1 tracking-widest shadow-md rotate-[-8deg] rounded-sm">SOLD OUT</div>
                    </div>
                  ) : null}

                  <img src={product.image_urls?.[0] || product.image_url} alt={product.title} className="w-full h-full object-cover" />
                </div>
                {/* 🔥 FIX: flex-1 ensures this box stretches evenly across both grid items */}
                <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-[#111111] line-clamp-2 leading-tight">{product.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">{product.size || 'M'}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[13px] font-black text-[#111111]">₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 🔴 FEED BLOCK */}
      <section className="px-5 pb-10">
        <div className="bg-[#FFFFFF] border border-gray-200 rounded-[20px] p-5 flex flex-col relative overflow-hidden shadow-sm">
          
          <div className="flex items-center gap-4 mb-5 z-10">
              <div className="w-12 h-12 bg-[#FCECEC] border border-red-100 rounded-full shrink-0 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-[#FF3B30] animate-ping opacity-20"></div>
                <svg className="w-5 h-5 text-[#FF3B30] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#FF3B30] text-white text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest animate-pulse">Live Now</span>
                </div>
                <h4 className="text-[14px] font-black text-[#111111] leading-tight">Exclusive Thrift Drops</h4>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Join the stream and claim 1-of-1 pieces before they're gone.</p>
              </div>
          </div>
          
          <Link href="/live" className="w-full text-center bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-900 transition z-10 active:scale-[0.98]">
            Enter Feed
          </Link>
        </div>
      </section>

      {/* 🛡️ SECURE AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-2xl w-full max-w-sm p-8 relative shadow-2xl">
            <button onClick={() => { setIsAuthModalOpen(false); setSelectedProduct(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-[#111111] transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-center text-[#111111]">{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mb-6">{selectedProduct ? "Secure your 1-of-1 item now." : "Access Buyer Terminal"}</p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Email Address</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-[#F6F3EE] border border-gray-300 rounded-xl text-[#111111] px-4 py-3 text-sm outline-none focus:border-[#FF3B30] transition" placeholder="you@example.com" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">Password</label>
                  {authMode === 'login' && <button type="button" onClick={handleForgotPassword} className="text-[9px] text-[#FF3B30] hover:underline uppercase tracking-widest font-black">Forgot?</button>}
                </div>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-[#F6F3EE] border border-gray-300 rounded-xl text-[#111111] px-4 py-3 text-sm outline-none focus:border-[#FF3B30] transition" placeholder="••••••••" />
              </div>
              
              <button type="submit" disabled={authLoading} className="w-full bg-[#111111] text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-black transition shadow-md disabled:opacity-70 mt-4">
                {authLoading ? "Authenticating..." : (authMode === 'signup' ? "Create Account & Continue" : "Login Securely")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] text-gray-600 uppercase tracking-widest font-black hover:text-[#111111] transition">
                {authMode === 'login' ? "New Buyer? Create Account" : "Already a Buyer? Login Here"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}