"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ScoutTerminal() {
  const router = useRouter();
  
  // 🧑‍🚀 User & Order States
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📝 Form States for Profile & Address
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editUpi, setEditUpi] = useState("");
  const [saving, setSaving] = useState(false);

  // 🎛️ Navigation & Modal States (Sab kuch zinda karne ke liye)
  const [activeView, setActiveView] = useState<'dashboard' | 'tracking' | 'following' | 'security'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    const userEmail = session.user.email || "";
    setEmail(userEmail);

    // Fetch Profile Data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const nameToUse = profile?.full_name || userEmail.split("@")[0];
    setFullName(nameToUse);
    
    // Set Form States
    if (profile) {
      setEditName(profile.full_name || "");
      setEditPhone(profile.phone || "");
      setEditAddress(profile.address || "");
      setEditUpi(profile.upi_id || "");
    }

    // Fetch Orders Data
    const { data: scoutOrders } = await supabase
      .from("orders")
      .select("*")
      .in("customer_name", [nameToUse, userEmail.split("@")[0]])
      .order("created_at", { ascending: false });

    if (scoutOrders) setOrders(scoutOrders);
    setLoading(false);
  };

  // 💾 Universal Save Handler (For Profile, Address & Settings)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName,
        phone: editPhone,
        address: editAddress,
        upi_id: editUpi,
      })
      .eq("id", userId);

    if (!error) {
      setFullName(editName); // Update UI instantly
      setShowProfileModal(false);
      setShowAddressModal(false);
      setShowSettingsModal(false);
      alert("Details saved successfully! ✅");
    } else {
      alert("Failed to save: " + error.message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-black tracking-widest text-xs uppercase">Initializing Terminal...</div>;

  // Stats Counters
  const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const historyCount = orders.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 selection:bg-[#00e599] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-6 py-6 flex justify-between items-center relative z-20">
        <div>
          <h1 className="text-xl font-black tracking-tighter w-max block cursor-pointer" onClick={() => setActiveView('dashboard')}>
            KORO <span className="text-[#00e599]">LANE</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage your account and orders.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Bell -> Opens Notifications */}
          <button onClick={() => setShowNotifications(true)} className="text-gray-400 hover:text-white transition relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00e599] rounded-full border-2 border-[#050505]"></span>
          </button>
          {/* Gear -> Opens Settings Modal */}
          <button onClick={() => setShowSettingsModal(true)} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </header>

      {/* 🔔 1. NOTIFICATIONS DRAWER */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showNotifications ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowNotifications(false)}>
        <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-[#0a0a0c] border-l border-gray-900 shadow-2xl transform transition-transform duration-300 ${showNotifications ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-gray-900">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-[#00e599]">🔔</span> NOTIFICATIONS</h2>
            <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white bg-[#121214] p-2 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-80px)]">
            <div className="bg-[#121214] border border-[#00e599]/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(0,229,153,0.05)]">
              <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 bg-[#00e599] text-black rounded-full flex items-center justify-center text-[10px] font-black">K</div><span className="text-[9px] font-black uppercase text-[#00e599] tracking-widest">Koro Lane Admin</span></div>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">Big drop coming this weekend! 100+ vintage tees loading. Get your wallets ready. 🔥</p>
            </div>
            <div className="bg-[#121214] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">U</div><span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Urban Thrift</span></div>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">Just dropped 5 new Carhartt jackets! Go check them out before they sell out.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✏️ 2. EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black uppercase text-white mb-4">Edit Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Full Name</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" required /></div>
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Phone Number</label><input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" /></div>
              <button type="submit" disabled={saving} className="w-full bg-[#00e599] text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition mt-2">{saving ? "Saving..." : "Save Changes"}</button>
            </form>
          </div>
        </div>
      )}

      {/* 📍 3. ADDRESS BOOK MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black uppercase text-white mb-4 flex items-center gap-2"><span className="text-[#00e599]">📍</span> Address Book</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Default Delivery Address</label><textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} rows={4} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none resize-none" placeholder="Enter full address with pin code..." required /></div>
              <button type="submit" disabled={saving} className="w-full bg-[#00e599] text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition mt-2">{saving ? "Saving..." : "Save Address"}</button>
            </form>
          </div>
        </div>
      )}

      {/* ⚙️ 4. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black uppercase text-white mb-4 flex items-center gap-2"><span className="text-gray-400">⚙️</span> Settings</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Payout UPI ID (For Reselling)</label><input type="text" value={editUpi} onChange={e => setEditUpi(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" placeholder="yourname@upi" /></div>
              <div className="pt-2 border-t border-gray-900 space-y-2">
                <button type="button" className="w-full text-left text-xs font-bold text-gray-400 py-2 hover:text-white">Privacy Policy</button>
                <button type="button" className="w-full text-left text-xs font-bold text-gray-400 py-2 hover:text-white">Help & Support</button>
              </div>
              <button type="submit" disabled={saving} className="w-full border border-[#00e599] text-[#00e599] font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-[#00e599]/10 transition mt-2">{saving ? "Saving..." : "Save Settings"}</button>
            </form>
          </div>
        </div>
      )}

      <main className="relative">
        
        {/* 🎛️ VIEW 1: MAIN DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="px-6 space-y-6 animate-in fade-in duration-300">
            
            {/* PROFILE CARD -> Opens Profile Modal */}
            <div onClick={() => setShowProfileModal(true)} className="flex items-center justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-3xl cursor-pointer hover:border-gray-700 transition group">
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200" className="w-16 h-16 rounded-full border-2 border-[#00e599]/30 object-cover" />
                <div>
                  <h2 className="text-lg font-black text-white capitalize">{fullName}</h2>
                  <div className="flex items-center gap-1 mt-1 bg-[#003320] text-[#00e599] px-2 py-0.5 rounded-full w-max">
                    <span className="text-[8px] font-black uppercase tracking-widest">Verified Buyer</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 truncate max-w-[150px]">📍 {editAddress ? editAddress.split(',')[0] : "Dehradun, Uttarakhand"}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>

            {/* ORDERS CARD -> Opens Tracking View */}
            <div onClick={() => setActiveView('tracking')} className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-5 cursor-pointer hover:border-gray-700 transition group">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#003320] p-2 rounded-xl text-[#00e599] group-hover:scale-110 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Orders</h3>
                </div>
                <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-gray-900 pt-4 text-center">
                <div><p className="text-lg font-black text-[#00e599]">{activeCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Active</p></div>
                <div><p className="text-lg font-black text-white">{deliveredCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Delivered</p></div>
                <div><p className="text-lg font-black text-white">{historyCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">History</p></div>
              </div>
            </div>

            {/* LIST ITEMS (2-COLUMN GRID) */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Wishlist -> Route */}
              <div onClick={() => router.push('/wishlist')} className="flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">♡</div>
                  <span className="bg-[#121214] border border-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">8</span>
                </div>
                <div><h4 className="text-[11px] font-bold text-white mb-0.5">Wishlist</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Items you saved</p></div>
              </div>

              {/* Following -> View */}
              <div onClick={() => setActiveView('following')} className="flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">👥</div>
                  <span className="bg-[#121214] border border-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">4</span>
                </div>
                <div><h4 className="text-[11px] font-bold text-white mb-0.5">Following</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Sellers you follow</p></div>
              </div>

              {/* Addresses -> Modal */}
              <div onClick={() => setShowAddressModal(true)} className="flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">📍</div>
                </div>
                <div><h4 className="text-[11px] font-bold text-white mb-0.5">Addresses</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Delivery addresses</p></div>
              </div>

              {/* Settings -> Modal */}
              <div onClick={() => setShowSettingsModal(true)} className="flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">⚙️</div>
                </div>
                <div><h4 className="text-[11px] font-bold text-white mb-0.5">Settings</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Account & privacy</p></div>
              </div>

              {/* Security -> View */}
              <div onClick={() => setActiveView('security')} className="col-span-2 flex flex-row items-center justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="text-xl bg-[#121214] w-10 h-10 rounded-full flex items-center justify-center border border-gray-800">🛡️</div>
                  <div><h4 className="text-[11px] font-bold text-white leading-tight">Security</h4><p className="text-[9px] text-gray-500 font-medium mt-0.5">Your data is safe</p></div>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>

              {/* Notifications Block -> Drawer */}
              <div onClick={() => setShowNotifications(true)} className="col-span-2 flex flex-row items-center justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="text-xl bg-[#121214] w-10 h-10 rounded-full flex items-center justify-center border border-gray-800 text-[#00e599]">🔔</div>
                  <div><h4 className="text-[11px] font-bold text-white leading-tight">Notifications</h4><p className="text-[9px] text-gray-500 font-medium mt-0.5">View your latest alerts</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00e599] rounded-full"></span>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>

            </div>

            {/* LOGOUT */}
            <button onClick={handleLogout} className="w-full text-center text-red-500 text-[10px] font-black uppercase tracking-widest py-4 mt-2 hover:bg-red-950/20 rounded-xl transition">
              Secure Sign Out
            </button>
          </div>
        )}

        {/* 🎛️ VIEW 2: LIVE ORDER TRACKING */}
        {activeView === 'tracking' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-[#00e599]">📦</span> Your Secured Drops</h2>
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-5 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div><span className="text-[8px] text-[#00e599] font-black uppercase tracking-widest bg-[#003320] px-2 py-0.5 rounded">Order Secured</span><h3 className="font-black text-base uppercase text-gray-200 mt-1.5">{order.product_name}</h3><p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: #{order.id.substring(0,8).toUpperCase()}</p></div>
                  <p className="text-lg font-black text-white">₹{order.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className={order.payment_status === "Pending WhatsApp Confirmation" ? "text-yellow-500" : "text-gray-600"}>1. WA Check</span>
                    <span className={order.status === "packed" ? "text-orange-500" : order.status === "dispatched" || order.status === "delivered" ? "text-orange-500/50" : "text-gray-600"}>2. Packed</span>
                    <span className={order.status === "dispatched" || order.status === "delivered" ? "text-[#00e599]" : "text-gray-600"}>3. Dispatched</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-900 rounded-full relative overflow-hidden">
                    <div className={`h-full absolute left-0 top-0 transition-all duration-500 ${order.status === 'delivered' || order.status === 'dispatched' ? 'w-full bg-[#00e599]' : order.status === 'packed' ? 'w-2/3 bg-orange-500' : 'w-1/3 bg-yellow-500'}`} />
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-center py-12 border border-gray-900 border-dashed rounded-3xl bg-[#0a0a0c]"><p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">No active orders found.</p></div>}
          </div>
        )}

        {/* 🎛️ VIEW 3: FOLLOWING LIST */}
        {activeView === 'following' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><span>👥</span> Following (4)</h2>
            {['Urban Thrift', 'Vintage Vault', 'Streetwear Hub', 'Sneaker Head India'].map((seller, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#0a0a0c] border border-gray-900 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#121214] rounded-full border border-gray-800 flex items-center justify-center font-black text-xs">{seller[0]}</div>
                  <div><h4 className="text-xs font-bold text-white">{seller}</h4><p className="text-[9px] text-[#00e599] font-black uppercase tracking-widest">Verified Seller</p></div>
                </div>
                <button className="bg-white text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition">Following</button>
              </div>
            ))}
          </div>
        )}

        {/* 🎛️ VIEW 4: SECURITY */}
        {activeView === 'security' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><span>🛡️</span> Buyer Protection</h2>
            <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#003320] text-[#00e599] rounded-full flex items-center justify-center mx-auto text-3xl">🔒</div>
              <h3 className="text-lg font-black text-white">Your Data is Encrypted</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Koro Lane uses bank-level encryption to secure your details. Sellers never see your personal payment information.</p>
              <div className="pt-4 border-t border-gray-900 text-left space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold"><span className="text-[#00e599]">✓</span> Secure WhatsApp Verification</div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold"><span className="text-[#00e599]">✓</span> 100% Authenticity Guarantee</div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold"><span className="text-[#00e599]">✓</span> Fraud Protection</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}