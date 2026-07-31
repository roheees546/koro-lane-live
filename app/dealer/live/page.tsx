"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SlotBookingPage() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [hasBooked, setHasBooked] = useState(false);

  // Fake database for today's slots (1.5 hours each)
  const slots = [
    { id: 1, time: "10:00 AM - 11:30 AM", status: "passed" },
    { id: 2, time: "11:30 AM - 01:00 PM", status: "booked", seller: "Vintage Vault" },
    { id: 3, time: "01:00 PM - 02:30 PM", status: "available" },
    { id: 4, time: "02:30 PM - 04:00 PM", status: "available" },
    { id: 5, time: "04:00 PM - 05:30 PM", status: "booked", seller: "Thrift & Co." },
    { id: 6, time: "05:30 PM - 07:00 PM", status: "available" },
    { id: 7, time: "07:00 PM - 08:30 PM", status: "available" },
    { id: 8, time: "08:30 PM - 10:00 PM", status: "available" },
  ];

  const handleBookSlot = () => {
    if (selectedSlot) {
      setHasBooked(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-5 pb-24 max-w-[450px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-[#121214] border border-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white">Live Slots</h1>
          <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">Book your 1.5hr window</p>
        </div>
      </div>

      {!hasBooked ? (
        <>
          {/* Slots Grid */}
          <div className="space-y-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                disabled={slot.status !== "available"}
                onClick={() => setSelectedSlot(slot.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  slot.status === "passed"
                    ? "bg-[#0a0a0c] border-gray-900 opacity-50 cursor-not-allowed"
                    : slot.status === "booked"
                    ? "bg-[#121214] border-gray-800 cursor-not-allowed"
                    : selectedSlot === slot.id
                    ? "bg-[#00e599]/10 border-[#00e599] shadow-[0_0_15px_rgba(0,229,153,0.1)]"
                    : "bg-[#121214] border-gray-800 hover:border-gray-600"
                }`}
              >
                <div>
                  <h3 className={`font-black text-sm tracking-widest ${selectedSlot === slot.id ? "text-[#00e599]" : "text-white"}`}>
                    {slot.time}
                  </h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider mt-1 flex items-center gap-1.5">
                    {slot.status === "passed" && <span className="text-gray-600">Time Passed</span>}
                    {slot.status === "booked" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-gray-500">Booked by {slot.seller}</span>
                      </>
                    )}
                    {slot.status === "available" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]"></span>
                        <span className="text-[#00e599]">Available</span>
                      </>
                    )}
                  </p>
                </div>
                
                {/* Radio Circle for Available slots */}
                {slot.status === "available" && (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSlot === slot.id ? "border-[#00e599]" : "border-gray-700"}`}>
                    {selectedSlot === slot.id && <div className="w-2.5 h-2.5 bg-[#00e599] rounded-full"></div>}
                  </div>
                )}
                {/* Lock icon for booked slots */}
                {slot.status === "booked" && (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                )}
              </button>
            ))}
          </div>

          {/* Floating Action Button */}
          {selectedSlot && (
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent z-50 flex justify-center max-w-[450px] mx-auto">
              <button 
                onClick={handleBookSlot}
                className="w-full bg-[#00e599] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#00c987] transition shadow-[0_0_20px_rgba(0,229,153,0.3)]"
              >
                Confirm Booking
              </button>
            </div>
          )}
        </>
      ) : (
        /* SUCCESS STATE & PRE-LIVE REDIRECT */
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-[#00e599]/10 rounded-full flex items-center justify-center mb-6 border border-[#00e599]/30">
            <svg className="w-10 h-10 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Slot Confirmed</h2>
          <p className="text-xs text-gray-400 mb-8 max-w-[250px] leading-relaxed">
            Your 1.5hr slot has been locked. Please prepare your inventory. You can enter the Live Studio 10 minutes before your slot.
          </p>
          
          <button 
            onClick={() => router.push('/dealer')}
            className="bg-[#121214] border border-gray-800 text-white font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-gray-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      )}
      
    </div>
  );
}