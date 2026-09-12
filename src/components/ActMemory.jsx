'use client';

import React from 'react';
import PhotoStrip from '@/components/PhotoStrip';

export default function ActMemory({
  active,
  finalHoldRef,
  finalStripRef,
  postmarkShow,
  captionsSummary,
  photos = [],
  roomCode = 'DUET',
  filterName = 'ORIGINAL',
  isStudio = false,
  stickersDict,
  loadedStrip,
  uploading,
  savedLink,
  isSolo = false,
  onSavePNG,
  onPrintAgain,
  onShareLink,
  onLeaveBooth
}) {
  const soloActive = isSolo || roomCode === 'SOLO' || (roomCode && roomCode.startsWith('SOLO'));

  const handlePhysicalPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <section className={`scene scene-final ${active ? 'on' : ''}`} id="sceneFinal">
      <div className="final-wrap">
        <div className="final-kicker rise" style={{ '--d': '.15s' }}>
          {loadedStrip ? '✶ SHARED MEMORY ✶' : (soloActive ? '✶ SOLO PORTRAIT DEVELOPED ✶' : '✶ PRINTED & DEVELOPED ✶')}
        </div>
        <h2 className="final-title rise" style={{ '--d': '.25s' }}>
          {loadedStrip ? 'POLAROID STRIP' : 'KEEP THIS '}<em>{loadedStrip ? 'MEMORY.' : 'ONE.'}</em>
        </h2>

        <div className="final-stage">
          <div className="final-hold" ref={finalHoldRef} id="finalHold">
            <span className="tape" />
            
            <div ref={finalStripRef} style={{ width: '100%' }}>
              <PhotoStrip
                photos={photos}
                loadedStrip={loadedStrip}
                roomCode={roomCode}
                filterName={filterName}
                isStudio={isStudio}
                stickersDict={stickersDict}
                isSolo={soloActive}
              />
            </div>

            <svg className={`postmark ${postmarkShow ? 'show' : ''}`} id="postmark" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="pmc" d="M60 13 a 47 47 0 1 1 -0.01 0" />
              </defs>
              <circle cx="60" cy="60" r="57" fill="none" stroke="#C13A2E" strokeWidth="2.5" />
              <circle cx="60" cy="60" r="40" fill="none" stroke="#C13A2E" strokeWidth="1.2" />
              <text font-size="11" letterSpacing="2.2" fill="#C13A2E" fontFamily="Staatliches, sans-serif">
                <textPath href="#pmc">
                  {soloActive
                    ? 'SOLO BOOTH · MADE JUST FOR YOU · STICKERS AND ALL ·'
                    : 'MADE TOGETHER · BETWEEN HERE AND THERE · STICKERS AND ALL ·'}
                </textPath>
              </text>
              <path d="M60 46 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#C13A2E" />
            </svg>
            <div className="f-note fn0">
              {soloActive ? 'me, being me' : 'us, being us'}
              <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6"/></svg>
            </div>
            <div className="f-note fn1">{soloActive ? 'one person, one quiet room' : 'two people, one white room'}</div>
            <div className="f-note fn2">put it somewhere real.</div>
          </div>
        </div>

        <div className="f-caps-m rise" id="fCapsM" style={{ '--d': '.5s' }}>
          {loadedStrip ? (loadedStrip.captions || '—') : captionsSummary}
        </div>
        <p className="final-sub rise" style={{ '--d': '.55s' }}>
          {uploading
            ? 'Storing memory in cloud bucket…'
            : (soloActive ? 'Made by you, from somewhere quiet and real.' : 'Made together, from somewhere between here and there.')}
        </p>

        <div className="final-actions rise" style={{ '--d': '.7s' }}>
          <button className="pbtn pbtn--red pbtn--sm" onClick={onSavePNG} data-cursor="SAVE">
            SAVE PHOTO (300 DPI)
            <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
            </svg>
          </button>

          <button className="pbtn pbtn--sm" onClick={handlePhysicalPrint} data-cursor="PRINT">
            PRINT STRIP
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, marginLeft: 6, verticalAlign: '-1px' }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>
          
          {!loadedStrip && (
            <button className="pbtn pbtn--sm" onClick={onPrintAgain} data-cursor="AGAIN">PRINT ANOTHER</button>
          )}

          <button className="pbtn pbtn--sm" onClick={onShareLink} data-cursor="SHARE">
            {savedLink ? 'COPY STRIP LINK' : 'SHARE LINK'}
          </button>
          
          <button className="pbtn pbtn--sm" onClick={onLeaveBooth} data-cursor="EXIT">
            {loadedStrip ? 'ENTER PHOTO BOOTH' : 'LEAVE THE BOOTH'}
          </button>
        </div>

        <div className="final-foot rise" style={{ '--d': '.9s' }}>
          {loadedStrip ? `SAVED POLAROID · ROOM ${loadedStrip.roomCode || 'DUET'}` : (soloActive ? 'STORED & READY · SOLO SESSION · KEPT FOREVER' : 'STORED & READY · KEPT FOREVER · WITH STICKERS')}
        </div>
      </div>
    </section>
  );
}

