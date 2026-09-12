/**
 * DUET Photobooth — Per-Tab Participant Identifier
 *
 * Guarantees that every browser tab has its own distinct participant ID
 * stored in sessionStorage. This allows testing two participants in separate
 * tabs within the exact same browser window/profile.
 */

export function getTabParticipantId() {
  if (typeof window === 'undefined') {
    return 'server_' + Math.random().toString(36).substring(2, 9);
  }

  const STORAGE_KEY = 'duet_participant_id';
  let participantId = sessionStorage.getItem(STORAGE_KEY);

  if (!participantId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      participantId = crypto.randomUUID();
    } else {
      participantId = 'duet_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    }
    sessionStorage.setItem(STORAGE_KEY, participantId);
  }

  return participantId;
}
