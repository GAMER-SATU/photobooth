/**
 * DUET Photobooth — Per-Tab Participant Identifier
 *
 * Guarantees that every browser tab has its own distinct participant ID.
 * Uses in-memory window caching to ensure that even if a tab is duplicated
 * or opened via a link in the exact same browser window/profile, Tab 1 and
 * Tab 2 will NEVER share the same participant ID (which would break presence & WebRTC).
 */

export function getTabParticipantId() {
  if (typeof window === 'undefined') {
    return 'server_' + Math.random().toString(36).substring(2, 9);
  }

  if (!window.__DUET_PARTICIPANT_ID__) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      window.__DUET_PARTICIPANT_ID__ = 'p_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    } else {
      window.__DUET_PARTICIPANT_ID__ = 'p_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }
  }

  return window.__DUET_PARTICIPANT_ID__;
}
