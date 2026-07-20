"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ScoutTerminal() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  
  // Profile Details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [upiId, setUpiId] = useState("");
  
  // Orders Data
  const [orders, setOrders] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 🎛️ Tab State: Switch between Dashboard and Live Tracking
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking'>('dashboard');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    
    setUserId(session.user.id);
    setEmail(session.user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    let exactCustomerName = "";

    if (profile && profile.full_name) {
      exactCustomerName = profile.full_name;
      setFullName(profile.full_name);
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setUpiId(profile.upi_id || "");
    } else {
      exactCustomerName = session.user.email?.split("@")[0] || "Scout";
    }

    if (exactCustomerName) {
      const { data: scoutOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_name", exactCustomerName)
        .order("created_at", { ascending: false });

      if (scoutOrders) {
        setOrders(scoutOrders);
      }
    }

    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
        address: address,
        upi_id: upiId,
      })
      .eq("id", userId);

    if (error) {
      alert("ERROR: " + error.message);
    } else {
      alert("Profile Details Saved Successfully! ✅ Koro Lane Admin has your latest address.");
      fetchUserData();
      setShowSettings(false);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-black tracking-widest text-xs uppercase">Initializing Terminal...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 selection:bg-[#00e599] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-5 py-4 flex justify-between items-center bg-[#050505]/90 backdrop-blur-md z-30 sticky top-0 border-b border-gray-900/50">
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white">BUYER <span className="text-[#00e599]">TERMINAL</span></h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Agent: {fullName || email.split("@")[0]}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="border border-gray-800 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
            Marketplace
          </Link>
          <button className="relative text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00e599] rounded-full border-2 border-[#050505]"></span>
          </button>
        </div>
      </header>

      <main className="max-w-[450px] mx-auto px-4 pt-6">
        
        {/* 🧑‍🚀 PROFILE HERO SECTION */}
        <section className="flex items-center gap-4 mb-5">
          {/* Avatar with Camera Icon */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-[#00e599] p-0.5 relative z-10">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar" className="w-full h-full rounded-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 z-20 bg-[#00e599] text-black w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] border-[#050505] hover:scale-105 transition shadow-lg">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/></svg>
            </button>
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-black text-white capitalize">{fullName || email.split("@")[0]}</h2>
              <svg className="w-4 h-4 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <p className="text-gray-500 text-[11px] font-bold mt-0.5">@{email.split("@")[0]}</p>
            
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2"></line></svg>
              <span className="text-xs text-white">rohees_insta</span>
              <span className="text-[#00e599] text-[9px] font-black uppercase tracking-widest ml-1">Verified</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-gray-500 text-[10px] font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {address ? address.split(",")[0] : "Dehradun, Uttarakhand"}
            </div>
          </div>
        </section>

        {/* Level Box & Bio */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Streetwear lover • Vintage collector <br/> Building my style, one fit at a time.
            </p>
          </div>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-3 w-36 shrink-0 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#00e599]/10 blur-xl rounded-full"></div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Level</p>
                <p className="text-[11px] font-black text-[#00e599] whitespace-nowrap">Vintage Hunter</p>
              </div>
              <svg className="w-6 h-6 text-[#00e599]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2zm0 4.5v11M7.5 7l9 5M7.5 17l9-5" /></svg>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-bold mb-1">
                <span className="text-gray-500">XP</span>
                <span className="text-white">1,250 <span className="text-gray-700">/ 2,000</span></span>
              </div>
              <div className="w-full bg-[#121214] rounded-full h-1">
                <div className="bg-[#00e599] h-1 rounded-full w-[62%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 STATS BAR */}
        <div className="flex justify-between border-y border-gray-900/50 py-4 mb-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Orders</p>
            <p className="text-xs font-black text-white">{orders.length}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Followers</p>
            <p className="text-xs font-black text-white">248</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Following</p>
            <p className="text-xs font-black text-white">186</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Likes</p>
            <p className="text-xs font-black text-white">1.2K</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Reviews</p>
            <p className="text-xs font-black text-white">18</p>
          </div>
        </div>

        {/* 🎛️ TAB CONTENT RENDERER */}
        {activeTab === 'dashboard' ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* BOX 1: MY CLOSET */}
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599] text-sm">👕</span> MY CLOSET</h3>
                <Link href="#" className="text-[#00e599] text-[9px] font-black uppercase tracking-widest hover:underline">View all</Link>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="aspect-square bg-[#121214] rounded-xl relative overflow-hidden border border-gray-800">
                  <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80" className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 bg-[#050505] rounded-full p-0.5 border border-[#00e599]"><svg className="w-2.5 h-2.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                </div>
                <div className="aspect-square bg-[#121214] rounded-xl relative overflow-hidden border border-gray-800">
                  <img src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80" className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 bg-[#050505] rounded-full p-0.5 border border-[#00e599]"><svg className="w-2.5 h-2.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                </div>
                <div className="aspect-square bg-[#121214] rounded-xl relative overflow-hidden border border-gray-800">
                  <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&q=80" className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 bg-[#050505] rounded-full p-0.5 border border-[#00e599]"><svg className="w-2.5 h-2.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                </div>
                {/* Upload Fit Button */}
                <button className="aspect-square bg-[#0a0a0c] rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center gap-1 hover:border-[#00e599] transition group">
                  <svg className="w-5 h-5 text-[#00e599] group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span className="text-[8px] font-black uppercase text-[#00e599] tracking-widest text-center leading-tight">Upload<br/>Fit</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 font-bold"><span className="text-[#00e599]">12</span> Verified Pieces</p>
            </div>

            {/* BOX 2: ORDERS (Connected to Live Tracking) */}
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-gray-400 text-sm">📦</span> ORDERS</h3>
                <button onClick={() => setActiveTab('tracking')} className="text-[#00e599] text-[9px] font-black uppercase tracking-widest hover:underline">View all</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => setActiveTab('tracking')} className="bg-[#121214] border border-gray-800 rounded-xl p-3 flex flex-col gap-2 hover:border-[#00e599]/50 transition group">
                  <div className="flex items-center gap-1.5"><svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><span className="text-[9px] text-gray-400 font-bold leading-tight text-left">Active<br/>Orders</span></div>
                  <span className="font-black text-white text-lg group-hover:text-[#00e599] transition">{orders.length}</span>
                </button>
                <div className="bg-[#121214] border border-gray-800 rounded-xl p-3 flex flex-col gap-2 opacity-70">
                  <div className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-[9px] text-gray-400 font-bold leading-tight text-left">Delivered<br/>Orders</span></div>
                  <span className="font-black text-white text-lg">24</span>
                </div>
                <div className="bg-[#121214] border border-gray-800 rounded-xl p-3 flex flex-col gap-2 opacity-70">
                  <div className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg><span className="text-[9px] text-gray-400 font-bold leading-tight text-left">Cancelled<br/>Orders</span></div>
                  <span className="font-black text-white text-lg">3</span>
                </div>
              </div>
              <button onClick={() => setActiveTab('tracking')} className="flex justify-between items-center w-full text-xs border-t border-gray-900 pt-3 group">
                <span className="text-gray-400 flex items-center gap-2 font-bold group-hover:text-white transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> View Order History</span>
                <span className="font-black text-gray-600 group-hover:text-[#00e599] transition">→</span>
              </button>
            </div>

            {/* BOX 3: WISHLIST */}
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4 flex items-center justify-between group hover:border-gray-800 transition cursor-pointer">
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2 mb-1"><span className="text-gray-400 text-sm">♡</span> WISHLIST</h3>
                <p className="text-[10px] text-gray-500 font-bold"><span className="text-[#00e599]">8</span> Items Saved</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&q=80" className="w-10 h-10 rounded-lg border-2 border-[#0a0a0c] object-cover" />
                  <img src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=100&q=80" className="w-10 h-10 rounded-lg border-2 border-[#0a0a0c] object-cover" />
                  <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&q=80" className="w-10 h-10 rounded-lg border-2 border-[#0a0a0c] object-cover" />
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>

            {/* GRID 2 COLUMNS */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Reviews */}
              <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4 col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-gray-400 text-sm">☆</span> REVIEWS</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-black uppercase tracking-widest hover:underline">View all</Link>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-500 font-bold">You reviewed <span className="text-[#00e599]">12</span> items</p>
                  <div className="flex items-center gap-1 text-[#00e599]">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3.5 h-3.5 text-[#00e599]/30" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                </div>
              </div>

              {/* Resell Center */}
              <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="text-[10px] font-black uppercase text-white flex items-center gap-1.5"><span className="text-[#00e599] text-sm">♻️</span> RESELL CENTER</h3>
                  <span className="bg-gray-800 text-gray-400 text-[7px] font-black uppercase px-1.5 py-0.5 rounded">SOON</span>
                </div>
                <div className="relative z-10 mt-2">
                  <p className="text-[10px] text-gray-400 font-bold leading-snug">Resell feature is<br/>coming soon!</p>
                  <p className="text-[8px] text-gray-600 mt-1">Stay tuned for updates.</p>
                </div>
                {/* Decorative Box SVG */}
                <svg className="w-16 h-16 text-[#00e599]/10 absolute bottom-0 right-0 -mr-4 -mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>

              {/* Badges & XP */}
              <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-[10px] font-black uppercase text-white flex items-center gap-1.5"><span className="text-[#00e599] text-sm">⬡</span> BADGES & XP</h3>
                  <Link href="#" className="text-[#00e599] text-[8px] font-black uppercase tracking-widest hover:underline">View all</Link>
                </div>
                <div className="flex gap-1.5 mb-2">
                  <svg className="w-6 h-6 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.3)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-6 h-6 text-[#00e599] drop-shadow-[0_0_5px_rgba(0,229,153,0.3)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-6 h-6 text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-6 h-6 text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                </div>
                <p className="text-[9px] text-[#00e599] font-bold"><span className="text-gray-500">+12</span> Badges Earned</p>
              </div>

              {/* Notifications */}
              <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase text-white flex items-center gap-1.5"><span className="text-[#00e599] text-sm">🔔</span> NOTIFICATIONS</h3>
                  <Link href="#" className="text-[#00e599] text-[8px] font-black uppercase tracking-widest hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00e599] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <div><p className="text-[9px] text-gray-300 leading-tight">Your order #KRL1234 has been delivered</p><span className="text-[8px] text-gray-600 font-bold">2h ago</span></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3.5 h-3.5 bg-gray-800 rounded-full flex items-center justify-center text-[7px] shrink-0 mt-0.5">K</div>
                    <div><p className="text-[9px] text-gray-300 leading-tight"><span className="text-[#00e599] font-bold">Komal_thrift</span> liked your fit</p><span className="text-[8px] text-gray-600 font-bold">5h ago</span></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <div><p className="text-[9px] text-gray-300 leading-tight">You got a new follower <span className="text-white font-bold">_style_king</span></p><span className="text-[8px] text-gray-600 font-bold">1d ago</span></div>
                  </div>
                </div>
              </div>

              {/* Settings (Connected to your form) */}
              <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black uppercase text-white flex items-center gap-1.5"><span className="text-gray-400 text-sm">⚙️</span> SETTINGS</h3>
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
                <div className="space-y-3">
                  <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-white transition group">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className={showSettings ? "text-[#00e599]" : ""}>Account Settings</span>
                  </button>
                  <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-white transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Address Book
                  </button>
                  <button className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-white transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    Payment Methods
                  </button>
                  <button className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-white transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Help & Support
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-red-500 transition mt-1 pt-2 border-t border-gray-900">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                  </button>
                </div>
              </div>

            </div>

            {/* 🔥 HIDDEN SETTINGS FORM (Toggles when Account Settings is clicked) */}
            {showSettings && (
              <div className="bg-[#121214] border border-[#00e599]/30 rounded-2xl p-5 mt-4 shadow-[0_0_20px_rgba(0,229,153,0.1)] animate-in slide-in-from-bottom-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00e599] mb-4">Edit Profile</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Full Name *</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599] transition" placeholder="Agent Name" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Mobile Number *</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599] transition" placeholder="+91 00000 00000" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Default Delivery Address *</label>
                    <textarea rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599] resize-none transition" placeholder="Enter your full address"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Payout UPI ID</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-lg text-white px-3 py-2.5 text-sm outline-none focus:border-[#00e599] transition" placeholder="yourname@upi" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowSettings(false)} className="flex-1 bg-transparent border border-gray-700 text-gray-400 font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:text-white transition">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-[#00e599] text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition disabled:opacity-70 shadow-[0_0_15px_rgba(0,229,153,0.3)]">
                      {saving ? "SAVING..." : "UPDATE DETAILS"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* 🚀 TAB 2: LIVE ORDER TRACKING (Appears when user clicks "Active Orders") */
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-4 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back to Dashboard
            </button>

            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your Secured Drops Tracker</h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] text-[#00e599] font-black uppercase tracking-widest bg-[#003320] px-2 py-0.5 rounded">Order Secured</span>
                    <h3 className="font-black text-base uppercase text-gray-200 mt-1.5">{order.product_name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: #{order.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <p className="text-lg font-black text-white">₹{order.price.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className={order.payment_status === "Pending WhatsApp Confirmation" ? "text-yellow-500" : "text-gray-600"}>1. WA Check</span>
                    <span className={order.status === "packed" ? "text-orange-500" : order.status === "dispatched" ? "text-orange-500/50" : "text-gray-600"}>2. Packed</span>
                    <span className={order.status === "dispatched" ? "text-[#00e599]" : "text-gray-600"}>3. Dispatched</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-900 rounded-full relative overflow-hidden">
                    <div className={`h-full absolute left-0 top-0 transition-all duration-500 ${
                      order.status === 'dispatched' ? 'w-full bg-[#00e599] shadow-[0_0_10px_#00e599]' :
                      order.status === 'packed' ? 'w-2/3 bg-orange-500 shadow-[0_0_10px_#f97316]' : 'w-1/3 bg-yellow-500 shadow-[0_0_10px_#eab308]'
                    }`} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide leading-relaxed">
                    {order.status === 'dispatched' ? "🚚 GAADI NIKAL CHUKI HAI! Your item is dispatched and on its way." :
                     order.status === 'packed' ? "📦 Item has been securely packed by the dealer." :
                     order.payment_status === "Pending WhatsApp Confirmation" ? "📱 Verification pending. Send screenshot on WhatsApp." :
                     "🏪 Order received. Dealer is preparing the item."}
                  </p>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-12 border border-gray-900 border-dashed rounded-2xl bg-[#0a0a0c]">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">No active orders found.</p>
                <button onClick={() => setActiveTab('dashboard')} className="text-[#00e599] text-[9px] font-black uppercase tracking-widest mt-3 hover:underline">Return to Dashboard</button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}