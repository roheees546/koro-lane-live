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
  const [itemSize, setItemSize] = useState("L"); // Added Size
  const [itemDesc, setItemDesc] = useState("");
  
  // 🔥 Arrays for Multiple Images
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  const [isUpdating, setIsUpdating] = useState(false);

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
    setItemName(""); setItemPrice(""); setItemCategory("Top"); setItemSize("L"); setItemDesc("");
    setImageFiles([]); setExistingImageUrls([]);
    setIsCreateModalOpen(true);
  };

  // 📝 OPEN EDIT MODAL & PRE-FILL DATA
  const openEditModal = (product: any) => {
    setEditingId(product.id);
    setItemName(product.title);
    setItemPrice(product.price.toString());
    setItemCategory(product.category || "Top");
    setItemSize(product.size || "L");
    setItemDesc(product.description || "");
    
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

  // 🚀 CREATE PRODUCT ENGINE
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const { error: insertError } = await supabase.from("products").insert([{
        dealer_id: userId,
        title: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory,
        size: itemSize,
        description: itemDesc,
        image_urls: uploadedUrls,
        image_url: uploadedUrls[0],
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

      const { error } = await supabase.from("products").update({
        title: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory,
        size: itemSize,
        description: itemDesc,
        image_urls: finalImageUrls,
        image_url: finalImageUrls[0] || null
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
                    {product.size && (
                      <span className="bg-gray-800/50 border border-gray-700 text-gray-400 text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">
                        Size: {product.size}
                      </span>
                    )}
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

      {/* --- ➕ CREATE PRODUCT MODAL (GOLD THEME) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-[#F5A623]/30 shadow-[0_0_30px_rgba(245,166,35,0.05)] rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="text-[#F5A623]">✦</span> Upload Article
            </h2>
            
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Item Title</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="e.g. Vintage Denim Jacket" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" placeholder="1299" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Size</label>
                  <select value={itemSize} onChange={(e) => setItemSize(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Item Photos (Max 4)</label>
                <div className="bg-[#1a1a1d] border border-gray-800 border-dashed rounded-xl p-5 text-center hover:border-[#F5A623]/50 transition cursor-pointer">
                  <input required type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) { setImageFiles(Array.from(e.target.files).slice(0, 4)); } }} className="hidden" id="create-image-upload" />
                  <label htmlFor="create-image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-[#F5A623]/10 text-[#F5A623] rounded-full flex items-center justify-center mb-2">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-xs font-bold text-white mb-0.5">Tap to upload images</span>
                    <span className="text-[9px] text-gray-500">{imageFiles.length} files selected</span>
                  </label>
                </div>
                
                {imageFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="aspect-square bg-[#1a1a1d] rounded-lg border border-[#F5A623]/30 overflow-hidden flex items-center justify-center text-[8px] text-center p-1 text-[#F5A623] font-bold">
                        {file.name.substring(0, 10)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition resize-none" placeholder="Condition, fit, defects (if any)..."></textarea>
              </div>
              
              <button type="submit" disabled={isCreating} className="w-full mt-2 bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isCreating ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Uploading...</>
                ) : "Publish Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- 🛠️ EDIT PRODUCT MODAL (GOLD THEME) --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-[#F5A623]/30 shadow-[0_0_30px_rgba(245,166,35,0.05)] rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Edit Details
            </h2>
            
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Item Title</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Size</label>
                  <select value={itemSize} onChange={(e) => setItemSize(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition appearance-none">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
                  Update Photos 
                  <span className="text-gray-500 font-normal lowercase">(Optional)</span>
                </label>
                
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
                
                <div className="bg-[#1a1a1d] border border-gray-800 border-dashed rounded-xl p-4 text-center hover:border-[#F5A623]/50 transition cursor-pointer">
                  <input type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) { setImageFiles(Array.from(e.target.files).slice(0, 4)); } }} className="hidden" id="edit-image-upload" />
                  <label htmlFor="edit-image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-300 mb-0.5">Select new images to replace old ones</span>
                    <span className="text-[9px] text-[#F5A623]">{imageFiles.length > 0 ? `${imageFiles.length} new files selected` : "Tap to browse"}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl text-white px-4 py-3 text-sm outline-none focus:border-[#F5A623] transition resize-none"></textarea>
              </div>
              
              <button type="submit" disabled={isUpdating} className="w-full mt-2 bg-[#F5A623] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {isUpdating ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> SAVING...</>
                ) : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }`}} />
    </div>
  );
}