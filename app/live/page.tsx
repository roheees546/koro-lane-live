"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveShoppingPage() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [likes, setLikes] = useState(152);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dummy Chat Messages
  const [chatMessages, setChatMessages] = useState([
    { id: 4, user: "KoRo Lane", avatar: "🏪", time: "11:02 AM", text: "It's Size L & in perfect condition ✅", isHost: true },
    { id: 5, user: "Ravi", avatar: "👨🏽", time: "11:03 AM", text: "Shipping to Delhi?", isHost: false },
    { id: 6, user: "Sneha", avatar: "👩🏽", time: "11:03 AM", text: "Loved it! ❤️", isHost: false },
    { id: 7, user: "Pooja", avatar: "👱🏽‍♀️", time: "11:03 AM", text: "Show more hoodies", isHost: false },
    { id: 8, user: "Aman", avatar: "👨🏻‍💻", time: "11:04 AM", text: "Superb quality 🔥", isHost: false },
  ]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), user: "You", avatar: "👤", time: "Now", text: chatInput, isHost: false }]);
    setChatInput("");
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#050505] font-sans text-white overflow-hidden max-w-[450px] mx-auto pb-[70px]">
      
      {/* 🎥 BACKGROUND STREAM */}
      <img 
        src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=800&auto=format&fit=crop" 
        alt="Live Stream" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" 
      />
      
      {/* Dark Gradients for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none"></div>

      {/* 🚀 TOP HEADER */}
      <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 flex justify-between items-start pointer-events-none">
        
        {/* Left Side: Live Badge & Host */}
        <div className="flex flex-col gap-4 pointer-events-auto">
          {/* Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow-md">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              124
            </div>
          </div>

          {/* Host Info */}
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

        {/* Right Side: Share Button */}
        <button className="pointer-events-auto flex items-center gap-1.5 text-xs font-bold bg-black/40 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full hover:bg-black/60 transition shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          Share
        </button>
      </div>

      {/* 🛍️ NOW SHOWING WIDGET (Top Right Floating) */}
      <div className="absolute top-20 right-4 z-30 pointer-events-auto">
        <div className="w-[110px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col shadow-2xl hover:border-[#00e599]/30 transition cursor-pointer group">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full animate-pulse"></span>
            <span className="text-[#00e599] text-[7px] font-black uppercase tracking-widest">Now</span>
          </div>
          <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 relative">
            <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop" alt="Current Item" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
          </div>
          <h3 className="text-[8px] font-black uppercase leading-tight text-white mb-1 line-clamp-2">VINTAGE CARHARTT JACKET</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#00e599]">₹2499</span>
            <svg className="w-3 h-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
      </div>

      {/* 💬 BOTTOM CONTENT AREA */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-4 pointer-events-none">
        
        {/* Chat List */}
        <div 
          ref={chatContainerRef}
          className="pointer-events-auto w-[80%] h-[220px] overflow-y-auto flex flex-col justify-end space-y-3 pb-3 hide-scrollbar mask-image-gradient"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)' }}
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs shrink-0 border border-white/5 shadow-sm">
                {msg.avatar}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-300">{msg.user}</span>
                  {msg.isHost && <span className="bg-[#00e599] text-black text-[7px] px-1.5 py-0.5 font-black uppercase rounded-sm">Host</span>}
                </div>
                <span className={`text-xs leading-snug drop-shadow-md ${msg.isHost ? 'text-[#00e599] font-medium' : 'text-white'}`}>{msg.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input & Like Button */}
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
            <svg className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            <span className="text-xs font-bold text-white">{likes}</span>
          </button>
        </div>

        {/* 🎛️ DASHBOARD WIDGETS (Bottom Cards) */}
        <div className="pointer-events-auto flex flex-col gap-2">
          
          {/* Next Live Card */}
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
              <div className="text-right">
                <p className="text-[8px] text-gray-400">Starts in</p>
                <p className="text-xs font-black text-[#00e599] font-mono">01:30:45</p>
                <p className="text-[7px] text-gray-500">(After 1.5 hr)</p>
              </div>
              <button className="flex items-center gap-1 border border-[#00e599]/30 bg-[#003320]/30 px-2 py-1.5 rounded-lg hover:bg-[#00e599]/20 transition">
                <svg className="w-3 h-3 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span className="text-[9px] font-bold text-[#00e599]">Remind me</span>
              </button>
            </div>
          </div>

          {/* Split Action Cards */}
          <div className="grid grid-cols-[1fr_1.8fr] gap-2">
            {/* Upcoming button */}
            <button className="bg-[#121214]/90 backdrop-blur-lg border border-white/5 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-[#1a1a1c] transition shadow-lg group">
              <svg className="w-4 h-4 text-white group-hover:-translate-y-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <span className="text-[10px] font-bold text-white">Upcoming in this live</span>
              <svg className="w-3 h-3 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            {/* Announcement Banner */}
            <div className="bg-[#003320]/20 backdrop-blur-lg border border-[#00e599]/20 rounded-2xl p-3 flex flex-col justify-center shadow-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                <span className="text-[8px] font-black text-[#00e599] uppercase tracking-widest">Announcement</span>
              </div>
              <span className="text-[9px] text-gray-300 leading-snug">Free delivery on all drops! 📍 Dehradun Only</span>
            </div>
          </div>

        </div>
      </div>

      {/* Global styles for hide-scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}