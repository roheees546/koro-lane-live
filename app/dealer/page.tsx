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
  const [storeLogo, setStoreLogo] = useState<string | null>(null); // Added for logo
  const [stats, setStats] = useState({ todaySale: 0, pending: 0, totalSales: 0, liveStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // Notifications State

  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Top"); 
  const [itemSize, setItemSize] = useState("L"); // Added Size State
  const [itemDesc, setItemDesc] = useState("");
  
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [isAdding, setIsAdding] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false); // Added for Logo upload

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
    setStoreName(profile.store_name || "KOROLANE User");
    setStoreAddress(profile.store_address || "Address not set");
    setStoreLogo(profile.store_logo || null); // Load logo if exists

    const { data: inventory } = await supabase.from("products").select("*").eq("dealer_id", session.user.id).order("created_at", { ascending: false });
    const liveStockCount = inventory ? inventory.length : 0;

    const { data: orders } = await supabase.from("orders").select("*").eq("dealer_id", session.user.id).order("created_at", { ascending: false });

    let todayTotal = 0;
    let pendingCount = 0;
    let totalCount = orders ? orders.length : 0;

    if (orders) {
      const enhancedOrders = orders.map(order => {
        const matchedProduct = inventory?.find(p => p.title === order.product_name);
        return {
          ...order,
          product_image: matchedProduct?.image_url || "https://placehold.co/100x120/121214/00e599?text=ITEM"
        };
      });

      setRecentOrders(enhancedOrders.slice(0, 5)); 
      
      const today = new Date().toDateString();
      orders.forEach(order => {
        if ((order.payment_status === "Verified" || order.payment_status === "Pending WhatsApp Confirmation") && order.status !== "packed") pendingCount++;
        const orderDate = new Date(order.created_at).toDateString();
        if (orderDate === today && order.status !== "cancelled") todayTotal += order.price;
      });
    }

    setStats({
      todaySale: todayTotal,
      pending: pendingCount,
      totalSales: totalCount,
      liveStock: liveStockCount
    });
    setLoading(false);
  };

  const handlePackItem = async (orderId: string) => {
    if(!confirm("Have you securely packed this item for Koro Lane Admin pickup?")) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'packed' }) 
        .eq('id', orderId);

      if (error) throw error;
      
      alert("Awesome! Koro Lane Admin will pick this up soon. 🚀");
      fetchDashboardData(); 
    } catch (error: any) {
      alert("Error updating order: " + error.message);
    }
  };

  // 🔥 NEW: Store Logo Upload Handler
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

      // Update profile
      const { error: updateError } = await supabase.from('profiles').update({ store_logo: newLogoUrl }).eq('id', userId);
      if (updateError) throw updateError;

      setStoreLogo(newLogoUrl);
      alert("Store Logo updated successfully! ✨");
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

    const { error } = await supabase.from("products").insert([
      {
        dealer_id: userId,
        title: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory,
        size: itemSize, // Added size field
        description: itemDesc,
        image_url: uploadedUrls[0] || "", 
        image_urls: uploadedUrls 
      }
    ]);

    if (!error) {
      setIsAddModalOpen(false);
      setItemName("");
      setItemPrice("");
      setItemCategory("Top");
      setItemSize("L");
      setItemDesc("");
      setImageFiles([]); 
      fetchDashboardData(); 
    } else {
      alert("Error adding item: " + error.message);
    }
    setIsAdding(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599]">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER WITH LOGO UPLOAD & NOTIFICATIONS FIX */}
      <header className="px-5 pt-6 pb-4 flex justify-between items-start mb-2">
        <div className="flex items-center gap-4">
          
          {/* 📸 Custom Store Logo / Camera Icon */}
          <div className="relative group cursor-pointer">
             <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
               {isLogoUploading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-[#00e599] border-t-transparent animate-spin"></span>
               ) : storeLogo ? (
                  <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
               ) : (
                 <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               )}
             </div>
             <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} disabled={isLogoUploading} />
             <div className="absolute -bottom-1 -right-1 bg-[#00e599] text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-black pointer-events-none shadow-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{storeName}</p>
            {/* Removed 'On' Button as requested */}
            <h1 className="text-2xl font-bold mt-0.5 truncate max-w-[180px]">Hello, {storeName.split(" ")[0]}!</h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              {storeAddress} <Link href="/dealer/profile" className="text-[#00e599] hover:underline">Edit</Link>
            </p>
          </div>
        </div>

        {/* 🔔 Working Notifications Button */}
        <div className="relative">
          <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="bg-[#111114] border border-gray-800 p-2.5 rounded-xl relative hover:border-gray-600 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {stats.pending > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#111114] animate-pulse"></span>}
          </button>
          
          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 top-12 w-64 bg-[#121214] border border-gray-800 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3">Notifications</h3>
               {stats.pending > 0 ? (
                 <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-3">
                   <span className="text-orange-500 mt-0.5">📦</span>
                   <div>
                     <p className="text-sm font-bold text-white mb-1">Action Needed!</p>
                     <p className="text-xs text-gray-300">You have {stats.pending} order(s) waiting to be packed.</p>
                   </div>
                 </div>
               ) : (
                 <p className="text-xs text-gray-500 text-center py-2">No new notifications.</p>
               )}
            </div>
          )}
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <div className="px-5 mb-8 flex gap-3">
        <button className="flex-1 bg-[#003320] border border-[#00e599]/50 text-[#00e599] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
          <span className="w-2 h-2 rounded-full bg-[#00e599] animate-pulse"></span>
          Go Live <span className="text-[9px] tracking-widest uppercase">(Coming Soon)</span>
        </button>
        <button onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-[#111114] border border-gray-800 hover:border-gray-600 transition py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Product
        </button>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="px-5 mb-8">
        <h2 className="text-sm font-bold mb-4">Overview</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
          <div className="min-w-[130px] bg-[#0f0f11] border-t-2 border-[#00e599] rounded-xl p-4 shadow-lg shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Today's Sale</p>
            <p className="text-2xl font-black">₹{stats.todaySale.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-[#00e599] mt-2 font-bold uppercase tracking-wider">Live Data</p>
          </div>
          <div className="min-w-[130px] bg-[#0f0f11] border-t-2 border-orange-500 rounded-xl p-4 shadow-lg shrink-0 relative">
            {stats.pending > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>}
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pending Pack</p>
            <p className="text-2xl font-black">{stats.pending}</p>
            <p className="text-[9px] text-orange-500 mt-2 font-bold uppercase tracking-wider">Orders to pack</p>
          </div>
          <div className="min-w-[130px] bg-[#0f0f11] border-t-2 border-purple-500 rounded-xl p-4 shadow-lg shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Sales</p>
            <p className="text-2xl font-black">{stats.totalSales}</p>
            <p className="text-[9px] text-purple-500 mt-2 font-bold uppercase tracking-wider">All orders</p>
          </div>
          <div className="min-w-[130px] bg-[#0f0f11] border-t-2 border-blue-500 rounded-xl p-4 shadow-lg shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Live Stock</p>
            <p className="text-2xl font-black">{stats.liveStock}</p>
            <p className="text-[9px] text-blue-500 mt-2 font-bold uppercase tracking-wider">Active listings</p>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="px-5 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold">Recent Action Needed</h2>
          <Link href="/dealer/orders" className="text-[10px] text-[#00e599] uppercase tracking-widest font-bold hover:underline">Manage All</Link>
        </div>
        
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4 border border-gray-900 border-dashed rounded-xl">No active orders yet.</p>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className={`border rounded-xl p-3 flex gap-3 relative overflow-hidden transition ${order.status === 'packed' ? 'bg-[#050505] border-[#00e599]/20' : 'bg-[#0f0f11] border-gray-900'}`}>
                <div className="w-16 h-20 bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-800">
                  <img src={order.product_image} className="w-full h-full object-cover" alt="Item" />
                </div>
                <div className="flex flex-col justify-between py-1 flex-1 pr-24">
                  <div>
                    <p className="text-[8px] text-[#00e599] uppercase tracking-widest font-bold mb-0.5">ORDER #{order.id.substring(0,6)}</p>
                    <h3 className="font-bold text-sm uppercase truncate text-gray-200">{order.product_name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold">{order.customer_name}</p>
                  </div>
                  <p className="font-black text-white">₹{order.price.toLocaleString('en-IN')}</p>
                </div>
                
                <div className="absolute right-3 top-3 bottom-3 flex flex-col gap-1.5 items-end justify-center">
                  {order.status === 'packed' ? (
                     <span className="bg-[#003320]/50 border border-[#00e599]/30 text-[#00e599] text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg flex flex-col items-center gap-1">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       Packed
                     </span>
                  ) : order.payment_status === "Pending WhatsApp Confirmation" || order.payment_status === "Verified" ? (
                    <>
                      <span className="text-orange-500 text-[8px] uppercase tracking-wider font-bold text-right text-center">Verify & Pack</span>
                      <button onClick={() => handlePackItem(order.id)} className="bg-[#00e599] text-black hover:bg-[#00c580] text-[10px] uppercase tracking-wider font-black px-4 py-2 rounded-lg transition shadow-[0_0_10px_rgba(0,229,153,0.3)]">
                        Pack Item 📦
                      </button>
                    </>
                  ) : (
                    <span className="bg-gray-800 text-gray-400 text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg">Check Status</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between z-40 rounded-t-2xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span className="text-[10px] text-[#00e599] mb-3">Home</span>
        </Link>
        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Orders</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Inventory</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Profile</span>
        </Link>
      </div>

      {/* --- 🛠️ UPGRADED ADD PRODUCT MODAL (SIZE, MULTI-IMAGE + HELP TEXT) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-bold text-[#00e599] uppercase mb-6 border-b border-gray-800 pb-4">Add New Surplus Item</h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Item Name</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="e.g. Vintage Combat Jacket" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="1299" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Size</label>
                  <select value={itemSize} onChange={(e) => setItemSize(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]">
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
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Photo Upload with Guidance */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Item Photos</label>
                <div className="bg-[#09090b] border border-gray-800 border-dashed rounded-lg p-4 text-center">
                  <input 
                    required
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        // Limiting to 4 files max
                        const filesArray = Array.from(e.target.files).slice(0, 4);
                        setImageFiles(filesArray);
                      }
                    }}
                    className="hidden" 
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-[#00e599] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-xs font-bold text-white mb-1">Tap to select images (Max 4)</span>
                    <span className="text-[9px] text-gray-500">Please crop/edit your photos in your phone gallery before selecting them here.</span>
                  </label>
                </div>
                
                {imageFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {imageFiles.map((file, idx) => (
                      <span key={idx} className="bg-[#003320] text-[#00e599] text-[9px] px-2 py-1 rounded border border-[#00e599]/30 truncate max-w-[100px] flex items-center gap-1">
                        📸 {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Description</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none" placeholder="Condition, fit, details..."></textarea>
              </div>
              
              <button type="submit" disabled={isAdding} className="w-full mt-4 bg-[#00e599] text-black font-bold py-3 rounded-lg uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                {isAdding ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Uploading...</>
                ) : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}