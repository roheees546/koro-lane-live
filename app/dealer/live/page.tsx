"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UploadReelStudio() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);
  
  // Naye Upload States
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const id = session.user.id;
        setDealerId(id);
        
        // 🔥 SMART FILTER: Sirf unsold items fetch karo
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('dealer_id', id)
          .eq('is_sold', false)
          .order('created_at', { ascending: false });
          
        if (data && data.length > 0) {
          const productIds = data.map(p => p.id);
          
          // 🔥 DOUBLE FILTER: Check orders table so we don't show "On Hold" items either
          const { data: ordersData } = await supabase
            .from("orders")
            .select("product_id, status")
            .in("product_id", productIds)
            .neq("status", "cancelled");

          const orderMap: Record<string, string> = {};
          if (ordersData) {
            ordersData.forEach(o => { orderMap[o.product_id] = o.status; });
          }

          // Filter out items that have any active order
          const availableProducts = data.filter((p) => {
            // Agar koi active order (pending, packed, shipped, delivered) hai, toh hata do
            if (orderMap[p.id]) return false;
            return true;
          });

          setInventory(availableProducts);
        } else {
          setInventory([]);
        }
      }
    };
    fetchInventory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const uploadReel = async () => {
    if (!selectedVideo) {
      alert("Bhai pehle drop ki video toh select kar!");
      return;
    }
    if (selectedProducts.length === 0) {
      alert("Kam se kam ek product toh pin kar feed ke liye!");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = selectedVideo.name.split('.').pop();
      const fileName = `${dealerId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reels_videos')
        .upload(fileName, selectedVideo);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('reels_videos')
        .getPublicUrl(fileName);

      const videoUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from('reels')
        .insert([
          {
            dealer_id: dealerId,
            video_url: videoUrl,
            product_ids: selectedProducts 
          }
        ]);

      if (dbError) throw dbError;

      alert("🚀 Reel successfully published to feed!");
      router.back(); 
      
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert("Upload fail ho gaya bawa: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[450px] mx-auto bg-black text-white overflow-hidden selection:bg-[#00e599] selection:text-black">
      
      {/* 🎥 Background Video Preview */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {videoPreviewUrl ? (
          <video 
            src={videoPreviewUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-30">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <p className="text-xs uppercase tracking-widest">No Video Selected</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none"></div>
      </div>

      {/* 🚀 TOP HEADER */}
      <div className="absolute top-0 w-full p-4 pt-safe-top flex justify-between items-start z-20 h-32 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button onClick={() => router.back()} className="w-10 h-10 bg-black/45 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      {/* 🛠️ BOTTOM CONTROLS */}
      <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pt-16">
        <div className="space-y-3">
          
          <div className="text-center mb-2">
            <h2 className="text-lg font-black uppercase tracking-widest text-[#00e599]">Drop Studio</h2>
            <p className="text-xs text-gray-400">Upload a reel and pin your products.</p>
          </div>

          <input 
            type="file" 
            accept="video/*" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl p-3 flex items-center justify-center gap-2 text-white text-xs font-bold uppercase transition hover:border-[#00e599]/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            {selectedVideo ? "Change Video" : "Select Video File"}
          </button>

          <button 
            onClick={() => setShowProductModal(true)}
            className="w-full bg-[#121214]/80 backdrop-blur-md border border-gray-800 rounded-xl p-3 flex items-center justify-between transition hover:border-[#00e599]/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-[#00e599]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">Pin Products</h4>
                <p className="text-[9px] text-[#00e599] font-bold uppercase">{selectedProducts.length} items pinned</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
          
          <button 
            onClick={uploadReel}
            disabled={isUploading}
            className={`w-full font-black uppercase tracking-widest py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg ${
              isUploading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#00e599] hover:bg-[#00c987] text-black'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Uploading...
              </span>
            ) : (
              "Publish Drop"
            )}
          </button>
        </div>
      </div>

      {/* 🛍️ PRODUCT SELECTION MODAL */}
      {showProductModal && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col pt-safe-top">
          <div className="p-4 flex justify-between items-center border-b border-gray-800">
            <h3 className="text-sm font-bold uppercase tracking-wider">Select Items to Pin</h3>
            <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center mt-10 opacity-50">
                <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold">No active products found.</p>
                <p className="text-center text-[10px] text-gray-500 mt-1">Upload fresh items to pin them in reels.</p>
              </div>
            ) : (
              inventory.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => toggleProductSelection(item.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    selectedProducts.includes(item.id) ? 'bg-[#00e599]/10 border-[#00e599]' : 'bg-[#121214] border-gray-800'
                  }`}
                >
                  <img src={item.image_url || "https://placehold.co/100"} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-900" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] font-black text-[#00e599]">₹{item.price}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedProducts.includes(item.id) ? 'bg-[#00e599] border-[#00e599] text-black' : 'border-gray-600'
                  }`}>
                    {selectedProducts.includes(item.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-800">
            <button onClick={() => setShowProductModal(false)} className="w-full bg-white text-black font-black uppercase text-xs py-3 rounded-xl hover:bg-gray-200 transition">
              Confirm Selection ({selectedProducts.length})
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}