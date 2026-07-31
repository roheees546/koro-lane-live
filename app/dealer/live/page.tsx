"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Slot {
  id: number;
  time: string;
  endVal: number;
  status: "available" | "booked" | "passed";
  seller?: string;
}

export default function SlotBookingPage() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    
    // Get today's local date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    
    // Calculate current time as a decimal (e.g., 2:30 PM = 14.5) for "Passed" logic
    const currentTimeVal = now.getHours() + now.getMinutes() / 60;

    // Fetch today's bookings from Supabase, joining profiles to get store_name
    const { data: bookings, error } = await supabase
      .from('live_bookings')
      .select(`
        slot_index,
        profiles ( store_name )
      `)
      .eq('booking_date', currentDateStr);

    if (error) {
      console.error("Error fetching bookings:", error);
    }

    // Base Slot Timings (1.5 hours each)
    const baseSlots = [
      { id: 1, time: "10:00 AM - 11:30 AM", endVal: 11.5 },
      { id: 2, time: "11:30 AM - 01:00 PM", endVal: 13.0 },
      { id: 3, time: "01:00 PM - 02:30 PM", endVal: 14.5 },
      { id: 4, time: "02:30 PM - 04:00 PM", endVal: 16.0 },
      { id: 5, time: "04:00 PM - 05:30 PM", endVal: 17.5 },
      { id: 6, time: "05:30 PM - 07:00 PM", endVal: 19.0 },
      { id: 7, time: "07:00 PM - 08:30 PM", endVal: 20.5 },
      { id: 8, time: "08:30 PM - 10:00 PM", endVal: 22.0 },
    ];

    // Process logic: Check if passed, booked, or available
    const processedSlots: Slot[] = baseSlots.map(slot => {
      // 1. Check if time has already passed today
      if (currentTimeVal >= slot.endVal) {
        return { ...slot, status: 'passed' as const };
      }
      
      // 2. Check if it's booked in the database
      const booking = bookings?.find(b => b.slot_index === slot.id);
      if (booking) {
        // Safe check in case profiles is an array or object based on foreign key
        const storeName = Array.isArray(booking.profiles) 
          ? booking.profiles[0]?.store_name 
          : (booking.profiles as any)?.store_name;
          
        return { 
          ...slot, 
          status: 'booked' as const, 
          seller: storeName || 'Another Seller' 
        };
      }
      
      // 3. Otherwise, it's available
      return { ...slot, status: 'available' as const };
    });

    setSlots(processedSlots);
    setLoading(false);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const now = new Date();
    const currentDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Insert booking into our new Supabase table
    const { error } = await supabase.from('live_bookings').insert({
      dealer_id: session.user.id,
      booking_date: currentDateStr,
      slot_index: selectedSlot,
      status: 'booked'
    });

    if (error) {
      alert("Oops! This slot might have just been booked by someone else or you already booked a slot today.");
      fetchSlots(); // Refresh slots to show updated state
    } else {
      setHasBooked(true);
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-[#00e599] font-black tracking-widest text-xs uppercase animate-pulse">Loading Slots...</div>;
  }

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
                disabled={slot.status !== "available" || isSubmitting}
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
                disabled={isSubmitting}
                className="w-full bg-[#00e599] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#00c987] transition shadow-[0_0_20px_rgba(0,229,153,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Processing...</>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* SUCCESS STATE */
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