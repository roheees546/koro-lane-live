"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Same helper for time formatting
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599]">Loading Orders...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* --- TOP HEADER --- */}
      <div className="flex items-center px-5 pt-6 pb-6 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-gray-900">
        <h1 className="text-2xl font-bold tracking-tight text-[#00e599]">My Orders</h1>
        <div className="ml-auto bg-gray-800 text-xs px-3 py-1 rounded-full font-bold">
          {orders.length} Total
        </div>
      </div>

      {/* --- ORDERS LIST --- */}
      <div className="px-5 pt-6">
        {orders.length === 0 ? (
          <div className="text-center py-12 border border-gray-800 border-dashed rounded-2xl">
            <p className="text-gray-500 text-sm mb-4">Koi order nahi aaya bawa abhi! 🛒</p>
            <p className="text-gray-600 text-xs">Apna product share karo aur khareedar ka wait karo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0f0f11] rounded-2xl overflow-hidden flex flex-col border border-gray-900 shadow-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] text-[#00e599] font-medium tracking-wider mb-1 uppercase">{timeAgo(order.created_at)}</p>
                    <h4 className="text-sm font-bold leading-tight uppercase">{order.product_name}</h4>
                    <p className="text-xs text-gray-400 mt-1">Customer: <span className="text-white font-medium">{order.customer_name}</span></p>
                  </div>
                  {/* Status Badge */}
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.status === 'pending' ? 'bg-[#ff8b3d]/20 text-[#ff8b3d] border border-[#ff8b3d]/30' : 'bg-[#00e599]/20 text-[#00e599] border border-[#00e599]/30'}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-800 pt-3 mt-1">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Size: {order.size} • Qty: {order.qty}</p>
                    <span className="font-bold text-lg text-white">₹{order.price.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Shipped Action Button */}
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleMarkShipped(order.id)}
                      disabled={updatingId === order.id}
                      className="bg-[#003320] text-[#00e599] border border-[#00e599] hover:bg-[#00e599] hover:text-black transition text-xs px-4 py-2 rounded-lg font-bold"
                    >
                      {updatingId === order.id ? "Updating..." : "Mark Shipped"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- BOTTOM NAVIGATION (MOBILE ZINDA ROUTING) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between z-40 rounded-t-2xl">
        
        {/* HOME BLOCK (Gray) */}
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span className="text-[10px] text-gray-500 mb-3">Home</span>
        </Link>

        {/* ORDERS BLOCK (Active - Green) */}
        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          <span className="text-[10px] text-[#00e599] mb-3">Orders</span>
        </Link>

        {/* INVENTORY BLOCK (Gray) */}
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Inventory</span>
        </Link>

        {/* PROFILE BLOCK (Gray) */}
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Profile</span>
        </Link>

      </div>
    </div>
  );
}