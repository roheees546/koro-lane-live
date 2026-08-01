"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StoreLivePage() {
  const params = useParams();
  const router = useRouter();
  
  // 🚀 Dynamic Dealer ID from URL params (/store/[id]/live)
  const dealerId = params.id as string;

  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch active pinned product for this specific dealer dynamically
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

  // 2. Fetch live chat & Setup Realtime channel scoped strictly to this dealerId
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

    // Dynamic Supabase Realtime Channel Subscription
    const channel = supabase
      .channel(`store-live-${dealerId}`)
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

  // Send message bound to this specific dealer
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !dealerId) return;

    const newMessage = {
      dealer_id: dealerId,
      user_name: "Viewer", 
      avatar: "👤",
      text: chatInput.trim(),
      is_host: false,
    };

    const { error } = await supabase.from('live_messages').insert([newMessage]);
    if (!error) {
      setChatInput("");
    }
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden flex flex-col justify-between">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-zinc-950 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* TOP BAR */}
      <div className="relative w-full p-4 flex justify-between items-center z-20">
        <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          LIVE STREAM
        </div>
        <button onClick={() => router.back()} className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center border border-white/10 text-white">
          ✕
        </button>
      </div>

      {/* CHAT & CONTROLS CONTAINER */}
      <div className="relative z-20 flex flex-col px-4 pb-4 space-y-3 mt-auto">
        
        {/* CHAT MESSAGES FEED */}
        <div 
          ref={chatContainerRef}
          className="w-full h-48 overflow-y-auto flex flex-col space-y-2 pr-1 hide-scrollbar bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10"
        >
          {chatMessages.length === 0 ? (
            <div className="text-gray-400 text-xs text-center my-auto">No messages yet. Say hello to the store! 👋</div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={msg.id || idx} className="text-xs leading-snug">
                <span className={`font-bold mr-1.5 ${msg.is_host ? 'text-[#00e599]' : 'text-gray-300'}`}>{msg.user_name}:</span>
                <span className="text-white">{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* CHAT INPUT BOX */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/90 border border-white/20 text-xs text-white px-4 py-2.5 rounded-xl outline-none focus:border-[#00e599]"
          />
          <button type="submit" className="bg-[#00e599] text-black font-black text-xs px-4 py-2.5 rounded-xl">
            Send
          </button>
        </form>

        {/* PINNED PRODUCT CARD (Clickable to Checkout/Product Page) */}
        {pinnedProduct && (
          <div 
            onClick={() => router.push(`/product/${pinnedProduct.id}`)}
            className="bg-[#121214]/90 backdrop-blur-xl border border-[#00e599]/60 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-[#00e599] transition shadow-lg"
          >
            <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Pinned" className="w-10 h-10 rounded-xl object-cover bg-gray-900 border border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase text-[#00e599]">Pinned by Store</p>
              <h4 className="text-xs font-bold text-white truncate">{pinnedProduct.title}</h4>
              <p className="text-xs font-black text-white">₹{pinnedProduct.price}</p>
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