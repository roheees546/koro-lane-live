"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDashboard() {
  // 🔐 Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const ADMIN_PASSCODE = "Mcmafia9219"; // The secret key

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 📝 Naya State: Logistics Modal ke liye
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 📊 Master Stats
  const [stats, setStats] = useState({
    grossVolume: 0,
    platformProfit: 0,
    pendingPayments: 0,
    pendingPickups: 0
  });

  // Only fetch data if authenticated
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
    // 🔥 UPDATE: `phone` bhi fetch kar rahe hain Dealer ka `profiles` table se
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(store_name, store_address, phone)
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
            profit += (o.price * 0.05); // 💎 5% Platform Fee
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
      .update({ payment_status: "Verified" })
      .eq("id", orderId);

    if (!error) {
      alert("Payment Verified! Dealer can now pack this item. ✅");
      fetchOrders(); 
      if(selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } else {
      alert("Error verifying payment!");
    }
  };

  const handleDispatch = async (orderId: string) => {
    const confirmDispatch = confirm("Kya tumne yeh item Dealer se pick-up karke Customer ko dispatch kar diya hai?");
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

  // ----------------------------------------------------
  // 🛡️ THE SECURITY LOCK SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-[#00e599] selection:text-black">
        <div className="bg-[#0a0a0c] border border-gray-900 p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
          {/* Subtle neon glow on top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 opacity-80"></div>
          
          <h1 className="text-xl font-black tracking-tighter text-white mb-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            RESTRICTED <span className="text-red-500">AREA</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Koro Lane Administrative Access Only</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                autoFocus
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="ENTER SECURE PIN" 
                className={`w-full bg-[#121214] border ${authError ? 'border-red-500' : 'border-gray-800'} rounded-xl text-center text-white px-4 py-3 text-sm outline-none focus:border-red-500 tracking-[0.2em] font-mono transition`}
              />
              {authError && <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest mt-2 animate-bounce">Access Denied</p>}
            </div>
            
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              Unlock God Mode
            </button>
          </form>
          
          <Link href="/" className="inline-block mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest hover:text-white transition">
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 🌟 THE ACTUAL GOD MODE (Only visible if authenticated)
  // ----------------------------------------------------
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] text-xs font-bold uppercase tracking-widest">Loading Network Data...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 selection:bg-[#00e599] selection:text-black">
      
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-900 bg-[#0a0a0c] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h1 className="text-xl font-black tracking-tighter text-white">KORO LANE <span className="text-[#00e599]">ADMIN</span></h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 text-[10px] font-bold uppercase hover:text-red-500 transition">Lock Session</button>
      </nav>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gross Volume</p>
            <h3 className="text-2xl font-black text-white">₹{stats.grossVolume.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-[#003320]/20 border border-[#00e599]/30 p-5 rounded-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10">💎</div>
            <p className="text-[10px] text-[#00e599] uppercase font-bold tracking-widest mb-1">Platform Profit (5%)</p>
            <h3 className="text-2xl font-black text-[#00e599]">₹{stats.platformProfit.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-[#1a0f00] border border-orange-500/30 p-5 rounded-xl">
            <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mb-1">Pending Pickups</p>
            <h3 className="text-2xl font-black text-orange-500">{stats.pendingPickups}</h3>
          </div>
          <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">WhatsApp Checks</p>
            <h3 className="text-2xl font-black text-yellow-500">{stats.pendingPayments}</h3>
          </div>
        </div>

        <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-900 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest">Global Order Logistics</h2>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111114] text-[9px] uppercase tracking-widest text-gray-500">
                  <th className="px-6 py-4 font-bold border-b border-gray-900">Order ID</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-900">Item & Price</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-900">🏪 Pick-Up (Dealer)</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-900">📍 Drop-Off (Customer)</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-900">Status</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-900 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-900 hover:bg-[#111114]/50 transition">
                    <td className="px-6 py-4 font-mono text-gray-400">#{order.id.substring(0, 6)}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 font-bold uppercase">{order.product_name}</p>
                      <p className="font-black text-[#00e599] mt-1">₹{order.price.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="px-6 py-4">
                      {order.profiles ? (
                        <>
                          <p className="font-bold text-[#00e599]">{order.profiles.store_name}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5 truncate max-w-[150px]">{order.profiles.store_address || "Address not set"}</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-red-400 font-bold">Unknown Dealer</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{order.customer_name}</p>
                      <p className="text-[9px] text-gray-600 truncate max-w-[150px] mt-0.5">{order.customer_address || "No Address"} - {order.customer_pincode || ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      {order.payment_status === "Pending WhatsApp Confirmation" ? (
                         <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider block w-max">Check WA 📱</span>
                      ) : order.status === "packed" ? (
                         <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                           <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Ready to Pickup
                         </span>
                      ) : order.status === "dispatched" ? (
                         <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider block w-max">Dispatched 🚚</span>
                      ) : (
                         <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider block w-max">Dealer Packing...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col gap-2 items-end">
                      {order.payment_status === "Pending WhatsApp Confirmation" ? (
                        <button onClick={() => handleVerifyPayment(order.id)} className="bg-yellow-500 text-black hover:bg-yellow-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition w-full shadow-[0_0_10px_rgba(234,179,8,0.2)]">Verify Pay ✅</button>
                      ) : order.status === "packed" ? (
                        <button onClick={() => handleDispatch(order.id)} className="bg-[#00e599] text-black hover:bg-[#00c580] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition w-full shadow-[0_0_10px_rgba(0,229,153,0.3)]">Dispatch 🚚</button>
                      ) : order.status === "dispatched" ? (
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest w-full text-center py-1.5">Done ✅</span>
                      ) : (
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center w-full py-1.5">-</span>
                      )}
                      
                      {/* 🔥 VIEW DETAILS BUTTON */}
                      <button onClick={() => setSelectedOrder(order)} className="bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition w-full border border-gray-700">
                        Full Details 📋
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- 🚀 LOGISTICS DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            
            {/* Modal Header */}
            <div className="bg-[#0a0a0c] border-b border-gray-800 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-[#00e599] font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  Logistics Dispatch Sheet 📋
                </h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Order #{selectedOrder.id.substring(0, 8)} • {selectedOrder.product_name}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white bg-gray-900 p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body: Two Columns for Pick & Drop */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 🏢 SELLER (PICKUP POINT) */}
              <div className="bg-[#003320]/10 border border-[#00e599]/20 rounded-xl p-5">
                <h3 className="text-[10px] text-[#00e599] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#00e599]/20 pb-2">
                  🏪 Pick-Up (Seller)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Store Name</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.profiles?.store_name || "Unknown Store"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Full Address</p>
                    <p className="text-sm text-gray-300">{selectedOrder.profiles?.store_address || "Address not provided by dealer."}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.profiles?.phone || "No Phone Number"}</p>
                  </div>
                  
                  {selectedOrder.profiles?.phone && (
                    <a href={`tel:${selectedOrder.profiles.phone}`} className="mt-2 block w-full text-center bg-[#00e599] text-black text-[10px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-[#00c580] transition">
                      Call Seller 📞
                    </a>
                  )}
                </div>
              </div>

              {/* 🏡 CUSTOMER (DROP-OFF POINT) */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                <h3 className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-orange-500/20 pb-2">
                  📍 Drop-Off (Customer)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Customer Name</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Full Delivery Address</p>
                    <p className="text-sm text-gray-300">{selectedOrder.customer_address || "Address Missing"}</p>
                    <p className="text-xs text-orange-400 mt-1 font-bold">PIN: {selectedOrder.customer_pincode || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.customer_phone || "No Phone Number"}</p>
                  </div>

                  {selectedOrder.customer_phone && (
                    <a href={`tel:${selectedOrder.customer_phone}`} className="mt-2 block w-full text-center bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-orange-600 transition">
                      Call Customer 📞
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-[#0a0a0c] border-t border-gray-800 p-4 flex justify-between items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Payment:</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${selectedOrder.payment_status === 'Verified' ? 'bg-[#00e599]/20 text-[#00e599]' : 'bg-yellow-500/20 text-yellow-500'}`}>
                   {selectedOrder.payment_status}
                 </span>
               </div>
               
               {/* Quick Action Button right inside modal */}
               {selectedOrder.status === 'packed' && (
                 <button onClick={() => handleDispatch(selectedOrder.id)} className="bg-white text-black font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-lg hover:bg-gray-200 shadow-md">
                   Mark Dispatched 🚚
                 </button>
               )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}