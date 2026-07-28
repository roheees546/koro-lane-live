"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductEngagement({ productId, sellerId }: { productId: string; sellerId?: string }) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<{ [key: string]: any }>({});
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchEngagementData();
  }, [productId]);

  const fetchEngagementData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUser(session.user);
      
      const { data: likeData } = await supabase
        .from("product_likes")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", session.user.id)
        .single();
      
      if (likeData) setHasLiked(true);
    }

    const { count } = await supabase
      .from("product_likes")
      .select("*", { count: 'exact', head: true })
      .eq("product_id", productId);
    setLikesCount(count || 0);

    // Fetch comments
    const { data: commentsData } = await supabase
      .from("product_comments")
      .select("id, content, created_at, user_id")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (commentsData && commentsData.length > 0) {
      setComments(commentsData);

      // Extract unique user IDs to fetch their real profiles safely
      const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, store_name, full_name, avatar_url")
        .in("id", userIds);

      if (profilesData) {
        const map: { [key: string]: any } = {};
        profilesData.forEach(p => {
          map[p.id] = p;
        });
        setProfilesMap(map);
      }
    } else {
      setComments([]);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      alert("Bawa, please login to like this item!");
      return;
    }

    if (hasLiked) {
      setHasLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      await supabase.from("product_likes").delete().eq("product_id", productId).eq("user_id", currentUser.id);
    } else {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
      await supabase.from("product_likes").insert([{ product_id: productId, user_id: currentUser.id }]);

      // Send notification to seller safely
      if (sellerId && sellerId !== currentUser.id) {
        try {
          await supabase.from("notifications").insert([{
            user_id: sellerId,
            title: "New Product Like ❤️",
            message: `Someone liked your product!`,
            is_read: false
          }]);
        } catch (err) {
          // Ignore if notifications table doesn't exist
        }
      }
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Bawa, please login to drop a comment!");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const commentText = newComment.trim();
    const { error } = await supabase.from("product_comments").insert([
      { product_id: productId, user_id: currentUser.id, content: commentText }
    ]);

    if (!error) {
      setNewComment("");
      
      // Send notification to seller safely
      if (sellerId && sellerId !== currentUser.id) {
        try {
          await supabase.from("notifications").insert([{
            user_id: sellerId,
            title: "New Community Comment 💬",
            message: `Someone commented on your product: "${commentText.substring(0, 30)}..."`,
            is_read: false
          }]);
        } catch (err) {
          // Ignore if notifications table doesn't exist
        }
      }

      fetchEngagementData();
    } else {
      alert("Error posting comment: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("product_comments").delete().eq("id", commentId);
    if (!error) {
      fetchEngagementData();
    } else {
      alert("Error deleting comment: " + error.message);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-8 mb-6 border-t border-gray-800 pt-6">
      {/* LIKE BUTTON SECTION */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handleLikeToggle} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${hasLiked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-[#121214] border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'}`}
        >
          <svg className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
          <span className="font-bold text-sm">{likesCount} Likes</span>
        </button>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          {likesCount > 5 ? '🔥 High Demand' : 'Tap to Hype'}
        </p>
      </div>

      {/* COMMENTS SECTION */}
      <div className="space-y-5">
        <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          Community Discussion ({comments.length})
        </h3>

        {/* Comment Input */}
        <form onSubmit={submitComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 shrink-0 overflow-hidden border border-gray-700">
            {currentUser ? (
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-full h-full text-gray-500 p-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUser ? "Ask about fit, condition..." : "Login to drop a comment"}
              disabled={!currentUser || isSubmitting}
              className="w-full bg-[#121214] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00e599] transition pr-12 disabled:opacity-50"
            />
            <button type="submit" disabled={!currentUser || isSubmitting || !newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00e599] disabled:text-gray-600 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-4 pt-2">
          {comments.map((comment) => {
            const profile = profilesMap[comment.user_id];
            const displayName = profile?.store_name || profile?.full_name || `Collector #${comment.user_id.slice(0, 4)}`;
            const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`;
            const isOwner = currentUser && currentUser.id === comment.user_id;

            return (
              <div key={comment.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gray-900 shrink-0 overflow-hidden border border-gray-800">
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <div className="flex-1 bg-[#121214] border border-gray-800/60 rounded-tr-xl rounded-b-xl p-3 relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white uppercase tracking-tight">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 font-medium">{formatTime(comment.created_at)}</span>
                      {isOwner && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-400 text-xs font-bold transition px-1"
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest py-4">No comments yet. Be the first to hype this!</p>
          )}
        </div>
      </div>
    </div>
  );
}