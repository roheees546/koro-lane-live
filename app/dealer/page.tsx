"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DealerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Dashboard Data
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [joinDate, setJoinDate] = useState("");
  
  // Stats & Pipeline
  const [stats, setStats] = useState({ todaySale: 0, pending: 0, totalSales: 0, liveStock: 0 });
  const [pipeline, setPipeline] = useState({ new: 0, packing: 0, shipped: 0, done: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Modals & UI States
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPayoutsOpen, setIsPayoutsOpen] = useState(false);

  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Top"); 
  const [itemSize, setItemSize] = useState("L");
  const [itemDesc, setItemDesc] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [isAdding, setIsAdding] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  // Brand Color (Seller Theme)
  const themeColor = "#F5A623"; // Premium Amber/Gold

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserId(session.user.id);

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profile?.role !== "dealer") {
      router.push("/");
      return;
    }
    setStoreName(profile.store_name || "KOROLANE STORE");
    setStoreAddress(profile.address || profile.store_address || "Address not set");
    setStoreLogo(profile.store_logo || profile.avatar_url || null);
    
    // Format Join Date
    if (profile.created_at) {
      const date = new Date(profile.created_at);
      setJoinDate(`Joined ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`);
    }

    const { data: inventory } = await supabase.from("products").select("*").eq("dealer_id", session.user.id).order("created_at", { ascending: false });
    const liveStockCount = inventory ? inventory.length : 0;

    const { data: orders } = await supabase.from("orders").select("*").eq("dealer_id", session.user.id).order("created_at", { ascending: false });

    let todayTotal = 0;
    let newCount = 0, packingCount = 0, shippedCount = 0, doneCount = 0;
    let totalCount = orders ? orders.length : 0;

    if (orders) {
      const enhancedOrders = orders.map(order => {
        const matchedProduct = inventory?.find(p => p.title === order.product_name);
        return {
          ...order,
          product_image: matchedProduct?.image_url || "https://placehold.co/100x120/121214/F5A623?text=ITEM"
        };
      });

      setRecentOrders(enhancedOrders.slice(0, 5)); 
      
      const today = new Date().toDateString();
      orders.forEach(order => {
        // Pipeline Logic
        if (order.status === 'delivered') doneCount++;
        else if (order.status === 'dispatched') shippedCount++;
        else if (order.status === 'packed') packingCount++;
        else if (order.status !== 'cancelled') newCount++; // Pending WA or Verified

        const orderDate = new Date(order.created_at).toDateString();
        if (orderDate === today && order.status !== "cancelled") todayTotal += order.price;
      });
    }

    setPipeline({ new: newCount, packing: packingCount, shipped: shippedCount, done: doneCount });
    setStats({ todaySale: todayTotal, pending: newCount, totalSales: totalCount, liveStock: liveStockCount });
    setLoading(false);
  };

  const handlePackItem = async (orderId: string) => {
    if(!confirm("Have you securely packed this item for Koro Lane Admin pickup?")) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'packed' }).eq('id', orderId);
      if (error) throw error;
      alert("Awesome! Koro Lane Admin will pick this up soon. 🚀");
      fetchDashboardData(); 
    } catch (error: any) {
      alert("Error updating order: " + error.message);
    }
  };

  // 🔥 Logo Upload (Clicking image opens gallery)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    setIsLogoUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
      const newLogoUrl = publicUrlData.publicUrl;

      await supabase.from('profiles').update({ store_logo: newLogoUrl }).eq('id', userId);
      setStoreLogo(newLogoUrl);
    } catch (error: any) {
      alert("Logo upload failed: " + error.message);
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    let uploadedUrls: string[] = [];

    if (imageFiles.length > 0) {
      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
          return publicUrlData.publicUrl;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      } catch (error: any) {
        alert("Image upload fail hua bawa: " + error.message);
        setIsAdding(false);
        return;
      }
    }

    const { error } = await supabase.from("products").insert([{
      dealer_id: userId,
      title: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      size: itemSize,
      description: itemDesc,
      image_url: uploadedUrls[0] || "", 
      image_urls: uploadedUrls 
    }]);

    if (!error) {
      setIsAddModalOpen(false);
      setItemName(""); setItemPrice(""); setItemSize("L"); setItemDesc(""); setImageFiles([]); 
      fetchDashboardData(); 
    } else {
      alert("Error adding item: " + error.message);
    }
    setIsAdding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#F5A623] font-black tracking-widest text-xs uppercase">Loading Store...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-24 selection:bg-[#F5A623] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-5 pt-6 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
            {storeName}
            <svg className="w-5 h-5 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </h1>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Seller Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bell Notification */}
          <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="text-gray-400 hover:text-white transition relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {stats.pending > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#F5A623] rounded-full border-2 border-[#0a0a0c]"></span>}
          </button>
          {/* Settings Gear */}
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </header>

      <main className="px-4 space-y-4">
        
        {/* ⚠️ ACTION ALERT BANNER */}
        {pipeline.new > 0 && (
          <div className="bg-gradient-to-r from-[#F5A623]/20 to-[#3a2808] border border-[#F5A623]/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5A623] rounded-full flex items-center justify-center text-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{pipeline.new} orders need packing today</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Ship before 5 PM to avoid delay</p>
              </div>
            </div>
            <button onClick={() => router.push('/dealer/orders')} className="bg-[#1a1a1d] border border-gray-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition">
              View ›
            </button>
          </div>
        )}

        {/* 🏪 PROFILE CARD */}
        <div className="bg-[#121214] border border-gray-800/60 rounded-3xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group shrink-0">
              <div className="w-16 h-16 rounded-full border border-gray-700 overflow-hidden bg-gray-900">
                {isLogoUploading ? (
                   <div className="w-full h-full flex items-center justify-center"><span className="w-4 h-4 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin"></span></div>
                ) : storeLogo ? (
                   <img src={storeLogo} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-[#F5A623] font-black text-xl">{storeName[0]}</div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isLogoUploading} />
            </label>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">{storeName}</h2>
              <div className="flex items-center gap-1 mt-0.5 bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded w-max">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                <span className="text-[9px] font-black uppercase tracking-widest">Verified Seller</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1.5 space-y-0.5">
                <p className="flex items-center gap-1"><span className="text-gray-500">📍</span> {storeAddress.split(',')[0]}</p>
                <p className="flex items-center gap-1"><span className="text-gray-500">📅</span> {joinDate}</p>
              </div>
            </div>
          </div>
          <button onClick={() => router.push(`/store/${userId}`)} className="bg-[#1a1a1d] border border-gray-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-gray-800 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            View store ›
          </button>
        </div>

        {/* 📈 REVENUE & PIPELINE */}
        <div className="bg-[#121214] border border-gray-800/60 rounded-3xl p-5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">Revenue today</p>
              <h2 className="text-3xl font-black mt-1">₹{stats.todaySale.toLocaleString('en-IN')}</h2>
              <p className="text-[10px] text-[#00e599] font-bold mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                Live data tracking
              </p>
            </div>
            {/* Minimal SVG Chart representation */}
            <svg className="w-24 h-12 text-[#00e599] opacity-80" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 35 L20 25 L40 30 L60 15 L80 20 L100 5"></path>
            </svg>
          </div>

          <div className="border-t border-gray-800/60 pt-4">
            <p className="text-[11px] text-gray-400 font-medium mb-3">Today's order pipeline</p>
            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col items-center cursor-pointer" onClick={() => router.push('/dealer/orders')}>
                <span className="text-lg font-black text-white">{pipeline.new}</span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full my-1"></span>
                <span className="text-[10px] text-gray-400">New</span>
              </div>
              <span className="text-gray-700 text-xs">›</span>
              <div className="flex flex-col items-center cursor-pointer" onClick={() => router.push('/dealer/orders')}>
                <span className="text-lg font-black text-white">{pipeline.packing}</span>
                <span className="w-1.5 h-1.5 bg-[#F5A623] rounded-full my-1"></span>
                <span className="text-[10px] text-gray-400">Packing</span>
              </div>
              <span className="text-gray-700 text-xs">›</span>
              <div className="flex flex-col items-center cursor-pointer" onClick={() => router.push('/dealer/orders')}>
                <span className="text-lg font-black text-white">{pipeline.shipped}</span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full my-1"></span>
                <span className="text-[10px] text-gray-400">Shipped</span>
              </div>
              <span className="text-gray-700 text-xs">›</span>
              <div className="flex flex-col items-center cursor-pointer" onClick={() => router.push('/dealer/orders')}>
                <span className="text-lg font-black text-white">{pipeline.done}</span>
                <span className="w-1.5 h-1.5 bg-[#00e599] rounded-full my-1"></span>
                <span className="text-[10px] text-gray-400">Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ QUICK ACTIONS (2x2 Grid) */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <div onClick={() => setIsAddModalOpen(true)} className="bg-[#121214] border border-gray-800/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-[#F5A623]/50 transition">
              <div className="w-10 h-10 bg-[#1a1a1d] rounded-xl flex items-center justify-center text-[#F5A623]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Add product</h4>
                <p className="text-[10px] text-gray-400">{stats.liveStock} live now</p>
              </div>
            </div>
            
            <div onClick={() => alert("Chat functionality coming in next update!")} className="bg-[#121214] border border-gray-800/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-[#F5A623]/50 transition">
              <div className="w-10 h-10 bg-[#1a1a1d] rounded-xl flex items-center justify-center text-[#F5A623]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Messages</h4>
                <p className="text-[10px] text-[#F5A623]">0 unread</p>
              </div>
            </div>

            <div onClick={() => setIsPayoutsOpen(true)} className="bg-[#121214] border border-gray-800/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-[#F5A623]/50 transition">
              <div className="w-10 h-10 bg-[#1a1a1d] rounded-xl flex items-center justify-center text-[#00e599]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Payouts</h4>
                <p className="text-[10px] text-gray-400">Dashboard</p>
              </div>
            </div>

            <div onClick={() => alert("Live Streaming feature coming soon!")} className="bg-[#121214] border border-gray-800/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-purple-500/50 transition">
              <div className="w-10 h-10 bg-[#1a1a1d] rounded-xl flex items-center justify-center text-purple-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Go live</h4>
                <p className="text-[10px] text-gray-400">Tap to start</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📦 RECENT SALES (List View) */}
        <div className="pb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Recent Sales</p>
          <div className="bg-[#121214] border border-gray-800/60 rounded-3xl overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-8">No recent orders found.</p>
            ) : (
              recentOrders.map((order, idx) => (
                <div key={order.id} className={`flex items-center gap-3 p-4 ${idx !== recentOrders.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
                  <div className="w-12 h-12 bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-800">
                    <img src={order.product_image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{order.product_name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{order.customer_name} • #{order.id.substring(0,6).toUpperCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">₹{order.price}</p>
                    
                    {/* Status Text formatting */}
                    {order.status === 'packed' ? (
                       <p className="text-[10px] font-bold text-[#F5A623] mt-0.5">Packing</p>
                    ) : order.status === 'dispatched' ? (
                       <p className="text-[10px] font-bold text-purple-500 mt-0.5">Shipped</p>
                    ) : order.status === 'delivered' ? (
                       <p className="text-[10px] font-bold text-[#00e599] mt-0.5">Delivered</p>
                    ) : order.payment_status === "Pending WhatsApp Confirmation" || order.payment_status === "Verified" ? (
                       <button onClick={() => handlePackItem(order.id)} className="text-[10px] font-bold text-[#4da8da] mt-0.5 hover:underline">Pack now</button>
                    ) : (
                       <p className="text-[10px] font-bold text-gray-500 mt-0.5">Pending</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION (Updated to Gold Theme) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span className="text-[10px] font-bold text-[#F5A623] mb-3">Home</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Products</span>
        </Link>
        
        {/* Center Big Gold FAB */}
        <div className="relative -top-5">
          <button onClick={() => setIsAddModalOpen(true)} className="w-14 h-14 bg-[#F5A623] rounded-full flex items-center justify-center border-4 border-[#0a0a0c] shadow-[0_0_15px_rgba(245,166,35,0.4)] hover:scale-105 transition transform">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>

        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group relative">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          {pipeline.new > 0 && <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#0a0a0c]">{pipeline.new}</span>}
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Orders</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Profile</span>
        </Link>
      </div>

      {/* --- ⚙️ SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-[#121214] border border-gray-800 rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-black uppercase text-white mb-6">Store Settings</h3>
             <div className="space-y-4">
                <button onClick={() => {setIsSettingsOpen(false); router.push('/dealer/profile');}} className="w-full text-left bg-[#1a1a1d] p-4 rounded-2xl text-sm font-bold text-white hover:border-[#F5A623] border border-transparent transition">Edit Store Details</button>
                <button onClick={handleLogout} className="w-full text-left bg-red-950/20 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-500/20 hover:bg-red-900/30 transition">Secure Logout</button>
             </div>
          </div>
        </div>
      )}

      {/* --- 💸 PAYOUTS MODAL --- */}
      {isPayoutsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsPayoutsOpen(false)}>
          <div className="bg-[#121214] border border-gray-800 rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-black uppercase text-white mb-2">Payouts</h3>
             <p className="text-[10px] text-gray-400 mb-6">Your earnings will be credited here.</p>
             <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-5 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Available Balance</p>
                <h2 className="text-3xl font-black text-[#00e599] my-2">₹0</h2>
                <p className="text-[10px] text-gray-500">Minimum payout is ₹1000</p>
             </div>
          </div>
        </div>
      )}

      {/* --- 🛠️ UPGRADED ADD PRODUCT MODAL (GOLD THEME) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-[#F5A623]/30 shadow-[0_0_30px_rgba(245,166,35,0.05)] rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><span className="text-[#F5A623]">✦</span> Add Product</h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Item Title</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="e.g. Vintage Denim Jacket" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="1299" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Size</label>
                  <select value={itemSize} onChange={(e) => setItemSize(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Item Photos (Max 4)</label>
                <div className="bg-[#1a1a1d] border border-gray-800 border-dashed rounded-xl p-5 text-center hover:border-[#F5A623]/50 transition cursor-pointer">
                  <input required type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) { setImageFiles(Array.from(e.target.files).slice(0, 4)); } }} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-[#F5A623]/10 text-[#F5A623] rounded-full flex items-center justify-center mb-2">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-xs font-bold text-white mb-0.5">Tap to upload images</span>
                    <span className="text-[9px] text-gray-500">Square crop looks best</span>
                  </label>
                </div>
                
                {imageFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="aspect-square bg-[#1a1a1d] rounded-lg border border-[#F5A623]/30 overflow-hidden flex items-center justify-center text-[8px] text-center p-1 text-[#F5A623] font-bold">
                        {file.name.substring(0, 10)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition resize-none" placeholder="Condition, fit, defects (if any)..."></textarea>
              </div>
              
              <button type="submit" disabled={isAdding} className="w-full mt-2 bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isAdding ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Uploading...</>
                ) : "Publish Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}