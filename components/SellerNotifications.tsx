"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SellerNotifications({ sellerId }: { sellerId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!sellerId) return;
    
    // Initial Fetch
    fetchNotifications();

    // Realtime subscription for instant bell ring
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${sellerId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    // Instant UI update so user doesn't wait
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Background DB update
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  return (
    <div className="relative z-50">
      {/* Bell Icon Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full bg-[#121214] border border-gray-800 text-gray-300 hover:text-white transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-[#121214] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1d]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Seller Activity</span>
            <span className="text-[10px] text-gray-500 font-bold">{notifications.length} total</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/50 custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 transition-all cursor-pointer hover:bg-gray-900/80 ${notif.is_read ? 'opacity-60 bg-transparent' : 'bg-[#00e599]/5 border-l-2 border-[#00e599]'}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-xs font-bold ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</span>
                    <span className="text-[9px] text-gray-500 font-medium">
                      {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{notif.message}</p>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Inbox is empty</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}