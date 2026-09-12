'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Pelmet from '@/components/Pelmet';
import CustomCursor from '@/components/CustomCursor';
import ActCurtains from '@/components/ActCurtains';
import ActMemory from '@/components/ActMemory';

import { Snd } from '@/lib/audio';
import { generateRoomCode, createRoomRecord } from '@/lib/rooms';
import { getTabParticipantId } from '@/lib/participant';
import { getPhotoStripById } from '@/lib/storage';
import { STICKERS } from '@/lib/canvas';

export default function LandingPage() {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [pelmetGone, setPelmetGone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Saved strip viewing state
  const [loadedStrip, setLoadedStrip] = useState(null);
  const [postmarkShow, setPostmarkShow] = useState(false);
  const [savedStripLink, setSavedStripLink] = useState('');
  const finalHoldRef = useRef(null);
  const finalStripRef = useRef(null);

  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  const triggerToast = useCallback((msg) => {
    setToastMsg(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2600);
  }, []);

  // Handle URL parameters (redirect legacy room query or load strip)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    requestAnimationFrame(() => {
      document.body.classList.add('loaded');
    });

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const stripParam = urlParams.get('strip');

    // Redirect legacy query param to new route
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      console.log('[DUET][ROOM] Redirecting legacy room query to /booth/' + code);
      router.replace(`/booth/${code}`);
      return;
    }

    // View saved strip
    if (stripParam) {
      getPhotoStripById(stripParam).then(stripData => {
        if (stripData) {
          setLoadedStrip(stripData);
          setSavedStripLink(`${window.location.origin}/?strip=${stripData.id}`);
          setPelmetGone(true);
          setTimeout(() => {
            setPostmarkShow(true);
            Snd.stamp();
          }, 600);
        }
      });
    }
  }, [router]);

  // Create Booth and open curtains flow
  const handleOpenCurtains = useCallback(async (cInL, cInR, heroEl, stageLight, stageBloom, mode = 'duet') => {
    if (busy) return;
    setBusy(true);

    if (heroEl) heroEl.classList.add('opening', 'out');
    Snd.ensure(); Snd.whoosh();

    if (stageLight) {
      stageLight.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: .95 },
        { transform: 'translate(-50%, -50%) scale(1.24)', opacity: 1, offset: .36 },
        { transform: 'translate(-50%, -50%) scale(1.48)', opacity: 0 }
      ], { duration: 1600, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', fill: 'forwards' });
    }

    if (stageBloom) {
      stageBloom.animate([
        { opacity: 0.4, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0.85, transform: 'translate(-50%, -50%) scale(1.3)', offset: 0.36 },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.6)' }
      ], { duration: 1600, easing: 'ease-out', fill: 'forwards' });
    }

    setTimeout(() => Snd.thunk(), 1620);

    const runC = (inner, sign, open) => new Promise(res => {
      const dur = 1740;
      const t0 = performance.now();
      (function fr(now) {
        let t = now - t0;
        let u = Math.min(1, Math.max(0, t / dur));
        if (!open) u = 1 - u;

        const cubicEase = 1 - Math.pow(1 - u, 3.5);
        const scaleXVal = 1 - cubicEase * 0.94;
        const translateXVal = -34 * sign * cubicEase;

        if (inner) {
          inner.style.transform = `translateX(${translateXVal}px) scaleX(${scaleXVal})`;
        }

        if (t < dur) {
          requestAnimationFrame(fr);
        } else {
          res();
        }
      })(performance.now());
    });

    const isSolo = mode === 'solo';
    const newRoomCode = isSolo ? `SOLO-${generateRoomCode()}` : generateRoomCode();
    const myParticipantId = getTabParticipantId();
    console.log('[DUET][ROOM] Creating new room:', newRoomCode, 'mode:', mode, 'host:', myParticipantId);

    // Create room in Supabase DB
    try {
      await createRoomRecord(newRoomCode, myParticipantId);
    } catch (e) {
      console.warn('Room record creation warning:', e);
    }

    // Animate curtains and navigate
    await Promise.all([runC(cInL, 1, true), runC(cInR, -1, true)]);
    if (heroEl) heroEl.classList.add('open');

    router.push(isSolo ? `/booth/${newRoomCode}?mode=solo` : `/booth/${newRoomCode}`);
  }, [busy, router]);

  const handleSavePNG = () => {
    Snd.click();
    if (loadedStrip && loadedStrip.imageUrl) {
      const a = document.createElement('a');
      a.download = `duet-strip-${loadedStrip.roomCode || 'saved'}-${Date.now()}.png`;
      a.href = loadedStrip.imageUrl;
      a.target = '_blank';
      a.click();
      triggerToast('photo strip saved to your device ✶');
    }
  };

  const handleShareLink = () => {
    Snd.click();
    if (navigator.clipboard && savedStripLink) {
      navigator.clipboard.writeText(savedStripLink).catch(() => {});
    }
    triggerToast('polaroid link copied to clipboard! ✶');
  };

  const handleLeaveMemory = () => {
    Snd.click();
    setLoadedStrip(null);
    setSavedStripLink('');
    setPelmetGone(false);
    setPostmarkShow(false);
    router.replace('/');
  };

  return (
    <>
      <Header
        roomCode="001"
        micOn={micOn}
        onToggleMic={() => {
          Snd.click();
          setMicOn(prev => !prev);
        }}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(prev => !prev)}
      />

      <Pelmet gone={pelmetGone} />
      <CustomCursor />

      <div className="grain" id="grain" />
      <div className="vignette" />

      {/* Act I : Curtains Landing */}
      {!loadedStrip && (
        <ActCurtains active={true} onOpenCurtains={handleOpenCurtains} />
      )}

      {/* Act IV : Memory (if strip is loaded from ?strip=...) */}
      {loadedStrip && (
        <ActMemory
          active={true}
          finalHoldRef={finalHoldRef}
          finalStripRef={finalStripRef}
          postmarkShow={postmarkShow}
          captionsSummary={loadedStrip.captions || '—'}
          photos={[]}
          roomCode={loadedStrip.roomCode}
          filterName={loadedStrip.filterName || 'ORIGINAL'}
          isStudio={false}
          stickersDict={STICKERS}
          loadedStrip={loadedStrip}
          uploading={false}
          savedLink={savedStripLink}
          onSavePNG={handleSavePNG}
          onPrintAgain={() => router.push('/')}
          onShareLink={handleShareLink}
          onLeaveBooth={handleLeaveMemory}
        />
      )}

      <div className={`toast ${showToast ? 'show' : ''}`} id="toast">{toastMsg}</div>
    </>
  );
}
