'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const labelRef = useRef(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let targetX = cx;
    let targetY = cy;
    let rafId = null;

    const onPointerMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.classList.add('vis');
      }
    };

    const animate = () => {
      cx += (targetX - cx) * 0.22;
      cy += (targetY - cy) * 0.22;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cx}px, ${cy}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    const onPointerOver = (e) => {
      const cursor = cursorRef.current;
      if (!cursor) return;
      if (e.target.closest('input, textarea')) {
        cursor.classList.add('over-input');
        return;
      }
      cursor.classList.remove('over-input');
      const target = e.target.closest('button, a, [data-cursor], .polaroid');
      if (target) {
        cursor.classList.add('hov');
        setLabel(target.dataset.cursor || '');
      }
    };

    const onPointerOut = (e) => {
      const cursor = cursorRef.current;
      if (!cursor) return;
      if (e.target.closest('input, textarea')) cursor.classList.remove('over-input');
      const target = e.target.closest('button, a, [data-cursor], .polaroid');
      if (target && !target.contains(e.relatedTarget)) {
        cursor.classList.remove('hov');
      }
    };

    const onPointerDown = () => cursorRef.current?.classList.add('press');
    const onPointerUp = () => cursorRef.current?.classList.remove('press');

    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div id="cursor" ref={cursorRef}>
      <div className="c-in">
        <span className="c-ring" />
        <span className="c-b tl" />
        <span className="c-b tr" />
        <span className="c-b bl" />
        <span className="c-b br" />
        <span className="c-dot" />
      </div>
      <span className="c-label" ref={labelRef}>
        {label}
      </span>
    </div>
  );
}
