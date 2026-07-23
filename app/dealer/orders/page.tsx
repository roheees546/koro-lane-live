"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper for time formatting
function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `JUST NOW`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} MIN AGO`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} HRS AGO`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} DAYS AGO`;
}

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "dealer") {
        router.push("/"); 
        return;
      }

      // Fetch Orders from Database
      const { data: myOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("dealer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (myOrders) {
        setOrders(myOrders);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [router]);

  // Order "Shipped" Mark Karne ka Logic
  const handleMarkShipped = async (orderId: string) => {
    setUpdatingId(orderId);
    
    const { error } = await supabase
      .from("orders")
      .update({ status: 'shipped' })
      .eq("id", orderId);
      
    if (!error) {
      // Local state update karo UI turant badalne ke liye
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'shipped' } : o));
    } else {
      alert("Error aa gaya bawa: " + error.message);
    }
    setUpdatingId(null);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-[#F5A623] font-black tracking-widest text-xs uppercase">Loading Orders...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-24 selection:bg-[#F5A623] selection:text-black overflow-x-hidden">
      
      {/* --- TOP HEADER --- */}
      <header className="flex items-center justify-between px-5 py-6 sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30 border-b border-gray-900">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2 text-white">
            Orders
          </h1>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Manage your pipeline</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 text-[#F5A623] text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,166,35,0.1)]">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse"></span>
          {orders.length} Total
        </div>
      </header>

      {/* --- ORDERS LIST --- */}
      <main className="px-5 pt-6 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-[#121214] border border-dashed border-gray-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center mt-10">
             <div className="w-16 h-16 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
             </div>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">No orders yet</p>
             <p className="text-[10px] text-gray-500">List more items to get your first sale! 🛒</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#121214] border border-gray-800/60 rounded-3xl p-5 hover:border-[#F5A623]/30 transition duration-300 relative group overflow-hidden">
                {/* Background Glow Effect */}
                {order.status === 'pending' && <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5A623] rounded-full blur-[60px] opacity-[0.05] group-hover:opacity-[0.1] transition duration-500 pointer-events-none"></div>}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[9px] text-[#F5A623] font-black tracking-widest uppercase">{timeAgo(order.created_at)}</p>
                      <span className="text-gray-700 text-[8px]">•</span>
                      <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">ID: {order.id.substring(0,6)}</p>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase line-clamp-1 pr-2">{order.product_name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Buyer: <span className="text-gray-200 font-bold">{order.customer_name}</span></p>
                  </div>
                  
                  {/* Premium Status Badge */}
                  <div className="shrink-0">
                    <span className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                      order.status === 'pending' || order.status === 'packed' ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/30' : 
                      order.status === 'shipped' || order.status === 'dispatched' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 
                      'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/30'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-800/60 pt-4 mt-2 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                      <span className="bg-[#1a1a1d] px-2 py-0.5 rounded border border-gray-800">Size: {order.size || "N/A"}</span>
                      <span className="bg-[#1a1a1d] px-2 py-0.5 rounded border border-gray-800">Qty: {order.qty || 1}</span>
                    </div>
                    <span className="font-black text-xl text-white">₹{order.price.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Action Button */}
                  {(order.status === 'pending' || order.status === 'packed') && (
                    <button 
                      onClick={() => handleMarkShipped(order.id)}
                      disabled={updatingId === order.id}
                      className="bg-[#1a1a1d] text-[#F5A623] border border-[#F5A623]/30 hover:bg-[#F5A623] hover:text-black transition text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,166,35,0.1)] hover:shadow-[0_0_20px_rgba(245,166,35,0.3)] disabled:opacity-50 flex items-center gap-2"
                    >
                      {updatingId === order.id ? (
                        <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> Wait...</>
                      ) : (
                        <>Ship Item <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION (Super App Gold Theme) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Home</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Products</span>
        </Link>
        
        {/* Center Big Gold FAB - Links to Inventory to add product */}
        <div className="relative -top-5">
          <Link href="/dealer/inventory" className="w-14 h-14 bg-[#F5A623] rounded-full flex items-center justify-center border-4 border-[#0a0a0c] shadow-[0_0_15px_rgba(245,166,35,0.4)] hover:scale-105 transition transform block">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </Link>
        </div>

        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M13 12h7v1.5h-7V12zm0-2.5h7V11h-7V9.5zm0-2.5h7V8.5h-7V7zm-2.5 5.5H4v1.5h6.5V12.5zm0-2.5H4V11h6.5V10zm0-2.5H4V8.5h6.5V7.5zM3 5h18v14H3V5zm16 12v-1.5H5V17h14z" /></svg>
          <span className="text-[10px] font-bold text-[#F5A623] mb-3">Orders</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Profile</span>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}