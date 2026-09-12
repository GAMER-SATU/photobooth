import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Uploads a photo strip image blob and saves metadata to Supabase DB or LocalStorage fallback.
 */
export async function uploadAndSavePhotoStrip({ blob, roomCode, filterName, captionsSummary }) {
  const stripId = 'strip_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const fileName = `${roomCode}/${stripId}.png`;

  let publicUrl = null;
  let isCloudStored = false;

  // Try Supabase Storage if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('photostrips')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('photostrips')
          .getPublicUrl(fileName);

        if (urlData && urlData.publicUrl) {
          publicUrl = urlData.publicUrl;
          isCloudStored = true;

          // Insert record in Supabase DB table `photostrips`
          await supabase.from('photostrips').insert([
            {
              id: stripId,
              room_code: roomCode,
              image_url: publicUrl,
              captions: captionsSummary || '',
              filter_used: filterName || 'ORIGINAL',
              created_at: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (e) {
      console.warn('[STORAGE] Supabase upload failed, falling back to local memory:', e);
    }
  }

  // Fallback: Store locally in browser storage / Data URL
  if (!publicUrl) {
    const reader = new FileReader();
    publicUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    try {
      const localStrips = JSON.parse(localStorage.getItem('duet_saved_strips') || '{}');
      localStrips[stripId] = {
        id: stripId,
        roomCode,
        imageUrl: publicUrl,
        captions: captionsSummary,
        filterName,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('duet_saved_strips', JSON.stringify(localStrips));
    } catch (e) {
      console.warn('[STORAGE] LocalStorage fallback write error:', e);
    }
  }

  const shareableLink = `${window.location.origin}${window.location.pathname}?strip=${stripId}`;

  return {
    id: stripId,
    imageUrl: publicUrl,
    shareableLink,
    isCloudStored
  };
}

/**
 * Retrieves a saved photo strip by ID from Supabase DB or LocalStorage fallback.
 */
export async function getPhotoStripById(stripId) {
  if (!stripId) return null;

  // 1. Try Supabase DB
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('photostrips')
        .select('*')
        .eq('id', stripId)
        .single();

      if (data && !error) {
        return {
          id: data.id,
          roomCode: data.room_code,
          imageUrl: data.image_url,
          captions: data.captions,
          filterName: data.filter_used,
          createdAt: data.created_at,
          isCloudStored: true
        };
      }
    } catch (e) {
      console.warn('[STORAGE] Error fetching strip from Supabase:', e);
    }
  }

  // 2. Try LocalStorage fallback
  try {
    const localStrips = JSON.parse(localStorage.getItem('duet_saved_strips') || '{}');
    if (localStrips[stripId]) {
      return { ...localStrips[stripId], isCloudStored: false };
    }
  } catch (e) {}

  return null;
}
