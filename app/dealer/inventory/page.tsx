"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // ✏️ EDIT MODAL STATES
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // ➕ CREATE MODAL STATES
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 📝 SHARED FORM STATES
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Top");
  const [itemDesc, setItemDesc] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [itemMaterial, setItemMaterial] = useState("");
  
  // 🔥 JSON Measurements State
  const [measurements, setMeasurements] = useState({
    chest: "", length: "", shoulder: "", sleeve: "", // Top
    waist: "", hip: "", rise: "", inseam: "", outseam: "", legOpening: "" // Bottom
  });
  const [measurementsConfirmed, setMeasurementsConfirmed] = useState(false);
  const [isHowToMeasureOpen, setIsHowToMeasureOpen] = useState(false);

  // 🔥 Arrays for Multiple Images
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  const [isUpdating, setIsUpdating] = useState(false);

  // Pre-defined Colors for UI
  const colorOptions = [
    { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" },
    { name: "Navy Blue", hex: "#000080" }, { name: "Grey", hex: "#808080" },
    { name: "Red", hex: "#FF0000" }, { name: "Olive", hex: "#808000" },
    { name: "Brown", hex: "#A52A2A" }, { name: "Beige", hex: "#F5F5DC" }
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserId(session.user.id);

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("dealer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bawa, are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert("Delete failed: " + error.message);
    }
  };

  // 📝 OPEN CREATE MODAL
  const openCreateModal = () => {
    setItemName(""); setItemPrice(""); setItemCategory("Top"); setItemDesc("");
    setItemColor(""); setItemMaterial(""); setMeasurementsConfirmed(false);
    setMeasurements({ chest: "", length: "", shoulder: "", sleeve: "", waist: "", hip: "", rise: "", inseam: "", outseam: "", legOpening: "" });
    setImageFiles([]); setExistingImageUrls([]);
    setIsCreateModalOpen(true);
  };

  // 📝 OPEN EDIT MODAL & PRE-FILL DATA (GOD TIER)
  const openEditModal = (product: any) => {
    setEditingId(product.id);
    setItemName(product.title);
    setItemPrice(product.price.toString());
    setItemCategory(product.category || "Top");
    setItemDesc(product.description || "");
    setItemColor(product.color || "");
    setItemMaterial(product.material || "");
    
    // Parse JSON Measurements
    const meas = product.measurements || {};
    setMeasurements({
      chest: meas.chest || "", length: meas.length || "", shoulder: meas.shoulder || "", sleeve: meas.sleeve || "",
      waist: meas.waist || "", hip: meas.hip || "", rise: meas.rise || "", inseam: meas.inseam || "", outseam: meas.outseam || "", legOpening: meas.legOpening || ""
    });
    setMeasurementsConfirmed(true); // Auto confirm for edits so they don't have to re-check
    
    if (product.image_urls && Array.isArray(product.image_urls)) {
      setExistingImageUrls(product.image_urls);
    } else if (product.image_url) {
      setExistingImageUrls([product.image_url]);
    } else {
      setExistingImageUrls([]);
    }
    
    setImageFiles([]); 
    setIsEditModalOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles].slice(0, 4)); // Max 4 images
    }
  };

  // 🚀 CREATE PRODUCT ENGINE
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measurementsConfirmed) {
      alert("Please confirm that the measurements are accurate.");
      return;
    }
    if (imageFiles.length === 0) {
      alert("Bawa, please select at least one photo!");
      return;
    }
    
    setIsCreating(true);
    let uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-create-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const finalMeasurements = itemCategory === "Top" ? {
        chest: measurements.chest, length: measurements.length, shoulder: measurements.shoulder, sleeve: measurements.sleeve
      } : {
        waist: measurements.waist, hip: measurements.hip, rise: measurements.rise, inseam: measurements.inseam, outseam: measurements.outseam, legOpening: measurements.legOpening
      };

      const { error: insertError } = await supabase.from("products").insert([{
        dealer_id: userId,
        title: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory,
        size: itemCategory === 'Top' ? 'Free Size' : 'Standard',
        description: itemDesc,
        image_urls: uploadedUrls,
        image_url: uploadedUrls[0],
        color: itemColor || null,
        material: itemMaterial || null,
        measurements: finalMeasurements,
        is_sold: false
      }]);

      if (insertError) throw insertError;

      setIsCreateModalOpen(false);
      fetchInventory(); 
    } catch (error: any) {
      alert("Error adding item: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // 🚀 UPDATE PRODUCT ENGINE
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measurementsConfirmed) {
      alert("Please confirm that the measurements are accurate.");
      return;
    }
    setIsUpdating(true);
    let finalImageUrls = [...existingImageUrls];

    try {
      if (imageFiles.length > 0 && userId) {
        finalImageUrls = []; 
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-update-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, file);
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
            finalImageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      const finalMeasurements = itemCategory === "Top" ? {
        chest: measurements.chest, length: measurements.length, shoulder: measurements.shoulder, sleeve: measurements.sleeve
      } : {
        waist: measurements.waist, hip: measurements.hip, rise: measurements.rise, inseam: measurements.inseam, outseam: measurements.outseam, legOpening: measurements.legOpening
      };

      const { error } = await supabase.from("products").update({
        title: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory,
        size: itemCategory === 'Top' ? 'Free Size' : 'Standard',
        description: itemDesc,
        image_urls: finalImageUrls,
        image_url: finalImageUrls[0] || null,
        color: itemColor || null,
        material: itemMaterial || null,
        measurements: finalMeasurements
      }).eq("id", editingId);

      if (!error) {
        setIsEditModalOpen(false);
        fetchInventory(); 
      } else throw error;
    } catch (error: any) {
      alert("Error updating item: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-[#F5A623] font-black tracking-widest text-xs uppercase">Loading Inventory...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-24 selection:bg-[#F5A623] selection:text-black overflow-x-hidden">
      
      {/* 🚀 HEADER */}
      <header className="px-5 py-6 flex justify-between items-center sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30 border-b border-gray-900">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2 text-white">
            Inventory
          </h1>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{products.length} Items Live</p>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <button onClick={openCreateModal} className="bg-[#1a1a1d] border border-gray-700 text-[#F5A623] px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 hover:border-[#F5A623]/50 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              Add Item
            </button>
          )}
        </div>
      </header>

      {/* 📦 INVENTORY LIST */}
      <main className="px-5 py-6 space-y-4">
        {products.length === 0 ? (
           <div className="bg-[#121214] border border-dashed border-gray-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center mt-10">
             <div className="w-16 h-16 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
             </div>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Your vault is empty</p>
             <button onClick={openCreateModal} className="bg-[#F5A623] text-black text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(245,166,35,0.2)] hover:scale-105 transition">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
               Upload First Item
             </button>
           </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-[#121214] border border-gray-800/60 rounded-3xl p-4 flex gap-4 relative group hover:border-[#F5A623]/30 transition duration-300">
              <div className="w-24 h-32 bg-[#1a1a1d] rounded-2xl overflow-hidden shrink-0 border border-gray-800 relative">
                {product.is_sold && (
                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-[2px]">
                      <span className="text-red-500 text-[9px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 -rotate-12 shadow-lg">Sold Out</span>
                   </div>
                )}
                {(product.image_urls && product.image_urls.length > 1) && (
                   <div className="absolute top-2 right-2 bg-black/80 text-[8px] px-1.5 py-0.5 rounded text-white font-bold backdrop-blur-md z-10 border border-gray-700">
                      +{product.image_urls.length - 1}
                   </div>
                )}
                <img src={product.image_urls?.[0] || product.image_url || "https://placehold.co/100x120/121214/F5A623?text=SURPLUS"} alt={product.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">
                      {product.category || "TOP"}
                    </span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-gray-200 line-clamp-2 pr-2 leading-tight">{product.title}</h3>
                </div>
                
                <div className="flex items-end justify-between mt-2">
                  <p className="font-black text-lg text-white">₹{product.price}</p>
                  
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(product)} className="w-8 h-8 bg-[#1a1a1d] border border-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/50 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 bg-[#1a1a1d] border border-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- BOTTOM NAVIGATION (Super App Gold Theme) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-gray-900 pb-safe pt-3 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        <Link href="/dealer" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Home</span>
        </Link>
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm0 2v10h14V10H5zm4 3h6v2H9v-2z" /></svg>
          <span className="text-[10px] font-bold text-[#F5A623] mb-3">Products</span>
        </Link>
        
        {/* Center Big Gold FAB */}
        <div className="relative -top-5">
          <button onClick={openCreateModal} className="w-14 h-14 bg-[#F5A623] rounded-full flex items-center justify-center border-4 border-[#0a0a0c] shadow-[0_0_15px_rgba(245,166,35,0.4)] hover:scale-105 transition transform">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>

        <Link href="/dealer/orders" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Orders</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition group">
          <svg className="w-6 h-6 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3 group-hover:text-white transition">Profile</span>
        </Link>
      </div>

      {/* --- ➕ CREATE PRODUCT MODAL (GOD TIER UI) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center z-[70] p-0 md:p-4 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95">
          <div className="bg-[#0a0a0c] md:bg-[#121214] md:border border-gray-800 rounded-t-3xl md:rounded-3xl w-full max-w-md h-[95vh] md:h-[85vh] flex flex-col relative overflow-hidden">
            
            {/* Header Sticky */}
            <div className="sticky top-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-[#F5A623]">✦</span> Add Product</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">List your item with accurate details</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Scrollable Form */}
            <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
              <form id="create-product-form" onSubmit={handleCreateItem} className="space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Item Title</label>
                    <div className="relative">
                      <input required type="text" maxLength={80} value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition pr-12" placeholder="e.g. Vintage Denim Jacket" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono">{itemName.length}/80</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Category</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]">
                        {itemCategory === 'Bottom' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13V6a2 2 0 00-2-2H5a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H5"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                      </div>
                      <select value={itemCategory} onChange={(e) => {setItemCategory(e.target.value); setMeasurementsConfirmed(false);}} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white pl-10 pr-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none cursor-pointer">
                        <option value="Top">Top</option>
                        <option value="Bottom">Bottom</option>
                      </select>
                      <svg className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Price (₹)</label>
                    <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition font-mono" placeholder="e.g. 1299" />
                  </div>
                </div>

                {/* 📏 MEASUREMENTS MASTER SECTION */}
                <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-1 shadow-inner relative overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                      <h3 className="text-[11px] font-bold text-white tracking-widest uppercase">Measurements <span className="text-[#F5A623] ml-1">{itemCategory} Wear</span></h3>
                    </div>
                    <button type="button" onClick={() => setIsHowToMeasureOpen(true)} className="text-[10px] text-[#F5A623] flex items-center gap-1 hover:underline">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      How to measure?
                    </button>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {itemCategory === 'Top' ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Chest (Pit to Pit)</p><p className="text-[9px] text-gray-500">Armpit to armpit</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.chest} onChange={e => setMeasurements({...measurements, chest: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 56" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Length</p><p className="text-[9px] text-gray-500">Top to bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.length} onChange={e => setMeasurements({...measurements, length: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 72" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Shoulder</p><p className="text-[9px] text-gray-500">Seam to seam</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.shoulder} onChange={e => setMeasurements({...measurements, shoulder: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 48" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Sleeve Length</p><p className="text-[9px] text-gray-500">Shoulder to cuff</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.sleeve} onChange={e => setMeasurements({...measurements, sleeve: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 64" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Waist</p><p className="text-[9px] text-gray-500">Waistband laid flat</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.waist} onChange={e => setMeasurements({...measurements, waist: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 82" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Hip</p><p className="text-[9px] text-gray-500">Widest part</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.hip} onChange={e => setMeasurements({...measurements, hip: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 102" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Rise</p><p className="text-[9px] text-gray-500">Crotch to waist</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.rise} onChange={e => setMeasurements({...measurements, rise: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 31" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Inseam</p><p className="text-[9px] text-gray-500">Crotch to bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.inseam} onChange={e => setMeasurements({...measurements, inseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 76" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Outseam</p><p className="text-[9px] text-gray-500">Waist to outer bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.outseam} onChange={e => setMeasurements({...measurements, outseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 104" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Leg Opening</p><p className="text-[9px] text-gray-500">Bottom hem width</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.legOpening} onChange={e => setMeasurements({...measurements, legOpening: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" placeholder="e.g. 20" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-800/50">
                      <div className="flex items-start gap-2 mb-3 bg-[#0a0a0c] p-2.5 rounded-lg border border-gray-800">
                        <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-[10px] text-gray-400">All measurements should be of the actual garment laid flat.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer p-1">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" checked={measurementsConfirmed} onChange={(e) => setMeasurementsConfirmed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-[#0a0a0c] checked:bg-[#F5A623] checked:border-[#F5A623] transition cursor-pointer" />
                          <svg className="w-3 h-3 text-black absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="text-[11px] font-bold text-white select-none">I confirm these measurements are accurate.</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">Color <span className="text-gray-500 font-normal">(optional)</span></label>
                    <div className="flex gap-2">
                      <select value={itemColor} onChange={(e) => setItemColor(e.target.value)} className="flex-1 bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                        <option value="">Select color (optional)</option>
                        {colorOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <div className="w-12 h-[50px] bg-[#1a1a1d] border border-gray-800 rounded-xl flex items-center justify-center shrink-0">
                        {itemColor ? (
                          <div className="w-6 h-6 rounded-full border border-gray-600 shadow-inner" style={{backgroundColor: colorOptions.find(c => c.name === itemColor)?.hex}}></div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-[#0a0a0c]"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">Material <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input type="text" value={itemMaterial} onChange={(e) => setItemMaterial(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition" placeholder="e.g. Cotton, Denim, Twill" />
                  </div>
                </div>
                
                {/* 📸 4-SLOT IMAGE UPLOADER */}
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] text-white font-bold">Photos (Max 4)</label>
                    <span className="text-[10px] text-gray-500">{imageFiles.length}/4</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const file = imageFiles[idx];
                      const isMain = idx === 0;
                      return (
                        <div key={idx} className={`aspect-square rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center cursor-pointer transition ${file ? 'border border-gray-700 bg-gray-900' : isMain ? 'border-2 border-[#F5A623] border-dashed bg-[#F5A623]/5 hover:bg-[#F5A623]/10' : 'border border-gray-800 border-dashed bg-[#1a1a1d] hover:border-gray-600'}`}>
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={imageFiles.length >= 4} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                          {file ? (
                            <>
                              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                              {isMain && <span className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-black text-[8px] font-black uppercase py-0.5 z-20">Main Photo</span>}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center pointer-events-none">
                              <svg className={`w-5 h-5 mb-1 ${isMain ? 'text-[#F5A623]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                              <span className={`text-[8px] font-bold uppercase leading-tight ${isMain ? 'text-[#F5A623]' : 'text-gray-500'}`}>Add Photo{isMain && <br/>} {isMain && 'Main Photo'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Clear photos help buyers trust your listing
                    </p>
                    {imageFiles.length > 0 && <button type="button" onClick={() => setImageFiles([])} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Clear All</button>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white font-bold mb-1.5">Description</label>
                  <div className="relative">
                    <textarea rows={4} required maxLength={300} value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition resize-none pb-8" placeholder="Describe the item, its fit, style and any other details..."></textarea>
                    <span className="absolute right-4 bottom-3 text-[10px] text-gray-500 font-mono">{itemDesc.length}/300</span>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="sticky bottom-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-t border-gray-800">
              <button type="submit" form="create-product-form" disabled={isCreating || !measurementsConfirmed} className="w-full bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isCreating ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Publishing...</> : <>Publish Product</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 🛠️ EDIT PRODUCT MODAL (GOD TIER UI) --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center z-[70] p-0 md:p-4 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95">
          <div className="bg-[#0a0a0c] md:bg-[#121214] md:border border-gray-800 rounded-t-3xl md:rounded-3xl w-full max-w-md h-[95vh] md:h-[85vh] flex flex-col relative overflow-hidden">
            
            <div className="sticky top-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-[#F5A623]">✦</span> Edit Details</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Update your item specifics</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
              <form id="edit-product-form" onSubmit={handleUpdateItem} className="space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Item Title</label>
                    <div className="relative">
                      <input required type="text" maxLength={80} value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono">{itemName.length}/80</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Category</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]">
                        {itemCategory === 'Bottom' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13V6a2 2 0 00-2-2H5a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H5"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                      </div>
                      <select value={itemCategory} onChange={(e) => {setItemCategory(e.target.value); setMeasurementsConfirmed(false);}} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white pl-10 pr-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none cursor-pointer">
                        <option value="Top">Top</option>
                        <option value="Bottom">Bottom</option>
                      </select>
                      <svg className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white font-bold mb-1.5">Price (₹)</label>
                    <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition font-mono" />
                  </div>
                </div>

                {/* 📏 MEASUREMENTS MASTER SECTION (EDIT) */}
                <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-1 shadow-inner relative overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                      <h3 className="text-[11px] font-bold text-white tracking-widest uppercase">Measurements <span className="text-[#F5A623] ml-1">{itemCategory} Wear</span></h3>
                    </div>
                    <button type="button" onClick={() => setIsHowToMeasureOpen(true)} className="text-[10px] text-[#F5A623] flex items-center gap-1 hover:underline">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Guide
                    </button>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {itemCategory === 'Top' ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Chest</p><p className="text-[9px] text-gray-500">Pit to pit</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.chest} onChange={e => setMeasurements({...measurements, chest: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Length</p><p className="text-[9px] text-gray-500">Top to bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.length} onChange={e => setMeasurements({...measurements, length: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Shoulder</p><p className="text-[9px] text-gray-500">Seam to seam</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.shoulder} onChange={e => setMeasurements({...measurements, shoulder: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v10c0 2-2 3-4 3H8c-2 0-4-1-4-3V8z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Sleeve</p><p className="text-[9px] text-gray-500">Shoulder to cuff</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.sleeve} onChange={e => setMeasurements({...measurements, sleeve: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Waist</p><p className="text-[9px] text-gray-500">Waistband laid flat</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.waist} onChange={e => setMeasurements({...measurements, waist: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Hip</p><p className="text-[9px] text-gray-500">Widest part</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.hip} onChange={e => setMeasurements({...measurements, hip: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Rise</p><p className="text-[9px] text-gray-500">Crotch to waist</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.rise} onChange={e => setMeasurements({...measurements, rise: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Inseam</p><p className="text-[9px] text-gray-500">Crotch to bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.inseam} onChange={e => setMeasurements({...measurements, inseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Outseam</p><p className="text-[9px] text-gray-500">Waist to outer bottom</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.outseam} onChange={e => setMeasurements({...measurements, outseam: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-1/2">
                             <div className="w-8 h-8 opacity-60"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l1 16H6L7 4z"/></svg></div>
                             <div><p className="text-[11px] font-bold text-white">Leg Opening</p><p className="text-[9px] text-gray-500">Bottom hem width</p></div>
                          </div>
                          <div className="relative w-24">
                            <input required type="number" value={measurements.legOpening} onChange={e => setMeasurements({...measurements, legOpening: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg text-white text-center py-2 text-sm outline-none focus:border-[#F5A623] pr-6" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cm</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-800/50">
                      <label className="flex items-center gap-3 cursor-pointer p-1">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" checked={measurementsConfirmed} onChange={(e) => setMeasurementsConfirmed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-[#0a0a0c] checked:bg-[#F5A623] checked:border-[#F5A623] transition cursor-pointer" />
                          <svg className="w-3 h-3 text-black absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="text-[11px] font-bold text-white select-none">I confirm these measurements are accurate.</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">Color <span className="text-gray-500 font-normal">(optional)</span></label>
                    <div className="flex gap-2">
                      <select value={itemColor} onChange={(e) => setItemColor(e.target.value)} className="flex-1 bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                        <option value="">Select color (optional)</option>
                        {colorOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <div className="w-12 h-[50px] bg-[#1a1a1d] border border-gray-800 rounded-xl flex items-center justify-center shrink-0">
                        {itemColor ? (
                          <div className="w-6 h-6 rounded-full border border-gray-600 shadow-inner" style={{backgroundColor: colorOptions.find(c => c.name === itemColor)?.hex}}></div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-[#0a0a0c]"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white font-bold mb-1.5">Material <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input type="text" value={itemMaterial} onChange={(e) => setItemMaterial(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition" />
                  </div>
                </div>
                
                {/* 📸 4-SLOT IMAGE UPLOADER (EDIT) */}
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] text-white font-bold">Update Photos <span className="text-gray-500 font-normal lowercase">(Optional)</span></label>
                  </div>
                  
                  {existingImageUrls.length > 0 && imageFiles.length === 0 && (
                    <div className="mb-3 bg-[#1a1a1d] p-3 rounded-xl border border-gray-800">
                      <span className="text-[9px] text-gray-500 mb-2 block uppercase tracking-widest font-bold">Currently Live:</span>
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        {existingImageUrls.map((url, idx) => (
                           <img key={idx} src={url} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-700" alt="Current" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const file = imageFiles[idx];
                      const isMain = idx === 0;
                      return (
                        <div key={idx} className={`aspect-square rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center cursor-pointer transition ${file ? 'border border-gray-700 bg-gray-900' : isMain ? 'border-2 border-[#F5A623] border-dashed bg-[#F5A623]/5 hover:bg-[#F5A623]/10' : 'border border-gray-800 border-dashed bg-[#1a1a1d] hover:border-gray-600'}`}>
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={imageFiles.length >= 4} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                          {file ? (
                            <>
                              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                              {isMain && <span className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-black text-[8px] font-black uppercase py-0.5 z-20">Main</span>}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center pointer-events-none">
                              <svg className={`w-5 h-5 mb-1 ${isMain ? 'text-[#F5A623]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                              <span className={`text-[8px] font-bold uppercase leading-tight ${isMain ? 'text-[#F5A623]' : 'text-gray-500'}`}>Add Photo{isMain && <br/>} {isMain && 'Main Photo'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-500 flex items-center gap-1">Selecting new photos will replace the currently live ones.</p>
                    {imageFiles.length > 0 && <button type="button" onClick={() => setImageFiles([])} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Clear</button>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white font-bold mb-1.5">Description</label>
                  <div className="relative">
                    <textarea rows={4} required maxLength={300} value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3.5 text-sm outline-none focus:border-[#F5A623] transition resize-none pb-8"></textarea>
                    <span className="absolute right-4 bottom-3 text-[10px] text-gray-500 font-mono">{itemDesc.length}/300</span>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="sticky bottom-0 bg-[#0a0a0c] md:bg-[#121214] z-20 px-6 py-4 border-t border-gray-800">
              <button type="submit" form="edit-product-form" disabled={isUpdating || !measurementsConfirmed} className="w-full bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isUpdating ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> SAVING...</> : <>SAVE CHANGES</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 📏 HOW TO MEASURE MODAL --- */}
      {isHowToMeasureOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-in fade-in zoom-in-95">
          <div className="bg-[#121214] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col">
            <div className="bg-[#1a1a1d] px-6 py-4 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5A623]/10 text-[#F5A623] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg">How to Measure</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">All measurements are in centimeters (cm)</p>
                </div>
              </div>
              <button onClick={() => setIsHowToMeasureOpen(false)} className="w-8 h-8 bg-[#0a0a0c] rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-gray-800 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto hide-scrollbar space-y-8">
              <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-black text-sm tracking-widest uppercase mb-4 border-b border-gray-800/50 pb-3">Top Wear Guide</h3>
                <div className="space-y-4 text-xs text-gray-300">
                  <p><b>1. Chest:</b> Measure from one underarm seam to the other.</p>
                  <p><b>2. Length:</b> Measure from the highest point of the shoulder to the bottom hem.</p>
                  <p><b>3. Shoulder:</b> Measure from one shoulder seam to the other.</p>
                  <p><b>4. Sleeve Length:</b> Measure from shoulder seam to cuff.</p>
                </div>
              </div>
              <div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-black text-sm tracking-widest uppercase mb-4 border-b border-gray-800/50 pb-3">Bottom Wear Guide</h3>
                <div className="space-y-4 text-xs text-gray-300">
                  <p><b>1. Waist:</b> Measure straight across the top of the waistband laid flat.</p>
                  <p><b>2. Hip:</b> Measure across the widest part of the hip.</p>
                  <p><b>3. Rise:</b> Measure from the top of waistband to crotch seam.</p>
                  <p><b>4. Inseam:</b> Measure from crotch seam to bottom hem.</p>
                  <p><b>5. Outseam:</b> Measure from top of waistband to outer bottom.</p>
                  <p><b>6. Leg Opening:</b> Measure across the bottom hem width.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}