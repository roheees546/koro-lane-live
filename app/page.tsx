"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "../components/WishlistButton"; // 🔥 NEW: Wishlist Engine

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔐 Role & Auth States
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🚀 Premium Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // 🖼️ Modal & Checkout States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const [isStoryExpanded, setIsStoryExpanded] = useState(false); 
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null); 
  
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 📝 Form Data
  const [formData, setFormData] = useState({ 
    fullName: "", mobile: "", altMobile: "", address: "", pincode: ""
  });

  const ADMIN_UPI = "9027434335@ptsbi"; 

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

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setFormData(prev => ({
          ...prev, fullName: profile.full_name || prev.fullName, mobile: profile.phone || prev.mobile, address: profile.address || prev.address,
        }));
      }
    }
  };

  const fetchProducts = async () => {
    try {
      // 🔥 NEW: Performance Limit (Only 6 items for Discovery Home)
      let { data: prods, error } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .eq("is_sold", false)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        const fallback = await supabase.from("products").select("*").eq("is_sold", false).order("created_at", { ascending: false }).limit(6);
        prods = fallback.data;
      }

      if (prods) setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- EXISTING LOGIC REMAINS UNCHANGED ---
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

      const { data: { session } } = await supabase.auth.getSession();
      if(session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) setFormData(prev => ({ ...prev, fullName: profile.full_name || prev.fullName, mobile: profile.phone || prev.mobile, address: profile.address || prev.address }));
      }
      if (selectedProduct) { setCheckoutStep(1); setIsCheckoutOpen(true); }
    } catch (error: any) { alert("Auth Error: " + error.message); } finally { setAuthLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!authEmail) return alert("Please enter your email in the box first! 📩");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
    if (error) alert(error.message); else alert("Reset link sent! Check your email. 🚀");
  };

  const handleCardClick = (product: any) => { setSelectedProduct(product); setIsDetailsOpen(true); };

  const handleBuyNowClick = (e: any, product: any) => {
    e.stopPropagation(); setSelectedProduct(product); setIsDetailsOpen(false); 
    if(!isLoggedIn) { setAuthMode('signup'); setIsAuthModalOpen(true); return; }
    setCheckoutStep(1); setIsCheckoutOpen(true); 
  };

  const handleAddressSubmit = (e: React.FormEvent) => { e.preventDefault(); setCheckoutStep(2); };

  const handlePaymentConfirm = async (e: React.FormEvent) => {
    e.preventDefault(); setIsProcessing(true);
    try {
      const { error: orderError } = await supabase.from('orders').insert([{
          dealer_id: selectedProduct.dealer_id, product_id: selectedProduct.id, product_name: selectedProduct.title,
          customer_name: formData.fullName, customer_phone: formData.mobile, customer_alt_phone: formData.altMobile,
          customer_address: formData.address, customer_pincode: formData.pincode, price: selectedProduct.price,
          status: 'pending', payment_status: 'Pending WhatsApp Confirmation', size: selectedProduct.size || '1-of-1', qty: 1
        }]);
      if (orderError) throw orderError;
      const { error: productError } = await supabase.from('products').update({ is_sold: true }).eq('id', selectedProduct.id);
      if (productError) throw productError;

      alert("Order Placed! Please send the screenshot on WhatsApp to confirm. ✅");
      setIsCheckoutOpen(false); setProducts(products.filter(p => p.id !== selectedProduct.id)); 
    } catch (error: any) { alert("ERROR placing order: " + error.message); } finally { setIsProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Platform...</div>;

  return (
    <div className="bg-black text-white w-full">
      
      {/* 🚀 SMART APP HEADER */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-black/90 backdrop-blur z-30">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          KORO<span className="text-[#00e599]">LANE</span>
        </h1>
        <Link href="/shop" className="bg-[#121214] text-gray-400 border border-gray-800 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 w-40">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Search rare styles...
        </Link>
      </header>

      {/* 🚀 DISCOVERY BANNER */}
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

      {/* 🚀 FEATURED SELLERS (Mockup UI implementation) */}
      <section className="pt-2 pb-6">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
            <span className="text-[#00e599]">🏪</span> FEATURED SELLERS
          </h3>
          <Link href="/shop" className="text-[9px] text-[#00e599] font-bold uppercase tracking-widest hover:underline">View all</Link>
        </div>
        
        <div className="px-5">
          {/* Static card for now, to match design */}
          <div className="bg-[#121214] border border-gray-800 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
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
                <span className="text-[9px] text-gray-400 font-medium">4 Active Drops</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SELL BANNER */}
      <section className="px-5 mb-8">
        <Link href="/login" className="block bg-black border border-gray-800 hover:border-[#00e599]/50 transition rounded-2xl p-5 relative overflow-hidden group">
          <div className="relative z-10 w-2/3">
            <h3 className="text-xs font-black uppercase text-white mb-1">Want to sell on Koro Lane?</h3>
            <p className="text-[9px] text-gray-400 mb-3">Join as a seller and start reaching fashion lovers.</p>
            <span className="inline-flex items-center gap-1 text-[9px] text-[#00e599] border border-[#00e599]/30 px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest group-hover:bg-[#00e599]/10">
              Become a Seller <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
          </div>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-[#00e599]/20 group-hover:text-[#00e599]/40 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
        </Link>
      </section>

      {/* 🚀 LATEST DROPS (Horizontal Scroll) */}
      <section className="pb-8">
        <div className="flex justify-between items-center px-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
             <span className="text-[#00e599]">⚡</span> LATEST DROPS
          </h3>
          <Link href="/shop" className="text-[9px] text-[#00e599] font-bold uppercase tracking-widest hover:underline">View all</Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-4 snap-x snap-mandatory pb-4">
          {products.map((product) => (
            <div key={product.id} onClick={() => handleCardClick(product)} className="w-[140px] shrink-0 snap-start bg-[#0a0a0c] border border-gray-900 rounded-xl overflow-hidden relative cursor-pointer hover:border-gray-700 transition flex flex-col">
              
              {/* 🔥 REUSABLE WISHLIST ENGINE */}
              <WishlistButton productId={product.id} onRequireAuth={() => setIsAuthModalOpen(true)} />
              
              <div className="relative aspect-[4/5] bg-gray-900">
                <span className="absolute top-2 left-2 bg-[#003320] text-[#00e599] text-[7px] font-bold px-1.5 py-0.5 rounded z-10 uppercase tracking-widest">{product.category || 'TOP'}</span>
                <img src={product.image_urls?.[0] || product.image_url} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-grow justify-between bg-gradient-to-t from-black to-[#0a0a0c]">
                <div>
                  <h4 className="text-[10px] font-bold uppercase truncate text-gray-200">{product.title}</h4>
                  <p className="text-[8px] text-gray-500 mt-0.5">{product.size || 'Free Size'}</p>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-black text-white block mb-2">₹{product.price.toLocaleString('en-IN')}</span>
                  <button onClick={(e) => handleBuyNowClick(e, product)} className="w-full bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599] hover:text-black border border-[#00e599]/20 text-[8px] font-black uppercase py-1.5 rounded transition">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 STYLE FEED PROMO */}
      <section className="px-5 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
             <span className="text-[#00e599]">📸</span> STYLE FEED
          </h3>
          <span className="text-[9px] text-[#00e599] font-bold uppercase tracking-widest">Coming Soon</span>
        </div>
        <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <h4 className="text-xs font-bold text-white mb-1">Be the first to upload your style!</h4>
          <p className="text-[10px] text-gray-500 mb-4 max-w-[250px]">Buy any item and share your look with the community.</p>
          <Link href="/shop" className="text-[9px] bg-[#003320] text-[#00e599] border border-[#00e599]/30 font-bold uppercase tracking-widest px-4 py-2 rounded-lg">Explore Marketplace</Link>
        </div>
      </section>

      {/* 🚀 WHY KORO LANE */}
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


      {/* --- ALL EXISTING MODALS (Auth, Product Details, Secure Checkout) REMAIN HERE UNTOUCHED (as sent in your code) --- */}
      
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

      {/* 🔥 UPGRADED PRODUCT DETAILS MODAL */}
      {isDetailsOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setIsDetailsOpen(false)}>
          <div className="bg-[#0f0f11] sm:border border-gray-800 sm:rounded-2xl rounded-t-2xl w-full max-w-[450px] overflow-y-auto relative flex flex-col max-h-[90vh] sm:max-h-[95vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 z-20 bg-black/60 p-2.5 rounded-full text-gray-300 hover:text-white backdrop-blur-sm border border-gray-700/50 transition fixed sm:absolute">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="w-full h-[60vh] min-h-[400px] max-h-[600px] bg-[#050505] relative flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth flex-shrink-0">
              {selectedProduct.image_urls && selectedProduct.image_urls.length > 0 ? (
                selectedProduct.image_urls.map((img: string, idx: number) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative cursor-zoom-in group" onClick={() => setFullScreenImage(img)}>
                    <img src={img} className="w-full h-full object-contain" alt={`Product View ${idx}`} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                      </div>
                    </div>
                    {selectedProduct.image_urls.length > 1 && (
                      <div className="absolute top-5 left-5 bg-black/80 border border-gray-800 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-md backdrop-blur-md uppercase shadow-lg">
                        {idx + 1} / {selectedProduct.image_urls.length}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex-shrink-0 snap-center relative cursor-zoom-in group" onClick={() => setFullScreenImage(selectedProduct.image_url)}>
                   <img src={selectedProduct.image_url} className="w-full h-full object-contain" alt="Product View" />
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0f0f11]">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  SELLER: <strong className="text-white">{selectedProduct.profiles?.store_name || "VERIFIED DEALER"}</strong>
                </p>
                <Link href={`/store/${selectedProduct.dealer_id}`} onClick={(e) => e.stopPropagation()} className="bg-[#003320] text-[#00e599] border border-[#00e599]/30 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#00e599] hover:text-black transition shadow-[0_0_10px_rgba(0,229,153,0.1)] flex items-center gap-1">
                  View Shop <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
              </div>

              <h2 className="text-xl font-black uppercase mb-3 text-white">{selectedProduct.title}</h2>
              
              <div className="flex items-end gap-3 mb-6">
                <div className="bg-[#1a1a1c] border border-gray-800 rounded-lg px-4 py-2 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Size</span>
                  <span className="text-lg font-black text-white">{selectedProduct.size || 'L'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Price</span>
                  <p className="text-3xl font-black text-[#00e599] leading-none">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              <div className="mb-5">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Description</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
              </div>
              
              <div className="flex justify-between items-center bg-[#151518] border border-gray-800 rounded-xl p-3 mb-6">
                <div className="flex items-center gap-2"><span className="bg-red-500/10 text-red-500 p-1.5 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><div><p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No Returns</p></div></div>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2"><span className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><div><p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No C.O.D</p></div></div>
              </div>
              
              <button onClick={(e) => handleBuyNowClick(e, selectedProduct)} className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_20px_rgba(0,229,153,0.3)]">PROCEED TO SECURE CHECKOUT 💳</button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 FULL SCREEN IMAGE VIEWER */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-8 animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-full text-white transition backdrop-blur-md" onClick={() => setFullScreenImage(null)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={fullScreenImage} className="w-full h-full object-contain cursor-zoom-out" alt="Full Screen Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* SECURE CHECKOUT MODAL */}
      {isCheckoutOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-[450px] p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            
            <h2 className="text-lg font-black uppercase tracking-tight mb-1">SECURE CHECKOUT</h2>
            <p className="text-[10px] text-[#00e599] font-bold uppercase tracking-widest mb-6">STEP {checkoutStep} OF 2</p>
            
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-xl p-3 flex gap-4 mb-6 relative overflow-hidden">
              <img src={selectedProduct.image_urls?.[0] || selectedProduct.image_url} alt="item" className="w-16 h-20 object-cover rounded-md border border-gray-800" />
              <div className="flex flex-col justify-center z-10">
                <h3 className="font-bold text-xs uppercase text-gray-200 line-clamp-2">{selectedProduct.title}</h3>
                <p className="text-[#00e599] font-black text-base mt-1">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
                <span className="inline-block mt-2 border border-gray-700 text-gray-400 text-[8px] uppercase font-bold px-2 py-1 rounded w-max">1-OF-1 PIECE</span>
              </div>
            </div>

            {checkoutStep === 1 && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="bg-[#003320]/30 border border-[#00e599]/30 p-3 rounded-lg text-[9px] font-bold text-[#00e599] uppercase tracking-widest mb-4 flex items-center gap-2">📍 Address auto-filled!</div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Your Full Name *</label><input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599]" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Mobile No. *</label><input required type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599]" /></div>
                  <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Alt. Mobile</label><input type="tel" placeholder="Optional" value={formData.altMobile} onChange={e => setFormData({...formData, altMobile: e.target.value})} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599]" /></div>
                </div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Full Delivery Address *</label><textarea required rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none"></textarea></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Pincode *</label><input required type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599]" placeholder="e.g. 248001" /></div>
                <button type="submit" className="w-full mt-2 bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.3)]">Proceed to Payment 💳</button>
              </form>
            )}

            {checkoutStep === 2 && (
              <form onSubmit={handlePaymentConfirm} className="space-y-6">
                <div className="bg-[#050505] border border-[#00e599]/30 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#00e599] animate-pulse"></div>
                  <div className="bg-white p-2 rounded-xl mb-4 shadow-[0_0_20px_rgba(0,229,153,0.15)]"><img src="/qr.jpg" alt="UPI QR" className="w-32 h-32 object-contain" /></div>
                  <p className="text-xl font-black text-white">Amount: <span className="text-[#00e599]">₹{selectedProduct.price.toLocaleString('en-IN')}</span></p>
                  
                  <div className="w-full mt-5">
                    <a href={`upi://pay?pa=${ADMIN_UPI}&pn=Rohit%20Singh%20Rana&am=${selectedProduct.price}&cu=INR`} className="w-full flex items-center justify-center gap-2 bg-[#00e599] text-black px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#00c580] transition shadow-[0_0_20px_rgba(0,229,153,0.4)] animate-pulse"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Pay Directly via UPI App</a>
                  </div>
                  <a href={`https://wa.me/919027434335?text=Hi Rohit, I am ${formData.fullName}. I have paid ₹${selectedProduct.price} for the ${selectedProduct.title}.`} target="_blank" rel="noopener noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#25D366] hover:text-black transition">Send Screenshot on WhatsApp</a>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setCheckoutStep(1)} className="w-1/3 border border-gray-800 text-gray-400 font-bold py-4 rounded-xl uppercase tracking-widest text-[10px] hover:text-white hover:border-gray-600 transition">Back</button>
                  <button type="submit" disabled={isProcessing} className="w-2/3 bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                    {isProcessing ? "Verifying..." : "I Have Paid ✅"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Hide Scrollbars Global style for horizontal lists */}
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}