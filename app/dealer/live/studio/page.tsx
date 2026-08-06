"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PreLiveStudio() {
  const router = useRouter();
  const [isLive, setIsLive] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 🔴 NAYE ENGINE KE REFS (Camera aur WebSocket ke liye)
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const id = session.user.id;
        setDealerId(id);
        const { data } = await supabase.from('products').select('*').eq('dealer_id', id);
        if (data) setInventory(data);
      }
    };
    fetchInventory();
  }, []);

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

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // 🎥 THE MASTER FUNCTION: Go Live Using Ngrok WebSocket Tunnel
  const startLiveStream = async () => {
    try {
      // 1. Camera aur Mic chalu karo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 2. Ngrok Tunnel WebSocket Server se connect karo
      const ws = new WebSocket('wss://tubby-unisexual-lesser.ngrok-free.dev');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to Ngrok Stream Server!');
        // Dummy Stream Key (Testing phase)
        ws.send(JSON.stringify({ streamKey: "TESTING_KEY" }));

        // 3. Video ko 250ms chunks me kaato aur bhejo
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm; codecs=vp8,opus',
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data); // Sending chunk to PC server via tunnel!
          }
        };

        mediaRecorder.start(250);
        setIsLive(true); // UI ko Live mode me daal do
      };

      ws.onerror = () => {
        alert("Ngrok server se connect nahi ho paya. Kya tera Ngrok tunnel chalu hai?");
      };

    } catch (err) {
      console.error("Camera access denied!", err);
      alert("Camera/Mic ki permission do bhai!");
    }
  };

  // 🛑 Stream Band Karne Ka Function
  const stopLiveStream = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (wsRef.current) wsRef.current.close();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black">
      
      {/* 🔴 CAMERA ENGINE BACKGROUND 🔴 */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          muted // Muted taaki seller ko khud ki awaz wapas na sunai de (echo)
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 w-full p-4 pt-safe-top flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent z-20 h-32 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button onClick={() => { stopLiveStream(); router.back(); }} className="w-10 h-10 bg-black/45 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          {isLive && (
            <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* PRE-LIVE: Setup Screen */}
      {!isLive && (
        <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-16">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#00e599]">Studio Ready</h2>
              <p className="text-xs text-gray-400">Directly go live from Korolane Engine.</p>
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
            
            {/* 🔴 GO LIVE BUTTON */}
            <button 
              onClick={startLiveStream}
              className="w-full bg-[#00e599] hover:bg-[#00c987] text-black font-black uppercase tracking-widest py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg"
            >
              Start Live Broadcast
            </button>
          </div>
        </div>
      )}

      {/* LIVE STUDIO: Controls & Chat */}
      {isLive && (
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-16 flex flex-col gap-3">
          
          {/* Chat Container */}
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

          {/* Pinned Product Display */}
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowProductModal(true)} className="flex-1 bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl py-3 flex items-center justify-center gap-2 text-white font-bold text-xs uppercase hover:bg-gray-900 transition">
              Pin Product
            </button>
            <button onClick={stopLiveStream} className="w-12 bg-red-600/20 border border-red-600/50 text-red-500 rounded-xl flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
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