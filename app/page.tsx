"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  
  // 📜 NEW: ABOUT US MODAL STATE
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 📝 Form Data (UTR removed)
  const [formData, setFormData] = useState({ 
    fullName: "", 
    mobile: "", 
    altMobile: "", 
    address: "", 
    pincode: ""
  });

  // 🏦 ACTUAL UPI ID
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
          ...prev,
          fullName: profile.full_name || prev.fullName,
          mobile: profile.phone || prev.mobile,
          address: profile.address || prev.address,
        }));
      }
    }
  };

  const fetchProducts = async () => {
    try {
      let { data: prods, error } = await supabase
        .from("products")
        .select(`*, profiles(store_name)`)
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("products")
          .select("*")
          .eq("is_sold", false)
          .order("created_at", { ascending: false });
        prods = fallback.data;
      }

      if (prods) setProducts(prods);
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
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { data: { role: 'scout' } }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }

      setIsLoggedIn(true);
      setUserRole('scout');
      setIsAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");

      const { data: { session } } = await supabase.auth.getSession();
      if(session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setFormData(prev => ({
              ...prev,
              fullName: profile.full_name || prev.fullName,
              mobile: profile.phone || prev.mobile,
              address: profile.address || prev.address,
            }));
          }
      }

      if (selectedProduct) {
        setCheckoutStep(1);
        setIsCheckoutOpen(true);
      }

    } catch (error: any) {
      alert("Auth Error: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!authEmail) {
      alert("Please enter your email in the box first! 📩");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
    if (error) alert(error.message);
    else alert("Reset link sent! Check your email. 🚀");
  };

  const handleCardClick = (product: any) => {
    setSelectedProduct(product);
    setCurrentImageIdx(0); 
    setIsDetailsOpen(true);
  };

  const handleBuyNowClick = (e: any, product: any) => {
    e.stopPropagation(); 
    setSelectedProduct(product);
    setIsDetailsOpen(false); 
    
    if(!isLoggedIn) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    
    setCheckoutStep(1); 
    setIsCheckoutOpen(true); 
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep(2); 
  };

  const handlePaymentConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { error: orderError } = await supabase.from('orders').insert([{
          dealer_id: selectedProduct.dealer_id, 
          product_name: selectedProduct.title,
          customer_name: formData.fullName,
          price: selectedProduct.price,
          status: 'pending',
          payment_status: 'Pending WhatsApp Confirmation',
          size: '1-of-1',
          qty: 1
        }]);
      if (orderError) throw orderError;

      const { error: productError } = await supabase.from('products').update({ is_sold: true }).eq('id', selectedProduct.id);
      if (productError) throw productError;

      alert("Order Placed! Please send the screenshot on WhatsApp to confirm. ✅");
      setIsCheckoutOpen(false);
      setProducts(products.filter(p => p.id !== selectedProduct.id)); 
      
    } catch (error: any) {
      alert("ERROR placing order: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Feed...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 selection:bg-[#00e599] selection:text-black">
      
      {/* 🚀 SMART HEADER */}
      <header className="px-6 py-5 flex justify-between items-center border-b border-gray-900 sticky top-0 bg-black/90 backdrop-blur z-30">
        <h1 className="text-xl font-black tracking-tighter">KORO <span className="text-[#00e599]">LANE</span></h1>
        
        <div className="flex items-center gap-4">
          
          {/* 🔥 ABOUT US TRIGGER BUTTON */}
          <button 
            onClick={() => setIsAboutModalOpen(true)} 
            className="text-[10px] text-gray-400 hover:text-[#00e599] font-bold uppercase tracking-widest transition"
          >
            About
          </button>

          {isLoggedIn ? (
            <>
              <Link href="/scout" className="border border-gray-700 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Scout Terminal
              </Link>
              {userRole === 'dealer' && (
                <Link href="/dealer" className="bg-[#003320] text-[#00e599] border border-[#00e599]/30 transition px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span> Dashboard
                </Link>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} className="border border-gray-700 hover:border-[#00e599] hover:text-[#00e599] transition px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                🧑‍🚀 Login as Scout
              </button>
              <Link href="/login" className="bg-[#003320] text-[#00e599] border border-[#00e599]/30 hover:bg-[#00e599] hover:text-black transition px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hidden md:flex">
                🏪 Dealer Portal
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 🚀 UPGRADED HERO SECTION */}
      <section className="relative px-6 pt-24 pb-20 flex flex-col items-center text-center max-w-4xl mx-auto overflow-hidden border-b border-gray-900">
        
        {/* Background Subtle Neon Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#00e599]/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Exclusive Dehradun Tag */}
        <div className="bg-[#003320]/60 border border-[#00e599]/30 text-[#00e599] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,153,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse"></span>
          ⚡ Live & Available in Dehradun Only
        </div>

        {/* Main Enhanced Heading */}
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none mb-6 text-white max-w-3xl">
          FIND RARE <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e599] to-[#00c580] shadow-sm">
            SURPLUS DROPS
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide max-w-xl leading-relaxed mb-6">
          The underground network for premium handpicked streetwear, oversized tees, hoodies, and jackets from verified surplus dealers.
        </p>
        
        {/* Next Day Delivery Hook */}
        <p className="text-[10px] text-[#00e599] font-black uppercase tracking-widest bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
          🚀 Next Day Flash Delivery Straight to Your Doorstep
        </p>
      </section>

      {/* LIVE FEED */}
      <div className="max-w-6xl mx-auto px-6 py-10 mt-4">
        <div className="flex justify-between items-center border-b border-gray-900 pb-4 mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e599] animate-ping"></span> Live Feed
          </h3>
          <span className="bg-[#003320] text-[#00e599] border border-[#00e599]/20 text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase">{products.length} Active Drops</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product.id} onClick={() => handleCardClick(product)} className="bg-[#0a0a0c] border border-gray-900 rounded-xl overflow-hidden cursor-pointer hover:border-[#00e599]/50 transition group flex flex-col">
              <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden">
                <span className="absolute top-2 left-2 bg-[#003320] text-[#00e599] text-[8px] font-bold px-2 py-1 rounded z-10 uppercase tracking-widest">{product.category || 'TOP'}</span>
                <img src={product.image_urls?.[0] || product.image_url || "https://placehold.co/400x500/121214/00e599?text=ITEM"} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-3 flex flex-col flex-grow justify-between">
                <div>
                  <Link href={`/store/${product.dealer_id}`} onClick={(e) => e.stopPropagation()} className="text-[8px] text-[#00e599] uppercase font-bold tracking-widest mb-1 flex items-center gap-1 hover:underline w-max">
                    BY {product.profiles?.store_name || "VERIFIED DEALER"} <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </Link>
                  <h4 className="text-[11px] font-bold uppercase line-clamp-2 text-gray-200">{product.title}</h4>
                  <p className="text-[9px] text-gray-500 mt-1 italic">1-of-1 Condition</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-black text-white">₹{product.price.toLocaleString('en-IN')}</span>
                  <button onClick={(e) => handleBuyNowClick(e, product)} className="bg-[#00e599] text-black text-[9px] font-black uppercase px-3 py-1.5 rounded shadow-[0_0_10px_rgba(0,229,153,0.2)] hover:bg-[#00c580]">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- 📜 ABOUT US MODAL --- */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsAboutModalOpen(false)}>
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl w-full max-w-2xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsAboutModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20 bg-gray-900 p-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div className="absolute right-0 bottom-0 text-9xl font-black text-gray-900/10 pointer-events-none select-none tracking-tighter">ABOUT</div>
            
            <h2 className="text-[#00e599] text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <span>//</span> The Koro Lane Manifesto
            </h2>
            
            <p className="text-xs text-gray-300 font-bold uppercase tracking-wider leading-relaxed mb-4">
              Surplus industry waste nahi, goldmine hai. But marketplace mein kachra upload karne waalo ne game kharab kar diya hai.
            </p>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-8 z-10 relative">
              Koro Lane ek community-driven aggregator network hai jahan hum sirf verify kiye hue trusted local dealers ke 1-of-1 rare articles filter karke drop karte hain. No heavily torn items, no cheap quality. Sirf premium Tops & Bottoms jinke measurements ekdum exact hain taaki fit perfect baithe.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-900 z-10 relative">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Curation Rule</p>
                <p className="text-xs text-[#00e599] font-bold uppercase">Tops & Bottoms Only</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Logistics Focus</p>
                <p className="text-xs text-[#00e599] font-bold uppercase">Dehradun Speed-Run</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 🛡️ SECURE AUTH MODAL --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-sm p-8 relative">
            <button onClick={() => { setIsAuthModalOpen(false); setSelectedProduct(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-center text-[#00e599]">{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mb-6">{selectedProduct ? "Secure your 1-of-1 item now." : "Access Scout Terminal"}</p>

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
                {authMode === 'login' ? "New Scout? Create Account" : "Already a Scout? Login Here"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRODUCT DETAILS MODAL --- */}
      {isDetailsOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsDetailsOpen(false)}>
          <div className="bg-[#0f0f11] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full text-gray-300 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            <div className="w-full aspect-square bg-[#050505] relative">
              <img src={selectedProduct.image_urls?.[currentImageIdx] || selectedProduct.image_url} className="w-full h-full object-contain" alt="Product View" />
            </div>
            {(selectedProduct.image_urls && selectedProduct.image_urls.length > 1) && (
              <div className="flex gap-2 p-3 bg-[#151518] overflow-x-auto hide-scrollbar border-b border-gray-900">
                {selectedProduct.image_urls.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setCurrentImageIdx(idx)} className={`shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition ${currentImageIdx === idx ? 'border-[#00e599]' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
            <div className="p-6 overflow-y-auto">
              <Link href={`/store/${selectedProduct.dealer_id}`} className="text-[10px] text-[#00e599] uppercase font-bold tracking-widest mb-2 flex items-center gap-1 hover:underline w-max">
                SELLER: {selectedProduct.profiles?.store_name || "VERIFIED DEALER"} <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </Link>
              <h2 className="text-xl font-black uppercase mb-1">{selectedProduct.title}</h2>
              <p className="text-2xl font-black text-[#00e599] mb-4">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
              
              <div className="mb-5">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Description</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
              </div>
              
              <div className="flex justify-between items-center bg-[#151518] border border-gray-800 rounded-xl p-3 mb-6">
                <div className="flex items-center gap-2"><span className="bg-red-500/10 text-red-500 p-1.5 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><div><p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No Returns</p><p className="text-[8px] text-gray-500 uppercase mt-0.5">Final Sale</p></div></div>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2"><span className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><div><p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No C.O.D</p><p className="text-[8px] text-gray-500 uppercase mt-0.5">Prepaid Only</p></div></div>
              </div>
              
              <button onClick={(e) => handleBuyNowClick(e, selectedProduct)} className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_20px_rgba(0,229,153,0.3)]">PROCEED TO SECURE CHECKOUT 💳</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SECURE CHECKOUT MODAL (2-STEP) --- */}
      {isCheckoutOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            
            <h2 className="text-lg font-black uppercase tracking-tight mb-1">SECURE CHECKOUT</h2>
            <p className="text-[10px] text-[#00e599] font-bold uppercase tracking-widest mb-6">STEP {checkoutStep} OF 2: {checkoutStep === 1 ? 'DELIVERY DETAILS' : 'PAYMENT'}</p>
            
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
                <div className="bg-[#003320]/30 border border-[#00e599]/30 p-3 rounded-lg text-[9px] font-bold text-[#00e599] uppercase tracking-widest mb-4 flex items-center gap-2">📍 Address auto-filled from your Scout Profile!</div>
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

            {/* --- 🚀 NEW REAL QR & WHATSAPP STEP (NO UTR FORM) --- */}
            {checkoutStep === 2 && (
              <form onSubmit={handlePaymentConfirm} className="space-y-6">
                <div className="bg-[#050505] border border-[#00e599]/30 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#00e599] animate-pulse"></div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Scan using GPay, PhonePe, or Paytm</h3>
                  
                  {/* Real Static QR Code from public folder */}
                  <div className="bg-white p-2 rounded-xl mb-4 shadow-[0_0_20px_rgba(0,229,153,0.15)]">
                    <img src="/qr.jpg" alt="UPI QR" className="w-40 h-40 object-contain" />
                  </div>
                  
                  <p className="text-xl font-black text-white">Amount: <span className="text-[#00e599]">₹{selectedProduct.price.toLocaleString('en-IN')}</span></p>
                  
                  {/* Custom UPI & Name Details */}
                  <div className="mt-3 space-y-1">
                    <p className="text-[12px] font-bold text-[#00e599] uppercase tracking-widest">UPI ID: {ADMIN_UPI}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Paying to: Co-founder Rohit Singh Rana</p>
                  </div>

                  {/* WhatsApp Connect Button */}
                  <a 
                    href={`https://wa.me/919027434335?text=Hi Rohit, I am paying ₹${selectedProduct.price} for the ${selectedProduct.title}.`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#25D366] hover:text-black transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.553 4.195 1.602 6.015L.175 24l6.113-1.602a11.96 11.96 0 005.743 1.472h.005c6.645 0 12.03-5.385 12.03-12.031S18.676 0 12.031 0zm0 21.84c-1.846 0-3.655-.497-5.244-1.44l-.376-.223-3.896 1.021 1.042-3.798-.245-.39C2.186 15.348 1.63 13.722 1.63 12.03 1.63 6.286 6.286 1.63 12.03 1.63c5.744 0 10.4 4.656 10.4 10.4 0 5.744-4.656 10.4-10.4 10.4zm5.713-7.8c-.314-.157-1.857-.916-2.145-1.022-.287-.105-.497-.157-.706.157-.21.314-.812 1.022-.995 1.23-.183.21-.366.236-.68.079-.314-.157-1.324-.488-2.52-1.554-.93-.828-1.557-1.85-1.74-2.164-.183-.314-.02-.484.137-.64.14-.14.314-.366.47-.55.157-.183.21-.314.314-.523.105-.21.052-.392-.026-.55-.079-.157-.706-1.702-.968-2.33-.255-.612-.516-.53-.706-.54-.183-.01-.392-.01-.602-.01-.21 0-.55.079-.838.392-.288.314-1.1 1.074-1.1 2.618s1.126 3.036 1.283 3.245c.157.21 2.213 3.376 5.36 4.656 2.16.877 2.943.957 3.993.81 1.18-.166 3.322-1.357 3.793-2.67.47-1.313.47-2.438.33-2.67-.14-.233-.513-.37-.827-.525z"/></svg>
                    Send Screenshot on WhatsApp
                  </a>
                </div>

                {/* 📝 NEW TEXT INSTEAD OF UTR FORM */}
                <div className="bg-[#121214] border border-[#00e599]/20 p-4 rounded-xl text-center">
                  <p className="text-[11px] text-[#00e599] font-bold uppercase tracking-widest">
                    After payment, share it to WhatsApp for confirmation.
                  </p>
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
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}