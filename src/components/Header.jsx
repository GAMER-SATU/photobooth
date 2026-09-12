'use client';

import React from 'react';

export default function Header({ roomCode, micOn, onToggleMic, soundOn, onToggleSound }) {
  return (
    <header className="nav">
      <div className="nav-brand">
        <span className="nav-name">
          Duet
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z"/>
          </svg>
        </span>
        <span className="nav-tag">A PHOTO BOOTH FOR TWO</span>
      </div>
      <div className="nav-right">
        <span id="roomBadge">ROOM {roomCode || '001'}</span>
        <button
          className="nav-ctrl-btn"
          onClick={onToggleMic}
          aria-label="toggle microphone"
          aria-pressed={micOn}
          data-cursor="MIC"
        >
          MIC — {micOn ? 'ON' : 'MUTED'}
        </button>
        <button
          className="nav-ctrl-btn"
          onClick={onToggleSound}
          aria-label="toggle sound"
          aria-pressed={soundOn}
          data-cursor="SOUND"
        >
          SOUND — {soundOn ? 'ON' : 'OFF'}
        </button>
      </div>
    </header>
  );
}
