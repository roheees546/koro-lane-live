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
  
  // 🎛️ Naya Tab State: Switch between Tracking and Profile
  const [activeTab, setActiveTab] = useState<'tracking' | 'details'>('tracking');

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

    // 1. Fetch Profile Details
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    // 🚀 FIX: Get the exact name the user uses to checkout
    let exactCustomerName = "";

    if (profile && profile.full_name) {
      exactCustomerName = profile.full_name;
      setFullName(profile.full_name);
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setUpiId(profile.upi_id || "");
    } else {
      // Fallback if profile doesn't exist yet
      exactCustomerName = session.user.email?.split("@")[0] || "Scout";
    }

    // 2. Fetch Orders linked ONLY to this EXACT customer name
    // (Ensure it doesn't just pull random "Scout" default names if possible)
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
      // Re-fetch to update orders list based on new name
      fetchUserData();
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Changed to direct homepage
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] font-bold tracking-widest text-xs uppercase">Loading Terminal...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-[#00e599] selection:text-black">
      
      {/* HEADER */}
      <header className="px-6 py-5 flex justify-between items-center border-b border-gray-900 sticky top-0 bg-black/90 backdrop-blur z-30">
        <div>
          <h1 className="text-xl font-black tracking-tighter">BUYER <span className="text-[#00e599]">TERMINAL</span></h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Agent: {fullName || email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="border border-gray-800 hover:border-[#00e599] hover:text-[#00e599] transition px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest">
            Marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        
        {/* 🎛️ TAB SYSTEM */}
        <div className="flex gap-2 mb-8 bg-[#0a0a0c] p-1.5 rounded-lg border border-gray-900">
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'tracking' ? 'bg-[#003320] text-[#00e599] border border-[#00e599]/30 shadow-[0_0_15px_rgba(0,229,153,0.1)]' : 'text-gray-500 hover:text-white'}`}
          >
            Live Tracking
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'details' ? 'bg-[#003320] text-[#00e599] border border-[#00e599]/30 shadow-[0_0_15px_rgba(0,229,153,0.1)]' : 'text-gray-500 hover:text-white'}`}
          >
            My Details
          </button>
        </div>

        {/* 🚀 TAB 1: LIVE ORDER TRACKING */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Secured Drops</h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                
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
                <div className="bg-black/40 border border-gray-900 rounded-xl p-4 space-y-3">
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

        {/* 📝 TAB 2: MY DETAILS (Existing Profile Form) */}
        {activeTab === 'details' && (
          <div className="bg-[#0a0a0c] border border-gray-900 rounded-2xl p-5 mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-900 pb-3">Delivery & Contact Info</h2>
            
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
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Default Delivery Address (Dehradun Only) *</label>
                <textarea rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none" placeholder="Enter your full address"></textarea>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Refund / Payout UPI ID (Optional)</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599]" placeholder="yourname@upi" />
              </div>

              <div className="pt-4 border-t border-gray-900">
                <button type="submit" disabled={saving} className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-[#00c580] transition shadow-[0_0_15px_rgba(0,229,153,0.2)] disabled:opacity-70">
                  {saving ? "SAVING..." : "SAVE DETAILS FOR FAST CHECKOUT"}
                </button>
              </div>
            </form>
          </div>
        )}

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#1a0505] border border-red-900/50 text-red-500 rounded-xl p-4 hover:bg-red-900/20 transition mt-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span className="text-xs font-bold uppercase tracking-widest">Secure Sign Out</span>
        </button>

      </main>
    </div>
  );
}