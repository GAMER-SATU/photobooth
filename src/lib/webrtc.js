/**
 * DUET Photobooth — WebRTC Configuration & Helpers
 */

export function getIceServers() {
  const customStun = process.env.NEXT_PUBLIC_STUN_SERVER;
  
  // Fast, verified, reliable global STUN servers across multiple providers
  const defaultStunUrls = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
    'stun:stun.cloudflare.com:3478',
    'stun:stun.nextcloud.com:3478',
    'stun:relay.metered.ca:80',
    'stun:stun.voip.blackberry.com:3478'
  ];

  if (customStun) {
    defaultStunUrls.unshift(customStun);
  }

  const iceServers = [
    {
      urls: defaultStunUrls
    }
  ];

  // Optional dedicated TURN server (e.g. from Metered, Twilio, Coturn)
  const turnUrl = process.env.NEXT_PUBLIC_TURN_SERVER;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    const customTurn = { urls: turnUrl };
    if (turnUsername) customTurn.username = turnUsername;
    if (turnCredential) customTurn.credential = turnCredential;
    iceServers.unshift(customTurn);
  }

  return iceServers;
}

export function createPeerConnection({
  onIceCandidate,
  onTrack,
  onConnectionStateChange,
  onIceConnectionStateChange
}) {
  const config = {
    iceServers: getIceServers(),
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  console.log('[DUET][WEBRTC] Creating RTCPeerConnection with config:', config);
  const pc = new RTCPeerConnection(config);

  if (onIceCandidate) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[DUET][SIGNAL] Generated local ICE candidate:', event.candidate.candidate);
        onIceCandidate(event.candidate);
      } else {
        console.log('[DUET][SIGNAL] All local ICE candidates gathered');
      }
    };
  }

  if (onTrack) {
    pc.ontrack = (event) => {
      console.log('[DUET][MEDIA] Received remote track:', event.track.kind, 'stream count:', event.streams.length);
      onTrack(event);
    };
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      console.log('[DUET][WEBRTC] Connection state changed:', pc.connectionState);
      onConnectionStateChange(pc.connectionState);
    };
  }

  if (onIceConnectionStateChange) {
    pc.oniceconnectionstatechange = () => {
      console.log('[DUET][WEBRTC] ICE connection state changed:', pc.iceConnectionState);
      onIceConnectionStateChange(pc.iceConnectionState);
    };
  }

  return pc;
}
