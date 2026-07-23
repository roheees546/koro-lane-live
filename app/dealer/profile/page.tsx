"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  
  // States
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState(""); 
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Link Copier State
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin); 
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
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

    if (profile) {
      setStoreName(profile.store_name || "");
      setBio(profile.bio || ""); 
      setPhone(profile.phone || "");
      setUpiId(profile.upi_id || "");
      setAddress(profile.store_address || profile.address || ""); 
      setLogoUrl(profile.logo_url || profile.store_logo || profile.avatar_url || ""); 
      setInstagram(profile.instagram || "");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        store_name: storeName,
        bio: bio, 
        phone: phone,
        upi_id: upiId,
        store_address: address, 
        address: address,      
        instagram: instagram
      })
      .eq("id", userId);

    if (error) {
      alert("ERROR: " + error.message);
    } else {
      setIsEditing(false); 
    }
    setSaving(false);
  };

  const handleCopyLink = () => {
    if (!userId) return;
    const storeLink = `${origin}/store/${userId}`;
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-[#F5A623] font-black tracking-widest text-xs uppercase">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-24 selection:bg-[#F5A623] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-5 py-6 sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30 border-b border-gray-900">
        <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2 text-white">
          Brand Profile
        </h1>
        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Manage your identity</p>
      </header>

      <main className="px-5 pt-6 space-y-6">

        {/* 🟢 TOP CARD: STORE IDENTITY */}
        <Link href={userId ? `/store/${userId}` : "#"} className="bg-[#121214] border border-gray-800/60 rounded-3xl p-5 flex items-center gap-4 hover:border-[#F5A623]/50 transition group cursor-pointer relative overflow-hidden block">
          
          <div className="absolute top-4 right-5 text-[9px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-[#F5A623] transition flex items-center gap-1">
            Preview <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-[#1a1a1d] border border-gray-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_15px_rgba(245,166,35,0.1)]">
              {logoUrl ? (
                <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-[#F5A623] uppercase">{storeName ? storeName.charAt(0) : "S"}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">{storeName || "Unnamed Store"}</h2>
              <span className="bg-[#F5A623]/10 text-[#F5A623] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block border border-[#F5A623]/20">Verified Seller</span>
            </div>
          </div>
        </Link>

        {/* 🚀 THE VIRAL LOOP: MINI STORE LINK */}
        <div className="bg-gradient-to-br from-[#1a1306] to-[#0a0a0c] border border-[#F5A623]/20 rounded-3xl p-5 relative overflow-hidden shadow-[0_0_20px_rgba(245,166,35,0.05)]">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#F5A623] rounded-full blur-[50px] opacity-[0.1]"></div>
          <h2 className="text-white font-black uppercase tracking-widest text-sm mb-1">Share Your Mini Store</h2>
          <p className="text-[10px] text-[#F5A623]/80 font-medium uppercase tracking-widest mb-4">
            Add this link to your Instagram bio. Drive free traffic!
          </p>
          
          <div className="flex bg-[#050505] border border-gray-800 rounded-xl p-1.5 items-center relative z-10">
            <input 
              type="text" 
              readOnly 
              value={userId ? `${origin}/store/${userId}` : "Loading..."} 
              className="bg-transparent text-gray-400 text-xs px-3 py-2 outline-none w-full truncate font-mono"
            />
            <button 
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition shrink-0 ${copied ? 'bg-[#F5A623] text-black' : 'bg-[#1a1a1d] text-white hover:bg-gray-800'}`}
            >
              {copied ? "Copied! ✅" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* 🛠️ MIDDLE CARD: PUBLIC STORE INFO */}
        <div className="bg-[#121214] border border-gray-800/60 rounded-3xl overflow-hidden">
          
          <div className="flex justify-between items-center p-5 border-b border-gray-800/60 bg-[#1a1a1d]/30">
            <span className="text-xs text-white font-black uppercase tracking-widest">Store Info</span>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="text-[10px] text-[#F5A623] font-bold uppercase tracking-widest hover:text-white transition flex items-center gap-1"
            >
              {isEditing ? "Cancel" : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Edit</>}
            </button>
          </div>

          <div className="p-5">
            {isEditing ? (
              /* --- EDIT MODE FORM --- */
              <form onSubmit={handleSave} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Store / Brand Name *</label>
                  <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="e.g. Rare Kicks India" />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Store Bio / Description</label>
                  <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition resize-none" placeholder="Tell buyers about your collection..."></textarea>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Support Email</label>
                  <input type="email" disabled value={email} className="w-full bg-[#050505] border border-gray-900 rounded-xl text-gray-600 px-4 py-3 text-sm outline-none cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Business Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="+91 00000 00000" />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Store Location / Address</label>
                  <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition resize-none" placeholder="e.g. Dehradun, Uttarakhand"></textarea>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Instagram Handle</label>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="@your_store" />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Settlement UPI ID</label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="merchant@upi" />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={saving} className="w-full bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2">
                    {saving ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> SAVING...</> : "SAVE CHANGES"}
                  </button>
                </div>
              </form>
            ) : (
              /* --- VIEW MODE --- */
              <div className="space-y-6">
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-500 shrink-0 mt-0.5 border border-gray-800">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Store Bio</p>
                    <p className="text-sm font-medium text-gray-200 leading-relaxed">{bio || <span className="text-gray-600 italic">Not added</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-500 shrink-0 mt-0.5 border border-gray-800">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Support Email</p>
                    <p className="text-sm font-medium text-gray-200">{email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-500 shrink-0 mt-0.5 border border-gray-800">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Store Location</p>
                    <p className="text-sm font-medium text-gray-200 capitalize">{address || <span className="text-gray-600 italic">Not added</span>}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-500 shrink-0 mt-0.5 border border-gray-800">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-gray-200">{phone || <span className="text-gray-600 italic">Not added</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-[#F5A623] shrink-0 mt-0.5 border border-[#F5A623]/20">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Instagram</p>
                    <p className="text-sm font-black text-[#F5A623]">{instagram || <span className="text-gray-600 italic font-medium">Not added</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-500 shrink-0 mt-0.5 border border-gray-800">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Settlement UPI</p>
                    <p className="text-sm font-medium text-gray-200">{upiId || <span className="text-gray-600 italic">Not added</span>}</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="space-y-3">
          <Link href="/" className="w-full flex items-center justify-between bg-[#121214] border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-[#F5A623] border border-[#F5A623]/20">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white">Switch to Buyer Feed</span>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#1a0505] border border-red-900/30 text-red-500 rounded-2xl p-5 hover:bg-red-900/20 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="text-xs font-bold uppercase tracking-widest">Secure Sign Out</span>
          </button>
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION (Super App Gold Theme) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Home</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Products</span>
        </Link>
        
        {/* Center Big Gold FAB - Links to Inventory to add product */}
        <div className="relative -top-5">
          <Link href="/dealer/inventory" className="w-14 h-14 bg-[#F5A623] rounded-full flex items-center justify-center border-4 border-[#0a0a0c] shadow-[0_0_15px_rgba(245,166,35,0.4)] hover:scale-105 transition transform block">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </Link>
        </div>

        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Orders</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-[10px] font-bold text-[#F5A623] mb-3">Profile</span>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}