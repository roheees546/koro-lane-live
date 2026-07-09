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
  const [stats, setStats] = useState({ todaySale: 0, pending: 0, totalSales: 0, liveStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Top"); 
  const [itemDesc, setItemDesc] = useState("");
  
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [isAdding, setIsAdding] = useState(false);

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
        // 🔥 UPDATE: Check for new WhatsApp Confirmation Status or Paid status
        if ((order.payment_status === "Verified" || order.payment_status === "Pending WhatsApp Confirmation") && order.status !== "packed") pendingCount++;
        
        const orderDate = new Date(order.created_at).toDateString();
        // Today total only if not cancelled
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

  // 🔥 UPDATE: Handle Packing Item (Seller's Job)
  const handlePackItem = async (orderId: string) => {
    if(!confirm("Have you securely packed this item for Koro Lane Admin pickup?")) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'packed' }) // Seller ka kaam khatam
        .eq('id', orderId);

      if (error) throw error;
      
      alert("Awesome! Koro Lane Admin will pick this up soon. 🚀");
      fetchDashboardData(); // Refresh Data
    } catch (error: any) {
      alert("Error updating order: " + error.message);
    }
  };

  // 📦 MULTI-IMAGE ADD PRODUCT ENGINE 
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
      
      {/* HEADER */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{storeName}</p>
            <h1 className="text-2xl font-bold flex items-center gap-2 mt-1">
              Hello, {storeName.split(" ")[0]}! 👋
              <span className="bg-[#00e599] text-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">On</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              {storeAddress} <Link href="/dealer/profile" className="text-[#00e599] hover:underline">Edit</Link>
            </p>
          </div>
          <button className="bg-[#111114] border border-gray-800 p-2 rounded-lg relative hover:border-gray-600 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {stats.pending > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black"></span>}
          </button>
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
                      <span className="text-yellow-500 text-[8px] uppercase tracking-wider font-bold text-right">Payment Under Review</span>
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

      {/* --- 🛠️ ADD PRODUCT MODAL --- */}
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="1299" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-2">Item Photos (Select up to 4)</label>
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#003320] file:text-[#00e599] hover:file:bg-[#00e599] hover:file:text-black cursor-pointer border border-gray-800 rounded-lg p-2 bg-[#09090b]" 
                />
                
                {imageFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {imageFiles.map((file, idx) => (
                      <span key={idx} className="bg-[#003320] text-[#00e599] text-[9px] px-2 py-1 rounded border border-[#00e599]/30 truncate max-w-[120px]">
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
              
              <button type="submit" disabled={isAdding} className="w-full mt-4 bg-[#00e599] text-black font-bold py-3 rounded-lg uppercase tracking-widest text-sm hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.3)]">
                {isAdding ? "Uploading Images & Saving..." : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}