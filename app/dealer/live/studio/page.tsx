"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PreLiveStudio() {
  const router = useRouter();
  const [streamTitle, setStreamTitle] = useState("");
  const [youtubeStreamKey, setYoutubeStreamKey] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // 🚀 Naye Refs: Streaming aur WebSocket ke liye
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const fetchInventoryAndCamera = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const id = session.user.id;
        setDealerId(id);
        const { data } = await supabase.from('products').select('*').eq('dealer_id', id);
        if (data) setInventory(data);
      }
      startCamera("user");
    };

    fetchInventoryAndCamera();

    return () => {
      stopStreaming(); // Component unmount hone par stream rok do
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time Chat Listener
  useEffect(() => {
    if (!dealerId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_messages')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) setChatMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`studio-chat-${dealerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `dealer_id=eq.${dealerId}` },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startCamera = async (mode: "user" | "environment") => {
    try {
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
      alert("Camera/Mic access denied.");
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

  // 🔴 STOP STREAMING FUNCTION
  const stopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsLive(false);
  };

  // 🟢 GO LIVE FUNCTION (Connects to our Node.js Server)
  const handleGoLive = () => {
    if (!streamTitle) {
      alert("Bawa, pehle Drop ka title toh daal!");
      return;
    }
    if (!youtubeStreamKey) {
      alert("YouTube Stream Key zaruri hai stream karne ke liye!");
      return;
    }
    if (!mediaStream) {
      alert("Camera feed ready nahi hai!");
      return;
    }

    // 1. WebSocket connect kar rahe hain Local Backend (Port 8000) se
    const wsUrl = `ws://localhost:8000/?key=${encodeURIComponent(youtubeStreamKey)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to streaming backend!");
      
      // 2. MediaRecorder setup (Video chunks banana)
      // Browsers generally support webm format for recording
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Jab chunk ready ho, backend ko bhej do
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      // 1000ms (1 sec) ke video chunks bhejenge
      mediaRecorder.start(1000); 
      setIsLive(true);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error: Backend server shayed chal nahi raha hai.", error);
      alert("Connection fail ho gaya! Kya tumhara Node.js server (port 8000) chal raha hai?");
      stopStreaming();
    };

    ws.onclose = () => {
      console.log("Disconnected from backend.");
      stopStreaming();
    };
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black">
      
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

      <div className="absolute top-0 w-full p-4 pt-safe-top flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent z-20 h-32">
        <div className="flex flex-col gap-3">
          <button onClick={() => {
            stopStreaming();
            if(mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            router.back();
          }} className="w-10 h-10 bg-black/45 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          {isLive && (
            <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              LIVE + YT
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={toggleCameraFacing} className="w-10 h-10 bg-black/45 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
          <button onClick={toggleMute} className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center border transition ${isMuted ? 'bg-red-600/80 border-red-500 text-white' : 'bg-black/45 border-white/10 text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"}></path></svg>
          </button>
        </div>
      </div>

      {!isLive && (
        <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-16">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Live Drop Title</label>
              <input 
                type="text" 
                placeholder="e.g., Premium Vintage Jackets Drop 🔥" 
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                maxLength={40}
                className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00e599] text-white"
              />
            </div>

            {/* YouTube Stream Key Input (Ab Mandatory aur updated hai) */}
            <div>
              <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">YouTube Stream Key</label>
              <input 
                type="password" 
                placeholder="Paste YouTube RTMP Stream Key..." 
                value={youtubeStreamKey}
                onChange={(e) => setYoutubeStreamKey(e.target.value)}
                className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500 text-white"
              />
            </div>

            <button 
              onClick={() => setShowProductModal(true)}
              className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-[#00e599]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">Link Inventory</h4>
                  <p className="text-[9px] text-[#00e599] font-bold uppercase">{selectedProducts.length} items selected</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            
            <button 
              onClick={handleGoLive}
              className="w-full bg-[#00e599] hover:bg-[#00c987] text-black font-black uppercase tracking-widest py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg"
            >
              Go Live Now
            </button>
          </div>
        </div>
      )}

      {isLive && (
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-16 flex flex-col gap-3">
          <div 
            ref={chatContainerRef}
            className="w-full h-40 overflow-y-auto flex flex-col space-y-2 pr-1 hide-scrollbar bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10"
          >
            {chatMessages.length === 0 ? (
              <div className="text-gray-400 text-xs text-center my-auto">Waiting for viewer comments...</div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="text-xs leading-snug">
                  <span className={`font-bold mr-1.5 ${msg.is_host ? 'text-[#00e599]' : 'text-gray-300'}`}>{msg.user_name}:</span>
                  <span className="text-white">{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {pinnedProduct ? (
            <div className="bg-[#121214]/90 backdrop-blur-md border border-[#00e599]/50 rounded-xl p-2.5 flex items-center gap-3 relative">
              <button onClick={() => setPinnedProduct(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xs">✕</button>
              <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Pinned" className="w-10 h-10 rounded-lg object-cover bg-gray-900" />
              <div className="flex-1 min-w-0">
                <span className="text-[7px] font-black uppercase text-[#00e599]">Pinned</span>
                <h4 className="text-xs font-bold text-white truncate">{pinnedProduct.title}</h4>
                <p className="text-xs font-black text-white">₹{pinnedProduct.price}</p>
              </div>
            </div>
          ) : (
            <div className="text-center pb-1">
              <p className="text-[9px] text-gray-400 font-bold uppercase">No product pinned</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowProductModal(true)} className="flex-1 bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl py-3 flex items-center justify-center gap-2 text-white font-bold text-xs uppercase hover:bg-gray-900 transition">
              Pin Product
            </button>
            <button onClick={() => stopStreaming()} className="w-12 bg-red-600/20 border border-red-600/50 text-red-500 rounded-xl flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowProductModal(false)}>
          <div className="bg-[#121214] w-full max-w-[450px] h-[75vh] rounded-t-3xl border border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">{isLive ? 'Pin Product' : 'Select Inventory'}</h3>
              <button onClick={() => setShowProductModal(false)} className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {inventory.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-[#0a0a0c] border border-gray-800 rounded-xl">
                  <img src={item.image_url || "https://placehold.co/100"} className="w-12 h-12 object-cover rounded-lg bg-gray-900" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <p className="text-xs font-black text-[#00e599]">₹{item.price}</p>
                  </div>
                  {!isLive ? (
                    <button onClick={() => toggleProductSelection(item.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedProducts.includes(item.id) ? 'bg-[#00e599] border-[#00e599] text-black' : 'border-gray-700'}`}>✓</button>
                  ) : (
                    <button onClick={() => { setPinnedProduct(item); setShowProductModal(false); }} className="bg-[#1a1a1d] border border-gray-700 text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg">Pin</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}