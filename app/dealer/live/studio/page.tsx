"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PreLiveStudio() {
  const router = useRouter();
  const [streamTitle, setStreamTitle] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);

  // 🔥 Camera & Mic State References
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Fetch inventory & Start Camera on mount
  useEffect(() => {
    const fetchInventoryAndCamera = async () => {
      // 1. Fetch Inventory
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('products').select('*').eq('dealer_id', session.user.id);
        if (data) setInventory(data);
      }

      // 2. Start Real Camera & Mic Feed
      startCamera("user");
    };

    fetchInventoryAndCamera();

    // Cleanup tracks on unmount
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async (mode: "user" | "environment") => {
    try {
      // Stop existing tracks if any
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Camera/Mic access denied or not available on this device.");
    }
  };

  const toggleCameraFacing = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleGoLive = () => {
    if (!streamTitle) {
      alert("Bawa, pehle Drop ka title toh daal!");
      return;
    }
    setIsLive(true);
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black">
      
      {/* 🎥 REAL CAMERA FEED (Full Screen Background) */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />
        {isLive && (
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        )}
      </div>

      {/* 🔴 TOP CONTROLS */}
      <div className="absolute top-0 w-full p-4 pt-safe-top flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent z-20 h-32">
        <div className="flex flex-col gap-3">
          <button onClick={() => {
            if(mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            router.back();
          }} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          {isLive && (
            <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              LIVE
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* Flip Camera Button */}
          <button onClick={toggleCameraFacing} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
          {/* Mute Mic Button */}
          <button onClick={toggleMute} className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center border transition ${isMuted ? 'bg-red-600/80 border-red-500 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"}></path></svg>
          </button>
        </div>
      </div>

      {/* 🟢 PRE-LIVE SETUP PANEL (Bottom) */}
      {!isLive && (
        <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-20">
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Live Drop Title</label>
              <input 
                type="text" 
                placeholder="e.g., Premium Vintage Jackets Drop 🔥" 
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                maxLength={40}
                className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:border-[#00e599] transition mt-1.5 shadow-lg text-white"
              />
            </div>

            <button 
              onClick={() => setShowProductModal(true)}
              className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-4 flex items-center justify-between hover:border-gray-600 transition shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-[#00e599]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white">Link Inventory</h4>
                  <p className="text-[10px] text-[#00e599] font-bold uppercase tracking-wider">{selectedProducts.length} items selected</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            
            <button 
              onClick={handleGoLive}
              className="w-full bg-[#00e599] hover:bg-[#00c987] text-black font-black uppercase tracking-widest py-4 rounded-2xl transition flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(0,229,153,0.3)] mt-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Go Live Now
            </button>
          </div>
        </div>
      )}

      {/* 🔴 LIVE STUDIO CONTROLS (When Live) */}
      {isLive && (
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pt-20 flex flex-col gap-4">
          {pinnedProduct ? (
            <div className="bg-[#121214]/90 backdrop-blur-md border border-[#00e599]/50 rounded-2xl p-3 flex items-center gap-3 relative animate-in slide-in-from-bottom-4">
              <button onClick={() => setPinnedProduct(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Pinned" className="w-12 h-12 rounded-lg object-cover bg-gray-900" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span>
                  <span className="text-[8px] font-black uppercase text-[#00e599] tracking-widest">Pinned</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{pinnedProduct.title}</h4>
                <p className="text-sm font-black text-white mt-0.5">₹{pinnedProduct.price}</p>
              </div>
            </div>
          ) : (
            <div className="text-center pb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No product pinned</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowProductModal(true)} className="flex-1 bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-900 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              Pin Product
            </button>
            <button onClick={() => {
              if(mediaStream) mediaStream.getTracks().forEach(t => t.stop());
              setIsLive(false);
            }} className="w-14 bg-red-600/20 border border-red-600/50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-600/30 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}

      {/* 🛍️ PRODUCT SELECTOR MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowProductModal(false)}>
          <div className="bg-[#121214] w-full max-w-[450px] h-[75vh] sm:h-[80vh] sm:rounded-3xl rounded-t-3xl border border-gray-800 flex flex-col animate-in slide-in-from-bottom-full" onClick={e => e.stopPropagation()}>
            
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#121214] rounded-t-3xl">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-widest">{isLive ? 'Pin Product' : 'Select Inventory'}</h3>
                <p className="text-[10px] text-gray-400 mt-1">{isLive ? 'Showcase on screen' : 'Choose items for this drop'}</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {inventory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-xs">No products in your store yet.</p>
                </div>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-[#0a0a0c] border border-gray-800 rounded-2xl">
                    <img src={item.image_url || "https://placehold.co/100"} className="w-14 h-14 object-cover rounded-xl bg-gray-900" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-sm font-black text-[#00e599] mt-0.5">₹{item.price}</p>
                    </div>
                    
                    {!isLive ? (
                      <button onClick={() => toggleProductSelection(item.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${selectedProducts.includes(item.id) ? 'bg-[#00e599] border-[#00e599] text-black' : 'border-gray-700 text-transparent'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </button>
                    ) : (
                      <button onClick={() => { setPinnedProduct(item); setShowProductModal(false); }} className="bg-[#1a1a1d] border border-gray-700 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#00e599] hover:text-black hover:border-[#00e599] transition shrink-0">
                        Pin
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isLive && (
              <div className="p-4 border-t border-gray-800 bg-[#121214]">
                <button onClick={() => setShowProductModal(false)} className="w-full bg-[#00e599] text-black font-black uppercase tracking-widest py-3.5 rounded-xl transition">
                  Confirm {selectedProducts.length} items
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}