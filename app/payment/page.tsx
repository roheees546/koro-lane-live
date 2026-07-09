"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const orderId = searchParams.get("order_id");
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  // BAWA YAHAN APNA KORO LANE WALA WHATSAPP NUMBER DAALNA (Without +)
  const koroLaneWhatsAppNumber = "919027434335"; 

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] text-xs font-bold uppercase tracking-widest">Loading Secure Payment Gateway...</div>;
  
  if (!order) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-bold">Order not found. Please try again.</div>;

  // 💬 WHATSAPP AUTO-MESSAGE GENERATOR
  const whatsappMessage = `Hello Koro Lane Team! 👋\n\nI have made the payment for my order.\n\n*Order ID:* ${order.id}\n*Item:* ${order.product_name}\n*Amount Paid:* ₹${order.price}\n*Name:* ${order.customer_name}\n\nHere is my payment screenshot:`;
  const whatsappUrl = `https://wa.me/${koroLaneWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      
      {/* 🔙 HEADER WITH BACK BUTTON */}
      <nav className="flex justify-between items-center px-6 py-5 border-b border-gray-900 bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back
        </button>
        <h1 className="text-lg font-black tracking-tighter text-[#00e599]">KORO LANE SECURE PAY</h1>
        <div className="w-12"></div> {/* Spacer to keep header centered */}
      </nav>

      <main className="px-6 py-8 max-w-md mx-auto">
        
        {/* AMOUNT & ORDER DETAILS */}
        <div className="text-center mb-8">
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-2">Amount to Pay</p>
          <h2 className="text-5xl font-black text-white">₹{order.price.toLocaleString('en-IN')}</h2>
          <p className="text-gray-500 text-xs mt-2">For: {order.product_name}</p>
        </div>

        {/* QR CODE BOX */}
        <div className="bg-[#0f0f11] border border-[#00e599] p-6 rounded-2xl flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(0,229,153,0.1)] mb-6">
          <div className="bg-white p-2 rounded-xl mb-4">
            {/* 📸 EXACT IMAGE NAME FIX APPLIED HERE */}
            <img src="/qr-code.jpeg.jpeg" alt="UPI QR Code" className="w-48 h-48 object-contain" />
          </div>
          <p className="text-[#00e599] font-bold text-sm tracking-wider uppercase">Scan to Pay</p>
          <p className="text-gray-400 text-xs mt-2">UPI ID: <span className="text-white font-bold select-all">9027434335@ptsbi</span></p>

          {/* 🤝 CO-FOUNDERS PLUG */}
          <div className="mt-5 bg-[#111114] border border-gray-800 px-4 py-3 rounded-xl w-full text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Verified Banking Name</p>
            <p className="text-white text-sm font-bold">Rohit Singh Rana</p>
            <p className="text-[#00e599] text-[10px] font-bold uppercase tracking-wider mt-1">Co-Founders, Koro Lane</p>
          </div>
        </div>

        {/* 🚨 MANDATORY WARNING BOX */}
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
          <h3 className="text-red-500 font-bold text-sm uppercase flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Mandatory Step
          </h3>
          <p className="text-gray-300 text-xs leading-relaxed">
            Your order is <strong className="text-white">NOT CONFIRMED</strong> until you send us the payment screenshot. Please complete the payment and click the button below to send the screenshot on WhatsApp.
          </p>
        </div>

        {/* 🟢 WHATSAPP REDIRECT BUTTON */}
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm transition flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/20"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 21.5c-1.636 0-3.222-.416-4.648-1.211L3 21l.816-4.239A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10.031 10.5zM12 4a8 8 0 100 16 7.973 7.973 0 003.882-1.002l2.673.71-.722-2.6A7.962 7.962 0 0019.998 12 8 8 0 0012 4zm4.238 11.025c-.213-.107-1.26-.622-1.455-.693-.194-.072-.336-.107-.478.107-.142.214-.548.693-.672.835-.124.143-.248.16-.461.054-.213-.107-.9-.332-1.714-1.06-.633-.565-1.06-1.264-1.184-1.478-.124-.214-.014-.33.093-.437.096-.096.213-.249.319-.374.107-.125.142-.214.214-.356.071-.143.036-.268-.018-.374-.053-.107-.478-1.151-.655-1.576-.173-.414-.347-.358-.478-.364-.123-.006-.265-.006-.407-.006a.78.78 0 00-.568.268c-.194.214-.746.729-.746 1.78 0 1.052.763 2.068.87 2.211.106.143 1.508 2.302 3.655 3.228.512.221.912.353 1.223.452.514.164.983.14 1.353.085.412-.062 1.26-.515 1.437-1.013.178-.498.178-.925.124-1.013-.053-.089-.195-.143-.408-.25z"/></svg>
          I HAVE PAID (SEND SCREENSHOT)
        </a>
        
        <div className="mt-8 mb-4">
          <p className="text-center text-[10px] text-gray-600 uppercase font-bold tracking-widest">
            Payments are secured by Koro Lane Escrow
          </p>
          <p className="text-center text-[9px] text-gray-700 mt-2 italic font-semibold">
            Designed & Curated with 🤍 by Rohit & Komal
          </p>
        </div>

      </main>
    </div>
  );
}

// Suspense Boundary setup
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-[#00e599] text-xs font-bold uppercase tracking-widest">Loading Engine...</div>}>
      <PaymentContent />
    </Suspense>
  );
}