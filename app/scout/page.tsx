"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ScoutTerminal() {
  const router = useRouter();
  
  // 🧑‍🚀 User & Core States
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // 📦 Real Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // 📝 Mega Profile Form States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAltPhone, setEditAltPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editUpi, setEditUpi] = useState("");
  const [editInsta, setEditInsta] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🎛️ Navigation & Modal States
  const [activeView, setActiveView] = useState<'dashboard' | 'tracking' | 'following' | 'security' | 'wishlist'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    const nameToUse = profile?.full_name || userEmail.split("@")[0];
    setFullName(nameToUse);
    
    if (profile) {
      setEditName(profile.full_name || "");
      setEditPhone(profile.phone || "");
      setEditAltPhone(profile.alt_phone || "");
      setEditAddress(profile.address || "");
      setEditUpi(profile.upi_id || "");
      setEditInsta(profile.insta_id || "");
      setAvatarUrl(profile.avatar_url || "");
    }

    const { data: scoutOrders } = await supabase.from("orders").select("*").in("customer_name", [nameToUse, userEmail.split("@")[0]]).order("created_at", { ascending: false });
    if (scoutOrders) setOrders(scoutOrders);

    const { count: wlCount } = await supabase.from("wishlist").select("*", { count: 'exact', head: true }).eq("user_id", session.user.id);
    setWishlistCount(wlCount || 0);

    const { count: fCount } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("follower_id", session.user.id);
    setFollowingCount(fCount || 0);

    setLoading(false);
  };

  // 📸 DP Upload Logic
  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

      setAvatarUrl(publicUrl);
      alert('Profile picture updated successfully! 📸');
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: editName, phone: editPhone, alt_phone: editAltPhone, address: editAddress, upi_id: editUpi, insta_id: editInsta }).eq("id", userId);
    if (!error) {
      setFullName(editName); 
      setShowProfileModal(false);
    }
    setSaving(false);
  };

  // 🔥 2-STEP BYPASS FETCH FOR WISHLIST (Fixes 404 & Click Issue)
  const loadWishlistItems = async () => {
    setActiveView('wishlist');
    try {
      const { data: wlData } = await supabase.from("wishlist").select("id, product_id").eq("user_id", userId);
      if (wlData && wlData.length > 0) {
        const productIds = wlData.map(w => w.product_id);
        const { data: prodData } = await supabase.from("products").select("*").in("id", productIds);
        
        const enriched = wlData.map(w => ({
          ...w,
          products: prodData?.find(p => p.id === w.product_id)
        }));
        setWishlistItems(enriched);
      } else {
        setWishlistItems([]);
      }
    } catch(e) { console.error("Wishlist Fetch Error", e); }
  };

  // 🔥 2-STEP BYPASS FETCH FOR FOLLOWING (Fixes Seller ID issue)
  const loadFollowingList = async () => {
    setActiveView('following');
    try {
      const { data: followsData } = await supabase.from("follows").select("*").eq("follower_id", userId);
      if (followsData && followsData.length > 0) {
        const sellerIds = followsData.map(f => f.seller_id).filter(Boolean);
        const { data: profilesData } = await supabase.from("profiles").select("id, full_name, store_name, avatar_url").in("id", sellerIds);
        
        const enriched = followsData.map(f => ({
          ...f,
          seller_profile: profilesData?.find(p => p.id === f.seller_id)
        }));
        setFollowingList(enriched);
      } else {
        setFollowingList([]);
      }
    } catch(e) { console.error("Following Fetch Error", e); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-black tracking-widest text-xs uppercase">Initializing Terminal...</div>;

  const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const historyCount = orders.length;
  const defaultAvatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200";

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-12 selection:bg-[#00e599] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-6 py-5 flex justify-between items-center relative z-20">
        <div>
          <h1 className="text-xl font-black tracking-tighter w-max block cursor-pointer" onClick={() => setActiveView('dashboard')}>
            KORO <span className="text-[#00e599]">LANE</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage your account and orders.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNotifications(true)} className="text-gray-400 hover:text-white transition relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00e599] rounded-full border-2 border-[#050505]"></span>
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </header>

      {/* 🔔 NOTIFICATIONS DRAWER */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showNotifications ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowNotifications(false)}>
        <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-[#0a0a0c] border-l border-gray-900 shadow-2xl transform transition-transform duration-300 ${showNotifications ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-gray-900">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-[#00e599]">🔔</span> NOTIFICATIONS</h2>
            <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white bg-[#121214] p-2 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-80px)]">
            <div className="bg-[#121214] border border-[#00e599]/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 bg-[#00e599] text-black rounded-full flex items-center justify-center text-[10px] font-black">K</div><span className="text-[9px] font-black uppercase text-[#00e599] tracking-widest">Koro Lane Admin</span></div>
              <p className="text-xs text-gray-300 font-medium">Big drop coming this weekend! 100+ vintage tees loading. 🔥</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✏️ MEGA PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-0 md:p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-t-3xl md:rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase text-white">Edit Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <label className="relative cursor-pointer group">
                <img src={avatarUrl || defaultAvatar} className="w-24 h-24 rounded-full border-2 border-[#00e599] object-cover" />
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-[9px] text-white font-bold uppercase">{uploading ? 'Uploading...' : 'Open Gallery'}</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Full Name</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" required /></div>
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Full Address</label><textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} rows={3} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none resize-none" placeholder="House no, Street, City, Pincode" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Mobile No.</label><input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" required /></div>
                <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Alt Mobile (Opt)</label><input type="tel" value={editAltPhone} onChange={e => setEditAltPhone(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instagram ID (Optional)</label><input type="text" value={editInsta} onChange={e => setEditInsta(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" placeholder="@username" /></div>
              <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Payout UPI ID (Optional)</label><input type="text" value={editUpi} onChange={e => setEditUpi(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-sm text-white mt-1 focus:border-[#00e599] outline-none" placeholder="yourname@upi" /></div>
              <button type="submit" disabled={saving || uploading} className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-[11px] hover:bg-emerald-400 transition mt-4">{saving ? "Saving..." : "Save All Details"}</button>
            </form>
          </div>
        </div>
      )}

      {/* ⚙️ SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">⚙️ Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#121214] p-4 rounded-2xl border border-gray-800">
                <h4 className="text-xs font-black text-[#00e599] mb-1 uppercase tracking-widest">Privacy Policy</h4>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Your data is 100% secure with bank-level encryption. We respect your privacy and never share your details without explicit consent.</p>
              </div>
              <div className="bg-[#121214] p-4 rounded-2xl border border-gray-800">
                <h4 className="text-xs font-black text-white mb-2 uppercase tracking-widest">Help & Support</h4>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 flex items-center gap-2"><span className="text-[#00e599]">📞</span> +91 90274 34335</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2"><span className="text-[#00e599]">✉️</span> rohees546@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative">
        
        {/* 🎛️ VIEW 1: MAIN DASHBOARD (PREMIUM UI UPDATE) */}
        {activeView === 'dashboard' && (
          <div className="px-6 space-y-4 animate-in fade-in duration-300">
            
            {/* 🌟 PREMIUM PROFILE CARD */}
            <div onClick={() => setShowProfileModal(true)} className="relative p-5 bg-[#0a0a0c] border border-gray-900 rounded-3xl cursor-pointer hover:border-[#00e599]/30 transition duration-300 group overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 left-0 w-32 h-32 bg-[#00e599] rounded-full blur-[80px] opacity-[0.15]"></div>
               
               <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                     <img src={avatarUrl || defaultAvatar} className="w-16 h-16 rounded-full border-2 border-[#00e599] object-cover bg-gray-900" />
                     <div className="absolute bottom-0 right-0 bg-[#00e599] text-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a0a0c]">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                  </div>
                  <div className="flex-1">
                     <h2 className="text-xl font-black text-white capitalize tracking-tight">{fullName}</h2>
                     <div className="flex items-center gap-1 mt-0.5 bg-[#003320] text-[#00e599] px-2 py-0.5 rounded w-max">
                       <span className="text-[8px] font-black uppercase tracking-widest">Verified Buyer ✓</span>
                     </div>
                     <p className="text-[10px] text-gray-400 font-medium mt-1.5 leading-tight">Building my thrift wardrobe<br/>one piece at a time.</p>
                     <p className="text-[10px] text-gray-500 font-bold mt-1.5 flex items-center gap-1">📍 {editAddress ? editAddress.split(',')[0] : "Update Address"}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-[#00e599] transition">
                     Edit Profile <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
               </div>
            </div>

            {/* ORDERS CARD */}
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

            {/* WATERMARK GRIDS */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Wishlist */}
              <div onClick={loadWishlistItems} className="relative overflow-hidden flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-[#00e599] opacity-[0.03] group-hover:opacity-[0.08] transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 17s-2-1.5-2-2.5a2 2 0 114 0c0 1-2 2.5-2 2.5z"></path></svg>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">♡</div>
                  <span className="bg-[#121214] border border-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{wishlistCount}</span>
                </div>
                <div className="relative z-10"><h4 className="text-[11px] font-bold text-white mb-0.5">Wishlist</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Items you saved</p></div>
              </div>

              {/* Following */}
              <div onClick={loadFollowingList} className="relative overflow-hidden flex flex-col justify-between p-4 h-32 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <svg className="absolute -bottom-2 -right-2 w-24 h-24 text-[#00e599] opacity-[0.03] group-hover:opacity-[0.08] transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">👥</div>
                  <span className="bg-[#121214] border border-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{followingCount}</span>
                </div>
                <div className="relative z-10"><h4 className="text-[11px] font-bold text-white mb-0.5">Following</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Sellers you follow</p></div>
              </div>

              {/* Security */}
              <div onClick={() => setActiveView('security')} className="relative overflow-hidden col-span-2 flex flex-row items-center justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group">
                <svg className="absolute -bottom-6 -right-2 w-32 h-32 text-[#00e599] opacity-[0.03] group-hover:opacity-[0.08] transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="text-xl bg-[#121214] w-10 h-10 rounded-full flex items-center justify-center border border-gray-800">🛡️</div>
                  <div><h4 className="text-[11px] font-bold text-white leading-tight">Security</h4><p className="text-[9px] text-gray-500 font-medium mt-0.5">Your data is safe</p></div>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>

            </div>

            {/* LOGOUT BUTTON */}
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest py-2 hover:opacity-80 transition">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Secure Sign Out
            </button>

            {/* 🔥 PREMIUM PROMO BANNER (Fills the bottom gap) */}
            <div className="relative bg-gradient-to-br from-[#003320]/40 to-[#0a0a0c] border border-[#00e599]/20 rounded-3xl p-5 overflow-hidden flex items-center justify-between group">
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-24 h-24 bg-[#00e599] rounded-full blur-[40px] opacity-[0.15]"></div>
              
              <div className="relative z-10 space-y-1">
                <h3 className="text-white font-black text-[15px] leading-tight">Thrift more.<br/>Live unique.</h3>
                <p className="text-[#00e599]/70 text-[9px] font-medium tracking-wider uppercase mt-1">Sustainable fashion,<br/>smarter choices.</p>
              </div>

              {/* Minimalist Shopping Bag + Leaves Graphic */}
              <div className="relative z-10 text-[#00e599] opacity-80 group-hover:scale-110 transition-transform duration-700">
                <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                  {/* Leaves inside bag */}
                  <path d="M9 12c0 2 1.5 3.5 3 3.5s3-1.5 3-3.5-1.5-2.5-3-2.5S9 10 9 12z"></path>
                  <path d="M12 15.5v3"></path>
                </svg>
              </div>
            </div>

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

        {/* 🎛️ VIEW 3: REAL WISHLIST ITEMS */}
        {activeView === 'wishlist' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><span>♡</span> My Wishlist ({wishlistItems.length})</h2>
            
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {wishlistItems.map((item, idx) => {
                  const product = item.products;
                  return (
                    <div key={idx} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-3 flex flex-col justify-between">
                      {product?.image_url ? (
                        <img src={product.image_url} className="w-full aspect-square object-cover rounded-xl mb-2" />
                      ) : (
                        <div className="w-full aspect-square bg-[#121214] rounded-xl flex items-center justify-center text-xl mb-2">👕</div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{product?.title || "Exclusive Drop"}</h4>
                        <p className="text-[10px] text-[#00e599] font-black mt-0.5">₹{product?.price || "---"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-gray-900 border-dashed rounded-3xl bg-[#0a0a0c]">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">Your wishlist is empty.</p>
              </div>
            )}
          </div>
        )}

        {/* 🎛️ VIEW 4: REAL FOLLOWING LIST */}
        {activeView === 'following' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><span>👥</span> Following ({followingList.length})</h2>
            
            {followingList.length > 0 ? (
              followingList.map((follow, idx) => {
                const seller = follow.seller_profile;
                return (
                  <div key={idx} className="flex items-center justify-between bg-[#0a0a0c] border border-gray-900 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {seller?.avatar_url ? (
                         <img src={seller.avatar_url} className="w-10 h-10 rounded-full object-cover border border-gray-800" />
                      ) : (
                         <div className="w-10 h-10 bg-[#121214] rounded-full border border-gray-800 flex items-center justify-center font-black text-xs text-[#00e599]">{seller?.store_name?.[0] || seller?.full_name?.[0] || "S"}</div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{seller?.store_name || seller?.full_name || "Unknown Seller"}</h4>
                        <p className="text-[9px] text-[#00e599] font-black uppercase tracking-widest mt-0.5">Connected ✓</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 border border-gray-900 border-dashed rounded-3xl bg-[#0a0a0c]">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">You are not following anyone yet.</p>
              </div>
            )}
          </div>
        )}

        {/* 🎛️ VIEW 5: SECURITY */}
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