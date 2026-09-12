'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Pelmet from '@/components/Pelmet';
import CustomCursor from '@/components/CustomCursor';
import ActCurtains from '@/components/ActCurtains';
import ActBooth from '@/components/ActBooth';
import ActPrinter from '@/components/ActPrinter';
import ActMemory from '@/components/ActMemory';

import { Snd } from '@/lib/audio';
import {
  FILTERS,
  STICKERS,
  STK_KEYS,
  createGrainNoiseCanvas,
  coverInto,
  getStripBlob,
  downloadStripPNG
} from '@/lib/canvas';
import { uploadAndSavePhotoStrip } from '@/lib/storage';
import { useDuetRoom, ROOM_STATES } from '@/hooks/useDuetRoom';

export default function PhotoboothSession({ roomId, startInBooth = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = (roomId || '').trim().toUpperCase();

  // Solo mode state
  const [isSolo, setIsSolo] = useState(() => {
    return roomCode === 'SOLO' || roomCode.startsWith('SOLO');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const modeParam = searchParams?.get('mode');
      if (modeParam === 'solo' || roomCode === 'SOLO' || roomCode.startsWith('SOLO')) {
        setIsSolo(true);
      }
    } catch (e) {}
  }, [searchParams, roomCode]);

  const handleToggleSoloMode = useCallback(() => {
    Snd.click();
    setIsSolo(prev => {
      const next = !prev;
      triggerToast(next ? 'switched to solo booth ✶' : 'switched to duet booth ✶');
      return next;
    });
  }, []);

  // Navigation / Act state
  const [act, setAct] = useState(startInBooth ? 2 : 1);
  const [film, setFilm] = useState(3);
  const [photos, setPhotos] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [curFilter, setCurFilter] = useState(FILTERS[0]);
  const [studio, setStudioState] = useState(false);
  const [pelmetGone, setPelmetGone] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

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

  // Printer scene state
  const [printerRunning, setPrinterRunning] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [printLineText, setPrintLineText] = useState('PRINTING FOR BOTH OF YOU…');
  const [printSubText, setPrintSubText] = useState('— an identical strip is printing on their side');
  const [takeBtnDisabled, setTakeBtnDisabled] = useState(true);
  const [takeBtnLabel, setTakeBtnLabel] = useState('PRINTING…');
  const [takeBtnCursor, setTakeBtnCursor] = useState('WAIT');
  const [takeBtnReady, setTakeBtnReady] = useState(false);
  const [frameStates, setFrameStates] = useState(null);
  const isPrintingRef = useRef(false);

  // Final memory scene state
  const [postmarkShow, setPostmarkShow] = useState(false);
  const [loadedStrip, setLoadedStrip] = useState(null);
  const [uploadingStrip, setUploadingStrip] = useState(false);
  const [savedStripLink, setSavedStripLink] = useState('');

  // Media and element refs
  const camYouRef = useRef(null);
  const camThemRef = useRef(null);
  const fbYouRef = useRef(null);
  const themCvRef = useRef(null);
  const sfYouRef = useRef(null);
  const sfThemRef = useRef(null);
  const boothRef = useRef(null);
  const machineRef = useRef(null);
  const benchRowRef = useRef(null);
  const machineSlotRef = useRef(null);
  const stripWindowRef = useRef(null);
  const stripRef = useRef(null);
  const finalHoldRef = useRef(null);
  const finalStripRef = useRef(null);

  // MediaPipe Selfie Segmentation refs
  const segRef = useRef(null);
  const segOKRef = useRef(false);
  const segTargetRef = useRef('you');
  const segOutYouReadyRef = useRef(false);
  const segOutThemReadyRef = useRef(false);
  const noiseCvRef = useRef(null);

  const segW = 480, segH = 540;
  const segInYouRef = useRef(null);
  const segInThemRef = useRef(null);
  const segOutYouRef = useRef(null);
  const segOutThemRef = useRef(null);
  const personCvYouRef = useRef(null);
  const personCvThemRef = useRef(null);

  // Photo frame capture callback for useDuetRoom
  const handleCaptureFrame = useCallback(() => {
    const W = 960, H = 540;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const f = curFilter;

    // Trigger double flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 650);

    x.fillStyle = '#FFFFFF';
    x.fillRect(0, 0, W, H);

    const floorG = x.createRadialGradient(W / 2, H + 60, 50, W / 2, H + 60, W * .72);
    floorG.addColorStop(0, 'rgba(20,20,26,.07)');
    floorG.addColorStop(1, 'rgba(20,20,26,0)');
    x.fillStyle = floorG;
    x.fillRect(0, 0, W, H);

    if (f.css !== 'none') {
      try { x.filter = f.css + ' brightness(1.03)'; } catch (e) {}
    }

    if (isSolo) {
      // Solo mode: draw user camera centered across the full 960x540 frame
      if (camYouRef.current && camYouRef.current.videoWidth) {
        if (studio && segOKRef.current && segOutYouReadyRef.current && segOutYouRef.current) {
          x.drawImage(segOutYouRef.current, 0, 0, 480, 540, 240, 0, 480, 540);
        } else {
          coverInto(x, camYouRef.current, camYouRef.current.videoWidth, camYouRef.current.videoHeight, 0, 0, W, H, true);
        }
      } else if (fbYouRef.current) {
        coverInto(x, fbYouRef.current, fbYouRef.current.width, fbYouRef.current.height, 0, 0, W, H, false);
      }
    } else {
      // Duet mode: You side (0..480) and Them side (480..960)
      if (camYouRef.current && camYouRef.current.videoWidth) {
        if (studio && segOKRef.current && segOutYouReadyRef.current && segOutYouRef.current) {
          x.drawImage(segOutYouRef.current, 0, 0, 480, 540, 0, 0, 480, 540);
        } else {
          coverInto(x, camYouRef.current, camYouRef.current.videoWidth, camYouRef.current.videoHeight, 0, 0, 480, 540, true);
        }
      } else if (fbYouRef.current) {
        coverInto(x, fbYouRef.current, fbYouRef.current.width, fbYouRef.current.height, 0, 0, 480, 540, false);
      }

      // Them side
      if (camThemRef.current && camThemRef.current.videoWidth) {
        if (studio && segOKRef.current && segOutThemReadyRef.current && segOutThemRef.current) {
          x.drawImage(segOutThemRef.current, 0, 0, 480, 540, 480, 0, 480, 540);
        } else {
          coverInto(x, camThemRef.current, camThemRef.current.videoWidth, camThemRef.current.videoHeight, 480, 0, 480, 540, false);
        }
      } else if (themCvRef.current) {
        coverInto(x, themCvRef.current, themCvRef.current.width, themCvRef.current.height, 480, 0, 480, 540, false);
      }
    }

    if (f.css !== 'none') {
      try { x.filter = 'none'; } catch (e) {}
    }

    if (f.grain > 0 && noiseCvRef.current) {
      x.save();
      x.globalAlpha = f.grain;
      x.globalCompositeOperation = 'overlay';
      x.drawImage(noiseCvRef.current, -20, -20, W + 40, H + 40);
      x.restore();
    }

    const vg = x.createRadialGradient(W / 2, H / 2, H * .44, W / 2, H / 2, H * .86);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(18,18,22,${(f.vig * 0.4).toFixed(2)})`);
    x.fillStyle = vg;
    x.fillRect(0, 0, W, H);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    x.font = '15px "Special Elite", monospace';
    x.textAlign = 'center';
    x.fillStyle = 'rgba(72,68,62,.6)';
    x.fillText('✶ ' + timeStr, W / 2, H - 16);

    return {
      canvas: c,
      url: c.toDataURL('image/jpeg', .95),
      caption: '',
      stickers: []
    };
  }, [curFilter, studio, isSolo]);

  // Hook into Duet Realtime & WebRTC room
  const {
    roomState,
    isHost,
    partnerId,
    participantCount,
    youMode,
    localStream,
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
  } = useDuetRoom({
    roomId: roomCode,
    initialAct: act,
    onCaptureFrame: handleCaptureFrame,
    curFilter,
    setCurFilter,
    studio,
    setStudioState,
    photos,
    setPhotos,
    film,
    setFilm,
    triggerToast
  });

  // Realistic physical printing animation runner
  const runPhysicalPrinter = useCallback(async () => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    setAct(3);
    setPrinterRunning(false);
    setLampOn(false);
    setTakeBtnDisabled(true);
    setTakeBtnLabel('PRINTING…');
    setTakeBtnReady(false);
    setPrintLineText(isSolo ? 'PRINTING YOUR STRIP…' : 'PRINTING FOR BOTH OF YOU…');
    setPrintSubText(isSolo ? '— fresh off the machine' : '— an identical strip is printing on their side');

    // Initialize all frames as undeveloped (chemical emulsion layer on top)
    const initialFrameStates = photos.map(() => ({ printed: false, devd: false }));
    setFrameStates(initialFrameStates);

    Snd.ensure();
    Snd.click();

    // Small delay to allow Act 3 layout to mount and measure height
    await new Promise(r => setTimeout(r, 120));

    const fullHeight = (stripRef.current && (stripRef.current.offsetHeight || stripRef.current.scrollHeight)) || 640;

    // Set strip window to full reveal height (with overflow: hidden)
    if (stripWindowRef.current) {
      stripWindowRef.current.style.height = `${fullHeight + 12}px`;
    }

    // Start strip translated UP behind the machine slot
    if (stripRef.current) {
      stripRef.current.style.transform = `translateY(${-(fullHeight + 4)}px)`;
    }

    // Mechanical startup pause
    await new Promise(r => setTimeout(r, 650));
    setLampOn(true);
    setPrinterRunning(true);
    Snd.click();
    Snd.whoosh();
    await new Promise(r => setTimeout(r, 500));

    const printDuration = 5200; // ~5.2s mechanical emergence
    const startTime = performance.now();
    let lastTime = startTime;
    let p = 0;
    let audioAcc = 0;
    const seenFrames = new Set();
    const currentStates = photos.map(() => ({ printed: false, devd: false }));

    await new Promise(resolve => {
      const step = (now) => {
        const dt = Math.min(50, now - lastTime);
        lastTime = now;
        const mod = 0.8 + 0.45 * Math.abs(Math.sin(now * 0.0032));
        p = Math.min(1, p + (dt / printDuration) * mod * 1.22);

        // Mechanical jitter as paper advances through slot rollers
        const jx = p < 1 ? (Math.random() - 0.5) * 1.4 : 0;
        const currentY = -(1 - p) * (fullHeight + 4);

        if (stripRef.current) {
          stripRef.current.style.transform = `translate(${jx.toFixed(2)}px, ${currentY.toFixed(1)}px)`;
        }

        // Stepper motor ticking sound
        audioAcc += dt;
        if (audioAcc > 160 && p < 1) {
          audioAcc = 0;
          Snd.tick();
        }

        // Detect when photo frames emerge past the machine slot
        if (stripRef.current) {
          const frameEls = stripRef.current.querySelectorAll('.strip-frame');
          frameEls.forEach((el, idx) => {
            const frameBottom = el.offsetTop + el.offsetHeight + 14;
            if (!seenFrames.has(idx) && p * (fullHeight + 4) > frameBottom) {
              seenFrames.add(idx);
              currentStates[idx] = { ...currentStates[idx], printed: true };
              setFrameStates([...currentStates]);

              setTimeout(() => {
                currentStates[idx] = { ...currentStates[idx], devd: true };
                setFrameStates([...currentStates]);
              }, 420);
            }
          });
        }

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          if (stripRef.current) {
            stripRef.current.style.transform = 'translate(0, 0)';
          }
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    await new Promise(r => setTimeout(r, 400));

    // Ensure all frames are marked printed and developed
    setFrameStates(photos.map(() => ({ printed: true, devd: true })));

    setPrinterRunning(false);
    setLampOn(false);
    Snd.ding();

    setPrintLineText('YOUR MEMORY IS READY.');
    setPrintSubText(isSolo ? '— fresh off the machine' : '— an identical strip just printed on their side');
    setTakeBtnDisabled(false);
    setTakeBtnLabel('TAKE IT');
    setTakeBtnCursor('TAKE');
    setTakeBtnReady(true);
    isPrintingRef.current = false;
  }, [photos, isSolo]);

  // Synchronize printing when remote partner triggers it
  useEffect(() => {
    if (roomState === ROOM_STATES.PRINTING && act === 2) {
      runPhysicalPrinter();
    }
  }, [roomState, act, runPhysicalPrinter]);

  // Attach local stream to camYou video element
  useEffect(() => {
    if (camYouRef.current && localStream) {
      camYouRef.current.srcObject = localStream;
      camYouRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to camThem video element
  useEffect(() => {
    if (camThemRef.current && remoteStream) {
      camThemRef.current.srcObject = remoteStream;
      camThemRef.current.play().catch(() => {
        if (camThemRef.current) {
          camThemRef.current.muted = true;
          camThemRef.current.play().catch(() => {});
        }
      });
    }
  }, [remoteStream]);

  // Initialize MediaPipe & canvases on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    requestAnimationFrame(() => {
      document.body.classList.add('loaded');
    });

    noiseCvRef.current = createGrainNoiseCanvas();
    if (noiseCvRef.current) {
      try {
        const url = `url(${noiseCvRef.current.toDataURL()})`;
        document.documentElement.style.setProperty('--noise', url);
        const grainEl = document.getElementById('grain');
        if (grainEl) grainEl.style.backgroundImage = url;
      } catch (e) {}
    }

    segInYouRef.current = document.createElement('canvas');
    segInYouRef.current.width = segW; segInYouRef.current.height = segH;
    segInThemRef.current = document.createElement('canvas');
    segInThemRef.current.width = segW; segInThemRef.current.height = segH;
    segOutYouRef.current = document.createElement('canvas');
    segOutYouRef.current.width = segW; segOutYouRef.current.height = segH;
    segOutThemRef.current = document.createElement('canvas');
    segOutThemRef.current.width = segW; segOutThemRef.current.height = segH;
    personCvYouRef.current = document.createElement('canvas');
    personCvYouRef.current.width = segW; personCvYouRef.current.height = segH;
    personCvThemRef.current = document.createElement('canvas');
    personCvThemRef.current.width = segW; personCvThemRef.current.height = segH;

    import('@mediapipe/selfie_segmentation').then(({ SelfieSegmentation }) => {
      const seg = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });
      seg.setOptions({ modelSelection: 1 });
      seg.onResults((results) => {
        const target = segTargetRef.current;
        const outCv = target === 'you' ? segOutYouRef.current : segOutThemRef.current;
        const personCv = target === 'you' ? personCvYouRef.current : personCvThemRef.current;

        if (!outCv || !personCv) return;

        const ctxP = personCv.getContext('2d');
        ctxP.clearRect(0, 0, segW, segH);
        ctxP.drawImage(results.segmentationMask, 0, 0, segW, segH);
        ctxP.globalCompositeOperation = 'source-in';
        ctxP.drawImage(results.image, 0, 0, segW, segH);
        ctxP.globalCompositeOperation = 'source-over';

        const ctxOut = outCv.getContext('2d');
        ctxOut.fillStyle = '#FFFFFF';
        ctxOut.fillRect(0, 0, segW, segH);

        if (target === 'you') {
          ctxOut.save();
          ctxOut.translate(segW, 0);
          ctxOut.scale(-1, 1);
          ctxOut.drawImage(personCv, 0, 0, segW, segH);
          ctxOut.restore();
          segOutYouReadyRef.current = true;
        } else {
          ctxOut.drawImage(personCv, 0, 0, segW, segH);
          segOutThemReadyRef.current = true;
        }
      });
      segRef.current = seg;
      segOKRef.current = true;
    }).catch(e => {
      console.warn('[DUET] MediaPipe load warning, falling back to camera feed:', e);
      segOKRef.current = false;
    });

    if (startInBooth) {
      startCamera(false);
    }
  }, [startInBooth, startCamera]);

  // Video feed canvas animation loop
  useEffect(() => {
    let animId = null;
    let lastFeed = 0;

    const feedLoop = (t) => {
      animId = requestAnimationFrame(feedLoop);
      if (t - lastFeed < 35) return;
      lastFeed = t;

      if (studio && segOKRef.current && segRef.current) {
        if (camYouRef.current && youMode === 'live' && camYouRef.current.videoWidth) {
          segTargetRef.current = 'you';
          segRef.current.send({ image: camYouRef.current }).catch(() => {});
        }
        if (remoteStream && camThemRef.current && camThemRef.current.videoWidth) {
          segTargetRef.current = 'them';
          segRef.current.send({ image: camThemRef.current }).catch(() => {});
        }
      }

      // Draw You fallback or segmented studio image (clear when camera not ready to prevent white box)
      if (fbYouRef.current) {
        const ctx = fbYouRef.current.getContext('2d');
        if (camYouRef.current && youMode === 'live' && camYouRef.current.videoWidth) {
          if (studio && segOKRef.current && segOutYouReadyRef.current && segOutYouRef.current) {
            ctx.drawImage(segOutYouRef.current, 0, 0, 480, 540);
          } else {
            coverInto(ctx, camYouRef.current, camYouRef.current.videoWidth, camYouRef.current.videoHeight, 0, 0, 480, 540, true);
          }
        } else {
          ctx.clearRect(0, 0, 480, 540);
        }
      }

      // Draw Them fallback or segmented studio image
      if (themCvRef.current) {
        const ctx = themCvRef.current.getContext('2d');
        if (camThemRef.current && camThemRef.current.videoWidth) {
          if (studio && segOKRef.current && segOutThemReadyRef.current && segOutThemRef.current) {
            ctx.drawImage(segOutThemRef.current, 0, 0, 480, 540);
          } else {
            coverInto(ctx, camThemRef.current, camThemRef.current.videoWidth, camThemRef.current.videoHeight, 0, 0, 480, 540, false);
          }
        } else {
          ctx.clearRect(0, 0, 480, 540);
        }
      }
    };

    animId = requestAnimationFrame(feedLoop);
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, [studio, remoteStream, youMode]);

  // Curtain Open Handler (Act I -> Act II)
  const handleOpenCurtains = useCallback(async (cInL, cInR, heroEl, stageLight, stageBloom) => {
    if (heroEl) heroEl.classList.add('opening', 'out');
    Snd.ensure(); Snd.whoosh();
    startCamera(false);

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

    await Promise.all([runC(cInL, 1, true), runC(cInR, -1, true)]);
    if (heroEl) heroEl.classList.add('open');
    setAct(2);
  }, [startCamera]);

  // Shutter click trigger
  const handleShutterClick = () => {
    if (film <= 0 || isCapturing || editingIdx !== null) return;
    const photoIdx = photos.length;
    triggerSynchronizedShutter(photoIdx);
  };

  // Sticker handlers
  const handleAddSticker = (idx, type) => {
    const s = {
      type,
      x: 0.3 + Math.random() * 0.4,
      y: 0.28 + Math.random() * 0.32,
      r: (Math.random() - 0.5) * 32,
      id: 's' + Date.now() + Math.floor(Math.random() * 999)
    };
    Snd.click();
    setPhotos(prev => {
      const next = [...prev];
      if (next[idx]) next[idx].stickers = [...(next[idx].stickers || []), s];
      return next;
    });
    broadcastAddSticker(idx, s);
  };

  const handleRemoveSticker = (idx, id) => {
    Snd.click();
    setPhotos(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].stickers = next[idx].stickers.filter(s => s.id !== id);
      }
      return next;
    });
    broadcastRemoveSticker(idx, id);
  };

  const handleCaptionChange = (idx, text) => {
    const cleanText = text.replace(/[\r\n]+/g, ' ');
    setPhotos(prev => {
      const next = [...prev];
      if (next[idx]) next[idx].caption = cleanText;
      return next;
    });
    broadcastCaptionChange(idx, cleanText);
  };

  // Print strip trigger (Act II -> Act III)
  const handlePrintStrip = () => {
    broadcastPrintStrip();
    runPhysicalPrinter();
  };

  // Transition to Act IV
  const handleGoFinal = async () => {
    Snd.thunk();
    setAct(4);
    setPelmetGone(true);

    if (finalHoldRef.current) {
      finalHoldRef.current.animate([
        { transform: 'translateY(-78vh) rotate(5deg)', opacity: 0 },
        { transform: 'translateY(10px) rotate(-2.6deg)', opacity: 1, offset: 0.62 },
        { transform: 'translateY(-6px) rotate(-1.4deg)', offset: 0.82 },
        { transform: 'rotate(-1.8deg)' }
      ], { duration: 980, easing: 'cubic-bezier(.3,.6,.3,1)' });
    }

    setTimeout(() => {
      setPostmarkShow(true);
      Snd.stamp();
    }, 900);

    if (photos.length > 0 && !loadedStrip) {
      setUploadingStrip(true);
      try {
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const captionsSummary = photos.map(p => p.caption || '—').join(' · ');
        const blob = await getStripBlob(photos, dateStr, curFilter.name, studio, roomCode, noiseCvRef.current, isSolo);
        const result = await uploadAndSavePhotoStrip({
          blob,
          roomCode,
          filterName: curFilter.name,
          captionsSummary
        });
        setSavedStripLink(result.shareableLink);
        triggerToast(result.isCloudStored ? 'polaroid saved to cloud storage! link ready ✶' : 'polaroid saved! link ready ✶');
      } catch (e) {
        console.warn('Storage save error:', e);
      } finally {
        setUploadingStrip(false);
      }
    }
  };

  // Download PNG (Act IV)
  const handleSavePNG = () => {
    Snd.click();
    if (loadedStrip && loadedStrip.imageUrl) {
      const a = document.createElement('a');
      a.download = `${isSolo ? 'solo' : 'duet'}-strip-${loadedStrip.roomCode || 'saved'}-${Date.now()}.png`;
      a.href = loadedStrip.imageUrl;
      a.target = '_blank';
      a.click();
      triggerToast('photo strip saved to your device ✶');
    } else {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      downloadStripPNG(photos, dateStr, curFilter.name, studio, roomCode, noiseCvRef.current, isSolo);
      triggerToast('photo strip saved to your device ✶');
    }
  };

  const handlePrintAgain = () => {
    Snd.click();
    broadcastResetBooth();
    setPhotos([]);
    setFilm(3);
    setAct(2);
    setLoadedStrip(null);
    setSavedStripLink('');
    setPelmetGone(false);
    setPostmarkShow(false);
  };

  const handleShareLink = () => {
    Snd.click();
    const shareUrl = savedStripLink || (typeof window !== 'undefined' ? `${window.location.origin}/booth/${roomCode}` : `/booth/${roomCode}`);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    triggerToast(savedStripLink ? 'polaroid link copied to clipboard! ✶' : 'booth room link copied to clipboard!');
  };

  const handleLeaveBooth = () => {
    Snd.click();
    router.push('/');
  };

  // Map deterministic states to UI flags
  const isJoined = roomState === ROOM_STATES.READY ||
    roomState === ROOM_STATES.COUNTDOWN ||
    roomState === ROOM_STATES.CAPTURE ||
    roomState === ROOM_STATES.CAPTION_EDIT ||
    roomState === ROOM_STATES.PHOTO_REVIEW;

  let connLabel = 'WAITING';
  let statusMessage = 'WAITING FOR THE OTHER ONE';
  let guestsLabel = `${participantCount} OF 2`;

  if (roomState === ROOM_STATES.ROOM_FULL) {
    connLabel = 'ROOM FULL';
    statusMessage = 'THIS BOOTH IS FULL';
  } else if (roomState === ROOM_STATES.DISCONNECTED) {
    connLabel = 'DISCONNECTED';
    statusMessage = 'THE OTHER ONE LEFT — WAITING FOR RECONNECT';
  } else if (roomState === ROOM_STATES.RECONNECTING) {
    connLabel = 'RECONNECTING';
    statusMessage = 'RECONNECTING TO PARTNER...';
  } else if (roomState === ROOM_STATES.CAMERA_PERMISSION) {
    connLabel = 'CAMERA OFF';
    statusMessage = 'ALLOW CAMERA IN BROWSER TO ENTER';
  } else if (roomState === ROOM_STATES.PARTNER_CONNECTED) {
    connLabel = 'CONNECTING';
    statusMessage = 'PARTNER FOUND — STARTING VIDEO...';
    guestsLabel = '2 OF 2';
  } else if (isJoined) {
    connLabel = 'CONNECTED';
    statusMessage = `YOU'RE BOTH IN — ROOM ${roomCode}`;
    guestsLabel = '2 OF 2';
  }

  // OPTION A: Render only `/booth/${roomCode}` in HTML to completely eliminate hydration errors
  const inviteUrlStr = `/booth/${roomCode}`;

  const handleCopyInvite = useCallback(() => {
    Snd.click();
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.clipboard) {
      const fullUrl = `${window.location.origin}/booth/${roomCode}`;
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    triggerToast('booth room link copied to clipboard!');
  }, [roomCode, triggerToast]);

  return (
    <>
      <Header
        roomCode={roomCode}
        micOn={micOn}
        onToggleMic={() => {
          Snd.click();
          const next = !micOn;
          setMicOn(next);
          if (localStream) {
            localStream.getAudioTracks().forEach(t => { t.enabled = next; });
          }
          triggerToast(`microphone ${next ? 'unmuted' : 'muted'}`);
        }}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(prev => !prev)}
      />

      <Pelmet gone={pelmetGone} />
      <CustomCursor />

      <div className="grain" id="grain" />
      <div className="vignette" />

      {/* Act I : Curtains */}
      <ActCurtains active={act === 1} onOpenCurtains={handleOpenCurtains} />

      {/* Act II : Booth */}
      <ActBooth
        active={act === 2}
        boothRef={boothRef}
        machineRef={machineRef}
        camYouRef={camYouRef}
        camThemRef={camThemRef}
        fbYouRef={fbYouRef}
        themCvRef={themCvRef}
        sfYouRef={sfYouRef}
        sfThemRef={sfThemRef}
        youMode={youMode}
        remoteStream={remoteStream}
        isHost={isHost}
        joined={isJoined}
        connLabel={connLabel}
        statusMessage={statusMessage}
        guestsLabel={guestsLabel}
        film={film}
        curFilter={curFilter}
        filters={FILTERS}
        onApplyFilter={(f, broadcast) => {
          setCurFilter(f);
          if (broadcast) broadcastToneChange(f);
          triggerToast(`tone — ${f.name.toLowerCase()}`);
        }}
        studio={studio}
        onToggleStudio={() => {
          Snd.click();
          const next = !studio;
          setStudioState(next);
          broadcastStudioToggle(next);
          triggerToast(next ? 'one frame — backgrounds gone' : 'natural camera feeds');
        }}
        roomCode={roomCode}
        inviteUrlStr={inviteUrlStr}
        onCopyInvite={handleCopyInvite}
        shutterDisabled={film <= 0 || isCapturing || editingIdx !== null}
        shutterHint={
          film <= 0 ? 'film done — dress your prints, then print ✶' :
          editingIdx !== null ? 'writing on print — KEEP IT when done' :
          isSolo ? 'press when ready — count to three ✶' :
          isJoined ? 'press together — count to three' : 'works solo or send link to bring partner in ✶'
        }
        onShutterClick={handleShutterClick}
        photos={photos}
        editingIdx={editingIdx}
        onStartEdit={(idx) => setEditingIdx(idx)}
        onFinalizeCaption={(idx) => setEditingIdx(null)}
        onCaptionChange={handleCaptionChange}
        onAddSticker={handleAddSticker}
        onRemoveSticker={handleRemoveSticker}
        stkKeys={STK_KEYS}
        stickersDict={STICKERS}
        showDressBar={film <= 0 && photos.length > 0}
        onPrintStrip={handlePrintStrip}
        onStartCamera={(userInitiated) => startCamera(userInitiated)}
        benchRowRef={benchRowRef}
        machineSlotRef={machineSlotRef}
        waitChipGone={!!remoteStream}
        isSolo={isSolo}
        onToggleSoloMode={handleToggleSoloMode}
      />

      {/* Act III : Printer */}
      <ActPrinter
        active={act === 3}
        running={printerRunning}
        lampOn={lampOn}
        stripWindowRef={stripWindowRef}
        stripRef={stripRef}
        printLineText={printLineText}
        printSubText={printSubText}
        takeBtnDisabled={takeBtnDisabled}
        takeBtnLabel={takeBtnLabel}
        takeBtnCursor={takeBtnCursor}
        takeBtnReady={takeBtnReady}
        photos={photos}
        roomCode={roomCode}
        filterName={curFilter.name}
        isStudio={studio}
        stickersDict={STICKERS}
        isSolo={isSolo}
        frameStates={frameStates}
        onTakeBtnClick={handleGoFinal}
      />

      {/* Act IV : Memory */}
      <ActMemory
        active={act === 4}
        finalHoldRef={finalHoldRef}
        finalStripRef={finalStripRef}
        postmarkShow={postmarkShow}
        captionsSummary={photos.map(p => p.caption || '—').join(' · ')}
        photos={photos}
        roomCode={roomCode}
        filterName={curFilter.name}
        isStudio={studio}
        stickersDict={STICKERS}
        loadedStrip={loadedStrip}
        uploading={uploadingStrip}
        savedLink={savedStripLink}
        isSolo={isSolo}
        onSavePNG={handleSavePNG}
        onPrintAgain={handlePrintAgain}
        onShareLink={handleShareLink}
        onLeaveBooth={handleLeaveBooth}
      />

      {/* Synchronized Countdown Overlay */}
      {countdownNum !== null && (
        <div className="countdown" id="countdown">
          <div className="count" key={countdownNum}>
            {countdownNum}
            <small>STAY CLOSE · SMILE</small>
          </div>
        </div>
      )}

      {/* Double Flash Overlay */}
      <div id="flash" className={flashActive ? 'go' : ''} />

      {/* ROOM FULL OVERLAY (3rd Participant Blocker) */}
      {roomState === ROOM_STATES.ROOM_FULL && (
        <div className="room-full-overlay">
          <div className="room-full-card">
            <div className="rf-kicker">✶ BOOTH OCCUPIED ✶</div>
            <h2 className="rf-title">Room {roomCode} is Full</h2>
            <p className="rf-body">
              This little photo booth already has two people inside. DUET booths are made for pairs, but you can create your own private booth right now.
            </p>
            <div className="rf-actions">
              <button
                className="pbtn pbtn--red"
                onClick={() => router.push('/')}
                data-cursor="NEW"
              >
                START YOUR OWN BOOTH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`toast ${showToast ? 'show' : ''}`} id="toast">{toastMsg}</div>
    </>
  );
}
