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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Terminal...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32 selection:bg-[#00e599] selection:text-black">
      
      {/* 🚀 HEADER */}
      <header className="px-5 py-4 flex justify-between items-center bg-black/90 backdrop-blur z-30 sticky top-0">
        <div>
          <h1 className="text-xl font-black tracking-tighter">BUYER <span className="text-[#00e599]">TERMINAL</span></h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Agent: {fullName || email.split("@")[0]}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="border border-gray-800 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest">
            Marketplace
          </Link>
          <button className="relative text-gray-300 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute top-0 right-0.5 w-2 h-2 bg-[#00e599] rounded-full border border-black"></span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        
        {/* 🧑‍🚀 PROFILE CARD */}
        <section className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-2 border-[#00e599] p-0.5 relative shrink-0">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar" className="w-full h-full rounded-full object-cover" />
              <button className="absolute bottom-0 right-0 bg-[#00e599] text-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-black hover:scale-105 transition">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/></svg>
              </button>
            </div>
            {/* Info */}
            <div className="flex-1">
              <h2 className="text-xl font-black text-white flex items-center gap-1.5 capitalize">
                {fullName || email.split("@")[0]}
                <svg className="w-4 h-4 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </h2>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">@{email.split("@")[0]}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2"></line></svg>
                <span className="text-xs text-white">rohees_insta</span>
                <span className="text-[#00e599] text-[9px] font-bold">Verified</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-gray-400 text-[11px]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {address.split(",")[0] || "Dehradun, Uttarakhand"}
              </div>
            </div>
          </div>

          {/* Level Badge Box */}
          <div className="bg-[#121214] border border-[#00e599]/30 rounded-2xl p-4 w-full md:w-56 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00e599]/10 blur-xl rounded-full"></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Level</p>
                <p className="text-sm font-black text-[#00e599]">Vintage Hunter</p>
              </div>
              {/* Hexagon SVG */}
              <svg className="w-8 h-8 text-[#00e599]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2zm0 4.5v11M7.5 7l9 5M7.5 17l9-5" />
              </svg>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1.5">
                <span className="text-gray-400">XP</span>
                <span className="text-white">1,250 <span className="text-gray-600">/ 2,000</span></span>
              </div>
              <div className="w-full bg-black rounded-full h-1.5">
                <div className="bg-[#00e599] h-1.5 rounded-full w-[62%]"></div>
              </div>
            </div>
          </div>
        </section>
        
        <p className="text-[11px] text-gray-300 leading-relaxed mb-6 border-b border-gray-900 pb-6">
          Streetwear lover • Vintage collector <br/> Building my style, one fit at a time.
        </p>

        {/* 🎛️ TAB SYSTEM */}
        <div className="flex gap-2 mb-6 bg-[#0a0a0c] p-1.5 rounded-xl border border-gray-900">
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'tracking' ? 'bg-[#003320] text-[#00e599] border border-[#00e599]/30 shadow-[0_0_15px_rgba(0,229,153,0.1)]' : 'text-gray-500 hover:text-white'}`}
          >
            Live Tracking
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'dashboard' ? 'bg-[#003320] text-[#00e599] border border-[#00e599]/30 shadow-[0_0_15px_rgba(0,229,153,0.1)]' : 'text-gray-500 hover:text-white'}`}
          >
            My Dashboard
          </button>
        </div>

        {/* 📊 TAB 1: DASHBOARD (The New UI Grid) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-2 pb-2">
              <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Orders</p><p className="text-sm font-black text-white">{orders.length}</p></div>
              </div>
              <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Followers</p><p className="text-sm font-black text-white">248</p></div>
              </div>
              <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Following</p><p className="text-sm font-black text-white">186</p></div>
              </div>
              <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Likes</p><p className="text-sm font-black text-white">1.2K</p></div>
              </div>
              <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Reviews</p><p className="text-sm font-black text-white">18</p></div>
              </div>
            </div>

            {/* Grid Layout Start */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: My Closet */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">👕</span> MY CLOSET</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Dummy Closet Items */}
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80" className="w-full h-full object-cover opacity-80" />
                    <span className="absolute top-1 right-1 bg-[#003320] text-[#00e599] rounded-full p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                  </div>
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80" className="w-full h-full object-cover opacity-80" />
                    <span className="absolute top-1 right-1 bg-[#003320] text-[#00e599] rounded-full p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                  </div>
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&q=80" className="w-full h-full object-cover opacity-80" />
                    <span className="absolute top-1 right-1 bg-[#003320] text-[#00e599] rounded-full p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-500 font-bold">12 Items</p>
                  <button className="text-[10px] font-black text-white hover:text-[#00e599] uppercase tracking-widest flex items-center gap-1"><span className="text-xl leading-none font-normal">+</span> Upload Fit</button>
                </div>
              </div>

              {/* Box 2: My Fits */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">📸</span> MY FITS</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Dummy Fits Items */}
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1512353087810-254cb3656f1f?w=200&q=80" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span className="text-[8px] font-bold text-white">342</span></div>
                  </div>
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1523398002811-999aa8e9ddaa?w=200&q=80" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span className="text-[8px] font-bold text-white">287</span></div>
                  </div>
                  <div className="aspect-[4/5] bg-black rounded-lg relative overflow-hidden border border-gray-800">
                    <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&q=80" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span className="text-[8px] font-bold text-white">199</span></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-bold">See all your uploaded fits</p>
              </div>

              {/* Box 3: Orders Summary */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">📦</span> ORDERS</h3>
                  <button onClick={() => setActiveTab('tracking')} className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</button>
                </div>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-2 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Active Orders</span>
                    <span className="font-black text-white">{orders.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-2 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Delivered Orders</span>
                    <span className="font-black text-white">24</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-2 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> Cancelled Orders</span>
                    <span className="font-black text-white">3</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-800">
                    <span className="text-gray-400 flex items-center gap-2 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Order History</span>
                    <span className="font-black text-gray-500">→</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Wishlist Preview */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">♡</span> WISHLIST</h3>
                  <Link href="/wishlist" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="aspect-[4/5] bg-[#0a0a0c] rounded-lg relative overflow-hidden border border-gray-800 flex items-center justify-center p-2">
                    <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80" className="w-full h-full object-cover opacity-70" />
                    <span className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"><svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
                  </div>
                  <div className="aspect-[4/5] bg-[#0a0a0c] rounded-lg relative overflow-hidden border border-gray-800 flex items-center justify-center p-2">
                    <img src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80" className="w-full h-full object-cover opacity-70" />
                    <span className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"><svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
                  </div>
                  <div className="aspect-[4/5] bg-[#0a0a0c] rounded-lg relative overflow-hidden border border-gray-800 flex items-center justify-center p-2">
                    <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80" className="w-full h-full object-cover opacity-70" />
                    <span className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"><svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-bold">8 Items Saved</p>
              </div>

              {/* Box 5: Resell Center */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4 relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[160px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#003320]/10 to-transparent pointer-events-none"></div>
                <div className="flex w-full justify-between items-start mb-2 absolute top-4 left-4 right-4">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">♻️</span> RESELL CENTER</h3>
                  <span className="bg-gray-800 text-gray-400 text-[7px] font-black uppercase px-2 py-0.5 rounded">Coming Soon 2.0</span>
                </div>
                
                <svg className="w-10 h-10 text-gray-700 mb-2 mt-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                <h4 className="text-[11px] font-bold text-white mb-1">Resell feature is coming soon!</h4>
                <p className="text-[9px] text-gray-500 mb-3">We're building something big for you.</p>
                <button className="border border-[#00e599] text-[#00e599] text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg hover:bg-[#00e599]/10 transition">
                  Stay Tuned
                </button>
              </div>

              {/* Box 6: Reviews */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">⭐</span> REVIEWS</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">U</div>
                    <span className="text-[11px] font-bold">UrbanThrift</span>
                    <div className="flex items-center gap-0.5 ml-auto text-yellow-500">
                      <span className="text-[10px] font-bold mr-1 text-gray-300">5.0</span>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">"Great quality product and fast delivery!"</p>
                  <p className="text-[8px] text-gray-600 mt-1">2 days ago</p>
                </div>
                <p className="text-[10px] text-gray-500 font-bold border-t border-gray-800 pt-3">You reviewed 12 items</p>
              </div>

              {/* Box 7: Badges */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">🏵️</span> BADGES & XP</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="flex justify-between items-center mb-3 px-1">
                  {/* Dummy Hex Badges */}
                  <svg className="w-9 h-9 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-9 h-9 text-[#00e599] drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-9 h-9 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-9 h-9 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                  <svg className="w-9 h-9 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z" opacity="0.2"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l8 4.5v7L12 22l-8-4.5v-7L12 2z"/></svg>
                </div>
                <p className="text-[10px] text-[#00e599] font-bold"><span className="text-gray-500">+12</span> Badges</p>
              </div>

              {/* Box 8: Notifications */}
              <div className="bg-[#121214] border border-gray-900 rounded-2xl p-4 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><span className="text-[#00e599]">🔔</span> NOTIFICATIONS</h3>
                  <Link href="#" className="text-[#00e599] text-[9px] font-bold uppercase tracking-widest">View all</Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[#00e599] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      <p className="text-[10px] text-gray-300 leading-tight">Your order #KRL1234 has been delivered</p>
                    </div>
                    <span className="text-[9px] text-gray-600 font-bold shrink-0">2h ago</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center text-[8px] mt-0.5 shrink-0">K</div>
                      <p className="text-[10px] text-gray-300 leading-tight"><span className="text-[#00e599] font-bold">Komal_thrift</span> liked your fit</p>
                    </div>
                    <span className="text-[9px] text-gray-600 font-bold shrink-0">5h ago</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <p className="text-[10px] text-gray-300 leading-tight">You got a new follower — <span className="text-white font-bold">style_king</span></p>
                    </div>
                    <span className="text-[9px] text-gray-600 font-bold shrink-0">1d ago</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 🚀 TAB 2: LIVE ORDER TRACKING (Tera purana system intact) */}
        {activeTab === 'tracking' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Secured Drops</h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-[#121214] border border-gray-900 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] text-[#00e599] font-black uppercase tracking-widest bg-[#003320] px-2 py-0.5 rounded">
                      Order Secured
                    </span>
                    <h3 className="font-black text-base uppercase text-gray-200 mt-1.5">{order.product_name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: #{order.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <p className="text-lg font-black text-white">₹{order.price.toLocaleString('en-IN')}</p>
                </div>

                {/* 📊 LIVE VISUAL STATUS TRACKER */}
                <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className={order.payment_status === "Pending WhatsApp Confirmation" ? "text-yellow-500" : "text-gray-600"}>1. WA Check</span>
                    <span className={order.status === "packed" ? "text-orange-500" : order.status === "dispatched" ? "text-orange-500/50" : "text-gray-600"}>2. Packed</span>
                    <span className={order.status === "dispatched" ? "text-[#00e599]" : "text-gray-600"}>3. Dispatched</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-900 rounded-full relative overflow-hidden">
                    <div className={`h-full absolute left-0 top-0 transition-all duration-500 ${
                      order.status === 'dispatched' ? 'w-full bg-[#00e599] shadow-[0_0_10px_#00e599]' :
                      order.status === 'packed' ? 'w-2/3 bg-orange-500 shadow-[0_0_10px_#f97316]' : 'w-1/3 bg-yellow-500 shadow-[0_0_10px_#eab308]'
                    }`} />
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide leading-relaxed">
                    {order.status === 'dispatched' ? "🚚 GAADI NIKAL CHUKI HAI! Your item is dispatched and on its way to your address." :
                     order.status === 'packed' ? "📦 Item has been securely packed by the dealer. Koro Lane admin is picking it up." :
                     order.payment_status === "Pending WhatsApp Confirmation" ? "📱 Verification pending. Please ensure you sent the screenshot on WhatsApp." :
                     "🏪 Order received. Dealer is preparing the item."}
                  </p>
                </div>

              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-12 border border-gray-900 border-dashed rounded-2xl">
                <p className="text-gray-500 text-xs uppercase tracking-widest font-black">No secured drops yet.</p>
                <Link href="/" className="text-[#00e599] text-[10px] font-black uppercase tracking-widest mt-3 inline-block hover:underline">
                  Browse Marketplace Feed →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ⚙️ SETTINGS BLOCK (Bottom Area) */}
        <div className="mt-8 border-t border-gray-900 pt-6">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between p-4 bg-[#121214] border border-gray-900 hover:border-gray-700 transition rounded-2xl group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-white">SETTINGS</p>
                <p className="text-[9px] font-bold text-gray-500 mt-0.5">Manage your account, addresses & more</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-gray-600 transition-transform ${showSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
          
          {showSettings && (
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-b-2xl p-5 border-t-0 mt-[-10px] pt-6 animate-in slide-in-from-top-2">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="Agent Name" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Mobile Number *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="+91 00000 00000" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Default Delivery Address *</label>
                  <textarea rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none" placeholder="Enter your full address"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Payout UPI ID</label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="yourname@upi" />
                </div>
                <button type="submit" disabled={saving} className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-gray-200 transition disabled:opacity-70 mt-2">
                  {saving ? "SAVING..." : "UPDATE MY DETAILS"}
                </button>
              </form>
            </div>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#1a0505]/40 border border-red-900/30 text-red-500 rounded-2xl p-4 hover:bg-red-900/20 transition mt-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Sign Out</span>
          </button>
        </div>

      </main>
    </div>
  );
}