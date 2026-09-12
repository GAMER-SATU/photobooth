/**
 * DUET Photobooth — WebRTC Configuration & Helpers
 */

export function getIceServers() {
  const stunUrl = process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302';
  const iceServers = [
    { urls: [stunUrl, 'stun:stun1.l.google.com:19302'] }
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_SERVER;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    const turnConfig = { urls: turnUrl };
    if (turnUsername) turnConfig.username = turnUsername;
    if (turnCredential) turnConfig.credential = turnCredential;
    iceServers.push(turnConfig);
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
    iceCandidatePoolSize: 2
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
