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
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Image Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // 🔗 Naya State: Link Copier ke liye
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin); // Set base URL dynamically
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
      setPhone(profile.phone || "");
      setUpiId(profile.upi_id || "");
      setAddress(profile.store_address || profile.address || ""); 
      setLogoUrl(profile.logo_url || "");
      setInstagram(profile.instagram || "");
    }
    setLoading(false);
  };

  // 🔥 THE MAGIC: Image Upload from Gallery
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Uploading to Supabase 'store_logos' bucket
      const { error: uploadError } = await supabase.storage
        .from('store_logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Getting Public URL
      const { data } = supabase.storage.from('store_logos').getPublicUrl(filePath);
      
      setLogoUrl(data.publicUrl);
      alert("Logo uploaded successfully! ✅");

    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        store_name: storeName,
        phone: phone,
        upi_id: upiId,
        store_address: address, 
        address: address,       
        logo_url: logoUrl,
        instagram: instagram
      })
      .eq("id", userId);

    if (error) {
      alert("ERROR: " + error.message);
    } else {
      alert("Store Info Updated Successfully! ✅");
      setIsEditing(false); 
    }
    setSaving(false);
  };

  // 🔥 THE GROWTH HACK: Copy Mini-Store Link
  const handleCopyLink = () => {
    if (!userId) return;
    const storeLink = `${origin}/store/${userId}`;
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // 🚀 FIXED: Logout redirecting to Homepage
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Direct throw to main feed
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 pb-24 max-w-3xl mx-auto selection:bg-[#00e599] selection:text-black">
      
      <h1 className="text-2xl font-black text-[#00e599] mb-6 tracking-tight">Profile & Brand</h1>

   {/* 🟢 TOP CARD: STORE IDENTITY (NOW CLICKABLE FOR PREVIEW) */}
      <Link href={userId ? `/store/${userId}` : "#"} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-4 flex items-center gap-4 mb-6 hover:border-[#00e599]/50 transition group cursor-pointer relative overflow-hidden block">
        
        {/* Chota sa 'Preview Store' text jo hover karne pe dikhega */}
        <div className="absolute top-3 right-4 text-[8px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-[#00e599] transition flex items-center gap-1">
          Preview <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#003320] border-2 border-[#00e599] rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,229,153,0.2)]">
            {logoUrl ? (
              <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-[#00e599] uppercase">{storeName ? storeName.charAt(0) : "S"}</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">{storeName || "Unnamed Store"}</h2>
            <span className="bg-[#00e599] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest mt-1 inline-block shadow-[0_0_10px_rgba(0,229,153,0.3)]">Authorized Dealer</span>
          </div>
        </div>
      </Link>

      {/* 🚀 THE VIRAL LOOP: MINI STORE LINK */}
      <div className="bg-[#003320]/20 border border-[#00e599]/30 rounded-2xl p-5 relative overflow-hidden mb-6 shadow-[0_0_20px_rgba(0,229,153,0.05)]">
        <div className="absolute -right-4 -top-4 text-6xl opacity-10">🔗</div>
        <h2 className="text-[#00e599] font-black uppercase tracking-widest text-xs mb-2">Share Your Mini Store</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
          Add this link to your Instagram bio. Drive free traffic to your exclusive drops!
        </p>
        
        <div className="flex bg-[#0a0a0c] border border-[#00e599]/20 rounded-lg p-1 items-center">
          <input 
            type="text" 
            readOnly 
            value={userId ? `${origin}/store/${userId}` : "Loading..."} 
            className="bg-transparent text-gray-400 text-xs px-3 py-2 outline-none w-full truncate font-mono"
          />
          <button 
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition shrink-0 ${copied ? 'bg-[#00e599] text-black' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {copied ? "Copied! ✅" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* 🛠️ MIDDLE CARD: PUBLIC STORE INFO (With Edit Toggle) */}
      <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl mb-6 overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-900 bg-[#121214]">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Public Store Info</span>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="text-[10px] text-[#00e599] font-bold uppercase tracking-widest hover:text-white transition"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="p-5">
          {isEditing ? (
            /* --- EDIT MODE FORM --- */
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* 📸 NEW: UPLOAD LOGO BUTTON */}
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Store Logo</label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img src={logoUrl} alt="Preview" className="w-12 h-12 rounded-full border border-gray-800 object-cover" />
                  )}
                  <label className="cursor-pointer bg-[#121214] hover:bg-gray-800 border border-gray-800 rounded-lg text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-2">
                    {uploadingLogo ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Choose From Gallery
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      disabled={uploadingLogo}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Store / Brand Name *</label>
                <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="e.g. Rare Kicks India" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Support Email</label>
                <input type="email" disabled value={email} className="w-full bg-[#050505] border border-gray-900 rounded-lg text-gray-500 px-3 py-2 text-sm outline-none cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Business Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="+91 00000 00000" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Store Location / Address</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none" placeholder="e.g. Dehradun, Uttarakhand"></textarea>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Instagram Handle</label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="@your_store" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Settlement UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="merchant@upi" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={saving || uploadingLogo} className="w-full bg-[#00e599] text-black font-black py-3 rounded-lg uppercase tracking-widest text-[10px] hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.2)] disabled:opacity-70">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            /* --- VIEW MODE --- */
            <div className="space-y-5">
              
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Support Email</p>
                  <p className="text-sm font-medium">{email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Store Location</p>
                  <p className="text-sm font-medium capitalize">{address || <span className="text-gray-600 italic">Not added</span>}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Phone Number</p>
                  <p className="text-sm font-medium">{phone || <span className="text-gray-600 italic">Not added</span>}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Instagram</p>
                  <p className="text-sm font-medium text-[#00e599]">{instagram || <span className="text-gray-600 italic">Not added</span>}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Settlement UPI</p>
                  <p className="text-sm font-medium">{upiId || <span className="text-gray-600 italic">Not added</span>}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <Link href="/" className="w-full flex items-center justify-between bg-[#0a0a0c] border border-gray-900 rounded-xl p-4 mb-4 hover:border-gray-700 transition">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          <span className="text-xs font-bold uppercase tracking-widest">Switch to Marketplace Feed</span>
        </div>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </Link>

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#1a0505] border border-red-900/50 text-red-500 rounded-xl p-4 hover:bg-red-900/20 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        <span className="text-xs font-bold uppercase tracking-widest">Secure Sign Out</span>
      </button>

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between z-40 rounded-t-2xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Home</span>
        </Link>
        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Orders</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Inventory</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-[10px] text-[#00e599] mb-3">Profile</span>
        </Link>
      </div>

    </div>
  );
}