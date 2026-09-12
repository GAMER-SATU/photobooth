'use client';

import React from 'react';
import PhotoStrip from '@/components/PhotoStrip';

export default function ActPrinter({
  active,
  running,
  lampOn,
  stripWindowRef,
  stripRef,
  printLineText,
  printSubText,
  takeBtnDisabled,
  takeBtnLabel,
  takeBtnCursor,
  takeBtnReady,
  photos = [],
  roomCode = 'DUET',
  filterName = 'ORIGINAL',
  isStudio = false,
  stickersDict,
  isSolo = false,
  frameStates = null,
  onTakeBtnClick
}) {
  const soloActive = isSolo || roomCode === 'SOLO' || (roomCode && roomCode.startsWith('SOLO'));

  return (
    <section className={`scene scene-print ${active ? 'on' : ''}`} id="scenePrint">
      <div className="print-room">
        <div className="print-glow" />
        <div className={`machine2 ${running ? 'running' : ''}`} id="machine2">
          <span className="screw s-tl" /><span className="screw s-tr" />
          <span className="screw s-bl" /><span className="screw s-br" />
          <div className="m2-head">
            <i className={`lamp ${lampOn ? 'on' : ''}`} id="lamp" />
            <div>
              <div className="m2-title">PRINT MECHANISM — MODEL Nº 2</div>
              <div className="m2-sub">
                {soloActive ? 'PRINTS ONE · FOR YOUR POCKET' : 'PRINTS TWO · ONE FOR EACH OF YOU'}
              </div>
            </div>
          </div>
          <div className="m2-slotwrap">
            <div className="m2-slot" />
            <div className="strip-window" ref={stripWindowRef} id="stripWindow">
              <div ref={stripRef} style={{ width: '100%', willChange: 'transform' }}>
                <PhotoStrip
                  photos={photos}
                  roomCode={roomCode}
                  filterName={filterName}
                  isStudio={isStudio}
                  stickersDict={stickersDict}
                  isSolo={soloActive}
                  frameStates={frameStates}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="print-caption">
          <div className="print-line" id="printLine">{printLineText}</div>
          <div className="print-sub" id="printSub">{printSubText}</div>
          <button
            className={`pbtn ${takeBtnReady ? 'ready' : ''}`}
            id="takeBtn"
            disabled={takeBtnDisabled}
            onClick={onTakeBtnClick}
            data-cursor={takeBtnCursor}
          >
            <span id="takeBtnLabel">{takeBtnLabel}</span>
            <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
