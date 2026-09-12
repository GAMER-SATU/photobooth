'use client';

import React from 'react';
import { STICKERS } from '@/lib/canvas';

export default function PhotoStrip({
  photos = [],
  loadedStrip = null,
  roomCode = 'DUET',
  filterName = 'ORIGINAL',
  isStudio = false,
  stickersDict = STICKERS,
  isSolo = false,
  frameStates = null
}) {
  if (loadedStrip && loadedStrip.imageUrl) {
    return (
      <div className="strip" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
        <img 
          src={loadedStrip.imageUrl} 
          alt="Saved Polaroid Photo Strip" 
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} 
        />
      </div>
    );
  }

  const [dateStr, setDateStr] = React.useState('');

  React.useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  const soloActive = isSolo || roomCode === 'SOLO' || roomCode.startsWith('SOLO');

  return (
    <div className="strip" id="strip">
      <div className="strip-head">
        <span>{soloActive ? 'SOLO' : 'DUET'}</span>
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10, color: '#C13A2E' }}>
          <path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z" />
        </svg>
        <span>PHOTO BOOTH</span>
      </div>

      {photos.map((p, idx) => {
        // If frameStates is provided (during print animation), use it;
        // otherwise default to fully developed
        const fState = frameStates ? frameStates[idx] : { printed: true, devd: true };
        const isPrinted = fState ? fState.printed : true;
        const isDevd = fState ? fState.devd : true;

        return (
          <div
            className={`strip-frame ${isPrinted ? 'printed' : ''} ${isDevd ? 'devd' : ''}`}
            key={idx}
            data-frame-idx={idx}
          >
            <div className="strip-photo">
              {p.url && <img src={p.url} alt={`photo ${idx + 1}`} />}
              <div className="develop" />
              {(p.stickers || []).map((s) => (
                <div
                  key={s.id}
                  className="stk"
                  style={{
                    left: `${s.x * 100}%`,
                    top: `${s.y * 100}%`,
                    transform: `translate(-50%,-50%) rotate(${s.r}deg)`
                  }}
                  dangerouslySetInnerHTML={{ __html: (stickersDict && stickersDict[s.type]?.html) || '' }}
                />
              ))}
            </div>
            {p.caption ? <div className="strip-cap">{p.caption}</div> : null}
          </div>
        );
      })}

      <div className="strip-foot">
        <span>PHOTO BOOTH · {dateStr || 'TODAY'} · TONE {filterName}{isStudio ? ' · ONE FRAME' : ''} · {soloActive ? 'SOLO' : `ROOM ${roomCode}`}</span>
      </div>
    </div>
  );
}
