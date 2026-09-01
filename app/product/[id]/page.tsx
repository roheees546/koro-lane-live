"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";
import ProductEngagement from "@/components/ProductEngagement";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // 🔥 User ID State Added
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🔥 Image Zoom & UPI Copy States
  const [isZoomed, setIsZoomed] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  // Mobile Touch States for Swipe (Optional fallback)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(565); 
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', pincode: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const images = product?.image_urls?.length > 0 ? product.image_urls : [product?.image_url].filter(Boolean);

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
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserId(session.user.id); // 🔥 Saved User ID here
          const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (userProfile) {
            setFormData(prev => ({
              ...prev,
              name: userProfile.full_name || '',
              phone: userProfile.phone || '',
              address: userProfile.address || ''
            }));
          }
        }

        const { data: prodData, error: prodError } = await supabase.from("products").select("*").eq("id", productId).single();
        if (prodError) throw prodError;
        
        if (prodData) {
          const { data: activeOrders } = await supabase
            .from("orders")
            .select("*")
            .eq("product_id", prodData.id)
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1);

          const hasActiveOrder = activeOrders && activeOrders.length > 0;
          const orderData = hasActiveOrder ? activeOrders[0] : null;

          const isHoldOrSold = prodData.is_sold || hasActiveOrder;
          
          setProduct({
            ...prodData,
            is_sold: isHoldOrSold
          });

          const { data: sellerData } = await supabase.from("profiles").select("*").eq("id", prodData.dealer_id).single();
          if (sellerData) setSeller(sellerData);

          if (isHoldOrSold) {
            if (orderData && (orderData.status === 'pending' || orderData.status === 'packed')) {
              setPendingOrder(orderData);
            } else if (!orderData && prodData.is_sold) {
              setPendingOrder(null); 
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProductDetails();
  }, [productId]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (images.length <= 1) return;
    setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (images.length <= 1) return;
    setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (distance < -50) {
      setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("9027434335@ptsbi");
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  // 🔥 CORE LOGIC FOR ON-HOLD (I HAVE PAID)
  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      // 1. Create the Pending Order
      const { error: orderError } = await supabase.from('orders').insert([{
        user_id: userId, // 🔥 NAYA COLUMN YAHAN BHEJ DIYA
        dealer_id: product.dealer_id, 
        product_id: product.id, 
        product_name: product.title,
        customer_name: formData.name, 
        customer_phone: formData.phone, 
        customer_address: formData.address, 
        customer_pincode: formData.pincode, 
        price: product.price || 0,
        status: 'pending', 
        payment_status: 'Pending WhatsApp Confirmation', 
        size: product.size || '1-of-1', 
        qty: 1
      }]);
      
      if (orderError) throw orderError;

      const message = `Hi, I just paid ₹${totalPrice} (including ₹6 Platform Fee) for ${product.title} (ID: ${product.id}).\n\nDelivery Details:\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}, Pincode: ${formData.pincode}\n\nPlease verify my payment screenshot attached.`;
      
      setProduct((prev: any) => ({ ...prev, is_sold: true }));
      setPendingOrder(true);
      setIsCheckoutOpen(false);

      window.location.href = `https://wa.me/919027434335?text=${encodeURIComponent(message)}`;
      
    } catch (error: any) {
      alert("Error placing order: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-bold text-xs uppercase tracking-widest animate-pulse">Loading Heat...</div>;
  if (!product) return <div className="min-h-screen bg-[#F6F3EE] flex flex-col items-center justify-center text-[#111111]"><p className="mb-4 uppercase font-bold tracking-widest text-sm">Product not found</p><button onClick={() => router.back()} className="text-[#FF3B30] border border-[#FF3B30] px-6 py-2 rounded-xl font-bold text-xs uppercase">Go Back</button></div>;

  const itemPrice = product.price || 0;
  const platformFee = 6;
  const totalPrice = itemPrice + platformFee; 
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const deliveryDate = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] font-sans flex flex-col relative selection:bg-[#FF3B30] selection:text-white pb-40">
      
      {/* HEADER (Only Back Button Now) */}
      <header className="fixed top-0 left-0 w-full px-5 py-4 flex justify-between items-center z-40 pointer-events-none">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-[#111111] hover:text-[#FF3B30] transition pointer-events-auto shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
      </header>

      {/* 🔥 MAIN IMAGE CONTAINER WITH ARROWS */}
      <div 
        className="relative w-full aspect-[4/5] bg-gray-100 max-w-xl mx-auto overflow-hidden select-none group border-b border-gray-200"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* RIGHT SIDE ACTION BUTTONS (Share + Wishlist) */}
        <div className="absolute top-4 right-4 flex flex-col items-center gap-3 z-30 pointer-events-auto">
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-[#111111] hover:text-[#FF3B30] transition shadow-md">
            {copied ? <svg className="w-5 h-5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>}
          </button>
          <div className="relative w-10 flex items-center justify-center">
            <WishlistButton productId={product.id} onRequireAuth={() => alert("Please login from the Home page first to save items to your wishlist!")} />
          </div>
        </div>

        {/* 🔥 MAIN SLIDER ARROWS */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage} 
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-[#111111] hover:text-[#FF3B30] hover:bg-white transition shadow-md opacity-0 group-hover:opacity-100 sm:opacity-100"
            >
              <svg className="w-5 h-5 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button 
              onClick={handleNextImage} 
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-[#111111] hover:text-[#FF3B30] hover:bg-white transition shadow-md opacity-0 group-hover:opacity-100 sm:opacity-100"
            >
              <svg className="w-5 h-5 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </>
        )}

        {product.is_sold && (
          <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-sm pointer-events-none">
            {pendingOrder ? (
              <div className="bg-yellow-400 border border-black text-[#111111] text-2xl font-black uppercase px-6 py-2 tracking-widest rotate-[-8deg] shadow-lg">ON HOLD ⏳</div>
            ) : (
              <div className="bg-[#111111] border border-black text-white text-3xl font-black uppercase px-6 py-2 tracking-widest rotate-[-8deg] shadow-lg">SOLD OUT</div>
            )}
          </div>
        )}
        
        {images.length > 0 ? (
          <img 
            onClick={() => setIsZoomed(true)} 
            src={images[activeImage]} 
            alt={product.title} 
            draggable={false}
            className="w-full h-full object-cover cursor-zoom-in pointer-events-auto" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase">No Image Available</div>
        )}
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
            {images.map((url: any, idx: number) => <button key={idx} onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }} className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-[#FF3B30] w-6' : 'bg-gray-300 hover:bg-gray-400'}`} />)}
          </div>
        )}
      </div>

      <div className="px-5 w-full max-w-xl mx-auto pt-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-[#111111] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[4px] shadow-sm">1-OF-1 ARCHIVE</span>
          {product.category && <span className="bg-white border border-gray-200 text-[#111111] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[4px] shadow-sm">{product.category}</span>}
        </div>
        
        <div className="flex justify-between items-start mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#111111] uppercase tracking-tight leading-tight mb-2">{product.title}</h1>
            <p className="text-xl font-black text-[#111111]">₹{itemPrice.toLocaleString('en-IN')}</p>
          </div>
          
          {seller && (
            <Link href={`/store/${seller.id}`} className="shrink-0 bg-white border border-gray-200 rounded-[16px] px-3 py-2.5 flex flex-col items-center justify-center min-w-[80px] max-w-[90px] hover:border-gray-300 transition group shadow-sm">
              <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center overflow-hidden mb-1.5">
                {seller.avatar_url ? <img src={seller.avatar_url} alt="Seller" className="w-full h-full object-cover" /> : <span className="text-sm font-black text-white uppercase">{seller.store_name ? seller.store_name.charAt(0) : "S"}</span>}
              </div>
              <h4 className="text-[9px] font-black text-[#111111] uppercase w-full truncate text-center leading-tight">{seller.store_name}</h4>
              <p className="text-[7px] text-[#FF3B30] font-bold tracking-widest mt-1 flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> VERIFIED</p>
            </Link>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Size Details</h3>
          <div className="w-full bg-white border border-gray-200 rounded-[16px] p-4 flex justify-between items-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FF3B30]"></div>
            <div>
              <p className="text-sm font-black text-[#111111]">{product.size || 'Free Size'}</p>
              <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-medium">Verified Measurements</p>
            </div>
            <svg className="w-5 h-5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>

          {(product.measurements?.chest || product.measurements?.length || product.measurements?.shoulder || product.measurements?.sleeve || product.color || product.material) && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {product.measurements?.chest && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Chest</span>
                  <span className="text-xs font-black text-[#111111]">{product.measurements.chest} cm</span>
                </div>
              )}
              {product.measurements?.length && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Length</span>
                  <span className="text-xs font-black text-[#111111]">{product.measurements.length} cm</span>
                </div>
              )}
              {product.measurements?.shoulder && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Shoulder</span>
                  <span className="text-xs font-black text-[#111111]">{product.measurements.shoulder} cm</span>
                </div>
              )}
              {product.measurements?.sleeve && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Sleeve</span>
                  <span className="text-xs font-black text-[#111111]">{product.measurements.sleeve} cm</span>
                </div>
              )}
              {product.color && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center gap-1 shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Color</span>
                  <span className="text-xs font-black text-[#111111] capitalize">{product.color}</span>
                </div>
              )}
              {product.material && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center gap-1 shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Material</span>
                  <span className="text-xs font-black text-[#111111] capitalize">{product.material}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {product.description && (
          <div className="mb-6 bg-white border border-gray-200 rounded-[16px] p-4 shadow-sm">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Product Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{product.description}</p>
          </div>
        )}

        <div className="mt-8 mb-6">
          <ProductEngagement productId={product.id} sellerId={product.dealer_id || seller?.id} />
        </div>

      </div>

      <div className="fixed bottom-[72px] left-0 w-full bg-[#FFFFFF]/95 backdrop-blur-lg border-t border-gray-200 z-30 p-4 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Price</span>
            <span className="text-lg font-black text-[#111111]">₹{itemPrice.toLocaleString('en-IN')}</span>
          </div>
          
          <button 
            disabled={product.is_sold}
            onClick={() => setIsCheckoutOpen(true)}
            className={`flex-1 font-black uppercase tracking-widest py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 ${product.is_sold ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#111111] text-white hover:bg-black'}`}
          >
            {product.is_sold ? (pendingOrder ? 'On Hold ⏳' : 'Out of Stock') : 'Buy Now'}
            {!product.is_sold && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
          </button>
        </div>
      </div>

      {/* 🚀 CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] w-full sm:max-w-lg h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] border border-gray-200 shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-[#F6F3EE] shrink-0">
              <div>
                <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight flex items-center gap-2">
                  SECURE CHECKOUT <svg className="w-4 h-4 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </h2>
                <p className="text-[10px] text-[#FF3B30] font-bold tracking-widest uppercase mt-1">STEP {checkoutStep} OF 2</p>
              </div>
              <button onClick={() => {setIsCheckoutOpen(false); setCheckoutStep(1);}} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-[#111111] transition border border-gray-200 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar pb-36 bg-[#F6F3EE]">
              {checkoutStep === 1 && (
                <div className="animate-in fade-in space-y-3">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-2xl p-3 flex gap-3 shadow-sm">
                      <img src={images[0]} alt={product.title} className="w-12 h-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                      <div className="flex flex-col justify-center">
                        <h3 className="font-black text-xs uppercase text-[#111111] line-clamp-1">{product.title}</h3>
                        <p className="text-[#111111] font-black text-sm mt-0.5">₹{itemPrice.toLocaleString('en-IN')}</p>
                        <span className="inline-block mt-1.5 border border-gray-200 bg-gray-50 text-gray-600 text-[8px] uppercase font-black px-2 py-0.5 rounded-[4px] w-max tracking-widest">1-OF-1 PIECE</span>
                      </div>
                    </div>
                    {seller && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                            {seller.avatar_url ? <img src={seller.avatar_url} className="w-full h-full object-cover" /> : <span className="text-white font-black">{seller.store_name?.charAt(0)}</span>}
                          </div>
                          <div>
                            <h4 className="font-black text-[#111111] uppercase text-xs flex items-center gap-1">{seller.store_name} <svg className="w-3 h-3 text-[#FF3B30]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></h4>
                            <p className="text-[9px] text-yellow-600 font-bold mt-0.5">★ 5.0 <span className="text-gray-400">(Top Rated)</span></p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-red-100 bg-[#FCECEC] rounded-2xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Only 1 piece reserved for you</span>
                    </div>
                    <span className="text-base font-black text-[#FF3B30]">{formatTime(timeLeft)}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-4 mt-2 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[11px] font-black uppercase text-[#111111] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        DELIVER TO
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Full Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#F6F3EE] border border-gray-200 rounded-xl text-[#111111] px-4 py-3 text-xs outline-none focus:border-[#FF3B30] transition font-medium" />
                      <input type="tel" placeholder="Mobile Number *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#F6F3EE] border border-gray-200 rounded-xl text-[#111111] px-4 py-3 text-xs outline-none focus:border-[#FF3B30] transition font-medium" />
                      <textarea placeholder="Delivery Address *" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#F6F3EE] border border-gray-200 rounded-xl text-[#111111] px-4 py-3 text-xs outline-none focus:border-[#FF3B30] transition resize-none font-medium" />
                      <input type="text" placeholder="Pincode *" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full bg-[#F6F3EE] border border-gray-200 rounded-xl text-[#111111] px-4 py-3 text-xs outline-none focus:border-[#FF3B30] transition font-medium" />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-start shadow-sm">
                    <div>
                      <h3 className="text-[11px] font-black uppercase text-[#111111] flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        DELIVERY
                      </h3>
                      <p className="text-xs font-black text-[#111111]">Tomorrow, {deliveryDate}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Order within 2h 45m to get it by tomorrow</p>
                    </div>
                    <span className="bg-[#FCECEC] text-[#FF3B30] text-[9px] font-black uppercase px-2 py-1 rounded-[4px] flex items-center gap-1 border border-red-100">⚡ FAST</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Order Summary</h3>
                    <div className="flex justify-between text-xs text-gray-700 mb-2 font-medium"><span>Item Price</span><span>₹{itemPrice}</span></div>
                    <div className="flex justify-between text-xs text-[#FF3B30] mb-2 font-bold"><span>Delivery Charge</span><span>Free (₹0)</span></div>
                    <div className="flex justify-between text-xs text-gray-700 mb-3 pb-3 border-b border-gray-100 font-medium"><span>Platform Fee ⓘ</span><span>₹{platformFee}</span></div>
                    <div className="flex justify-between items-center">
                      <div><p className="text-sm font-black text-[#111111] uppercase tracking-widest">TOTAL</p><p className="text-[8px] text-gray-500 uppercase mt-0.5 font-bold">Inclusive of all taxes</p></div>
                      <span className="text-2xl font-black text-[#111111]">₹{totalPrice}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex gap-3 items-center">
                      <svg className="w-5 h-5 text-[#FF3B30] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      <div><p className="text-xs font-bold text-[#111111]">Secure Payment</p><p className="text-[9px] text-gray-500 mt-0.5 font-medium">Your payment is 100% safe & protected</p></div>
                    </div>
                  </div>

                </div>
              )}

              {checkoutStep === 2 && (
                <div className="animate-in fade-in flex flex-col items-center pt-2 max-w-sm mx-auto">
                  <div className="bg-white p-2.5 rounded-[20px] w-56 h-56 border-4 border-[#FF3B30] shadow-md mb-5">
                    <img src="/new-qr.png" alt="Payment QR" className="w-full h-full object-contain rounded-xl" />
                  </div>
                  
                  <div className="text-center mb-6 space-y-2">
                    <p className="text-[11px] text-[#FF3B30] font-black uppercase tracking-widest bg-[#FCECEC] border border-red-100 py-1.5 px-4 rounded-full inline-block shadow-sm">✓ You are paying to the co-founder</p>
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mt-2">UPI ID: <span className="text-[#111111] font-black">9027434335@ptsbi</span></p>
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mt-1">NAME: <span className="text-[#111111] font-black">ROHIT SINGH RANA</span></p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">After payment, share screenshot to WhatsApp number<br/><span className="text-[#111111] text-xs font-black">9027434335</span></p>
                  </div>

                  <div className="text-center bg-white w-full border border-gray-200 rounded-2xl py-4 mb-6 shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Please pay this exact amount</p>
                    <p className="text-4xl font-black text-[#111111]">₹{totalPrice}</p>
                  </div>
                  
                  <button onClick={handleCopyUPI} className="w-full block bg-[#FCECEC] border border-red-200 text-[#FF3B30] font-black uppercase tracking-widest text-[11px] py-4 rounded-xl hover:bg-red-100 transition text-center flex items-center justify-center gap-2 mb-3 shadow-sm">
                    {upiCopied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        UPI ID Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        Copy UPI ID
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 w-full bg-[#FFFFFF] border-t border-gray-200 z-50 shadow-lg">
              {checkoutStep === 1 ? (
                <div className="w-full">
                  <div className="flex justify-center items-center gap-4 py-3 bg-[#F6F3EE] border-b border-gray-200">
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><svg className="w-3 h-3 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 100% Authentic</span>
                    <span className="text-gray-400 text-[8px]">•</span>
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><svg className="w-3 h-3 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Safe & Secure</span>
                  </div>
                  <div className="p-3">
                    <button onClick={() => { if (!formData.name || !formData.phone || !formData.address || !formData.pincode) return alert("Please fill all delivery details! 🚚"); setCheckoutStep(2); }} className="w-full bg-[#111111] text-white font-black py-4 rounded-xl shadow-md hover:bg-black transition flex flex-col items-center justify-center gap-0.5 active:scale-95">
                      <div className="flex items-center gap-2 text-sm uppercase tracking-widest"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> PAY ₹{totalPrice} SECURELY</div>
                      <span className="text-[8px] font-bold tracking-widest opacity-80 uppercase">You will be redirected to a secure payment page</span>
                    </button>
                  </div>
                  <div className="py-2.5 flex justify-center items-center bg-[#F6F3EE] gap-1.5 text-[8px] text-gray-500 font-bold uppercase tracking-widest border-t border-gray-200">
                    <svg className="w-3 h-3 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Secured by KoroLane
                  </div>
                </div>
              ) : (
                <div className="p-4 flex gap-3 w-full border-t border-gray-200 bg-white">
                  <button onClick={() => setCheckoutStep(1)} className="flex-1 bg-[#F6F3EE] border border-gray-200 text-[#111111] font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-gray-200 transition shadow-sm">Back</button>
                  <button disabled={isProcessing} onClick={handlePaymentConfirm} className="flex-[2] bg-[#111111] text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-md hover:bg-black transition flex items-center justify-center gap-2">
                    {isProcessing ? "Processing..." : "I Have Paid"}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* 🔥 ZOOM MODAL WITH ARROWS */}
      {isZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setIsZoomed(false)}>
          <button className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full z-50 hover:bg-black/80 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 hover:text-[#FF3B30] transition shadow-2xl"
              >
                <svg className="w-6 h-6 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button 
                onClick={handleNextImage} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 hover:text-[#FF3B30] transition shadow-2xl"
              >
                <svg className="w-6 h-6 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </>
          )}

          <img 
            onClick={(e) => e.stopPropagation()} 
            src={images[activeImage]} 
            alt="Zoomed"
            className="w-full h-auto max-h-[90vh] object-contain animate-in zoom-in duration-300 pointer-events-auto" 
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1cbd4; border-radius: 4px; }`}} />
    </div>
  );
}