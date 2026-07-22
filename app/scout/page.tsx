"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ScoutTerminal() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    
    const userEmail = session.user.email || "";
    setEmail(userEmail);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    // Fix Name fallback
    const nameToUse = profile?.full_name || userEmail.split("@")[0];
    setFullName(nameToUse);

    // Fix Orders Count - matching exact name or email prefix
    const { data: scoutOrders } = await supabase
      .from("orders")
      .select("*")
      .in("customer_name", [nameToUse, userEmail.split("@")[0]]);

    if (scoutOrders) {
      setOrders(scoutOrders);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00e599] font-black tracking-widest text-xs uppercase">Loading Terminal...</div>;

  // Dynamic order counts
  const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const historyCount = orders.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 selection:bg-[#00e599] selection:text-black">
      
      {/* HEADER */}
      <header className="px-6 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tighter w-max block">KORO <span className="text-[#00e599]">LANE</span></h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage your account and orders.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></button>
          <button className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg></button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        
        {/* PROFILE CARD */}
        <div className="flex items-center justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-3xl">
          <div className="flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200" className="w-16 h-16 rounded-full border-2 border-[#00e599]/30 object-cover" />
            <div>
              <h2 className="text-lg font-black text-white capitalize">{fullName}</h2>
              <div className="flex items-center gap-1 mt-1 bg-[#003320] text-[#00e599] px-2 py-0.5 rounded-full w-max">
                <span className="text-[8px] font-black uppercase tracking-widest">Verified Buyer</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5">📍 Dehradun, Uttarakhand</p>
            </div>
          </div>
          <button className="text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
        </div>

        {/* ORDERS CARD */}
        <div className="bg-[#0a0a0c] border border-gray-900 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#003320] p-2 rounded-xl text-[#00e599]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Orders</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-gray-900 pt-4 text-center">
            <div>
              <p className="text-lg font-black text-[#00e599]">{activeCount}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Active</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">{deliveredCount}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Delivered</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">{historyCount}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">History</p>
            </div>
          </div>
        </div>

        {/* LIST ITEMS (2-COLUMN GRID) */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "♡", title: "Wishlist", sub: "Items you saved", count: 8, route: "/wishlist" },
            { icon: "👥", title: "Following", sub: "Sellers you follow", count: 4, route: "#" },
            { icon: "📍", title: "Addresses", sub: "Delivery addresses", count: null, route: "#" },
            { icon: "⚙️", title: "Settings", sub: "Account & privacy", count: null, route: "#" },
            { icon: "🛡️", title: "Security", sub: "Your data is safe", count: null, route: "#", colSpan: 2 }, // Made full width to balance the odd number
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => item.route !== "#" && router.push(item.route)}
              className={`flex flex-col justify-between p-4 bg-[#0a0a0c] border border-gray-900 rounded-2xl hover:border-gray-700 transition cursor-pointer group ${item.colSpan === 2 ? 'col-span-2 flex-row items-center' : 'h-32'}`}
            >
              {item.colSpan === 2 ? (
                // Horizontal Layout for the Full-Width block (Secure Shopping)
                <>
                  <div className="flex items-center gap-3">
                     <div className="text-xl bg-[#121214] w-10 h-10 rounded-full flex items-center justify-center border border-gray-800">{item.icon}</div>
                     <div>
                       <h4 className="text-[11px] font-bold text-white leading-tight">{item.title}</h4>
                       <p className="text-[9px] text-gray-500 font-medium mt-0.5">{item.sub}</p>
                     </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </>
              ) : (
                // Vertical Layout for the 2-Column Grid blocks
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-lg bg-[#121214] w-8 h-8 rounded-full flex items-center justify-center border border-gray-800">{item.icon}</div>
                    {item.count !== null && <span className="bg-[#121214] border border-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{item.count}</span>}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white mb-0.5">{item.title}</h4>
                    <p className="text-[9px] text-gray-500 font-medium leading-tight">{item.sub}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* LOGOUT */}
        <button onClick={handleLogout} className="w-full text-center text-red-500 text-[10px] font-black uppercase tracking-widest py-4 mt-2">
          Secure Sign Out
        </button>

      </main>
    </div>
  );
}