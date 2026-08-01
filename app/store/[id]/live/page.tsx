"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BuyerLiveView() {
  const params = useParams();
  const router = useRouter();
  const dealerId = params.id as string;

  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch active pinned product for this dealer from Supabase
  useEffect(() => {
    const fetchActivePin = async () => {
      if (!dealerId) return;
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('dealer_id', dealerId)
        .limit(1)
        .single();
      
      if (data) setPinnedProduct(data);
    };
    fetchActivePin();
  }, [dealerId]);

  // 2. Fetch live chat messages & Setup Supabase Realtime Listener for this Dealer
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

    // Realtime subscription
    const channel = supabase
      .channel(`seller-live-chat-${dealerId}`)
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

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle Host sending a message from Seller dashboard
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      dealer_id: dealerId,
      user_name: "KoRo Lane (Host)",
      avatar: "🏪",
      text: chatInput.trim(),
      is_host: true,
    };

    const { error } = await supabase.from('live_messages').insert([newMessage]);
    if (!error) {
      setChatInput("");
    }
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black flex flex-col justify-between">
      
      {/* 🎥 LIVE STREAM VIDEO BACKGROUND */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* 🔴 TOP BAR */}
      <div className="relative w-full p-4 pt-safe-top flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            LIVE DASHBOARD
          </div>
        </div>

        <button onClick={() => window.history.back()} className="w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* MIDDLE CONTENT CONTAINER */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-4 pb-6 overflow-hidden">
        
        {/* 💬 REALTIME CHAT FEED FOR SELLER */}
        <div 
          ref={chatContainerRef}
          className="w-full h-48 overflow-y-auto flex flex-col space-y-2 mb-3 pr-2 hide-scrollbar"
        >
          {chatMessages.map((msg, idx) => (
            <div key={msg.id || idx} className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 max-w-[90%]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-[#00e599]">{msg.user_name}</span>
                {msg.is_host && <span className="bg-[#00e599] text-black text-[7px] px-1 font-black rounded">HOST</span>}
              </div>
              <p className="text-xs text-white">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* ✍️ SELLER CHAT INPUT BOX */}
        <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Reply to viewers as Host..."
            className="flex-1 bg-black/80 backdrop-blur-md border border-white/20 text-xs text-white px-4 py-3 rounded-xl outline-none focus:border-[#00e599]"
          />
          <button type="submit" className="bg-[#00e599] text-black font-black text-xs px-4 py-3 rounded-xl">
            Send
          </button>
        </form>

        {/* 🛍️ PINNED PRODUCT OVERLAY */}
        {pinnedProduct && (
          <div className="w-full bg-[#121214]/90 backdrop-blur-xl border border-[#00e599]/60 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Pinned" className="w-12 h-12 rounded-xl object-cover bg-gray-900 border border-white/10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-ping"></span>
                <span className="text-[9px] font-black uppercase text-[#00e599]">Currently Pinned</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{pinnedProduct.title}</h4>
              <p className="text-sm font-black text-white">₹{pinnedProduct.price}</p>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}