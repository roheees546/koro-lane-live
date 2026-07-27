"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const ADMIN_PASSCODE = "Mcmafia9219";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [stats, setStats] = useState({
    grossVolume: 0,
    platformProfit: 0,
    pendingPayments: 0,
    pendingPickups: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput("");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    // 🔥 JOINED PRODUCTS TABLE TO GET IMAGE & EXACT DETAILS
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(store_name, store_address, phone),
        products(image_url, image_urls)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
      
      let volume = 0;
      let profit = 0;
      let pendingPay = 0;
      let readyToPickup = 0;

      data.forEach(o => {
        if (o.status !== 'cancelled') {
          if (o.payment_status === "Verified") {
            volume += o.price;
            profit += (o.price * 0.05); 
          }
          if (o.payment_status === "Pending WhatsApp Confirmation") {
            pendingPay += 1;
          }
          if (o.status === "packed" && o.payment_status === "Verified") {
            readyToPickup += 1;
          }
        }
      });
      
      setStats({
        grossVolume: volume,
        platformProfit: profit,
        pendingPayments: pendingPay,
        pendingPickups: readyToPickup
      });
    }
    setLoading(false);
  };

  const handleVerifyPayment = async (orderId: string) => {
    const confirmVerify = confirm("Kya sach mein customer ne WhatsApp par payment screenshot bhej diya hai?");
    if (!confirmVerify) return;

    const { error } = await supabase
      .from("orders")
      .update({ 
        payment_status: "Verified",
        status: "processing"
      })
      .eq("id", orderId);

    if (!error) {
      alert("Payment Verified! Item is now permanently SOLD OUT. ✅");
      fetchOrders(); 
      if(selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } else {
      alert("Error verifying payment!");
    }
  };

  const handleMarkPacked = async (orderId: string) => {
    const confirmPack = confirm("Kya yeh item pack ho chuka hai pickup ke liye?");
    if (!confirmPack) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: "packed" })
      .eq("id", orderId);

    if (!error) {
      alert("Item Marked as Packed! 📦");
      fetchOrders();
      if(selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } else {
      alert("Error updating status!");
    }
  };

  const handleRejectOrder = async (orderId: string, productId: string) => {
    const confirmReject = confirm("🚨 FAKE ORDER ALERT! Kya sach me order delete karke item ko wapas Live karna hai?");
    if (!confirmReject) return;

    if (productId) {
      const { error: productError } = await supabase
        .from("products")
        .update({ is_sold: false })
        .eq("id", productId);
        
      if (productError) {
        alert("Item restore karne me dikkat aayi!");
        return;
      }
    }

    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (!orderError) {
      alert("Kachra saaf! ♻️ Item wapas marketplace par Live ho gaya hai.");
      fetchOrders(); 
      if(selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } else {
      alert("Order delete karne me error aaya!");
    }
  };

  const handleDispatch = async (orderId: string) => {
    const confirmDispatch = confirm("Kya tumne yeh item pick-up karke Customer ko dispatch kar diya hai?");
    if (!confirmDispatch) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: "dispatched" })
      .eq("id", orderId);

    if (!error) {
      alert("Item Dispatched Successfully! 🚀");
      fetchOrders(); 
      if(selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } else {
      alert("Error dispatching item!");
    }
  };

  // 🔥 THE BREAKOUT HACK: fixed inset-0 z-[100] overlays the entire screen, hiding bottom nav
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-4 selection:bg-[#00e599] selection:text-black">
        <div className="bg-[#121214] border border-gray-900 p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 opacity-80"></div>
          <h1 className="text-xl font-black tracking-tighter text-white mb-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            RESTRICTED <span className="text-red-500">AREA</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Koro Lane Administrative Access Only</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" autoFocus required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="ENTER SECURE PIN" 
                className={`w-full bg-[#0a0a0c] border ${authError ? 'border-red-500' : 'border-gray-800'} rounded-xl text-center text-white px-4 py-3 text-sm outline-none focus:border-red-500 tracking-[0.2em] font-mono transition`}
              />
              {authError && <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest mt-2 animate-bounce">Access Denied</p>}
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              Unlock God Mode
            </button>
          </form>
          <Link href="/" className="inline-block mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest hover:text-white transition">Return to Marketplace</Link>
        </div>
      </div>
    );
  }

  // 🔥 THE BREAKOUT HACK APPLIED TO MAIN DASHBOARD TOO
  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto text-white font-sans selection:bg-[#00e599] selection:text-black">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-900 bg-[#0a0a0c] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h1 className="text-xl font-black tracking-tighter text-white">KORO LANE <span className="text-[#00e599]">ADMIN</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 text-[10px] font-bold uppercase hover:text-white transition hidden sm:block">View Site</Link>
          <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 text-[10px] font-bold uppercase hover:text-red-500 transition">Lock Session</button>
        </div>
      </nav>

      {loading ? (
        <div className="min-h-[80vh] flex items-center justify-center text-[#00e599] text-xs font-bold uppercase tracking-widest animate-pulse">Loading Network Data...</div>
      ) : (
        <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
          
          {/* Top Stats - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#121214] border border-gray-800 p-5 rounded-xl hover:border-gray-700 transition">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gross Volume</p>
              <h3 className="text-2xl font-black text-white">₹{stats.grossVolume.toLocaleString('en-IN')}</h3>
            </div>
            <div className="bg-[#003320]/20 border border-[#00e599]/30 p-5 rounded-xl relative overflow-hidden transition hover:border-[#00e599]/50">
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">💎</div>
              <p className="text-[10px] text-[#00e599] uppercase font-bold tracking-widest mb-1">Platform Profit (5%)</p>
              <h3 className="text-2xl font-black text-[#00e599]">₹{stats.platformProfit.toLocaleString('en-IN')}</h3>
            </div>
            <div className="bg-[#1a0f00] border border-orange-500/30 p-5 rounded-xl hover:border-orange-500/50 transition">
              <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mb-1">Pending Pickups</p>
              <h3 className="text-2xl font-black text-orange-500">{stats.pendingPickups}</h3>
            </div>
            <div className="bg-[#121214] border border-yellow-500/30 p-5 rounded-xl hover:border-yellow-500/50 transition">
              <p className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-1">WhatsApp Checks</p>
              <h3 className="text-2xl font-black text-yellow-500">{stats.pendingPayments}</h3>
            </div>
          </div>

          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-sm font-bold uppercase tracking-widest px-2 border-l-2 border-[#00e599]">Global Order Logistics</h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{orders.length} Total Orders</span>
          </div>
          
          {/* Orders Grid - Fully Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map(order => (
              <div key={order.id} className="bg-[#121214] border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 relative hover:border-gray-600 transition shadow-lg">
                 
                 {/* Top Row: Status & Order ID */}
                 <div className="flex justify-between items-start border-b border-gray-900 pb-4">
                   <div>
                     <p className="text-[10px] text-gray-500 font-mono mb-1">#{order.id.substring(0, 8)}</p>
                     <h3 className="font-black text-white uppercase text-sm truncate max-w-[180px]">{order.product_name}</h3>
                     <p className="text-[#00e599] font-black mt-1 text-base">₹{order.price.toLocaleString('en-IN')}</p>
                   </div>
                   <div className="text-right shrink-0">
                      {order.payment_status === "Pending WhatsApp Confirmation" ? (
                          <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider block">Pending WA 📱</span>
                      ) : order.status === "packed" ? (
                          <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Ready to Pickup
                          </span>
                      ) : order.status === "dispatched" ? (
                          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider block">Dispatched 🚚</span>
                      ) : (
                          <span className="bg-[#0a0a0c] text-gray-400 border border-gray-800 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider block">Dealer Packing</span>
                      )}
                   </div>
                 </div>

                 {/* Logistics Info (Pick/Drop) */}
                 <div className="grid grid-cols-2 gap-3 bg-[#0a0a0c] p-3.5 rounded-xl border border-gray-900">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">🏪 Pick-Up</p>
                      <p className="text-[10px] font-bold text-[#00e599] truncate">{order.profiles?.store_name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">📍 Drop-Off</p>
                      <p className="text-[10px] font-bold text-white truncate">{order.customer_name}</p>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-col gap-2 mt-auto pt-2">
                   {order.payment_status === "Pending WhatsApp Confirmation" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleVerifyPayment(order.id)} className="bg-yellow-500 text-black hover:bg-yellow-400 px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition w-full shadow-[0_0_15px_rgba(234,179,8,0.2)]">Verify ✅</button>
                        <button onClick={() => handleRejectOrder(order.id, order.product_id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition w-full">Reject ♻️</button>
                      </div>
                   ) : order.status === "processing" ? (
                      <button onClick={() => handleMarkPacked(order.id)} className="bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition w-full">Mark Packed 📦</button>
                   ) : order.status === "packed" ? (
                      <button onClick={() => handleDispatch(order.id)} className="bg-[#00e599] text-black hover:bg-[#00c580] px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition w-full shadow-[0_0_15px_rgba(0,229,153,0.3)]">Dispatch 🚚</button>
                   ) : order.status === "dispatched" ? (
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest w-full text-center py-2.5">Done ✅</span>
                   ) : (
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center w-full py-2.5">-</span>
                   )}
                   <button onClick={() => setSelectedOrder(order)} className="bg-[#0a0a0c] text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition w-full border border-gray-800 mt-1">Full Details 📋</button>
                 </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-2xl">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No Orders Found</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* --- 🚀 LOGISTICS DETAILS MODAL (WITH ITEM DETAILS) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <div className="bg-[#050505] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8">
            
            <div className="bg-[#0a0a0c] border-b border-gray-900 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-[#00e599] font-black uppercase tracking-widest text-sm flex items-center gap-2">Logistics Dispatch Sheet 📋</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Order #{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white bg-[#121214] border border-gray-800 p-2.5 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* 🔥 NEW: ITEM DETAILS VERIFICATION BLOCK */}
              <div className="bg-[#121214] border border-gray-800 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-24 h-24 bg-black rounded-xl border border-gray-800 overflow-hidden shrink-0">
                  {selectedOrder.products?.image_urls?.[0] || selectedOrder.products?.image_url ? (
                    <img 
                      src={selectedOrder.products?.image_urls?.[0] || selectedOrder.products?.image_url} 
                      alt="Product" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600 uppercase font-bold text-center p-2">No Image</div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Item to Verify</p>
                  <h3 className="font-black text-white uppercase text-base leading-tight mb-2">{selectedOrder.product_name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[#00e599] font-black text-xl">₹{selectedOrder.price.toLocaleString('en-IN')}</p>
                    <span className="bg-[#0a0a0c] text-gray-400 border border-gray-800 px-2 py-0.5 rounded text-[9px] font-mono tracking-widest">ID: {selectedOrder.product_id.substring(0,8)}</span>
                  </div>
                </div>
              </div>

              {/* LOGISTICS GRIDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#003320]/10 border border-[#00e599]/20 rounded-2xl p-5 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-20 text-3xl">🏪</div>
                  <h3 className="text-[11px] text-[#00e599] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#00e599]/20 pb-3">Pick-Up (Seller)</h3>
                  <div className="space-y-4 relative z-10">
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Store Name</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.profiles?.store_name || "Unknown Store"}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Full Address</p><p className="text-sm text-gray-300 mt-0.5">{selectedOrder.profiles?.store_address || "Address not provided."}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.profiles?.phone || "No Phone Number"}</p></div>
                    {selectedOrder.profiles?.phone && (<a href={`tel:${selectedOrder.profiles.phone}`} className="mt-4 block w-full text-center bg-[#00e599] text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.2)]">Call Seller 📞</a>)}
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-20 text-3xl">📍</div>
                  <h3 className="text-[11px] text-orange-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-orange-500/20 pb-3">Drop-Off (Customer)</h3>
                  <div className="space-y-4 relative z-10">
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Customer Name</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.customer_name}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Delivery Address</p><p className="text-sm text-gray-300 mt-0.5">{selectedOrder.customer_address}</p><p className="text-xs text-orange-400 mt-1.5 font-bold bg-orange-500/10 inline-block px-2 py-1 rounded">PIN: {selectedOrder.customer_pincode || "---"}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.customer_phone || "No Phone Number"}</p></div>
                    {selectedOrder.customer_phone && (<a href={`tel:${selectedOrder.customer_phone}`} className="mt-4 block w-full text-center bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-orange-600 transition shadow-[0_0_15px_rgba(249,115,22,0.2)]">Call Customer 📞</a>)}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}