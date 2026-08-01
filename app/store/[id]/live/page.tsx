"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BuyerLiveView() {
  const params = useParams();
  const dealerId = params.id as string; // URL se dealer ID utha li

  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes timer

  // Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  // Timer countdown logic
  useEffect(() => {
    if (isCheckoutOpen && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isCheckoutOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch active pinned product (Forced Dummy Data for Testing UI)
  useEffect(() => {
    const fetchActivePin = async () => {
      // Supabase query hata di for UI testing. Seedha ek dummy product set kar rahe hain:
      setPinnedProduct({
        title: "Vintage Carhartt Jacket (Test)",
        price: 2499,
        image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop"
      });
    };
    fetchActivePin();
  }, [dealerId]);

  // Handle Step 1 to Step 2 transition
  const handleProceedToPayment = () => {
    if (!fullName || !phone || !address || !pincode) {
      alert("Bawa, pehle saari delivery details toh bhar!");
      return;
    }
    setCheckoutStep(2);
  };

  // Handle Final Order Submission (I Have Paid)
  const handleFinalOrderSubmit = async () => {
    try {
      const { error } = await supabase.from('orders').insert([
        {
          dealer_id: dealerId,
          item_title: pinnedProduct?.title || "Live Stream Product",
          price: pinnedProduct?.price || 0,
          customer_name: fullName,
          phone: phone,
          address: `${address}, Pincode: ${pincode}`,
          status: 'new' // Ye seedha dealer ke dashboard ke 'New' pipeline mein jayega!
        }
      ]);

      if (error) throw error;

      alert("Order Placed Successfully via Live Stream! 🚀");
      setIsCheckoutOpen(false);
      setCheckoutStep(1);
    } catch (err: any) {
      alert("Error placing order: " + err.message);
    }
  };

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

      {/* 🛍️ PINNED PRODUCT OVERLAY */}
      {pinnedProduct && (
        <div className="absolute bottom-24 w-full px-4 z-20 animate-in slide-in-from-bottom-5">
          <div 
            onClick={() => { setCheckoutStep(1); setIsCheckoutOpen(true); }}
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

      {/* 🔒 2-STEP SECURE CHECKOUT MODAL */}
      {isCheckoutOpen && pinnedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsCheckoutOpen(false)}>
          <div className="bg-[#121214] w-full max-w-[450px] sm:rounded-3xl rounded-t-3xl border border-gray-800 flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#121214] sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  Secure Checkout <span className="text-[#00e599]">✓</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Step {checkoutStep} of 2</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ================= STEP 1: ADDRESS & TIMER ================= */}
              {checkoutStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
                      <img src={pinnedProduct.image_url || "https://placehold.co/100"} className="w-12 h-12 rounded-xl object-cover bg-gray-900" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{pinnedProduct.title}</h4>
                        <p className="text-sm font-black text-[#00e599] mt-0.5">₹{pinnedProduct.price}</p>
                        <span className="text-[9px] text-gray-500 block">1-of-1 Piece</span>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center font-black text-sm">
                        D
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">DR ZUZE</h4>
                        <p className="text-[10px] text-yellow-400 font-bold mt-0.5">★ 5.0</p>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Timer */}
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Only 1 piece reserved for you
                    </div>
                    <span className="text-sm font-black text-emerald-400 font-mono">{formatTime(timeLeft)}</span>
                  </div>

                  {/* Address Form Inputs */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Deliver To</label>
                    <input 
                      type="text" 
                      placeholder="Full Name *" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00e599] transition"
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number *" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00e599] transition"
                    />
                    <input 
                      type="text" 
                      placeholder="Delivery Address *" 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00e599] transition"
                    />
                    <input 
                      type="text" 
                      placeholder="Pincode *" 
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00e599] transition"
                    />
                  </div>

                  {/* Proceed Button */}
                  <button 
                    onClick={handleProceedToPayment}
                    className="w-full bg-[#00e599] hover:bg-[#00c987] text-black font-black uppercase tracking-widest py-4 rounded-2xl transition shadow-[0_0_25px_rgba(0,229,153,0.3)] mt-2 flex flex-col items-center justify-center"
                  >
                    <span>Pay ₹{pinnedProduct.price} Securely</span>
                    <span className="text-[9px] font-bold text-black/70 tracking-normal mt-0.5">Proceed to Payment QR</span>
                  </button>
                </>
              )}

              {/* ================= STEP 2: UPI QR CODE & PAYMENT ================= */}
              {checkoutStep === 2 && (
                <div className="space-y-4 text-center">
                  <div className="bg-[#0a0a0c] border border-gray-800 p-4 rounded-2xl flex flex-col items-center">
                    {/* QR Code Placeholder / Image */}
                    <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center mb-3">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=9027434335@PTSBI&pn=ROHIT%20SINGH%20RANA&am=${pinnedProduct.price}&cu=INR`} alt="Payment QR" className="w-full h-full object-contain" />
                    </div>
                    <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      ✓ You are paying to the Co-Founder
                    </span>
                    <p className="text-xs text-gray-400">UPI ID: <strong className="text-white">9027434335@PTSBI</strong></p>
                    <p className="text-xs text-gray-400">Name: <strong className="text-white">ROHIT SINGH RANA</strong></p>
                  </div>

                  {/* Exact Amount Banner */}
                  <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Please pay this exact amount</p>
                    <h3 className="text-2xl font-black text-[#00e599] mt-1">₹{pinnedProduct.price}</h3>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setCheckoutStep(1)} 
                      className="w-1/3 bg-gray-900 border border-gray-700 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-2xl hover:bg-gray-800 transition"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleFinalOrderSubmit}
                      className="flex-1 bg-[#00e599] hover:bg-[#00c987] text-black font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition shadow-[0_0_25px_rgba(0,229,153,0.3)]"
                    >
                      I Have Paid 🚀
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center pt-1 pb-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <span role="img" aria-label="secure">🔒</span> Secured by Korolane
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}