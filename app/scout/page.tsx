"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";

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

  // 🔥 NAYE NOTIFICATION STATES
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 📝 Mega Profile Form States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAltPhone, setEditAltPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState(""); 
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
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    fetchUserData();
  }, []);

  // 🔥 REALTIME NOTIFICATION LISTENER FOR BUYER
  useEffect(() => {
    if (!userId) return;

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (data) {
        setNotifications(data);
        const unreadExists = data.some(n => !n.is_read);
        setHasUnread(unreadExists);
      }
    };
    fetchNotifs();

    const channel = supabase
      .channel(`buyer-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev]);
          setHasUnread(true);
          
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markNotificationsAsRead = async () => {
    setShowNotifications(true);
    if (!hasUnread || !userId) return;

    setHasUnread(false);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  };

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    
    const currentUserId = session.user.id;
    setUserId(currentUserId);
    const userEmail = session.user.email || "";
    setEmail(userEmail);

    let { data: profile } = await supabase.from("profiles").select("*").eq("id", currentUserId).single();
    
    if (profile && profile.role === 'dealer') {
      router.push("/dealer");
      return;
    }

    if (!profile) {
      const { data: newProfile } = await supabase.from("profiles").insert({
        id: currentUserId,
        email: userEmail,
        role: "scout",
        full_name: "" 
      }).select().single();
      
      if (newProfile) profile = newProfile;
    } else if (profile && !profile.email) {
      await supabase.from("profiles").update({ email: userEmail }).eq("id", currentUserId);
      profile.email = userEmail;
    }

    if (typeof window !== 'undefined') localStorage.removeItem('koro_intended_role');

    const nameToUse = profile?.full_name || "New Buyer";
    setFullName(nameToUse);
    
    if (profile) {
      setEditName(profile.full_name || "");
      setEditPhone(profile.phone || "");
      setEditAltPhone(profile.alt_phone || "");
      setEditAddress(profile.address || "");
      setEditPincode(profile.pincode || ""); 
      setEditUpi(profile.upi_id || "");
      setEditInsta(profile.insta_id || "");
      setAvatarUrl(profile.avatar_url || "");
    }

    // 🔥 BULLETPROOF FETCH WITH DEBUG LOGS
    console.log("Fetching orders for User ID:", currentUserId);

    const { data: scoutOrders, error: orderError } = await supabase
      .from("orders")
      .select(`*`)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });
      
    if (orderError) {
      console.error("Order Fetch Error ❌:", orderError);
    } else {
      console.log("Fetched Orders Successfully ✅:", scoutOrders);
      if (scoutOrders) setOrders(scoutOrders);
    }

    const { count: wlCount } = await supabase.from("wishlist").select("*", { count: 'exact', head: true }).eq("user_id", currentUserId);
    setWishlistCount(wlCount || 0);

    const { count: fCount } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("follower_id", currentUserId);
    setFollowingCount(fCount || 0);

    setLoading(false);
  };

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
    const { error } = await supabase.from("profiles").update({ 
      full_name: editName, 
      phone: editPhone, 
      alt_phone: editAltPhone, 
      address: editAddress, 
      pincode: editPincode, 
      upi_id: editUpi, 
      insta_id: editInsta 
    }).eq("id", userId);
    
    if (!error) {
      setFullName(editName || "New Buyer"); 
      setShowProfileModal(false);
      fetchUserData(); 
    } else {
      alert("Error saving profile: " + error.message);
    }
    setSaving(false);
  };

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

  const loadFollowingList = async () => {
    setActiveView('following');
    try {
      const { data: followsData } = await supabase.from("follows").select("*").eq("follower_id", userId);
      if (followsData && followsData.length > 0) {
        const getTargetId = (f: any) => f.seller_id || f.following_id || f.dealer_id || f.profile_id;
        const sellerIds = followsData.map(f => getTargetId(f)).filter(Boolean);
        
        if (sellerIds.length > 0) {
          const { data: profilesData } = await supabase.from("profiles").select("id, full_name, store_name, avatar_url").in("id", sellerIds);
          
          const enriched = followsData.map(f => {
            const tId = getTargetId(f);
            return {
              ...f,
              target_id: tId,
              seller_profile: profilesData?.find(p => p.id === tId)
            }
          });
          setFollowingList(enriched);
        } else {
          setFollowingList(followsData.map(f => ({ ...f, target_id: null })));
        }
      } else {
        setFollowingList([]);
      }
    } catch(e) { console.error("Following Fetch Error", e); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-black tracking-widest text-xs uppercase">Initializing Terminal...</div>;

  const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const historyCount = orders.length;

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] font-sans pb-12 selection:bg-[#FF3B30] selection:text-white overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-6 py-5 flex justify-between items-center relative z-20 border-b border-gray-200 bg-[#F6F3EE]/95 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-black tracking-tighter w-max block cursor-pointer text-[#111111]" onClick={() => setActiveView('dashboard')}>
            KORO <span className="text-[#FF3B30]">LANE</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage your account and orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markNotificationsAsRead} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#111111] transition relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF3B30] rounded-full border border-[#F6F3EE] animate-ping"></span>}
            {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF3B30] rounded-full border border-[#F6F3EE]"></span>}
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#111111] transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </header>

      {/* 🔔 NOTIFICATIONS DRAWER */}
      <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showNotifications ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowNotifications(false)}>
        <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-[#FFFFFF] border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ${showNotifications ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-widest flex items-center gap-2"><span className="text-[#FF3B30]">🔔</span> NOTIFICATIONS</h2>
            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-[#111111] bg-gray-100 p-2 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-80px)]">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="bg-[#F6F3EE] border border-red-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-[#FF3B30] text-white rounded-full flex items-center justify-center text-[10px] font-black">K</div>
                    <span className="text-[9px] font-black uppercase text-[#FF3B30] tracking-widest">{n.title || "Koro Lane Update"}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{n.message}</p>
                  <p className="text-[8px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase">No notifications yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ✏️ MEGA PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-0 md:p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-t-[32px] md:rounded-[32px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#FFFFFF] z-10 py-2">
              <h3 className="text-xl font-black uppercase text-[#111111] tracking-tight">Edit Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-[#111111] hover:bg-gray-200 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <label className="relative cursor-pointer group">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-24 h-24 rounded-full border-2 border-[#FF3B30] object-cover shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-[#FF3B30] bg-gray-100 flex items-center justify-center text-3xl font-black text-[#FF3B30] uppercase shadow-sm">
                    {fullName && fullName !== "New Buyer" ? fullName.charAt(0) : "U"}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-[9px] text-white font-bold uppercase">{uploading ? 'Uploading...' : 'Open Gallery'}</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pb-4">
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" required placeholder="Enter your name" />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Full Address</label>
                <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} rows={3} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none resize-none transition placeholder-gray-400 shadow-inner" placeholder="House no, Street, City" required />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Pincode</label>
                <input type="text" value={editPincode} onChange={e => setEditPincode(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" required placeholder="e.g. 248001" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Mobile No.</label>
                  <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" required />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Alt Mobile (Opt)</label>
                  <input type="tel" value={editAltPhone} onChange={e => setEditAltPhone(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Instagram ID (Optional)</label>
                <input type="text" value={editInsta} onChange={e => setEditInsta(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" placeholder="@username" />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block">Payout UPI ID (Optional)</label>
                <input type="text" value={editUpi} onChange={e => setEditUpi(e.target.value)} className="w-full bg-[#F6F3EE] border border-transparent rounded-xl p-3.5 text-sm text-[#111111] font-bold focus:border-[#FF3B30] focus:bg-white outline-none transition placeholder-gray-400 shadow-inner" placeholder="yourname@upi" />
              </div>
              
              <button type="submit" disabled={saving || uploading} className="w-full bg-[#111111] text-white font-black py-4 rounded-xl uppercase tracking-widest text-[11px] hover:bg-black transition mt-6 shadow-md active:scale-95 disabled:opacity-70">
                {saving ? "Saving..." : "Save All Details"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ⚙️ SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-[28px] p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase text-[#111111] flex items-center gap-2">⚙️ Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-[#111111]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#F6F3EE] p-4 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-xs font-black text-[#FF3B30] mb-1 uppercase tracking-widest">Privacy Policy</h4>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed">Your data is 100% secure with bank-level encryption. We respect your privacy and never share your details without explicit consent.</p>
              </div>
              <div className="bg-[#F6F3EE] p-4 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-xs font-black text-[#111111] mb-2 uppercase tracking-widest">Help & Support</h4>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-700 font-medium flex items-center gap-2"><span className="text-[#FF3B30]">📞</span> +91 90274 34335</p>
                  <p className="text-[11px] text-gray-700 font-medium flex items-center gap-2"><span className="text-[#FF3B30]">✉️</span> rohees546@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative mt-4">
        
        {/* 🎛️ VIEW 1: MAIN DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="px-6 space-y-4 animate-in fade-in duration-300">
            
            {/* 🌟 PREMIUM PROFILE CARD */}
            <div onClick={() => setShowProfileModal(true)} className="relative p-5 bg-[#FFFFFF] border border-gray-200 rounded-[24px] cursor-pointer hover:border-[#FF3B30]/50 transition duration-300 group overflow-hidden shadow-sm">
               <div className="flex items-center gap-4 relative z-10">
                  
                  <div className="relative shrink-0">
                     {avatarUrl ? (
                       <img src={avatarUrl} className="w-16 h-16 rounded-full border-2 border-[#FF3B30] object-cover bg-gray-100 shadow-sm" />
                     ) : (
                       <div className="w-16 h-16 rounded-full border-2 border-[#FF3B30] bg-[#F6F3EE] flex items-center justify-center text-xl font-black text-[#FF3B30] uppercase shadow-sm">
                         {fullName && fullName !== "New Buyer" ? fullName.charAt(0) : "U"}
                       </div>
                     )}
                     
                     <div className="absolute bottom-0 right-0 bg-[#FF3B30] text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <h2 className="text-xl font-black text-[#111111] capitalize tracking-tight truncate">{fullName}</h2>
                     <div className="flex items-center gap-1 mt-0.5 bg-[#FCECEC] text-[#FF3B30] px-2 py-0.5 rounded w-max border border-red-100">
                        <span className="text-[8px] font-black uppercase tracking-widest">Verified Buyer ✓</span>
                     </div>
                     <p className="text-[10px] text-gray-500 font-bold mt-2.5 flex items-center gap-1 truncate">📍 {editAddress ? editAddress.split(',')[0] : "Update Address"}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#FF3B30] transition shrink-0">
                     Edit <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
               </div>
            </div>

            {/* ORDERS CARD */}
            <div onClick={() => setActiveView('tracking')} className="bg-[#FFFFFF] border border-gray-200 rounded-[24px] p-5 cursor-pointer hover:border-gray-300 transition group shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FCECEC] p-2.5 rounded-xl text-[#FF3B30] group-hover:scale-110 transition shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#111111]">Orders</h3>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#111111] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-center">
                <div><p className="text-lg font-black text-[#FF3B30]">{activeCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Active</p></div>
                <div><p className="text-lg font-black text-[#111111]">{deliveredCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Delivered</p></div>
                <div><p className="text-lg font-black text-[#111111]">{historyCount}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">History</p></div>
              </div>
            </div>

            {/* WATERMARK GRIDS */}
            <div className="grid grid-cols-2 gap-3">
              <div onClick={loadWishlistItems} className="relative overflow-hidden flex flex-col justify-between p-4 h-32 bg-[#FFFFFF] border border-gray-200 rounded-[20px] hover:border-gray-300 transition cursor-pointer group shadow-sm">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="text-base bg-[#F6F3EE] w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">♡</div>
                  <span className="bg-[#111111] text-white px-2 py-0.5 rounded-full text-[10px] font-black">{wishlistCount}</span>
                </div>
                <div className="relative z-10"><h4 className="text-[11px] font-bold text-[#111111] mb-0.5">Wishlist</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Items you saved</p></div>
              </div>

              <div onClick={loadFollowingList} className="relative overflow-hidden flex flex-col justify-between p-4 h-32 bg-[#FFFFFF] border border-gray-200 rounded-[20px] hover:border-gray-300 transition cursor-pointer group shadow-sm">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="text-base bg-[#F6F3EE] w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">👥</div>
                  <span className="bg-[#111111] text-white px-2 py-0.5 rounded-full text-[10px] font-black">{followingCount}</span>
                </div>
                <div className="relative z-10"><h4 className="text-[11px] font-bold text-[#111111] mb-0.5">Following</h4><p className="text-[9px] text-gray-500 font-medium leading-tight">Sellers you follow</p></div>
              </div>

              <div onClick={() => setActiveView('security')} className="relative overflow-hidden col-span-2 flex flex-row items-center justify-between p-4 bg-[#FFFFFF] border border-gray-200 rounded-[20px] hover:border-gray-300 transition cursor-pointer group shadow-sm">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="text-lg bg-[#F6F3EE] w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">🛡️</div>
                  <div><h4 className="text-[11px] font-bold text-[#111111] leading-tight">Security</h4><p className="text-[9px] text-gray-500 font-medium mt-0.5">Your data is safe</p></div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#111111] transition relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest py-3 hover:opacity-80 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Secure Sign Out
            </button>

            {/* 🔥 PREMIUM PROMO BANNER */}
            <div className="relative bg-[#FFFFFF] border border-gray-200 rounded-[24px] p-5 overflow-hidden flex items-center justify-between group shadow-sm">
               <div className="relative z-10 space-y-1">
                <h3 className="text-[#111111] font-black text-[15px] leading-tight">Thrift more.<br/>Live unique.</h3>
                <p className="text-gray-500 text-[9px] font-bold tracking-wider uppercase mt-1">Sustainable fashion,<br/>smarter choices.</p>
              </div>
              <div className="relative z-10 text-[#FF3B30] opacity-80 group-hover:scale-110 transition-transform duration-700">
                <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                  <path d="M9 12c0 2 1.5 3.5 3 3.5s3-1.5 3-3.5-1.5-2.5-3-2.5S9 10 9 12z"></path>
                  <path d="M12 15.5v3"></path>
                </svg>
              </div>
            </div>

          </div>
        )}

        {/* 🎛️ VIEW 2: BEAUTIFUL E-COMMERCE STYLE ORDER TRACKING */}
        {activeView === 'tracking' && (
          <div className="px-5 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#111111] text-[10px] font-black uppercase tracking-widest mb-6 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              Back to Dashboard
            </button>
            <h2 className="text-base font-black text-[#111111] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-xl">📦</span> YOUR ORDERS
            </h2>

            <div className="space-y-4 pb-10">
              {orders.map((order) => {
                const imgUrl = order.products?.image_urls?.[0] || order.products?.image_url;
                const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const orderTime = new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                const isPacked = order.status === 'packed' || order.status === 'dispatched' || order.status === 'delivered';
                const isDispatched = order.status === 'dispatched' || order.status === 'delivered';
                const isDelivered = order.status === 'delivered';

                let badgeClass = "bg-orange-50 text-orange-500";
                let badgeText = "ORDER PLACED";
                if (order.status === 'packed') { badgeClass = "bg-orange-100 text-orange-600"; badgeText = "PACKED"; }
                if (order.status === 'dispatched') { badgeClass = "bg-red-50 text-[#FF3B30]"; badgeText = "DISPATCHED"; }
                if (order.status === 'delivered') { badgeClass = "bg-green-50 text-[#00e599]"; badgeText = "DELIVERED"; }

                return (
                  <div key={order.id} className="bg-[#FFFFFF] border border-gray-200 rounded-[20px] overflow-hidden shadow-sm">
                    <div className="p-4 flex gap-4 border-b border-gray-100">
                      <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        {imgUrl ? (
                          <img src={imgUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[4px] ${badgeClass}`}>
                              {badgeText}
                            </span>
                            <div className="text-right">
                              <p className="text-sm font-black text-[#111111]">₹{order.price.toLocaleString('en-IN')}</p>
                              <p className="text-[8px] font-black text-[#00e599] uppercase tracking-widest mt-0.5">Paid</p>
                            </div>
                          </div>
                          <h3 className="font-black text-sm uppercase text-[#111111] line-clamp-1 leading-tight">{order.product_name}</h3>
                          <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Order #{order.id.substring(0,8)}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{orderDate} • {orderTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-5">
                      <div className="relative">
                        <div className="absolute top-2.5 left-2 right-2 h-[3px] bg-gray-100 rounded-full z-0"></div>
                        <div 
                          className="absolute top-2.5 left-2 h-[3px] rounded-full z-10 transition-all duration-500"
                          style={{
                            width: isDelivered ? 'calc(100% - 16px)' : isDispatched ? '66%' : isPacked ? '33%' : '0%',
                            backgroundColor: isDelivered ? '#00e599' : isDispatched ? '#FF3B30' : isPacked ? '#F5A623' : '#F5A623'
                          }}
                        ></div>

                        <div className="flex justify-between relative z-20">
                          <div className="flex flex-col items-center gap-1.5 w-10">
                            <div className="w-5 h-5 rounded-full bg-[#F5A623] border-2 border-white flex items-center justify-center shadow-sm">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span className="text-[8px] font-black text-[#F5A623] uppercase tracking-widest text-center">Order<br/>Placed</span>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1.5 w-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors duration-300 ${isPacked ? 'bg-[#F5A623] border-white' : 'bg-white border-gray-200'}`}>
                              {isPacked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${isPacked ? 'text-[#F5A623]' : 'text-gray-400'}`}>Packed</span>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 w-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors duration-300 ${isDispatched ? 'bg-[#FF3B30] border-white' : 'bg-white border-gray-200'}`}>
                              {isDispatched && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${isDispatched ? 'text-[#FF3B30]' : 'text-gray-400'}`}>Dispatched</span>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 w-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors duration-300 ${isDelivered ? 'bg-[#00e599] border-white' : 'bg-white border-gray-200'}`}>
                              {isDelivered && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${isDelivered ? 'text-[#00e599]' : 'text-gray-400'}`}>Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F6F3EE] p-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition" onClick={() => router.push(`/product/${order.product_id}`)}>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2v00V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">View Product</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>

                  </div>
                );
              })}
              
              {orders.length === 0 && (
                <div className="text-center py-16 border border-gray-200 border-dashed rounded-[20px] bg-white shadow-sm">
                  <span className="text-3xl mb-3 block opacity-40">🛍️</span>
                  <p className="text-gray-500 text-[11px] uppercase tracking-widest font-black">No active orders found.</p>
                  <button onClick={() => router.push('/shop')} className="mt-4 text-[#FF3B30] text-[10px] font-black uppercase tracking-widest hover:underline">Start Shopping</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎛️ VIEW 3: GRID STYLE WISHLIST */}
        {activeView === 'wishlist' && (
          <div className="px-5 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#111111] text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-red-500 text-lg">❤️</span> MY WISHLIST ({wishlistItems.length})</h2>
            
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 pb-10">
                {wishlistItems.map((item, idx) => {
                  const product = item.products;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => product?.id && router.push(`/product/${product.id}`)}
                      className="bg-[#FFFFFF] border border-gray-200 rounded-[16px] overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col group shadow-sm"
                    >
                      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                        {product?.image_url ? (
                          <img src={product.image_url} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">👕</div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 bg-white">
                        <h4 className="text-[11px] font-bold uppercase text-[#111111] line-clamp-2 leading-tight mb-1">{product?.title || "Exclusive Drop"}</h4>
                        <span className="text-[12px] font-black text-[#FF3B30] mt-auto">₹{product?.price || "---"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 border border-gray-200 border-dashed rounded-[20px] bg-white shadow-sm">
                <p className="text-gray-500 text-[11px] uppercase tracking-widest font-black">Your wishlist is empty.</p>
              </div>
            )}
          </div>
        )}

        {/* 🎛️ VIEW 4: REAL FOLLOWING LIST */}
        {activeView === 'following' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#111111] text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-widest mb-4 flex items-center gap-2"><span>👥</span> Following ({followingList.length})</h2>
            
            {followingList.length > 0 ? (
              followingList.map((follow, idx) => {
                const seller = follow.seller_profile;
                const targetId = follow.target_id;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => targetId && router.push(`/store/${targetId}`)}
                    className="flex items-center justify-between bg-[#FFFFFF] border border-gray-200 p-4 rounded-[20px] cursor-pointer hover:border-[#FF3B30]/50 transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {seller?.avatar_url ? (
                         <img src={seller.avatar_url} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                      ) : (
                         <div className="w-10 h-10 shrink-0 bg-[#F6F3EE] rounded-full border border-gray-200 flex items-center justify-center font-black text-xs text-[#FF3B30]">{seller?.store_name?.[0] || seller?.full_name?.[0] || "S"}</div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#111111] group-hover:text-[#FF3B30] transition truncate">{seller?.store_name || seller?.full_name || "Unknown Seller"}</h4>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Connected <span className="text-[#FF3B30]">✓</span></p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#111111] transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 border border-gray-200 border-dashed rounded-[24px] bg-white shadow-sm">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">You are not following anyone yet.</p>
              </div>
            )}
          </div>
        )}

        {/* 🎛️ VIEW 5: SECURITY */}
        {activeView === 'security' && (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#111111] text-[10px] font-black uppercase tracking-widest mb-6 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>Back to Dashboard</button>
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-widest mb-4 flex items-center gap-2"><span>🛡️</span> Buyer Protection</h2>
            <div className="bg-[#FFFFFF] border border-gray-200 rounded-[28px] p-6 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-[#FCECEC] text-[#FF3B30] rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">🔒</div>
              <h3 className="text-lg font-black text-[#111111]">Your Data is Encrypted</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Koro Lane uses bank-level encryption to secure your details. Sellers never see your personal payment information.</p>
            </div>
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1cbd4; border-radius: 4px; }
      `}} />
    </div>
  );
}