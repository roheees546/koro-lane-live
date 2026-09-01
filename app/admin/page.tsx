"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const ADMIN_PASSCODE = "Mcmafia9219";

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'history' | 'sellers'
  const [orders, setOrders] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const [stats, setStats] = useState({
    grossVolume: 0,
    platformProfit: 0,
    pendingPayments: 0,
    pendingPickups: 0
  });

  const prevPendingCount = useRef(0);
  const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Polling for new orders every 15 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchData(false);
      const interval = setInterval(() => {
        fetchData(true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError(false);
      // Play a silent sound to unlock browser audio policy
      const audio = new Audio(NOTIFICATION_SOUND);
      audio.volume = 0;
      audio.play().catch(e => console.log(e));
    } else {
      setAuthError(true);
      setPasswordInput("");
    }
  };

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    // Fetch Orders
    const { data: orderData } = await supabase
      .from("orders")
      .select(`*, profiles(store_name, store_address, phone)`)
      .order("created_at", { ascending: false });

    // Fetch Sellers
    const { data: sellerData } = await supabase
      .from("profiles")
      .select("*")
      .not("store_name", "is", null);

    if (sellerData) setSellers(sellerData);

    if (orderData) {
      setOrders(orderData);
      
      let volume = 0;
      let profit = 0;
      let pendingPay = 0;
      let readyToPickup = 0;

      orderData.forEach(o => {
        if (o.status !== 'cancelled' && o.payment_status === "Verified") {
          volume += o.price;
          profit += (o.price * 0.05); 
        }
        if (o.status !== 'cancelled' && o.payment_status === "Pending WhatsApp Confirmation") {
          pendingPay += 1;
        }
        if (o.status === "packed" && o.payment_status === "Verified") {
          readyToPickup += 1;
        }
      });
      
      setStats({ grossVolume: volume, platformProfit: profit, pendingPayments: pendingPay, pendingPickups: readyToPickup });

      // 🔥 ALARM LOGIC: If new pending order arrives, play sound
      const currentActionNeeded = pendingPay + readyToPickup;
      if (isBackground && currentActionNeeded > prevPendingCount.current) {
        playNotification();
      }
      prevPendingCount.current = currentActionNeeded;
    }
    
    if (!isBackground) setLoading(false);
  };

  const playNotification = () => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 1;
    audio.play().catch(e => console.log("Audio block by browser", e));
    
    // Fallback vibrate for mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!confirm("Confirm WhatsApp Payment?")) return;
    await supabase.from("orders").update({ payment_status: "Verified", status: "processing" }).eq("id", orderId);
    fetchData(); 
  };

  const handleMarkPacked = async (orderId: string) => {
    if (!confirm("Item packed for pickup?")) return;
    await supabase.from("orders").update({ status: "packed" }).eq("id", orderId);
    fetchData();
  };

  const handleDispatch = async (orderId: string) => {
    if (!confirm("Item dispatched to customer?")) return;
    await supabase.from("orders").update({ status: "dispatched" }).eq("id", orderId);
    fetchData(); 
  };

  // 🔥 NAYA MASTER BUTTON LOGIC
  const handleMarkDelivered = async (orderId: string) => {
    if (!confirm("Has the customer received the item? This will release the seller's payout!")) return;
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    alert("Order Delivered! Seller payout has been updated. 💰");
    fetchData(); 
  };

  // 🔥 REJECT LOGIC
  const handleRejectOrder = async (orderId: string, productId: string) => {
    if (!confirm("🚨 FAKE ORDER? Mark as Cancelled and make item LIVE again?")) return;

    if (productId) {
      await supabase.from("products").update({ is_sold: false }).eq("id", productId);
    }
    await supabase.from("orders").update({ status: "cancelled", payment_status: "Rejected" }).eq("id", orderId);
    alert("Order marked Fake. Item is LIVE again! ♻️");
    fetchData(); 
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order); 
    if (order.product_id) {
      const { data: prodData } = await supabase.from("products").select("image_url, image_urls").eq("id", order.product_id).single();
      if (prodData) setSelectedOrder((prev: any) => ({ ...prev, products: prodData }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0B14] flex items-center justify-center p-4">
        <div className="bg-[#13141F] border border-[#1F2132] p-8 rounded-2xl w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Admin Portal</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8">Enter Secure PIN to access logistics</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" autoFocus required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className={`w-full bg-[#0A0B14] border ${authError ? 'border-red-500' : 'border-[#1F2132]'} rounded-xl text-center text-white px-4 py-3 outline-none focus:border-indigo-500 tracking-[0.3em] font-mono transition shadow-inner`} />
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition shadow-[0_0_15px_rgba(99,102,241,0.4)]">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  // 🔥 SMART FILTERS (Dispatched is now ACTIVE until Delivered)
  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered');
  const historyOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'delivered');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0B14] text-white font-sans flex flex-col md:flex-row overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 🚀 DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0A0B14] border-r border-[#1F2132] h-full shrink-0">
        <div className="p-6 border-b border-[#1F2132] flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">K</div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase">KORO LANE</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        <div className="p-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-gray-400 hover:bg-[#13141F] hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Overview
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-gray-400 hover:bg-[#13141F] hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            History Ledger
          </button>
          <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'sellers' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-gray-400 hover:bg-[#13141F] hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Sellers Network
          </button>
        </div>
        <div className="p-4 border-t border-[#1F2132]">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Lock Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-[#1F2132] flex justify-between items-center bg-[#0A0B14]/80 backdrop-blur-md z-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-black text-[10px]">K</div>
            <h1 className="text-xs font-black tracking-widest uppercase">Admin</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-white">Hello, Admin 👋</h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Here's what's happening with your logistics today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchData(true)} className="p-2 rounded-lg bg-[#13141F] border border-[#1F2132] text-indigo-400 hover:bg-indigo-500/10 transition" title="Check for new orders">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="bg-[#13141F] border border-[#1F2132] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <div className="text-[9px] font-mono text-gray-300 text-right whitespace-pre-line leading-tight">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center text-indigo-500 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Database...</div>
          ) : (
            <>
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="animate-in fade-in">
                  
                  {/* Premium Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                    <div className="bg-gradient-to-br from-[#13141F] to-[#0A0B14] border border-[#1F2132] p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition">
                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div><p className="text-[9px] md:text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Gross Volume</p></div>
                      <h3 className="text-xl md:text-3xl font-black text-white">₹{stats.grossVolume.toLocaleString('en-IN')}</h3>
                      <p className="text-[8px] md:text-[9px] text-gray-500 mt-1">Total Order Value</p>
                      <svg className="absolute bottom-0 left-0 w-full h-12 text-cyan-500/10 group-hover:text-cyan-500/20 transition duration-500" preserveAspectRatio="none" viewBox="0 0 100 100"><path d="M0,100 C20,0 50,100 100,0 L100,100 Z" fill="currentColor"/></svg>
                    </div>

                    <div className="bg-gradient-to-br from-[#13141F] to-[#0A0B14] border border-[#1F2132] p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition">
                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div><p className="text-[9px] md:text-[10px] text-purple-500 font-bold uppercase tracking-widest">Platform Profit</p></div>
                      <h3 className="text-xl md:text-3xl font-black text-white">₹{stats.platformProfit.toLocaleString('en-IN')}</h3>
                      <p className="text-[8px] md:text-[9px] text-gray-500 mt-1">Total Earnings (5%)</p>
                      <svg className="absolute bottom-0 left-0 w-full h-12 text-purple-500/10 group-hover:text-purple-500/20 transition duration-500" preserveAspectRatio="none" viewBox="0 0 100 100"><path d="M0,100 C30,50 60,100 100,50 L100,100 Z" fill="currentColor"/></svg>
                    </div>

                    <div className="bg-gradient-to-br from-[#13141F] to-[#0A0B14] border border-[#1F2132] p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-500/50 transition">
                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div><p className="text-[9px] md:text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Pending Pickups</p></div>
                      <h3 className="text-xl md:text-3xl font-black text-white">{stats.pendingPickups}</h3>
                      <p className="text-[8px] md:text-[9px] text-gray-500 mt-1">Awaiting Pickup</p>
                      <svg className="absolute bottom-0 left-0 w-full h-12 text-yellow-500/10 group-hover:text-yellow-500/20 transition duration-500" preserveAspectRatio="none" viewBox="0 0 100 100"><path d="M0,100 C40,100 60,0 100,50 L100,100 Z" fill="currentColor"/></svg>
                    </div>

                    <div className="bg-gradient-to-br from-[#13141F] to-[#0A0B14] border border-[#1F2132] p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-pink-500/50 transition">
                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse"></div><p className="text-[9px] md:text-[10px] text-pink-500 font-bold uppercase tracking-widest">WhatsApp Checks</p></div>
                      <h3 className="text-xl md:text-3xl font-black text-white">{stats.pendingPayments}</h3>
                      <p className="text-[8px] md:text-[9px] text-gray-500 mt-1">Require Action</p>
                      <svg className="absolute bottom-0 left-0 w-full h-12 text-pink-500/10 group-hover:text-pink-500/20 transition duration-500" preserveAspectRatio="none" viewBox="0 0 100 100"><path d="M0,0 C30,100 70,100 100,0 L100,100 Z" fill="currentColor"/></svg>
                    </div>
                  </div>

                  <div className="mb-4 flex justify-between items-end">
                    <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      Active Order Logistics
                    </h2>
                    <span className="text-[9px] text-gray-500 border border-[#1F2132] bg-[#13141F] px-3 py-1 rounded-full">{activeOrders.length} Pending</span>
                  </div>

                  {/* Horizontal Logistics Cards */}
                  <div className="space-y-4">
                    {activeOrders.map(order => (
                      <div key={order.id} className="bg-[#13141F] border border-[#1F2132] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-5 hover:border-indigo-500/30 transition shadow-lg">
                        
                        {/* Item Identity */}
                        <div className="md:w-1/4 shrink-0">
                          <p className="text-[9px] text-indigo-400 font-mono mb-1 bg-indigo-500/10 inline-block px-2 py-0.5 rounded">#{order.id.substring(0, 8).toUpperCase()}</p>
                          <h3 className="font-black text-white uppercase text-sm line-clamp-1">{order.product_name}</h3>
                          <p className="text-[#00e599] font-black text-sm md:text-base mt-0.5">₹{order.price.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Logistics Timeline Route */}
                        <div className="md:flex-1 bg-[#0A0B14] rounded-xl p-3 md:p-4 border border-[#1F2132] relative flex flex-row items-center justify-between">
                          
                          {/* Pick-Up */}
                          <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 bg-[#0A0B14] px-2 w-1/3">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>
                            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest hidden md:block">Pick-Up</p>
                            <p className="text-[10px] font-bold text-white truncate max-w-[80px] md:max-w-[120px]">{order.profiles?.store_name || "Unknown"}</p>
                          </div>

                          {/* Connecting Line */}
                          <div className="flex-1 border-t-2 border-dashed border-[#1F2132] relative flex items-center justify-center mx-[-10px] md:mx-[-20px] z-0">
                             <div className="bg-[#13141F] border border-[#1F2132] p-1.5 rounded-full absolute text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                             </div>
                          </div>

                          {/* Drop-Off */}
                          <div className="flex flex-col items-center md:items-end text-center md:text-right z-10 bg-[#0A0B14] px-2 w-1/3">
                            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mb-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest hidden md:block">Drop-Off</p>
                            <p className="text-[10px] font-bold text-white truncate max-w-[80px] md:max-w-[120px]">{order.customer_name}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="md:w-1/4 shrink-0 flex flex-col gap-2">
                           <div className="text-center md:text-right mb-1">
                            {order.payment_status === "Pending WhatsApp Confirmation" ? (
                                <span className="text-yellow-500 text-[10px] font-black uppercase tracking-wider flex items-center justify-center md:justify-end gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span> Pending WA Check</span>
                            ) : order.status === "packed" ? (
                                <span className="text-orange-500 text-[10px] font-black uppercase tracking-wider">Ready to Pickup 📦</span>
                            ) : order.status === "dispatched" ? (
                                <span className="text-purple-500 text-[10px] font-black uppercase tracking-wider">Out for Delivery 🚚</span>
                            ) : (
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Dealer Packing...</span>
                            )}
                           </div>
                           
                           <div className="grid grid-cols-2 gap-2">
                             {order.payment_status === "Pending WhatsApp Confirmation" ? (
                                <>
                                  <button onClick={() => handleVerifyPayment(order.id)} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition">Verify</button>
                                  <button onClick={() => handleRejectOrder(order.id, order.product_id)} className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition">Reject</button>
                                </>
                             ) : order.status === "processing" ? (
                                <button onClick={() => handleMarkPacked(order.id)} className="col-span-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition">Mark Packed</button>
                             ) : order.status === "packed" ? (
                                <button onClick={() => handleDispatch(order.id)} className="col-span-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(168,85,247,0.3)]">Dispatch Route</button>
                             ) : order.status === "dispatched" ? (
                                <button onClick={() => handleMarkDelivered(order.id)} className="col-span-2 bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(34,197,94,0.3)]">Mark Delivered</button>
                             ) : null}
                           </div>
                           
                           <button onClick={() => handleViewDetails(order)} className="bg-[#0A0B14] text-gray-400 hover:text-white hover:bg-[#1F2132] py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition w-full border border-[#1F2132]">Full Details <span className="ml-1">↗</span></button>
                        </div>

                      </div>
                    ))}
                    {activeOrders.length === 0 && (
                      <div className="py-16 text-center border border-dashed border-[#1F2132] rounded-2xl bg-[#0A0B14]">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No Active Logistics</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: HISTORY LEDGER */}
              {activeTab === 'history' && (
                <div className="animate-in fade-in">
                  <div className="mb-4 flex justify-between items-end">
                    <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Completed & Cancelled
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {historyOrders.map(order => (
                      <div key={order.id} className="bg-[#13141F] border border-[#1F2132] rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-80 hover:opacity-100 transition">
                         <div className="flex gap-4 items-center w-full md:w-auto">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-[#00e599]/10 text-[#00e599]'}`}>
                             {order.status === 'cancelled' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                           </div>
                           <div>
                             <h3 className="font-bold text-white text-xs uppercase">{order.product_name}</h3>
                             <p className="text-[10px] text-gray-500 mt-0.5">#{order.id.substring(0,8)} • {order.profiles?.store_name}</p>
                           </div>
                         </div>
                         
                         <div className="flex items-center justify-between w-full md:w-auto gap-4">
                           <div className="text-left md:text-right">
                             {/* 🔥 STATUS AB SAHI DIKHEGA */}
                             <p className="text-[10px] font-bold text-white uppercase">{order.status === 'cancelled' ? 'Fake / Cancelled' : 'Delivered ✅'}</p>
                             <p className="text-[9px] text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                           </div>
                           <button onClick={() => handleViewDetails(order)} className="bg-[#0A0B14] border border-[#1F2132] px-3 py-1.5 rounded-lg text-[9px] text-gray-400 hover:text-white uppercase font-bold transition shrink-0">View</button>
                         </div>
                      </div>
                    ))}
                    {historyOrders.length === 0 && (
                      <p className="text-gray-500 text-center py-10 text-[10px] font-bold uppercase tracking-widest">No History Found</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SELLERS NETWORK */}
              {activeTab === 'sellers' && (
                <div className="animate-in fade-in">
                  <div className="mb-4 flex justify-between items-end">
                    <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      Verified Dealers Network
                    </h2>
                    <span className="text-[9px] text-gray-500 border border-[#1F2132] bg-[#13141F] px-3 py-1 rounded-full">{sellers.length} Total</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellers.map(seller => (
                      <div key={seller.id} className="bg-[#13141F] border border-[#1F2132] rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-500/50 transition">
                         <div className="flex items-center gap-4 border-b border-[#1F2132] pb-4">
                           <div className="w-12 h-12 bg-[#0A0B14] rounded-full border border-[#1F2132] flex items-center justify-center overflow-hidden shrink-0 text-indigo-400 font-black text-xl">
                             {seller.avatar_url ? <img src={seller.avatar_url} className="w-full h-full object-cover" /> : seller.store_name?.charAt(0)}
                           </div>
                           <div>
                             <h3 className="text-sm font-black text-white uppercase">{seller.store_name}</h3>
                             <p className="text-[10px] text-gray-500">{seller.full_name || "Name not provided"}</p>
                           </div>
                         </div>
                         <div className="space-y-2 flex-1">
                           <div className="flex gap-2 items-start"><svg className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> <p className="text-[10px] text-gray-300">{seller.store_address || "No Address"}</p></div>
                           <div className="flex gap-2 items-center"><svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> <p className="text-[10px] text-gray-300 font-mono">{seller.phone || "No Phone"}</p></div>
                         </div>
                         {seller.phone && (
                           <a href={`tel:${seller.phone}`} className="mt-2 w-full text-center bg-[#0A0B14] border border-[#1F2132] text-white hover:text-indigo-400 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                             Call Dealer <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                           </a>
                         )}
                      </div>
                    ))}
                    {sellers.length === 0 && <p className="col-span-full text-center py-10 text-[10px] text-gray-500 uppercase tracking-widest">No Dealers Onboarded Yet.</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </main>

      {/* 🚀 MOBILE BOTTOM NAV BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0B14] border-t border-[#1F2132] pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${activeTab === 'overview' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Overview</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${activeTab === 'history' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
          </button>
          <button onClick={() => setActiveTab('sellers')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${activeTab === 'sellers' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Dealers</span>
          </button>
        </div>
      </nav>

      {/* --- 🚀 FULL DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[200] p-0 md:p-4 overflow-y-auto">
          <div className="bg-[#13141F] border border-[#1F2132] rounded-none md:rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] min-h-screen md:min-h-0 md:my-8">
            
            {/* 🔥 MODIFIED HEADER WITH LEFT BACK ARROW */}
            <div className="bg-[#0A0B14] border-b border-[#1F2132] px-4 py-4 md:px-6 md:py-5 flex items-center gap-4 sticky top-0 z-10">
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white bg-[#13141F] border border-[#1F2132] p-2 md:p-2.5 rounded-full transition shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div>
                <h2 className="text-indigo-400 font-black uppercase tracking-widest text-xs md:text-sm flex items-center gap-2">Logistics Dispatch Sheet 📋</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Order #{selectedOrder.id}</p>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              
              <div className="bg-[#0A0B14] border border-[#1F2132] rounded-2xl p-5 flex items-center gap-5">
                <div className="w-24 h-24 bg-black rounded-xl border border-[#1F2132] overflow-hidden shrink-0">
                  {selectedOrder.products?.image_urls?.[0] || selectedOrder.products?.image_url ? (
                    <img src={selectedOrder.products?.image_urls?.[0] || selectedOrder.products?.image_url} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600 uppercase font-bold text-center p-2 animate-pulse">Loading...</div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Item Details</p>
                  <h3 className="font-black text-white uppercase text-base leading-tight mb-2">{selectedOrder.product_name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[#00e599] font-black text-xl">₹{selectedOrder.price.toLocaleString('en-IN')}</p>
                    <span className="bg-[#13141F] text-gray-400 border border-[#1F2132] px-2 py-0.5 rounded text-[9px] font-mono tracking-widest">ID: {selectedOrder.product_id.substring(0,8)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 relative">
                  <h3 className="text-[11px] text-cyan-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-500/20 pb-3">🏪 Pick-Up (Seller)</h3>
                  <div className="space-y-4">
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Store Name</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.profiles?.store_name || "Unknown Store"}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Full Address</p><p className="text-sm text-gray-300 mt-0.5">{selectedOrder.profiles?.store_address || "Address not provided."}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.profiles?.phone || "No Phone Number"}</p></div>
                    {selectedOrder.profiles?.phone && (<a href={`tel:${selectedOrder.profiles.phone}`} className="mt-4 block w-full text-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-cyan-500 hover:text-black transition">Call Seller 📞</a>)}
                  </div>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 relative">
                  <h3 className="text-[11px] text-orange-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-orange-500/20 pb-3">📍 Drop-Off (Customer)</h3>
                  <div className="space-y-4">
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Customer Name</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.customer_name}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Delivery Address</p><p className="text-sm text-gray-300 mt-0.5">{selectedOrder.customer_address}</p><p className="text-xs text-orange-400 mt-1.5 font-bold bg-orange-500/10 inline-block px-2 py-1 rounded">PIN: {selectedOrder.customer_pincode || "---"}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Contact Number</p><p className="text-sm font-bold text-white mt-0.5">{selectedOrder.customer_phone || "No Phone Number"}</p></div>
                    {selectedOrder.customer_phone && (<a href={`tel:${selectedOrder.customer_phone}`} className="mt-4 block w-full text-center bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-orange-500 hover:text-black transition">Call Customer 📞</a>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1F2132; border-radius: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .pb-safe { padding-bottom: env(safe-area-inset-bottom); }`}} />
    </div>
  );
}