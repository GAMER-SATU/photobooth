'use client';

import React, { useEffect, useRef } from 'react';

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default function Pelmet({ gone }) {
  const svgRef = useRef(null);

  useEffect(() => {
    function buildPelmet() {
      const host = svgRef.current;
      if (!host) return;
      const W = host.clientWidth || window.innerWidth, H = host.clientHeight || 120;
      const boardH = 64;
      host.innerHTML = '';

      const NS = 'http://www.w3.org/2000/svg';
      const E = (n, a, p) => {
        const e = document.createElementNS(NS, n);
        for (const k in a) e.setAttribute(k, a[k]);
        if (p) p.appendChild(e);
        return e;
      };
      const stop = (g, o, c) => E('stop', { offset: o, 'stop-color': c }, g);

      const svg = E('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' }, host);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'block';

      const defs = E('defs', {}, svg);
      const gf = E('filter', { id: 'pgr' }, defs);
      E('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '2', stitchTiles: 'stitch' }, gf);
      E('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.9 0 0 0 0 0.9 0 0 0 0 0.92 0 0 0 0.35 0' }, gf);

      const pb = E('filter', { id: 'pbl', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      E('feGaussianBlur', { stdDeviation: 3 }, pb);

      const bg = E('linearGradient', { id: 'pbg', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      stop(bg, 0, '#1F1E23'); stop(bg, 1, '#121116');

      E('rect', { x: 0, y: 0, width: W, height: boardH, fill: 'url(#pbg)' }, svg);
      E('rect', { x: 0, y: 0, width: W, height: 1.5, fill: 'rgba(220,220,228,.14)' }, svg);
      E('rect', { x: 0, y: boardH - 2, width: W, height: 2, fill: '#7F8590', opacity: .6 }, svg);

      [12, W - 12].forEach(x => {
        E('circle', { cx: x, cy: boardH / 2, r: 4, fill: '#35343A' }, svg);
        E('circle', { cx: x - 1.2, cy: boardH / 2 - 1.2, r: 1.2, fill: '#6E6E76' }, svg);
      });

      const rnd = mulberry32(9917);
      const n = Math.max(3, Math.round(W / 250)), w = W / n, cy = boardH, span = H - boardH;
      const sg = E('linearGradient', { id: 'psg', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      stop(sg, 0, '#2B2930'); stop(sg, .6, '#17151B'); stop(sg, 1, '#0E0C10');

      for (let i = 0; i < n; i++) {
        const x0 = i * w - 1, x1 = (i + 1) * w + 1, depth = span * (1 + rnd() * .3), mid = (x0 + x1) / 2;
        const d = `M ${x0} ${cy} Q ${mid} ${cy + depth * 1.9} ${x1} ${cy} Z`;
        E('path', { d, fill: 'url(#psg)' }, svg);
        E('path', { d, fill: 'none', stroke: 'rgba(0,0,0,.5)', 'stroke-width': 6, filter: 'url(#pbl)' }, svg);
        E('path', { d, fill: 'none', stroke: 'rgba(215,212,228,.10)', 'stroke-width': 1.3 }, svg);
        E('path', { d, fill: 'none', stroke: '#4A4750', 'stroke-width': 7, 'stroke-dasharray': '1.5 5', opacity: .75 }, svg);
        E('circle', { cx: x0, cy: cy + 4, r: 6.5, fill: '#38353D' }, svg);
        E('circle', { cx: x0 - 2, cy: cy + 2, r: 2, fill: '#6E6E76', opacity: .8 }, svg);
      }
      E('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#pgr)', opacity: .4, style: 'mix-blend-mode:overlay' }, svg);
    }

    buildPelmet();
    window.addEventListener('resize', buildPelmet);
    return () => window.removeEventListener('resize', buildPelmet);
  }, []);

  return (
    <div className={`pelmet-wrap ${gone ? 'gone' : ''}`} id="pelmetWrap">
      <div ref={svgRef} id="pelmetSvg" aria-hidden="true" style={{ width: '100%', height: '100%' }} />
      <div className="pelmet-shadow" />
    </div>
  );
}
