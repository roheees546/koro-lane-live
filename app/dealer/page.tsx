"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SellerNotifications from "@/components/SellerNotifications";

export default function DealerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Dashboard Data
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [joinDate, setJoinDate] = useState("");
  const [userEmail, setUserEmail] = useState(""); 
  
  // Stats & Pipeline
  const [stats, setStats] = useState({ todaySale: 0, pending: 0, totalSales: 0, liveStock: 0 });
  const [pipeline, setPipeline] = useState({ new: 0, packing: 0, shipped: 0, done: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Modals & UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPayoutsOpen, setIsPayoutsOpen] = useState(false);
  const [isHowToMeasureOpen, setIsHowToMeasureOpen] = useState(false);
const [todayBooking, setTodayBooking] = useState<any>(null);
  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Top"); 
  const [itemSize, setItemSize] = useState("L");
  const [itemDesc, setItemDesc] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [itemMaterial, setItemMaterial] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [isAdding, setIsAdding] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  // 🔥 JSON Measurements State
  const [measurements, setMeasurements] = useState({
    chest: "", length: "", shoulder: "", sleeve: "", // Top
    waist: "", hip: "", rise: "", inseam: "", outseam: "", legOpening: "" // Bottom
  });
  const [measurementsConfirmed, setMeasurementsConfirmed] = useState(false);

  // Pre-defined Colors for UI
  const colorOptions = [
    { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" },
    { name: "Navy Blue", hex: "#000080" }, { name: "Grey", hex: "#808080" },
    { name: "Red", hex: "#FF0000" }, { name: "Olive", hex: "#808000" },
    { name: "Brown", hex: "#A52A2A" }, { name: "Beige", hex: "#F5F5DC" }
  ];

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
    const sessionEmail = session.user.email || "";

    let { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    const intendedRole = typeof window !== 'undefined' ? localStorage.getItem('koro_intended_role') : null;

    if (!profile || intendedRole === 'seller') {
      const { data: savedProfile, error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        email: sessionEmail,
        role: "dealer",
        store_name: profile?.store_name || "NEW SELLER STORE", 
        store_address: profile?.store_address || profile?.address || "Address not set",
        address: profile?.address || profile?.store_address || "Address not set"
      }).select().single();

      if (savedProfile) {
        profile = savedProfile;
      }
      
      if (typeof window !== 'undefined') localStorage.removeItem('koro_intended_role');
      
    } else if (profile && !profile.email) {
      await supabase.from("profiles").update({ email: sessionEmail }).eq("id", session.user.id);
      profile.email = sessionEmail;
    }

    if (profile?.role !== "dealer") {
      router.push("/");
      return;
    }

    setStoreName(profile.store_name || "KOROLANE STORE");
    setStoreAddress(profile.address || profile.store_address || "Address not set");
    setStoreLogo(profile.store_logo || profile.avatar_url || null);
    setUserEmail(profile.email || sessionEmail);
    
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
        if (order.status === 'delivered') doneCount++;
        else if (order.status === 'dispatched') shippedCount++;
        else if (order.status === 'packed') packingCount++;
        else if (order.status !== 'cancelled') newCount++;

        const orderDate = new Date(order.created_at).toDateString();
        if (orderDate === today && order.status !== "cancelled") todayTotal += order.price;
      });
    }

   setPipeline({ new: newCount, packing: packingCount, shipped: shippedCount, done: doneCount });
    setStats({ todaySale: todayTotal, pending: newCount, totalSales: totalCount, liveStock: liveStockCount });

    // 👇 YAHAN MAINE TERA NAYA CODE SET KAR DIYA HAI 👇
    const now = new Date();
    const currentDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const { data: booking } = await supabase
      .from('live_bookings')
      .select('*')
      .eq('dealer_id', session.user.id)
      .eq('booking_date', currentDateStr)
      .single();
      
    if (booking) {
      setTodayBooking(booking);
    }
    // 👆 NAYA CODE END 👆

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
    if (!measurementsConfirmed) {
      alert("Please confirm that the measurements are accurate.");
      return;
    }
    
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

    // Prepare JSON payload for measurements based on category
    const finalMeasurements = itemCategory === "Top" ? {
      chest: measurements.chest,
      length: measurements.length,
      shoulder: measurements.shoulder,
      sleeve: measurements.sleeve
    } : {
      waist: measurements.waist,
      hip: measurements.hip,
      rise: measurements.rise,
      inseam: measurements.inseam,
      outseam: measurements.outseam,
      legOpening: measurements.legOpening
    };

    const { error } = await supabase.from("products").insert([{
      dealer_id: userId,
      title: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      size: itemSize,
      description: itemDesc,
      image_url: uploadedUrls[0] || "", 
      image_urls: uploadedUrls,
      color: itemColor || null,
      material: itemMaterial || null,
      measurements: finalMeasurements // 🔥 JSONB Storage
    }]);

    if (!error) {
      setIsAddModalOpen(false);
      // Reset Form
      setItemName(""); setItemPrice(""); setItemSize("L"); setItemDesc(""); setImageFiles([]); 
      setItemColor(""); setItemMaterial(""); setMeasurementsConfirmed(false);
      setMeasurements({ chest: "", length: "", shoulder: "", sleeve: "", waist: "", hip: "", rise: "", inseam: "", outseam: "", legOpening: "" });
      fetchDashboardData(); 
    } else {
      alert("Error adding item: " + error.message);
    }
    setIsAdding(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, 4); // Max 4 images
      });
    }
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
          
          {/* 🔥 TERA NAYA LIVE NOTIFICATION BELL YAHAN AAGAYA */}
          {userId && <SellerNotifications sellerId={userId} />}

          {/* Settings wala button waisa ka waisa hi hai */}
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </header>

      <main className="px-4 space-y-4">
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
            <button onClick={() => router.push('/dealer/orders')} className="bg-[#1a1a1d] border border-gray-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition">View ›</button>
          </div>
        )}

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
                <p className="flex items-center gap-1 truncate"><span className="text-gray-500">✉️</span> {userEmail}</p>
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

            {/* 🔥 Updated Go Live Button */}
           {/* 🔥 SMART Go Live Button */}
            <div 
              onClick={() => router.push(todayBooking ? '/dealer/live/studio' : '/dealer/live')} 
              className={`bg-[#121214] border p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition ${todayBooking ? 'border-[#00e599]/50 hover:bg-[#00e599]/10' : 'border-gray-800/60 hover:border-purple-500/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayBooking ? 'bg-[#00e599] text-black' : 'bg-[#1a1a1d] text-purple-500'}`}>
                {todayBooking ? (
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{todayBooking ? 'Enter Studio' : 'Go live'}</h4>
                <p className={`text-[10px] ${todayBooking ? 'text-[#00e599] font-bold' : 'text-gray-400'}`}>
                  {todayBooking ? 'Slot booked for today' : 'Tap to schedule'}
                </p>
              </div>
            </div>
          </div>
        </div>

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

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span className="text-[10px] font-bold text-[#F5A623] mb-3">Home</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Products</span>
        </Link>
        
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

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-[#121214] border border-gray-800 rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-black uppercase text-white mb-6">Store Settings</h3>
             <div className="space-y-4">
                <button onClick={() => {setIsSettingsOpen(false); router.push('/dealer/profile');}} className="w-full text-left bg-[#1a1a1d] p-4 rounded-2xl text-sm font-bold text-white hover:border-[#F5A623] border border-transparent transition">Edit Store Details</button>
                <button onClick={handleLogout} className="w-full text-left bg-red-950/20 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-500/20 hover:bg-red-900/30 transition">Secure Logout</button>
             </div>
          </div>
        </div>
      )}

      {isPayoutsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsPayoutsOpen(false)}>
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

      {/* --- 🛠️ UPGRADED ADD PRODUCT MODAL (GOD TIER UI) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center z-[70] p-0 md:p-4 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95">
          <div className="bg-[#0a0a0c] md:bg-[#121214] md:border border-gray-800 rounded-t-3xl md:rounded-3xl w-full max-w-md h-[95vh] md:h-[85vh] flex flex-col relative overflow-hidden">
            
            {/* Header Sticky */}
            <div className="sticky top-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-[#F5A623]">✦</span> Add Product</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">List your item with accurate details</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Scrollable Form */}
            <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
              <form id="add-product-form" onSubmit={handleAddItem} className="space-y-6">
                
                {/* Basic Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Item Title</label>
                    <div className="relative">
                      <input required type="text" maxLength={80} value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition pr-12" placeholder="e.g. Vintage Denim Jacket" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono">{itemName.length}/80</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white font-bold mb-1.5">Category</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]">
                          {itemCategory === 'Bottom' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13V6a2 2 0 00-2-2H5a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H5"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          )}
                        </div>
                        <select value={itemCategory} onChange={(e) => {setItemCategory(e.target.value); setMeasurementsConfirmed(false);}} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white pl-10 pr-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none cursor-pointer">
                          <option value="Top">Top</option>
                          <option value="Bottom">Bottom</option>
                          <option value="Shoes">Shoes</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white font-bold mb-1.5">Size</label>
                      <div className="relative">
                        <select value={itemSize} onChange={(e) => setItemSize(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none cursor-pointer">
                          <option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option><option value="Free Size">Free Size</option>
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Price (₹)</label>
                    <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition font-mono" placeholder="e.g. 1299" />
                  </div>
                </div>

                {/* 📏 MEASUREMENTS MASTER SECTION */}
                {(itemCategory === 'Top' || itemCategory === 'Bottom') && (
                  <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-1 shadow-inner relative overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-3 border-b border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                        <h3 className="text-[11px] font-bold text-white tracking-widest uppercase">Measurements <span className="text-[#F5A623] ml-1">{itemCategory} Wear</span></h3>
                      </div>
                      <button type="button" onClick={() => setIsHowToMeasureOpen(true)} className="text-[10px] text-[#F5A623] flex items-center gap-1 hover:underline">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        How to measure?
                      </button>
                    </div>
                    
                    {/* Measurement Inputs Grid */}
                    <div className="p-3 space-y-3">
                      {itemCategory === 'Top' ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/><path d="M4 8h16" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M2 8l2 -2M2 8l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M22 8l-2 -2M22 8l-2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Chest (Pit to Pit)</p><p className="text-[9px] text-gray-500">Armpit to armpit</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.chest} onChange={e => setMeasurements({...measurements, chest: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 56" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/><path d="M12 4v17" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M10 4l2 -2l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M10 21l2 2l2 -2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Length</p><p className="text-[9px] text-gray-500">Top to bottom</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.length} onChange={e => setMeasurements({...measurements, length: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 72" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/><path d="M6 5h12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M6 3l-2 2l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M18 3l2 2l-2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Shoulder</p><p className="text-[9px] text-gray-500">Seam to seam</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.shoulder} onChange={e => setMeasurements({...measurements, shoulder: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 48" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/><path d="M4 8L2 18" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M3 6L1 8l2 1" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M0 17l2 2l2 -1" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Sleeve Length</p><p className="text-[9px] text-gray-500">Shoulder to cuff</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.sleeve} onChange={e => setMeasurements({...measurements, sleeve: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 64" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Bottom Wear Inputs (Waist, Hip, Rise, Inseam, Outseam, Leg Opening) */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4zM12 4v7m-5-7v7m10-7v7"/><path d="M6 4h12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M4 4l2 -2M4 4l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M20 4l-2 -2M20 4l-2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Waist</p><p className="text-[9px] text-gray-500">Waistband laid flat</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.waist} onChange={e => setMeasurements({...measurements, waist: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 82" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4zM12 4v7m-5-7v7m10-7v7"/><path d="M6 9h12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M4 9l2 -2M4 9l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M20 9l-2 -2M20 9l-2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Hip</p><p className="text-[9px] text-gray-500">Widest part</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.hip} onChange={e => setMeasurements({...measurements, hip: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 102" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/><path d="M12 4v7" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M10 4l2 -2l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M10 11l2 2l2 -2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Rise</p><p className="text-[9px] text-gray-500">Crotch to waist</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.rise} onChange={e => setMeasurements({...measurements, rise: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 31" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/><path d="M12 11l-5 9" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M11 9l1 2l2 -1" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M6 18l1 2l2 -1" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Inseam</p><p className="text-[9px] text-gray-500">Crotch to bottom</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.inseam} onChange={e => setMeasurements({...measurements, inseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 76" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/><path d="M7 4v16" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M5 4l2 -2l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M5 20l2 2l2 -2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Outseam</p><p className="text-[9px] text-gray-500">Waist to outer bottom</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.outseam} onChange={e => setMeasurements({...measurements, outseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 104" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-1/2">
                               <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/><path d="M6 20h5" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/><path d="M4 20l2 -2M4 20l2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/><path d="M13 20l-2 -2M13 20l-2 2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/></svg></div>
                               <div><p className="text-[11px] font-bold text-white">Leg Opening</p><p className="text-[9px] text-gray-500">Bottom hem width</p></div>
                            </div>
                            <div className="relative w-24">
                              <input required type="number" value={measurements.legOpening} onChange={e => setMeasurements({...measurements, legOpening: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 20" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-800/50">
                        <div className="flex items-start gap-2 mb-3 bg-[#0a0a0c] p-2.5 rounded-lg border border-gray-800">
                          <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <p className="text-[10px] text-gray-400">All measurements should be of the actual garment laid flat.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer p-1">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" checked={measurementsConfirmed} onChange={(e) => setMeasurementsConfirmed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-[#0a0a0c] checked:bg-[#F5A623] checked:border-[#F5A623] transition cursor-pointer" />
                            <svg className="w-3 h-3 text-black absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <span className="text-[11px] font-bold text-white select-none">I confirm these measurements are accurate.</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Optional Details */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">
                      <svg className="w-3.5 h-3.5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                      Color <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <select value={itemColor} onChange={(e) => setItemColor(e.target.value)} className="flex-1 bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                        <option value="">Select color (optional)</option>
                        {colorOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <div className="w-12 h-[50px] bg-[#1a1a1d] border border-gray-800 rounded-xl flex items-center justify-center shrink-0">
                        {itemColor ? (
                          <div className="w-6 h-6 rounded-full border border-gray-600 shadow-inner" style={{backgroundColor: colorOptions.find(c => c.name === itemColor)?.hex}}></div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-[#0a0a0c]"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">
                      <svg className="w-3.5 h-3.5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Material <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <input type="text" value={itemMaterial} onChange={(e) => setItemMaterial(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition" placeholder="e.g. Cotton, Denim, Twill" />
                  </div>
                </div>
                
                {/* 📸 4-SLOT IMAGE UPLOADER */}
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] text-white font-bold">Photos (Max 4)</label>
                    <span className="text-[10px] text-gray-500">{imageFiles.length}/4</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const file = imageFiles[idx];
                      const isMain = idx === 0;
                      return (
                        <div key={idx} className={`aspect-square rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center cursor-pointer transition ${file ? 'border border-gray-700 bg-gray-900' : isMain ? 'border-2 border-[#F5A623] border-dashed bg-[#F5A623]/5 hover:bg-[#F5A623]/10' : 'border border-gray-800 border-dashed bg-[#1a1a1d] hover:border-gray-600'}`}>
                          
                          {/* Invisible Input covering the square */}
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={imageFiles.length >= 4} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" title={file ? "Image selected" : "Add photo"} />
                          
                          {file ? (
                            <>
                              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                              {isMain && <span className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-black text-[8px] font-black uppercase py-0.5 z-20">Main Photo</span>}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center pointer-events-none">
                              {isMain ? (
                                <svg className="w-5 h-5 text-[#F5A623] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                              )}
                              <span className={`text-[8px] font-bold uppercase leading-tight ${isMain ? 'text-[#F5A623]' : 'text-gray-500'}`}>Add Photo{isMain && <br/>} {isMain && 'Main Photo'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Clear photos help buyers trust your listing
                    </p>
                    {imageFiles.length > 0 && (
                      <button type="button" onClick={() => setImageFiles([])} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Clear All</button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white font-bold mb-1.5">Description</label>
                  <div className="relative">
                    <textarea rows={4} required maxLength={300} value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition resize-none pb-8" placeholder="Describe the item, its fit, style and any other details..."></textarea>
                    <span className="absolute right-4 bottom-3 text-[10px] text-gray-500 font-mono">{itemDesc.length}/300</span>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer Sticky */}
            <div className="sticky bottom-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-t border-gray-800">
              <button type="submit" form="add-product-form" disabled={isAdding || (['Top', 'Bottom'].includes(itemCategory) && !measurementsConfirmed)} className="w-full bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isAdding ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Publishing...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Publish Product
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- 📏 "HOW TO MEASURE" REFERENCE MODAL --- */}
      {isHowToMeasureOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-in fade-in zoom-in-95">
          <div className="bg-[#121214] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col">
            
            <div className="bg-[#1a1a1d] px-6 py-4 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5A623]/10 text-[#F5A623] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg">How to Measure</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">All measurements are in centimeters (cm)</p>
                </div>
              </div>
              <button onClick={() => setIsHowToMeasureOpen(false)} className="w-8 h-8 bg-[#0a0a0c] rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-gray-800 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto hide-scrollbar space-y-8">
              
              {/* TOP WEAR GUIDE */}
              <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-800/50 pb-3">
                  <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"></path></svg>
                  <div>
                    <h3 className="text-white font-black text-sm tracking-widest uppercase">Top Wear</h3>
                    <p className="text-[10px] text-gray-500 font-bold">T-shirt, Shirt, Hoodie, Sweatshirt, Jacket</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="bg-[#0a0a0c] rounded-xl aspect-square border border-gray-800 flex items-center justify-center p-4 relative">
                     {/* Clean SVG Representation of T-Shirt Guide */}
                     <svg viewBox="0 0 100 100" className="w-full h-full text-gray-200 opacity-90 drop-shadow-xl" fill="currentColor">
                       <path d="M25,25 Q35,20 50,25 Q65,20 75,25 L95,50 L85,60 L75,45 L75,90 L25,90 L25,45 L15,60 L5,50 Z" className="text-[#1a1a1d] stroke-gray-700 stroke-[2]"/>
                       
                       {/* Arrow 1: Chest */}
                       <path d="M26 55 L74 55" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="50" cy="55" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="50" y="58" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">1</text>
                       <path d="M28 53 L26 55 L28 57 M72 53 L74 55 L72 57" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 2: Length */}
                       <path d="M40 25 L40 88" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="40" cy="65" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="40" y="68" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">2</text>
                       <path d="M38 27 L40 25 L42 27 M38 86 L40 88 L42 86" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 3: Shoulder */}
                       <path d="M27 27 L73 27" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="50" cy="27" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="50" y="30" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">3</text>
                       <path d="M29 25 L27 27 L29 29 M71 25 L73 27 L71 29" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 4: Sleeve */}
                       <path d="M75 25 L93 48" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="88" cy="38" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="88" y="41" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">4</text>
                       <path d="M76 28 L75 25 L78 26 M90 48 L93 48 L93 45" stroke="#F5A623" fill="none" strokeWidth="1.5"/>
                     </svg>
                  </div>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                      <div><p className="text-sm font-bold text-white">Chest (Pit to Pit)</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from one underarm seam to the other.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                      <div><p className="text-sm font-bold text-white">Length</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from the highest point of the shoulder to the bottom hem.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                      <div><p className="text-sm font-bold text-white">Shoulder</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from one shoulder seam to the other.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">4</div>
                      <div><p className="text-sm font-bold text-white">Sleeve Length</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from the shoulder seam to the end of the sleeve.</p></div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 bg-[#0a0a0c] p-3 rounded-xl border border-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="text-[11px] text-gray-400">Lay the garment flat on a surface. Do not measure on body.</p>
                </div>
              </div>

              {/* BOTTOM WEAR GUIDE */}
              <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-800/50 pb-3">
                  <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4h10l1 16H6L7 4zM12 4v7m-5-7v7m10-7v7"></path></svg>
                  <div>
                    <h3 className="text-white font-black text-sm tracking-widest uppercase">Bottom Wear</h3>
                    <p className="text-[10px] text-gray-500 font-bold">Jeans, Cargo, Trousers, Pants</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="bg-[#0a0a0c] rounded-xl h-[300px] border border-gray-800 flex items-center justify-center p-4 relative">
                     {/* Clean SVG Representation of Pants Guide */}
                     <svg viewBox="0 0 100 150" className="w-full h-full text-gray-200 opacity-90 drop-shadow-xl" fill="currentColor">
                       <path d="M25,20 L75,20 L85,130 L55,130 L50,60 L45,130 L15,130 Z" className="text-[#1a1a1d] stroke-gray-700 stroke-[2]"/>
                       
                       {/* Arrow 1: Waist */}
                       <path d="M26 15 L74 15" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="50" cy="15" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="50" y="17.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">1</text>
                       <path d="M28 13 L26 15 L28 17 M72 13 L74 15 L72 17" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 2: Hip */}
                       <path d="M23 45 L77 45" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="50" cy="45" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="50" y="47.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">2</text>
                       <path d="M25 43 L23 45 L25 47 M75 43 L77 45 L75 47" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 3: Rise */}
                       <path d="M50 20 L50 60" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="50" cy="32" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="50" y="34.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">3</text>
                       <path d="M48 22 L50 20 L52 22 M48 58 L50 60 L52 58" stroke="#F5A623" fill="none" strokeWidth="1.5"/>

                       {/* Arrow 4: Inseam */}
                       <path d="M50 60 L78 128" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="60" cy="95" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="60" y="97.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">4</text>
                       
                       {/* Arrow 5: Outseam */}
                       <path d="M15 20 L5 128" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="10" cy="80" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="10" y="82.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">5</text>

                       {/* Arrow 6: Leg Opening */}
                       <path d="M60 135 L82 135" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2 2" />
                       <circle cx="71" cy="135" r="4" fill="#0a0a0c" stroke="#F5A623"/> <text x="71" y="137.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">6</text>
                     </svg>
                  </div>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                      <div><p className="text-sm font-bold text-white">Waist</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure straight across the top of the waistband.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                      <div><p className="text-sm font-bold text-white">Hip</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure across the widest part of the hip.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                      <div><p className="text-sm font-bold text-white">Rise</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from the top of the waistband to the crotch seam.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">4</div>
                      <div><p className="text-sm font-bold text-white">Inseam</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from the crotch seam to the bottom hem.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">5</div>
                      <div><p className="text-sm font-bold text-white">Outseam</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure from the top of the waistband to the bottom hem.</p></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs shrink-0">6</div>
                      <div><p className="text-sm font-bold text-white">Leg Opening</p><p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Measure across the bottom opening of the leg.</p></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-[#1a1a1d] border-t border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                 </div>
                 <div>
                   <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest">Tip for accurate measurement</p>
                   <p className="text-[10px] text-gray-400 mt-0.5">Use a soft measuring tape. Measure twice to be sure!</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}