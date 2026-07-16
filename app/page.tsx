"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "../components/WishlistButton"; 

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Modal states removed! Only keeping selected product for Auth redirect
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      let { data: prods, error } = await supabase
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

  // 🔥 UPDATE: Card click now directly routes to the Product Page! No more old modal!
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Platform...</div>;

  return (
    <div className="bg-black text-white w-full pb-20">
      
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-black/90 backdrop-blur z-30">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          KORO<span className="text-[#00e599]">LANE</span>
        </h1>
        <Link href="/search" className="bg-[#121214] text-gray-400 border border-gray-800 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 w-44">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Search drops & sellers...
        </Link>
      </header>

      <section className="px-5 pt-4 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#00e599]">📍</span>
          <p className="text-[10px] font-bold text-[#00e599] uppercase tracking-widest">DEHRADUN LIVE <span className="text-gray-500 lowercase ml-1">Next day delivery in Dehradun</span></p>
        </div>
        <div className="bg-[#003320]/20 border border-[#00e599]/20 p-5 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(0,229,153,0.05)]">
          <div>
            <div className="w-8 h-8 bg-[#00e599]/10 rounded-full flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-1">Only Verified Sellers</h2>
            <p className="text-[9px] text-gray-400 font-medium leading-relaxed max-w-[200px]">We're growing with trust. More verified sellers coming soon!</p>
          </div>
          <svg className="w-16 h-16 text-[#00e599]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
      </section>

      <section className="pt-2 pb-6">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
            <span className="text-[#00e599]">🏪</span> FEATURED SELLERS
          </h3>
          <Link href="/sellers" className="text-[9px] text-[#00e599] font-bold uppercase tracking-widest hover:underline">View all</Link>
        </div>
        
        <div className="px-5">
          <Link href={`/store/03bc76a4-84c4-4d89-bf83-6cc89b52a7c4`} className="bg-[#121214] border border-gray-800 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden block hover:border-gray-600 transition">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#003320]/20 to-transparent pointer-events-none"></div>
            <div className="w-16 h-16 bg-black border border-gray-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-white text-center leading-tight">GET<br/>NOW</span>
            </div>
            <div>
              <span className="bg-[#003320] text-[#00e599] text-[7px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mb-1 inline-block">Verified</span>
              <h4 className="text-sm font-black text-white flex items-center gap-1">GET NOW <svg className="w-3 h-3 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></h4>
              <p className="text-[9px] text-gray-500 mt-0.5">Dehradun, Uttarakhand</p>
              <div className="mt-2 flex gap-2 items-center">
                <span className="text-[9px] text-yellow-500 font-bold">★ 5.0 <span className="text-gray-500">(12)</span></span>
                <span className="text-gray-700 text-[8px]">•</span>
                <span className="text-[9px] text-gray-400 font-medium">Active Drops</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="pb-8">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
             <span className="text-[#00e599]">⚡</span> LATEST DROPS
          </h3>
          {/* 🔥 UPDATE: View all link now points to /shop */}
          <Link href="/shop" className="text-[9px] text-[#00e599] font-bold uppercase tracking-widest hover:underline">View all</Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-4 snap-x snap-mandatory pb-4">
          {products.map((product) => (
            <div key={product.id} onClick={() => handleCardClick(product)} className="w-[140px] shrink-0 snap-start bg-[#0a0a0c] border border-gray-900 rounded-xl overflow-hidden relative cursor-pointer hover:border-gray-700 transition flex flex-col">
              
              <WishlistButton productId={product.id} onRequireAuth={() => setIsAuthModalOpen(true)} />
              
              <div className="relative aspect-[4/5] bg-gray-900">
                <span className="absolute top-2 left-2 bg-[#003320] text-[#00e599] text-[7px] font-bold px-1.5 py-0.5 rounded z-10 uppercase tracking-widest">{product.category || 'TOP'}</span>
                
                {product.isOnHold ? (
                  <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-yellow-600 text-black text-[9px] font-black uppercase px-3 py-1 tracking-widest shadow-xl rotate-[-12deg] rounded-sm">ON HOLD ⏳</div>
                  </div>
                ) : product.is_sold ? (
                  <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1 tracking-widest shadow-xl rotate-[-12deg] rounded-sm">SOLD OUT</div>
                  </div>
                ) : null}

                <img src={product.image_urls?.[0] || product.image_url} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-grow justify-between bg-gradient-to-t from-black to-[#0a0a0c]">
                <div>
                  <h4 className="text-[10px] font-bold uppercase truncate text-gray-200">{product.title}</h4>
                  <p className="text-[8px] text-gray-500 mt-0.5">{product.size || 'Free Size'}</p>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-black text-white block mb-2">₹{product.price.toLocaleString('en-IN')}</span>
                  
                  <button 
                    onClick={(e) => {
                      if(product.is_sold) {
                        e.stopPropagation();
                        router.push(`/product/${product.id}`); 
                      } else {
                        handleBuyNowClick(e, product);
                      }
                    }} 
                    className={`w-full text-[8px] font-black uppercase py-1.5 rounded transition ${product.isOnHold ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : product.is_sold ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599] hover:text-black border border-[#00e599]/20'}`}
                  >
                    {product.isOnHold ? 'On Hold ⏳' : product.is_sold ? 'Sold Out 🚫' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
           <span className="text-[#00e599]">🛡️</span> WHY KORO LANE?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-3 flex flex-col items-center text-center">
            <svg className="w-6 h-6 text-[#00e599] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <h5 className="text-[9px] font-bold text-white mb-1">Verified Sellers</h5>
            <p className="text-[8px] text-gray-500">100% genuine surplus</p>
          </div>
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-3 flex flex-col items-center text-center">
            <svg className="w-6 h-6 text-[#00e599] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <h5 className="text-[9px] font-bold text-white mb-1">Single Pieces</h5>
            <p className="text-[8px] text-gray-500">One-of-a-kind finds</p>
          </div>
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-3 flex flex-col items-center text-center">
            <svg className="w-6 h-6 text-[#00e599] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            <h5 className="text-[9px] font-bold text-white mb-1">Easy Delivery</h5>
            <p className="text-[8px] text-gray-500">Fast in Dehradun</p>
          </div>
        </div>
      </section>

      {/* 🛡️ SECURE AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-sm p-8 relative">
            <button onClick={() => { setIsAuthModalOpen(false); setSelectedProduct(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-center text-[#00e599]">{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mb-6">{selectedProduct ? "Secure your 1-of-1 item now." : "Access Buyer Terminal"}</p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white px-4 py-3 text-sm outline-none focus:border-[#00e599]" placeholder="agent@korolane.com" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest">Password</label>
                  {authMode === 'login' && <button type="button" onClick={handleForgotPassword} className="text-[9px] text-[#00e599] hover:underline uppercase tracking-widest font-bold">Forgot?</button>}
                </div>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white px-4 py-3 text-sm outline-none focus:border-[#00e599]" placeholder="••••••••" />
              </div>
              
              <button type="submit" disabled={authLoading} className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.3)] disabled:opacity-70 mt-4">
                {authLoading ? "Authenticating..." : (authMode === 'signup' ? "Create Account & Continue" : "Login Securely")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] text-gray-500 uppercase tracking-widest font-bold hover:text-white transition">
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