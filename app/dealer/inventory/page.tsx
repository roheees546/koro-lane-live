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
  
  // 🔥 UPDATED: Arrays for Multiple Images
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
    setItemName("");
    setItemPrice("");
    setItemCategory("Top");
    setItemDesc("");
    setImageFiles([]); // Reset array
    setExistingImageUrls([]); // Reset array
    setIsCreateModalOpen(true);
  };

  // 📝 OPEN EDIT MODAL & PRE-FILL DATA
  const openEditModal = (product: any) => {
    setEditingId(product.id);
    setItemName(product.title);
    setItemPrice(product.price.toString());
    setItemCategory(product.category || "Top");
    setItemDesc(product.description || "");
    
    // Handle both old single image and new array of images gracefully
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

  // 🚀 CREATE PRODUCT ENGINE (NOW WITH MULTIPLE UPLOADS)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      alert("Bawa, please select at least one photo!");
      return;
    }
    
    setIsCreating(true);
    let uploadedUrls: string[] = [];

    try {
      // 1. Loop through and Upload Multiple Photos
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-create-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product_images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('product_images')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // 2. Insert into Database (using image_urls array)
      const { error: insertError } = await supabase
        .from("products")
        .insert([{
          dealer_id: userId,
          title: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          description: itemDesc,
          image_urls: uploadedUrls, // Save as array
          image_url: uploadedUrls[0], // Fallback for older code
          is_sold: false
        }]);

      if (insertError) throw insertError;

      setIsCreateModalOpen(false);
      fetchInventory(); 
      alert("New Article Live with multiple photos! 🚀📸");
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
      // If new images are selected, upload them and REPLACE the old ones
      if (imageFiles.length > 0 && userId) {
        finalImageUrls = []; // Clear old images
        
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-update-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('product_images')
              .getPublicUrl(fileName);
            finalImageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      const { error } = await supabase
        .from("products")
        .update({
          title: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          description: itemDesc,
          image_urls: finalImageUrls, // Save as array
          image_url: finalImageUrls[0] || null // Fallback
        })
        .eq("id", editingId);

      if (!error) {
        setIsEditModalOpen(false);
        fetchInventory(); 
      } else {
        throw error;
      }
    } catch (error: any) {
      alert("Error updating item: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#00e599]">Loading Inventory...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER */}
      <header className="px-5 py-6 flex justify-between items-center border-b border-gray-900 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <h1 className="text-xl font-bold text-[#00e599]">My Inventory</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#111114] border border-gray-800 px-3 py-1.5 rounded-full font-bold">{products.length} Items</span>
          
          {/* UPLOAD HEADER BUTTON */}
          {products.length > 0 && (
            <button onClick={openCreateModal} className="bg-[#00e599] text-black w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,229,153,0.3)] hover:scale-105 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          )}
        </div>
      </header>

      {/* INVENTORY LIST */}
      <main className="px-5 py-6 space-y-4">
        {products.length === 0 ? (
           <div className="bg-[#0a0a0c] border border-dashed border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-10">
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">No items in your inventory.</p>
             <button 
               onClick={openCreateModal} 
               className="text-[#00e599] text-[10px] font-black uppercase tracking-widest hover:text-black transition hover:bg-[#00e599] bg-[#003320]/30 px-6 py-3 rounded-xl border border-[#00e599]/30 flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,153,0.1)]"
             >
               Upload New Article <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             </button>
           </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-[#0a0a0c] border border-gray-900 rounded-xl p-3 flex gap-4 relative">
              <div className="w-24 h-32 bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-800 relative">
                {product.is_sold && (
                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-red-500 text-[8px] font-black uppercase bg-red-500/20 px-2 py-1 rounded rotate-12 border border-red-500/50">Sold</span>
                   </div>
                )}
                {/* Visual indicator for multiple images in inventory list */}
                {(product.image_urls && product.image_urls.length > 1) && (
                   <div className="absolute top-1 right-1 bg-black/70 text-[8px] px-1.5 py-0.5 rounded text-white font-bold backdrop-blur-sm z-10 border border-gray-700">
                     +{product.image_urls.length - 1}
                   </div>
                )}
                <img src={product.image_urls?.[0] || product.image_url || "https://placehold.co/100x120/121214/00e599?text=SURPLUS"} alt={product.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                  <span className="inline-block border border-[#00e599] text-[#00e599] text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2">
                    {product.category || "TOP"}
                  </span>
                  <h3 className="font-bold text-sm uppercase truncate mb-1 pr-4">{product.title}</h3>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{product.description || "No description provided."}</p>
                </div>
                <p className="font-black text-lg mt-2">₹{product.price}</p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="absolute right-3 bottom-3 flex gap-2">
                <button 
                  onClick={() => openEditModal(product)} 
                  className="border border-gray-700 hover:border-[#00e599] hover:text-[#00e599] text-gray-400 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition flex items-center gap-1 bg-[#121214]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(product.id)} 
                  className="border border-red-900 hover:border-red-500 text-red-500 hover:bg-red-500/10 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition flex items-center gap-1 bg-[#121214]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

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
        <Link href="/dealer/inventory" className="flex flex-col items-center gap-1 cursor-pointer">
          <svg className="w-6 h-6 text-[#00e599]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm0 2v10h14V10H5zm4 3h6v2H9v-2z" /></svg>
          <span className="text-[10px] text-[#00e599] mb-3">Inventory</span>
        </Link>
        <Link href="/dealer/profile" className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] text-gray-500 mb-3">Profile</span>
        </Link>
      </div>

      {/* --- ➕ CREATE PRODUCT MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-bold text-white uppercase mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
              <span className="text-[#00e599]">+</span> Upload New Article
            </h2>
            
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Item Name *</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Price (₹) *</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Category *</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                  </select>
                </div>
              </div>

              {/* MULTIPLE IMAGE UPLOAD SECTION */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1 flex justify-between">
                  <span>Upload Photos *</span>
                  <span className="text-[#00e599] font-bold">{imageFiles.length} Selected</span>
                </label>
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  multiple // 🔥 This allows selecting multiple photos!
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#111114] file:text-white hover:file:text-[#00e599] cursor-pointer border border-gray-800 rounded-lg p-2 bg-[#09090b] transition" 
                />
                <p className="text-[8px] text-gray-500 mt-1 italic">Tip: You can select multiple images at once from your gallery.</p>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Description *</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none transition" placeholder="Condition, size, etc."></textarea>
              </div>
              
              <button type="submit" disabled={isCreating} className="w-full mt-4 bg-[#00e599] hover:bg-[#00c985] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition flex justify-center items-center gap-2">
                {isCreating ? "UPLOADING PHOTOS..." : "PUBLISH ARTICLE"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- 🛠️ EDIT PRODUCT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-sm font-bold text-white uppercase mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Edit Item Details
            </h2>
            
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Item Name</label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Price (₹)</label>
                  <input required type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] transition">
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                  </select>
                </div>
              </div>

              {/* IMAGE UPLOAD SECTION */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-2">Update Photos (Optional)</label>
                
                {existingImageUrls.length > 0 && imageFiles.length === 0 && (
                  <div className="mb-2 bg-[#0a0a0c] p-2 rounded border border-gray-800">
                    <span className="text-[10px] text-gray-500 mb-1 block">Current Active Images:</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                      {existingImageUrls.map((url, idx) => (
                         <img key={idx} src={url} className="w-8 h-10 object-cover rounded shrink-0 border border-gray-700" alt="Current" />
                      ))}
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  multiple // 🔥 Allows replacing with multiple new photos
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#111114] file:text-white hover:file:text-[#00e599] cursor-pointer border border-gray-800 rounded-lg p-2 bg-[#09090b] transition" 
                />
                <p className="text-[8px] text-gray-500 mt-1 italic">Note: Uploading new photos will replace all current photos.</p>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">Description</label>
                <textarea rows={3} required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-[#09090b] border border-gray-800 rounded-lg text-white px-3 py-2 text-sm outline-none focus:border-[#00e599] resize-none transition"></textarea>
              </div>
              
              <button type="submit" disabled={isUpdating} className="w-full mt-4 bg-[#00e599] hover:bg-[#00c985] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition flex justify-center items-center gap-2">
                {isUpdating ? "SAVING CHANGES..." : "UPDATE PRODUCT"}
              </button>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}