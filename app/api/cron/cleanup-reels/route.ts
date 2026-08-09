import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Calculate time for 48 hours (2 days) ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 2. Find all reels older than 48 hours
    const { data: expiredReels, error: fetchError } = await supabase
      .from('reels')
      .select('id, video_url')
      .lt('created_at', fortyEightHoursAgo);

    if (fetchError) throw fetchError;

    if (!expiredReels || expiredReels.length === 0) {
      return NextResponse.json({ message: 'No expired reels found. Storage is clean!' }, { status: 200 });
    }

    // 3. Extract file paths to delete from Storage (Using 'reels_videos' bucket)
    const filePathsToDelete = expiredReels.map(reel => {
      const urlParts = reel.video_url.split('/public/reels_videos/'); 
      return urlParts.length > 1 ? urlParts[1] : null;
    }).filter(path => path !== null) as string[];

    // 4. Delete videos from Storage bucket
    if (filePathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage.from('reels_videos').remove(filePathsToDelete);
      if (storageError) console.error("Storage Deletion Error:", storageError);
    }

    // 5. Delete rows from the Database
    const expiredIds = expiredReels.map(reel => reel.id);
    const { error: dbDeleteError } = await supabase
      .from('reels')
      .delete()
      .in('id', expiredIds);

    if (dbDeleteError) throw dbDeleteError;

    return NextResponse.json({ 
      message: `Successfully deleted ${expiredReels.length} expired reels! 🧹`,
      deleted_ids: expiredIds 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}