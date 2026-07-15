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

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(565); // 09:25 in seconds to match image vibe
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', pincode: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // FOMO Timer Logic
  useEffect(() => {
    if (isCheckoutOpen && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [isCheckoutOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data: prodData, error: prodError } = await supabase.from("products").select("*").eq("id", productId).single();
        if (prodError) throw prodError;
        if (prodData) {
          setProduct(prodData);
          const { data: sellerData } = await supabase.from("profiles").select("*").eq("id", prodData.dealer_id).single();
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

  // Database Order Logic
  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      const { error: orderError } = await supabase.from('orders').insert([{
        dealer_id: product.dealer_id, 
        product_id: product.id, 
        product_name: product.title,
        customer_name: formData.name, 
        customer_phone: formData.phone, 
        customer_address: formData.address, 
        customer_pincode: formData.pincode, 
        price: totalPrice,
        status: 'pending', 
        payment_status: 'Pending WhatsApp Confirmation', 
        size: product.size || '1-of-1', 
        qty: 1
      }]);
      
      if (orderError) throw orderError;

      const { error: productError } = await supabase.from('products').update({ is_sold: true }).eq('id', product.id);
      if (productError) throw productError;

      const message = `Hi, I just paid ₹${totalPrice} for ${product.title} (ID: ${product.id}).\n\nDelivery Details:\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}, Pincode: ${formData.pincode}\n\nPlease verify my payment screenshot attached.`;
      window.location.href = `https://wa.me/919027434335?text=${encodeURIComponent(message)}`;
      
    } catch (error: any) {
      alert("Error placing order: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-bold text-xs uppercase tracking-widest animate-pulse">Loading Heat...</div>;
  if (!product) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white"><p className="mb-4 uppercase font-bold tracking-widest text-sm">Product not found</p><button onClick={() => router.back()} className="text-[#00e599] border border-[#00e599] px-6 py-2 rounded-lg font-bold text-xs uppercase">Go Back</button></div>;

  const images = product.image_urls?.length > 0 ? product.image_urls : [product.image_url].filter(Boolean);
  const itemPrice = product.price || 0;
  const deliveryCharge = 40;
  const totalPrice = itemPrice + deliveryCharge;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative selection:bg-[#00e599] selection:text-black pb-40">
      
      {/* 🚀 PRODUCT PAGE (UNCHANGED) */}
      <header className="fixed top-0 left-0 w-full px-5 py-4 flex justify-between items-center z-40 pointer-events-none">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#00e599] transition pointer-events-auto"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
        <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#00e599] transition pointer-events-auto">
          {copied ? <svg className="w-5 h-5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>}
        </button>
      </header>

      <div className="relative w-full aspect-[4/5] bg-[#121214] max-w-xl mx-auto">
        {product.is_sold && <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm"><div className="bg-red-600 border-2 border-black text-white text-3xl font-black uppercase px-6 py-2 tracking-widest rotate-[-15deg] shadow-2xl">SOLD OUT</div></div>}
        {images.length > 0 ? <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold uppercase">No Image Available</div>}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
            {images.map((url: any, idx: number) => <button key={idx} onClick={() => setActiveImage(idx)} className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-[#00e599] w-6' : 'bg-white/50 hover:bg-white'}`} />)}
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent z-0"></div>
      </div>

      <div className="px-5 w-full max-w-xl mx-auto pt-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-[#00e599]/20 text-[#00e599] border border-[#00e599]/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm">1-OF-1 ARCHIVE</span>
          {product.category && <span className="bg-[#121214] text-gray-300 border border-gray-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">{product.category}</span>}
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mb-2">{product.title}</h1>
        <p className="text-xl font-black text-[#00e599] mb-6">₹{itemPrice.toLocaleString('en-IN')}</p>

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

        {product.description && (
          <div className="mb-10">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Product Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {seller && (
          <div className="mb-6">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Sourced & Verified By</h3>
            <Link href={`/store/${seller.id}`} className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-600 transition block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black border-2 border-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                  {seller.avatar_url ? <img src={seller.avatar_url} alt="Seller" className="w-full h-full object-cover" /> : <span className="text-lg font-black text-[#00e599] uppercase">{seller.store_name ? seller.store_name.charAt(0) : "S"}</span>}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase flex items-center gap-1.5">{seller.store_name} <svg className="w-3.5 h-3.5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></h4>
                  <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">Top Rated Dealer</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      <div className="fixed bottom-[72px] left-0 w-full bg-[#0a0a0c]/90 backdrop-blur-lg border-t border-gray-800 z-30 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Price</span>
            <span className="text-lg font-black text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
          <button 
            disabled={product.is_sold}
            onClick={() => setIsCheckoutOpen(true)}
            className={`flex-1 font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${product.is_sold ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#00e599] text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(0,229,153,0.3)]'}`}
          >
            {product.is_sold ? 'Out of Stock' : 'Buy Now'}
            {!product.is_sold && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
          </button>
        </div>
      </div>

      {/* 🚀 IMAGE #1 DESIGN EXACT MATCH CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#050505] w-full sm:max-w-md h-[95vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl border border-gray-800 shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-900 flex justify-between items-center bg-[#0a0a0c] shrink-0">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">Secure Checkout <svg className="w-4 h-4 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></h2>
                <p className="text-[10px] text-[#00e599] font-bold tracking-widest uppercase mt-1">Step {checkoutStep} of 2</p>
              </div>
              <button onClick={() => {setIsCheckoutOpen(false); setCheckoutStep(1);}} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-gray-400 hover:text-white transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-[140px]">
              {checkoutStep === 1 && (
                <div className="animate-in fade-in flex flex-col gap-5">
                  
                  {/* Product Snippet */}
                  <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex gap-4">
                    <img src={images[0]} alt={product.title} className="w-16 h-20 object-cover rounded-lg border border-gray-800 shrink-0" />
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-sm uppercase text-gray-100">{product.title}</h3>
                      <p className="text-[#00e599] font-black text-base mt-1">₹{itemPrice.toLocaleString('en-IN')}</p>
                      <span className="inline-block mt-2 border border-gray-700 text-gray-400 text-[8px] uppercase font-bold px-2.5 py-1 rounded w-max tracking-widest">1-OF-1 PIECE</span>
                    </div>
                  </div>

                  {/* FOMO Timer */}
                  <div className="border border-[#00e599]/30 bg-[#001f14]/40 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Only 1 piece reserved for you</span>
                    </div>
                    <span className="text-base font-black text-[#00e599]">{formatTime(timeLeft)}</span>
                  </div>

                  {/* Delivery Details Form */}
                  <div>
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Delivery Details</h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="Full Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#121214] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-xs outline-none focus:border-[#00e599] transition" />
                      <input type="tel" placeholder="Mobile Number *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#121214] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-xs outline-none focus:border-[#00e599] transition" />
                      <textarea placeholder="Delivery Address *" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#121214] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-xs outline-none focus:border-[#00e599] transition resize-none" />
                      <input type="text" placeholder="Pincode *" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full bg-[#121214] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-xs outline-none focus:border-[#00e599] transition" />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-[#121214] border border-gray-800 rounded-xl p-5">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Order Summary</h3>
                    <div className="flex justify-between text-xs text-gray-300 mb-3"><span>Item Price</span><span>₹{itemPrice}</span></div>
                    <div className="flex justify-between text-xs text-gray-300 mb-3"><span>Delivery Charge</span><span>₹{deliveryCharge}</span></div>
                    <div className="flex justify-between text-xs text-gray-300 mb-4 pb-4 border-b border-gray-800"><span>Platform Fee ⓘ</span><span>₹0</span></div>
                    <div className="flex justify-between items-center">
                      <div><p className="text-sm font-black text-white uppercase tracking-widest">TOTAL</p><p className="text-[8px] text-gray-500 uppercase mt-0.5">Inclusive of all taxes</p></div>
                      <span className="text-2xl font-black text-[#00e599]">₹{totalPrice}</span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex justify-center gap-6 mt-2 text-gray-500 pb-4">
                    <span className="text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 100% Authentic</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Safe & Secure</span>
                  </div>

                </div>
              )}

              {checkoutStep === 2 && (
                <div className="animate-in fade-in flex flex-col items-center pt-4 max-w-sm mx-auto">
                  <div className="bg-white p-2.5 rounded-2xl w-56 h-56 border-4 border-[#00e599] shadow-[0_0_40px_rgba(0,229,153,0.2)] mb-5">
                    <img src="/paytm-qr.jpg" alt="Payment QR" className="w-full h-full object-contain rounded-xl" />
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">UPI ID: <span className="text-white">paytm.s30za19@pty</span></p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1.5">Name: <span className="text-white">Rohit Singh Rana</span></p>
                  </div>
                  <div className="text-center bg-[#121214] w-full border border-gray-800 rounded-xl py-4 mb-6">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Payable</p>
                    <p className="text-4xl font-black text-[#00e599]">₹{totalPrice}</p>
                  </div>
                  <a href={`upi://pay?pa=paytm.s30za19@pty&pn=Rohit%20Singh%20Rana&am=${totalPrice}&cu=INR`} className="w-full block bg-[#003320]/30 border border-[#00e599]/50 text-[#00e599] font-black uppercase tracking-widest text-[11px] py-4 rounded-xl hover:bg-[#00e599]/20 transition text-center flex items-center justify-center gap-2 mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Pay Directly via UPI App
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Absolute Action Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-[#0a0a0c] z-50">
              {checkoutStep === 1 ? (
                <div>
                  <button onClick={() => { if (!formData.name || !formData.phone || !formData.address || !formData.pincode) return alert("Please fill all delivery details! 🚚"); setCheckoutStep(2); }} className="w-full bg-[#00e599] text-black font-black py-4 sm:py-5 flex flex-col items-center justify-center gap-1 active:bg-emerald-400 transition">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-widest"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Pay ₹{totalPrice} Securely</div>
                  </button>
                  <div className="py-2.5 flex justify-center items-center bg-black gap-1.5 text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Secured by KoroLane
                  </div>
                </div>
              ) : (
                <div className="p-4 flex gap-3 max-w-md mx-auto border-t border-gray-900 bg-black">
                  <button onClick={() => setCheckoutStep(1)} className="flex-1 bg-[#121214] border border-gray-800 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-gray-900 transition">Back</button>
                  <button disabled={isProcessing} onClick={handlePaymentConfirm} className="flex-[2] bg-[#00e599] text-black font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:bg-emerald-400 transition flex items-center justify-center gap-2">
                    {isProcessing ? "Processing..." : "I Have Paid"}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1c; border-radius: 4px; }`}} />
    </div>
  );
}