"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LiveShoppingPage() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [likes, setLikes] = useState(152);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const dealerId = "e2b9fc73-379b-4eb4-95bc-177aec9563b3";

  // 1. Fetch active pinned product
  useEffect(() => {
    const fetchActivePin = async () => {
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

  // 2. Fetch initial chat messages & Setup Supabase Realtime Listener
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_messages')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data && data.length > 0) {
        setChatMessages(data);
      } else {
        // Fallback default messages if table is empty
        setChatMessages([
          { id: 4, user_name: "KoRo Lane", avatar: "🏪", text: "It's Size L & in perfect condition ✅", is_host: true },
          { id: 5, user_name: "Ravi", avatar: "👨🏽", text: "Shipping to Delhi?", is_host: false },
          { id: 6, user_name: "Sneha", avatar: "👩🏽", text: "Loved it! ❤️", is_host: false },
        ]);
      }
    };

    fetchMessages();

    // Realtime subscription for incoming messages
    const channel = supabase
      .channel('realtime-chat')
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle sending a new message to Supabase
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      dealer_id: dealerId,
      user_name: "You",
      avatar: "👤",
      text: chatInput.trim(),
      is_host: false,
    };

    const { error } = await supabase.from('live_messages').insert([newMessage]);
    if (error) {
      console.error("Error sending message:", error.message);
    } else {
      setChatInput("");
    }
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
  };

  const handleProductClick = () => {
    if (pinnedProduct) {
      router.push(`/product/${pinnedProduct.id}`);
    } else {
      router.push(`/store/${dealerId}/live`);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#050505] font-sans text-white overflow-hidden max-w-[450px] mx-auto pb-[70px]">
      
      {/* 🎥 BACKGROUND YOUTUBE LIVE STREAM FOR BUYERS */}
      <div className="absolute inset-0 w-full h-full z-0 bg-zinc-950 overflow-hidden">
        <iframe
          src="https://www.youtube.com/embed/live_stream?channel=UCKvhbhHCaOf_FwA-GAciOCw&autoplay=1&mute=0&controls=0&modestbranding=1&playsinline=1"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-125"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none"></div>

      {/* 🚀 TOP HEADER */}
      <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow-md">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              124
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-black text-xs shrink-0 shadow-lg">
              KL
            </div>
            <div className="flex flex-col drop-shadow-md">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm">KoRo Lane</span>
                <svg className="w-3.5 h-3.5 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span className="text-xs text-gray-300">Live Thrift Drop 🌿</span>
            </div>
          </div>
        </div>

        <button className="pointer-events-auto flex items-center gap-1.5 text-xs font-bold bg-black/40 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full hover:bg-black/60 transition shadow-lg">
          Share
        </button>
      </div>

      {/* 🛍️ NOW SHOWING WIDGET */}
      {pinnedProduct && (
        <div className="absolute top-20 right-4 z-30 pointer-events-auto" onClick={handleProductClick}>
          <div className="w-[110px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col shadow-2xl hover:border-[#00e599]/30 transition cursor-pointer group">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span>
              <span className="text-[#00e599] text-[7px] font-black uppercase tracking-widest">Now Showing</span>
            </div>
            <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 relative bg-zinc-900">
              <img src={pinnedProduct.image_url || "https://placehold.co/100"} alt="Current Item" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            </div>
            <h3 className="text-[8px] font-black uppercase leading-tight text-white mb-1 line-clamp-2">{pinnedProduct.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#00e599]">₹{pinnedProduct.price}</span>
              <svg className="w-3 h-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </div>
        </div>
      )}

      {/* 💬 BOTTOM CONTENT AREA */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-4 pointer-events-none">
        
        {/* Realtime Chat List */}
        <div 
          ref={chatContainerRef}
          className="pointer-events-auto w-[80%] h-[220px] overflow-y-auto flex flex-col justify-end space-y-3 pb-3 hide-scrollbar mask-image-gradient"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)' }}
        >
          {chatMessages.map((msg, index) => (
            <div key={msg.id || index} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs shrink-0 border border-white/5 shadow-sm">
                {msg.avatar || "👤"}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-300">{msg.user_name}</span>
                  {msg.is_host && <span className="bg-[#00e599] text-black text-[7px] px-1.5 py-0.5 font-black uppercase rounded-sm">Host</span>}
                </div>
                <span className={`text-xs leading-snug drop-shadow-md ${msg.is_host ? 'text-[#00e599] font-medium' : 'text-white'}`}>{msg.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input & Interactive Likes Button */}
        <div className="pointer-events-auto flex items-center gap-3 mb-5">
          <form onSubmit={handleSendMessage} className="relative flex-1">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Say something..." 
              className="w-full bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 text-white text-xs px-4 py-3 rounded-full outline-none focus:border-[#00e599]/50 placeholder-gray-500 shadow-inner"
            />
            <button type="submit" className="absolute right-2 top-1.5 p-1.5 text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
          
          <button onClick={handleLike} className="flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 transition group">
            <svg className="w-6 h-6 text-red-500 fill-red-500 transition animate-bounce" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span className="text-xs font-bold text-white">{likes}</span>
          </button>
        </div>

        {/* 🎛️ DASHBOARD WIDGETS */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="bg-[#121214]/90 backdrop-blur-lg border border-white/5 rounded-2xl p-3.5 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                <img src="https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 mb-0.5">Next live</p>
                <h4 className="text-sm font-bold text-white">Thrift & Co. 🌿</h4>
                <p className="text-[9px] text-gray-500">Premium Thrift Finds</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-xs font-black text-[#00e599] font-mono">01:30:45</p>
              <button className="flex items-center gap-1 border border-[#00e599]/30 bg-[#003320]/30 px-2 py-1.5 rounded-lg">
                <span className="text-[9px] font-bold text-[#00e599]">Remind me</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}