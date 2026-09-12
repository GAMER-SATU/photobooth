'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Snd } from '@/lib/audio';

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default function ActCurtains({ active, onOpenCurtains }) {
  const cInLRef = useRef(null);
  const cInRRef = useRef(null);
  const curtainLRef = useRef(null);
  const curtainRRef = useRef(null);
  const heroRef = useRef(null);
  const stageLightRef = useRef(null);
  const stageBloomRef = useRef(null);
  const openBtnRef = useRef(null);
  const [ticketCut, setTicketCut] = useState(false);

  // Generate dust motes
  const motes = useMemo(() => {
    const rnd = mulberry32(12345);
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(15 + rnd() * 70).toFixed(1)}%`,
      top: `${(25 + rnd() * 60).toFixed(1)}%`,
      duration: `${(6 + rnd() * 8).toFixed(1)}s`,
      delay: `${(rnd() * 6).toFixed(1)}s`,
      mx: `${(-40 + rnd() * 80).toFixed(0)}px`,
      size: `${(2 + rnd() * 2.5).toFixed(1)}px`
    }));
  }, []);

  // SVG Curtains initialization
  useEffect(() => {
    function buildCurtain(host, side) {
      if (!host) return;
      const W = host.clientWidth || window.innerWidth * 0.29, H = host.clientHeight || window.innerHeight;
      host.innerHTML = '';
      const rnd = mulberry32(side === 'l' ? 20240214 : 20240215);

      const NS = 'http://www.w3.org/2000/svg';
      const E = (n, a, p) => {
        const e = document.createElementNS(NS, n);
        for (const k in a) e.setAttribute(k, a[k]);
        if (p) p.appendChild(e);
        return e;
      };
      const stop = (g, o, c) => E('stop', { offset: o, 'stop-color': c }, g);

      const svg = E('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' }, host);
      svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%'); svg.style.display = 'block';
      const uid = side + Math.floor(rnd() * 9999);
      const defs = E('defs', {}, svg);

      const gf = E('filter', { id: 'gr' + uid }, defs);
      E('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '2', stitchTiles: 'stitch' }, gf);
      E('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.9 0 0 0 0 0.9 0 0 0 0 0.92 0 0 0 0.35 0' }, gf);

      const bl = E('filter', { id: 'bl' + uid, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      E('feGaussianBlur', { stdDeviation: 1.1 }, bl);

      const g = E('linearGradient', { id: 'base' + uid, x1: side === 'l' ? '1' : '0', x2: side === 'l' ? '0' : '1', y1: 0, y2: 0 }, defs);
      stop(g, 0, '#2C2A31'); stop(g, .14, '#1F1D24'); stop(g, .55, '#141318'); stop(g, 1, '#08070A');
      E('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#base${uid})` }, svg);

      const bands = []; let bx = -24, ridge = rnd() < .5;
      while (bx < W + 24) { const w = ridge ? 28 + rnd() * 42 : 64 + rnd() * 90; bands.push({ x0: bx, x1: bx + w, ridge }); bx += w; ridge = !ridge; }
      const bnd = []; bands.forEach((b, i) => bnd[i] = { x: b.x0 }); bnd[bands.length] = { x: bands[bands.length - 1].x1 };
      bnd.forEach(b => { b.s = (rnd() - .5) * 24; b.c1 = b.s * .4 + (rnd() - .5) * 14; b.c2 = b.s * .8 + (rnd() - .5) * 14; });
      const edgeD = (b, rev) => {
        const y0 = -14, y1 = H + 14;
        return rev ? `M ${b.x + b.s} ${y1} C ${b.x + b.c2} ${H * .66} ${b.x + b.c1} ${H * .33} ${b.x} ${y0}`
                   : `M ${b.x} ${y0} C ${b.x + b.c1} ${H * .33} ${b.x + b.c2} ${H * .66} ${b.x + b.s} ${y1}`;
      };

      bands.forEach((b, i) => {
        const L = bnd[i], R = bnd[i + 1], id = 'f' + uid + '_' + i;
        const gr = E('linearGradient', { id, x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
        if (rnd() < .32) { gr.setAttribute('x1', '1'); gr.setAttribute('x2', '0'); }
        if (b.ridge) {
          const v = Math.round(66 + rnd() * 30), hp = (0.42 + rnd() * .16).toFixed(3);
          stop(gr, 0, '#070709'); stop(gr, .2, '#141218');
          stop(gr, Math.max(0, (+hp - .07)).toFixed(3), '#2B2931');
          stop(gr, hp, `rgb(${v},${v},${Math.min(255, v + 4)})`);
          stop(gr, (+hp + .08).toFixed(3), '#212025'); stop(gr, .82, '#0D0C10'); stop(gr, 1, '#060508');
        } else {
          stop(gr, 0, '#0A0A0C'); stop(gr, .5, '#18161C'); stop(gr, 1, '#09080B');
        }
        const d = edgeD(L) + ` L ${R.x + R.s} ${H + 14} ` + edgeD(R, true).replace('M', 'L') + ' Z';
        E('path', { d, fill: `url(#${id})` }, svg);
      });

      bnd.slice(1, bnd.length - 1).forEach(b => {
        E('path', { d: edgeD(b), fill: 'none', stroke: 'rgba(3,3,5,.5)', 'stroke-width': (2.5 + rnd() * 2).toFixed(1), filter: `url(#bl${uid})` }, svg);
      });
      for (let k = 0; k < 5; k++) {
        const b = bnd[2 + Math.floor(rnd() * (bnd.length - 4))];
        E('path', { d: edgeD(b), fill: 'none', stroke: `rgba(212,208,226,${(.07 + rnd() * .08).toFixed(2)})`, 'stroke-width': (1.2 + rnd() * 1.8).toFixed(1), filter: `url(#bl${uid})` }, svg);
      }

      const ov = (id, x0, x1, c0, c1) => {
        const gg = E('linearGradient', { id, x1: '0', x2: '1', y1: 0, y2: 0 }, defs);
        stop(gg, 0, c0); stop(gg, 1, c1);
        E('rect', { x: x0, y: 0, width: x1 - x0, height: H, fill: `url(#${id})` }, svg);
      };
      if (side === 'l') {
        ov('in' + uid, W * .62, W, 'rgba(228,225,240,0)', 'rgba(228,225,240,.13)');
        ov('o' + uid, 0, W * .09, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)');
      } else {
        ov('in' + uid, 0, W * .38, 'rgba(228,225,240,.13)', 'rgba(228,225,240,0)');
        ov('o' + uid, W * .91, W, 'rgba(0,0,0,0)', 'rgba(0,0,0,.5)');
      }

      const tv = E('linearGradient', { id: 'tsh' + uid, x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      stop(tv, 0, 'rgba(0,0,0,.62)'); stop(tv, 1, 'rgba(0,0,0,0)');
      E('rect', { x: 0, y: 0, width: W, height: H * .18, fill: `url(#tsh${uid})` }, svg);

      const ib = side === 'l' ? bnd[bnd.length - 1] : bnd[0];
      const tg = E('linearGradient', { id: 'tr' + uid, x1: side === 'l' ? '1' : '0', x2: side === 'l' ? '0' : '1', y1: 0, y2: 0 }, defs);
      stop(tg, 0, '#3A3840'); stop(tg, .5, '#232027'); stop(tg, 1, '#0C0B0F');
      E('path', { d: edgeD(ib), fill: 'none', stroke: `url(#tr${uid})`, 'stroke-width': 14, filter: `url(#bl${uid})` }, svg);
      E('path', { d: edgeD(ib), fill: 'none', stroke: 'rgba(160,158,176,.32)', 'stroke-width': 1.4, 'stroke-dasharray': '2 6' }, svg);
      E('rect', { x: 0, y: 0, width: W, height: H, filter: `url(#gr${uid})`, opacity: .45, style: 'mix-blend-mode:overlay' }, svg);
    }

    buildCurtain(cInLRef.current, 'l');
    buildCurtain(cInRRef.current, 'r');
  }, []);

  // Mouse Parallax Animation
  useEffect(() => {
    let pTx = 0, pTy = 0, pCx = 0, pCy = 0;
    let animId;

    const handleMouseMove = (e) => {
      if (!active) return;
      pTx = (e.clientX / window.innerWidth - 0.5) * 12;
      pTy = (e.clientY / window.innerHeight - 0.5) * 8;
    };

    const parallax = () => {
      if (active) {
        pCx += (pTx - pCx) * 0.05;
        pCy += (pTy - pCy) * 0.05;
        if (curtainLRef.current) {
          curtainLRef.current.style.transform = `translate3d(${-pCx}px, ${-pCy * 0.4}px, 0)`;
        }
        if (curtainRRef.current) {
          curtainRRef.current.style.transform = `translate3d(${pCx}px, ${-pCy * 0.4}px, 0)`;
        }
      }
      animId = requestAnimationFrame(parallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animId = requestAnimationFrame(parallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  const [ticketCutMode, setTicketCutMode] = useState(null);
  const soloBtnRef = useRef(null);
  const duetBtnRef = useRef(null);

  const handleOpenClick = async (mode = 'duet') => {
    if (ticketCutMode) return;
    setTicketCutMode(mode);
    const targetBtn = mode === 'solo' ? soloBtnRef.current : duetBtnRef.current;
    targetBtn?.classList.add('cutting');

    Snd.ensure();
    Snd.snip();
    setTimeout(() => Snd.snip(), 300);
    setTimeout(() => { Snd.snip(); Snd.click(); }, 640);

    setTimeout(() => {
      onOpenCurtains(cInLRef.current, cInRRef.current, heroRef.current, stageLightRef.current, stageBloomRef.current, mode);
    }, 960);
  };

  const SEG = 'SOLO OR FOR TWO · ONE LITTLE BOOTH · WRITE A LITTLE SOMETHING · STICK A HEART ON IT · KEEP IT · ✶ ';

  return (
    <section className={`scene scene-hero ${active ? 'on' : ''}`} id="sceneHero">
      <div className="stage-light" ref={stageLightRef} id="stageLight" />
      <div className="curtain curtain-l" ref={curtainLRef}>
        <div className="curtain-sway">
          <div className="curtain-inner" ref={cInLRef} id="cInL" />
        </div>
      </div>
      <div className="curtain curtain-r" ref={curtainRRef}>
        <div className="curtain-sway">
          <div className="curtain-inner" ref={cInRRef} id="cInR" />
        </div>
      </div>

      {/* Floating dust motes in spotlight */}
      {active && motes.map(m => (
        <div
          key={m.id}
          className="mote"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            animationDuration: m.duration,
            animationDelay: m.delay,
            '--mx': m.mx
          }}
        />
      ))}

      <div className="stage-bloom" ref={stageBloomRef} id="stageBloom" />
      <span className="curtain-tag ct-l">DUET &amp; SOLO — EST. TODAY</span>
      <span className="curtain-tag ct-r">DOORS OPEN NOW</span>

      <div className="hero" ref={heroRef} id="heroContent">
        <div className="hero-est">✶ DOORS OPEN · EST. RIGHT NOW ✶</div>
        <h1 className="hero-title">
          <span className="t1">Your little</span>
          <span className="t2">
            PHOTO BOOTH
            <svg className="squig" viewBox="0 0 240 12" aria-hidden="true">
              <path d="M3 8 C 40 3 70 11 105 7 S 175 3 208 7 S 232 5 237 6" fill="none" stroke="#C13A2E" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="t3">on the internet.</span>
        </h1>
        <p className="hero-sub">Made for someone special, or two people together,<br />who want to make something worth keeping.</p>

        <div className="tickets-wrap">
          <button
            className="ticket ticket--solo"
            ref={soloBtnRef}
            onClick={() => handleOpenClick('solo')}
            data-cursor="SOLO"
            disabled={!!ticketCutMode}
            aria-label="Admit one - Solo Booth"
          >
            <span className="tstub">ADMIT<br />ONE</span>
            <span className="tperf">
              <svg className="snip" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z"/>
              </svg>
            </span>
            <span className="tmain">
              SOLO BOOTH
              <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
              </svg>
            </span>
          </button>

          <button
            className="ticket ticket--duet"
            ref={duetBtnRef}
            onClick={() => handleOpenClick('duet')}
            data-cursor="DUET"
            disabled={!!ticketCutMode}
            aria-label="Admit two - Duet Booth"
          >
            <span className="tstub">ADMIT<br />TWO</span>
            <span className="tperf">
              <svg className="snip" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z"/>
              </svg>
            </span>
            <span className="tmain">
              DUET BOOTH
              <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
              </svg>
            </span>
          </button>
        </div>
        <div className="hero-note">step inside solo or invite someone along — it&apos;s starting.</div>
      </div>

      <div className="ticker">
        <div className="tk-track">
          <span>{SEG.repeat(4)}</span>
          <span>{SEG.repeat(4)}</span>
        </div>
      </div>
    </section>
  );
}

