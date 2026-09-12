'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/storage';
import { getTabParticipantId } from '@/lib/participant';
import { createPeerConnection } from '@/lib/webrtc';
import { createRoomRecord, verifyRoomRecord } from '@/lib/rooms';
import { Snd } from '@/lib/audio';

export const ROOM_STATES = {
  WAITING_FOR_PARTNER: 'WAITING_FOR_PARTNER',
  PARTNER_CONNECTED: 'PARTNER_CONNECTED',
  CAMERA_PERMISSION: 'CAMERA_PERMISSION',
  READY: 'READY',
  COUNTDOWN: 'COUNTDOWN',
  CAPTURE: 'CAPTURE',
  CAPTION_EDIT: 'CAPTION_EDIT',
  PHOTO_REVIEW: 'PHOTO_REVIEW',
  PRINTING: 'PRINTING',
  MEMORY_READY: 'MEMORY_READY',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
  ROOM_FULL: 'ROOM_FULL',
};

export function useDuetRoom({
  roomId,
  initialAct = 2,
  onCaptureFrame,
  curFilter,
  setCurFilter,
  studio,
  setStudioState,
  photos,
  setPhotos,
  film,
  setFilm,
  triggerToast
}) {
  const normalizedRoomId = (roomId || '').trim().toUpperCase();
  const participantId = useRef(getTabParticipantId()).current;

  // Primary deterministic state
  const [roomState, setRoomState] = useState(ROOM_STATES.WAITING_FOR_PARTNER);
  const [isHost, setIsHost] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [remoteStream, setRemoteStream] = useState(null);
  const [countdownNum, setCountdownNum] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Local media refs
  const localStreamRef = useRef(null);
  const [youMode, setYouMode] = useState('init'); // 'init' | 'live' | 'lost'

  // WebRTC & Supabase Realtime refs
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const hasNegotiatedRef = useRef(false);
  const partnerLeftTimerRef = useRef(null);

  // Keep latest callbacks in refs to avoid stale closures in listeners
  const onCaptureFrameRef = useRef(onCaptureFrame);
  onCaptureFrameRef.current = onCaptureFrame;

  const triggerToastRef = useRef(triggerToast);
  triggerToastRef.current = triggerToast;

  // Structured logging helpers
  const logRoom = useCallback((...args) => console.log(`[DUET][ROOM][${normalizedRoomId}]`, ...args), [normalizedRoomId]);
  const logPresence = useCallback((...args) => console.log(`[DUET][PRESENCE][${normalizedRoomId}]`, ...args), [normalizedRoomId]);
  const logSignal = useCallback((...args) => console.log(`[DUET][SIGNAL][${normalizedRoomId}]`, ...args), [normalizedRoomId]);
  const logWebRTC = useCallback((...args) => console.log(`[DUET][WEBRTC][${normalizedRoomId}]`, ...args), [normalizedRoomId]);
  const logMedia = useCallback((...args) => console.log(`[DUET][MEDIA][${normalizedRoomId}]`, ...args), [normalizedRoomId]);

  // Safe channel broadcast sender
  const broadcastMessage = useCallback(async (event, payload) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          from: participantId,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      console.warn('[DUET][SIGNAL] Broadcast error:', e);
    }
  }, [participantId]);

  // Media acquisition helper
  const startCamera = useCallback(async (userInitiated = false) => {
    logMedia('Requesting camera & mic...');
    if (localStreamRef.current && localStreamRef.current.active) {
      logMedia('Local stream already active');
      setYouMode('live');
      return localStreamRef.current;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setYouMode('lost');
      setRoomState(ROOM_STATES.ERROR);
      if (userInitiated) triggerToastRef.current('Camera API not available in this browser');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      logMedia('Camera & mic permission granted, tracks:', stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      setYouMode('live');

      // If we are currently in CAMERA_PERMISSION or WAITING_FOR_PARTNER, update state
      setRoomState(prev => {
        if (prev === ROOM_STATES.CAMERA_PERMISSION) {
          return partnerId ? ROOM_STATES.PARTNER_CONNECTED : ROOM_STATES.WAITING_FOR_PARTNER;
        }
        return prev;
      });

      if (userInitiated) triggerToastRef.current('Camera on — welcome in ✶');

      // Add or replace tracks in existing RTCPeerConnection if available
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            logWebRTC('Replacing track in existing sender:', track.kind);
            sender.replaceTrack(track);
          } else {
            logWebRTC('Adding track to RTCPeerConnection:', track.kind);
            pcRef.current.addTrack(track, stream);
          }
        });
      }

      return stream;
    } catch (err) {
      console.warn('[DUET][MEDIA] Camera acquisition error:', err);
      setYouMode('lost');
      setRoomState(ROOM_STATES.CAMERA_PERMISSION);
      if (userInitiated) triggerToastRef.current('Camera permission denied — check your browser settings');
      return null;
    }
  }, [logMedia, logWebRTC, partnerId]);

  // Synchronized countdown runner
  const runSynchronizedCountdown = useCallback(async (photoIdx, targetTime) => {
    logRoom('Starting synchronized countdown for photo index:', photoIdx, 'targetTime:', targetTime);
    setRoomState(ROOM_STATES.COUNTDOWN);
    setIsCapturing(true);

    const checkInterval = 25;
    let played3 = false;
    let played2 = false;
    let played1 = false;

    await new Promise(resolve => {
      const timer = setInterval(() => {
        const remaining = targetTime - Date.now();

        if (remaining <= 3000 && !played3) {
          played3 = true;
          setCountdownNum(3);
          Snd.beep(640, .05, .09);
        }
        if (remaining <= 2000 && !played2) {
          played2 = true;
          setCountdownNum(2);
          Snd.beep(640, .05, .09);
        }
        if (remaining <= 1000 && !played1) {
          played1 = true;
          setCountdownNum(1);
          Snd.beep(640, .05, .09);
        }

        if (remaining <= 0) {
          clearInterval(timer);
          setCountdownNum(null);
          resolve();
        }
      }, checkInterval);
    });

    // Moment of capture
    logRoom('FLASH & CAPTURE triggered at target timestamp');
    setRoomState(ROOM_STATES.CAPTURE);
    Snd.click();

    if (onCaptureFrameRef.current) {
      const ph = onCaptureFrameRef.current();
      if (ph) {
        setPhotos(prev => [...prev, ph]);
        setFilm(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setRoomState(ROOM_STATES.PHOTO_REVIEW);
          } else {
            setRoomState(ROOM_STATES.CAPTION_EDIT);
          }
          return next;
        });
      }
    }

    setIsCapturing(false);

    if (photoIdx === 0) triggerToastRef.current('tap your print anytime to write on it ✶');
    if (photoIdx === 2) triggerToastRef.current('three shots taken — tap any print to make it yours');
  }, [logRoom, setPhotos, setFilm]);

  // Cleanup RTCPeerConnection safely
  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      logWebRTC('Closing existing RTCPeerConnection');
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
      } catch (e) {
        console.warn('[DUET][WEBRTC] Error closing PC:', e);
      }
      pcRef.current = null;
    }
    hasNegotiatedRef.current = false;
    pendingIceCandidatesRef.current = [];
    setRemoteStream(null);
  }, [logWebRTC]);

  // Drain queued remote ICE candidates
  const drainIceCandidates = useCallback(async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    const queued = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        logSignal('Adding queued remote ICE candidate');
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[DUET][SIGNAL] Error adding queued ICE candidate:', e);
      }
    }
  }, [logSignal]);

  // Initialize WebRTC as Host (Offerer)
  const initiateCallAsHost = useCallback(async (targetPartnerId) => {
    logWebRTC('Initiating WebRTC offer as HOST to guest:', targetPartnerId);
    closePeerConnection();

    // Ensure camera is active
    let stream = localStreamRef.current;
    if (!stream || !stream.active) {
      stream = await startCamera(false);
    }

    const pc = createPeerConnection({
      onIceCandidate: (candidate) => {
        broadcastMessage('signal_ice', {
          to: targetPartnerId,
          candidate: candidate.toJSON ? candidate.toJSON() : candidate
        });
      },
      onTrack: (evt) => {
        logMedia('Remote track received by host:', evt.streams[0]?.id);
        if (evt.streams && evt.streams[0]) {
          setRemoteStream(evt.streams[0]);
          setRoomState(ROOM_STATES.READY);
        }
      },
      onConnectionStateChange: (state) => {
        logWebRTC('Host connection state:', state);
        if (state === 'connected') {
          setRoomState(ROOM_STATES.READY);
        } else if (state === 'disconnected' || state === 'failed') {
          setRoomState(ROOM_STATES.RECONNECTING);
        }
      },
      onIceConnectionStateChange: (state) => {
        logWebRTC('Host ICE state:', state);
        if (state === 'failed') {
          logWebRTC('Attempting ICE restart...');
          // Trigger renegotiation if needed
        }
      }
    });

    pcRef.current = pc;

    if (stream) {
      stream.getTracks().forEach(track => {
        logWebRTC('Host adding local track to PC:', track.kind);
        pc.addTrack(track, stream);
      });
    }

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      logSignal('Host created offer, broadcasting to guest:', targetPartnerId);
      hasNegotiatedRef.current = true;

      broadcastMessage('signal_offer', {
        to: targetPartnerId,
        sdp: { type: offer.type, sdp: offer.sdp }
      });
    } catch (e) {
      console.warn('[DUET][WEBRTC] Host createOffer error:', e);
    }
  }, [broadcastMessage, closePeerConnection, logMedia, logSignal, logWebRTC, startCamera]);

  // Answer WebRTC Offer as Guest
  const handleRemoteOfferAsGuest = useCallback(async (offer, senderId) => {
    logWebRTC('Guest handling remote offer from host:', senderId);
    closePeerConnection();

    let stream = localStreamRef.current;
    if (!stream || !stream.active) {
      stream = await startCamera(false);
    }

    const pc = createPeerConnection({
      onIceCandidate: (candidate) => {
        broadcastMessage('signal_ice', {
          to: senderId,
          candidate: candidate.toJSON ? candidate.toJSON() : candidate
        });
      },
      onTrack: (evt) => {
        logMedia('Remote track received by guest:', evt.streams[0]?.id);
        if (evt.streams && evt.streams[0]) {
          setRemoteStream(evt.streams[0]);
          setRoomState(ROOM_STATES.READY);
        }
      },
      onConnectionStateChange: (state) => {
        logWebRTC('Guest connection state:', state);
        if (state === 'connected') {
          setRoomState(ROOM_STATES.READY);
        } else if (state === 'disconnected' || state === 'failed') {
          setRoomState(ROOM_STATES.RECONNECTING);
        }
      }
    });

    pcRef.current = pc;

    if (stream) {
      stream.getTracks().forEach(track => {
        logWebRTC('Guest adding local track to PC:', track.kind);
        pc.addTrack(track, stream);
      });
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      logWebRTC('Guest setRemoteDescription(offer) succeeded');
      await drainIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      logSignal('Guest created answer, broadcasting to host:', senderId);
      hasNegotiatedRef.current = true;

      broadcastMessage('signal_answer', {
        to: senderId,
        sdp: { type: answer.type, sdp: answer.sdp }
      });
    } catch (e) {
      console.warn('[DUET][WEBRTC] Guest answer error:', e);
    }
  }, [broadcastMessage, closePeerConnection, drainIceCandidates, logMedia, logSignal, logWebRTC, startCamera]);

  // Handle Answer on Host
  const handleRemoteAnswerOnHost = useCallback(async (answer, senderId) => {
    logWebRTC('Host received remote answer from guest:', senderId);
    if (!pcRef.current) {
      console.warn('[DUET][WEBRTC] Received answer without active RTCPeerConnection');
      return;
    }

    try {
      if (pcRef.current.signalingState === 'have-local-offer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        logWebRTC('Host setRemoteDescription(answer) succeeded');
        await drainIceCandidates();
      } else {
        console.warn('[DUET][WEBRTC] Ignored duplicate or unexpected answer in signalingState:', pcRef.current.signalingState);
      }
    } catch (e) {
      console.warn('[DUET][WEBRTC] Host setRemoteDescription error:', e);
    }
  }, [drainIceCandidates, logWebRTC]);

  // Handle remote ICE candidate on both sides
  const handleRemoteIceCandidate = useCallback(async (candidate, senderId) => {
    logSignal('Received remote ICE candidate from:', senderId);
    if (!candidate || !candidate.candidate) return;

    if (pcRef.current && pcRef.current.remoteDescription) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[DUET][SIGNAL] Error adding remote candidate:', e);
      }
    } else {
      logSignal('Queueing remote ICE candidate pending remoteDescription');
      pendingIceCandidatesRef.current.push(candidate);
    }
  }, [logSignal]);

  // Main lifecycle effect for Supabase Realtime channel & Presence
  useEffect(() => {
    if (typeof window === 'undefined' || !normalizedRoomId || !supabase) return;

    let isMounted = true;
    const channelName = `booth:${normalizedRoomId}`;
    logRoom('Setting up Supabase Realtime channel:', channelName, 'with participantId:', participantId);

    // Verify room or create DB record in background
    verifyRoomRecord(normalizedRoomId).then(res => {
      if (isMounted) {
        logRoom('Room DB verification result:', res);
      }
    });

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: participantId },
        broadcast: { ack: true }
      }
    });

    channelRef.current = channel;

    // 1. PRESENCE HANDLERS (Register before subscribe)
    channel.on('presence', { event: 'sync' }, () => {
      if (!isMounted) return;
      const state = channel.presenceState();
      logPresence('Presence sync state:', state);

      // Collect active participants
      const participants = [];
      Object.keys(state).forEach(key => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
          participants.push({
            participantId: key,
            joinedAt: presences[0].joinedAt || 0,
            ...presences[0]
          });
        }
      });

      // Deterministic ordering by joinedAt timestamp, tie-breaker by participantId
      participants.sort((a, b) => {
        if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
        return a.participantId.localeCompare(b.participantId);
      });

      logPresence('Sorted participants in room:', participants.map(p => p.participantId));
      const totalCount = participants.length;
      setParticipantCount(totalCount);

      // Check for ROOM FULL (3rd participant rule)
      const myIndex = participants.findIndex(p => p.participantId === participantId);
      if (myIndex >= 2) {
        logPresence('Third participant detected! Transitioning to ROOM_FULL');
        setRoomState(ROOM_STATES.ROOM_FULL);
        channel.untrack();
        return;
      }

      if (totalCount === 1) {
        // Single participant in room
        setIsHost(true);
        isInitiatorRef.current = true;
        setPartnerId(null);
        setRoomState(prev => {
          if (prev === ROOM_STATES.ROOM_FULL) return prev;
          if (prev === ROOM_STATES.CAMERA_PERMISSION) return prev;
          return ROOM_STATES.WAITING_FOR_PARTNER;
        });
      } else if (totalCount >= 2) {
        // Two participants in room!
        const hostParticipant = participants[0];
        const guestParticipant = participants[1];
        const amIHost = hostParticipant.participantId === participantId;
        const otherParticipant = amIHost ? guestParticipant : hostParticipant;

        setIsHost(amIHost);
        isInitiatorRef.current = amIHost;
        setPartnerId(otherParticipant.participantId);

        logPresence(`Room paired: Host=${hostParticipant.participantId}, Guest=${guestParticipant.participantId}, AmIHost=${amIHost}`);

        if (partnerLeftTimerRef.current) {
          clearTimeout(partnerLeftTimerRef.current);
          partnerLeftTimerRef.current = null;
        }

        setRoomState(prev => {
          if (prev === ROOM_STATES.ROOM_FULL) return prev;
          if (prev === ROOM_STATES.READY || prev === ROOM_STATES.COUNTDOWN || prev === ROOM_STATES.CAPTURE || prev === ROOM_STATES.CAPTION_EDIT || prev === ROOM_STATES.PHOTO_REVIEW || prev === ROOM_STATES.PRINTING || prev === ROOM_STATES.MEMORY_READY) {
            return prev;
          }
          return ROOM_STATES.PARTNER_CONNECTED;
        });

        // If host and WebRTC not yet negotiated, initiate offer
        if (amIHost && !hasNegotiatedRef.current) {
          logWebRTC('Host triggering call initiation...');
          initiateCallAsHost(otherParticipant.participantId);
        }
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (!isMounted) return;
      logPresence('Participant joined:', key, newPresences);
      if (key !== participantId) {
        Snd.arrive();
        triggerToastRef.current('they entered the booth — smile! ✶');
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (!isMounted) return;
      logPresence('Participant left:', key, leftPresences);
      if (key !== participantId) {
        setRoomState(ROOM_STATES.DISCONNECTED);
        setRemoteStream(null);
        closePeerConnection();
        triggerToastRef.current('the other one stepped out — room link active');

        partnerLeftTimerRef.current = setTimeout(() => {
          if (isMounted) {
            setRoomState(ROOM_STATES.WAITING_FOR_PARTNER);
          }
        }, 3000);
      }
    });

    // 2. BROADCAST SIGNALING & EVENTS
    channel.on('broadcast', { event: 'signal_offer' }, ({ payload }) => {
      if (!isMounted) return;
      logSignal('Received signal_offer from:', payload.from, 'to:', payload.to);
      if (payload.to === participantId) {
        handleRemoteOfferAsGuest(payload.sdp, payload.from);
      }
    });

    channel.on('broadcast', { event: 'signal_answer' }, ({ payload }) => {
      if (!isMounted) return;
      logSignal('Received signal_answer from:', payload.from, 'to:', payload.to);
      if (payload.to === participantId) {
        handleRemoteAnswerOnHost(payload.sdp, payload.from);
      }
    });

    channel.on('broadcast', { event: 'signal_ice' }, ({ payload }) => {
      if (!isMounted) return;
      if (payload.to === participantId) {
        handleRemoteIceCandidate(payload.candidate, payload.from);
      }
    });

    // Photobooth synchronized actions
    channel.on('broadcast', { event: 'photobooth_event' }, ({ payload }) => {
      if (!isMounted || !payload) return;
      logRoom('Received photobooth_event:', payload.type);

      switch (payload.type) {
        case 'SHUTTER_TRIGGER':
          runSynchronizedCountdown(payload.photoIndex, payload.targetTime);
          break;
        case 'CAPTION_UPDATE':
          setPhotos(prev => {
            const next = [...prev];
            if (next[payload.index]) next[payload.index].caption = payload.text;
            return next;
          });
          break;
        case 'STICKER_ADD':
          setPhotos(prev => {
            const next = [...prev];
            if (next[payload.index]) {
              next[payload.index].stickers = [...(next[payload.index].stickers || []), payload.sticker];
            }
            return next;
          });
          break;
        case 'STICKER_REMOVE':
          setPhotos(prev => {
            const next = [...prev];
            if (next[payload.index]) {
              next[payload.index].stickers = next[payload.index].stickers.filter(s => s.id !== payload.id);
            }
            return next;
          });
          break;
        case 'TONE_CHANGE':
          if (payload.filter) setCurFilter(payload.filter);
          break;
        case 'STUDIO_TOGGLE':
          setStudioState(payload.studio);
          break;
        case 'PRINT_STRIP':
          setRoomState(ROOM_STATES.PRINTING);
          break;
        case 'RESET_BOOTH':
          setPhotos([]);
          setFilm(3);
          setRoomState(ROOM_STATES.READY);
          break;
      }
    });

    // 3. SUBSCRIBE & TRACK PRESENCE
    channel.subscribe(async (status) => {
      logRoom('Channel subscription status:', status);
      if (status === 'SUBSCRIBED' && isMounted) {
        await channel.track({
          participantId,
          joinedAt: Date.now()
        });
        logPresence('Tracked participant presence successfully');
      }
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      logRoom('Unmounting room, cleaning up channel, media, and peer connection');
      if (partnerLeftTimerRef.current) clearTimeout(partnerLeftTimerRef.current);
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    normalizedRoomId,
    participantId,
    logRoom,
    logPresence,
    logSignal,
    logWebRTC,
    closePeerConnection,
    initiateCallAsHost,
    handleRemoteOfferAsGuest,
    handleRemoteAnswerOnHost,
    handleRemoteIceCandidate,
    runSynchronizedCountdown,
    setCurFilter,
    setStudioState,
    setPhotos,
    setFilm
  ]);

  // Synchronized Shutter Trigger Handler
  const triggerSynchronizedShutter = useCallback((photoIdx) => {
    if (film <= 0 || isCapturing) return;
    const targetTime = Date.now() + 3200; // 3.2 seconds countdown
    broadcastMessage('photobooth_event', {
      type: 'SHUTTER_TRIGGER',
      photoIndex: photoIdx,
      targetTime
    });
    runSynchronizedCountdown(photoIdx, targetTime);
  }, [broadcastMessage, film, isCapturing, runSynchronizedCountdown]);

  // Synchronized Sticker Add Handler
  const broadcastAddSticker = useCallback((index, sticker) => {
    broadcastMessage('photobooth_event', {
      type: 'STICKER_ADD',
      index,
      sticker
    });
  }, [broadcastMessage]);

  // Synchronized Sticker Remove Handler
  const broadcastRemoveSticker = useCallback((index, id) => {
    broadcastMessage('photobooth_event', {
      type: 'STICKER_REMOVE',
      index,
      id
    });
  }, [broadcastMessage]);

  // Synchronized Caption Handler
  const broadcastCaptionChange = useCallback((index, text) => {
    broadcastMessage('photobooth_event', {
      type: 'CAPTION_UPDATE',
      index,
      text
    });
  }, [broadcastMessage]);

  // Synchronized Tone Handler
  const broadcastToneChange = useCallback((filter) => {
    broadcastMessage('photobooth_event', {
      type: 'TONE_CHANGE',
      filter
    });
  }, [broadcastMessage]);

  // Synchronized Studio Handler
  const broadcastStudioToggle = useCallback((on) => {
    broadcastMessage('photobooth_event', {
      type: 'STUDIO_TOGGLE',
      studio: on
    });
  }, [broadcastMessage]);

  // Synchronized Print Handler
  const broadcastPrintStrip = useCallback(() => {
    broadcastMessage('photobooth_event', {
      type: 'PRINT_STRIP'
    });
  }, [broadcastMessage]);

  // Synchronized Reset Handler
  const broadcastResetBooth = useCallback(() => {
    broadcastMessage('photobooth_event', {
      type: 'RESET_BOOTH'
    });
  }, [broadcastMessage]);

  return {
    roomState,
    setRoomState,
    participantId,
    isHost,
    partnerId,
    participantCount,
    youMode,
    localStream: localStreamRef.current,
    remoteStream,
    countdownNum,
    isCapturing,
    startCamera,
    triggerSynchronizedShutter,
    broadcastAddSticker,
    broadcastRemoveSticker,
    broadcastCaptionChange,
    broadcastToneChange,
    broadcastStudioToggle,
    broadcastPrintStrip,
    broadcastResetBooth
  };
}
