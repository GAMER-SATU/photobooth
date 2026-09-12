import { supabase } from './storage';

/**
 * Generates a clean, readable 6-character room code (e.g. "AB12XY").
 * Excludes easily confusable characters (0, O, 1, I).
 */
export function generateRoomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Creates a room record in Supabase DB if table exists.
 * Does not duplicate room records when reloaded.
 */
export async function createRoomRecord(roomCode, hostParticipantId) {
  const code = (roomCode || '').trim().toUpperCase();
  console.log('[DUET][ROOM] createRoomRecord requested for room:', code, 'host:', hostParticipantId);

  if (!supabase) {
    console.warn('[DUET][ROOM] Supabase client unavailable, skipping DB persistence');
    return { success: true, roomCode: code, hostParticipantId, localOnly: true };
  }

  try {
    // Check if room already exists
    const { data: existing, error: selectErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', code)
      .maybeSingle();

    if (existing) {
      console.log('[DUET][ROOM] Room record already exists in Supabase:', existing);
      return { success: true, room: existing, roomCode: code, isExisting: true };
    }

    // Insert new room
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: inserted, error: insertErr } = await supabase
      .from('rooms')
      .insert([
        {
          room_code: code,
          host_participant_id: hostParticipantId,
          status: 'active',
          expires_at: expiresAt
        }
      ])
      .select()
      .maybeSingle();

    if (insertErr) {
      console.warn('[DUET][ROOM] Supabase insert error (falling back gracefully to Realtime channel):', insertErr.message || insertErr);
      return { success: true, roomCode: code, hostParticipantId, fallback: true };
    }

    console.log('[DUET][ROOM] Room record created in Supabase:', inserted);
    return { success: true, room: inserted, roomCode: code };
  } catch (err) {
    console.warn('[DUET][ROOM] Room record operation exception (falling back to Realtime):', err);
    return { success: true, roomCode: code, hostParticipantId, fallback: true };
  }
}

/**
 * Verifies room existence in Supabase DB.
 */
export async function verifyRoomRecord(roomCode) {
  const code = (roomCode || '').trim().toUpperCase();
  if (!code) return { valid: false, error: 'Empty room code' };

  if (!supabase) {
    return { valid: true, roomCode: code, localOnly: true };
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', code)
      .maybeSingle();

    if (error) {
      // If table doesn't exist (PGRST205) or permissions, permit room so Realtime presence governs
      console.warn('[DUET][ROOM] Room verification query error, allowing Realtime fallback:', error.message || error);
      return { valid: true, roomCode: code, fallback: true };
    }

    if (!data) {
      // Room wasn't in DB; allow joining Realtime channel directly (URL room ID is source of truth)
      console.log('[DUET][ROOM] Room record not in DB table, allowing route roomId as source of truth');
      return { valid: true, roomCode: code, notInDb: true };
    }

    const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
    if (isExpired) {
      return { valid: false, error: 'Room expired', room: data };
    }

    return { valid: true, room: data, roomCode: code };
  } catch (e) {
    console.warn('[DUET][ROOM] Exception verifying room:', e);
    return { valid: true, roomCode: code, fallback: true };
  }
}
