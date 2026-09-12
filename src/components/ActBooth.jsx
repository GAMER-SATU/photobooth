'use client';

import React, { useEffect } from 'react';
import { Snd } from '@/lib/audio';

export default function ActBooth({
  active,
  boothRef,
  machineRef,
  camYouRef,
  camThemRef,
  fbYouRef,
  themCvRef,
  sfYouRef,
  sfThemRef,
  youMode,
  remoteStream,
  isHost,
  joined,
  film,
  curFilter,
  filters,
  onApplyFilter,
  studio,
  onToggleStudio,
  roomCode,
  inviteUrlStr,
  onCopyInvite,
  shutterDisabled,
  shutterHint,
  onShutterClick,
  photos,
  editingIdx,
  onStartEdit,
  onFinalizeCaption,
  onCaptionChange,
  onAddSticker,
  onRemoveSticker,
  stkKeys,
  stickersDict,
  showDressBar,
  onPrintStrip,
  onStartCamera,
  benchRowRef,
  machineSlotRef,
  waitChipGone,
  connLabel,
  statusMessage,
  guestsLabel,
  isSolo = false,
  onToggleSoloMode
}) {
  const ROTS = [-2, 1, -1];
  const PH = ['first one…', 'okay, one more.', 'this one.'];

  // Polaroid drop out of machine slot animation
  useEffect(() => {
    if (photos.length > 0 && benchRowRef?.current && machineSlotRef?.current) {
      const lastIdx = photos.length - 1;
      const polaroidEls = benchRowRef.current.querySelectorAll('.polaroid.final');
      const lastEl = polaroidEls[lastIdx];
      if (lastEl && !lastEl.dataset.dropped) {
        lastEl.dataset.dropped = 'true';
        const sr = machineSlotRef.current.getBoundingClientRect();
        const er = lastEl.getBoundingClientRect();
        const dx = (sr.left + sr.width / 2) - (er.left + er.width / 2);
        const dy = (sr.top + sr.height / 2) - (er.top + lastEl.offsetHeight / 2);
        const rot = ROTS[lastIdx] || 0;
        lastEl.animate([
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot + 26}deg) scale(.55)`, opacity: 0.05 },
          { transform: `translate(${dx * 0.2}px, ${dy * 0.25}px) rotate(${rot + 8}deg) scale(.94)`, opacity: 1, offset: 0.55 },
          { transform: `translate(0, -10px) rotate(${rot - 2}deg) scale(1)`, offset: 0.8 },
          { transform: `rotate(${rot}deg)` }
        ], { duration: 880, easing: 'cubic-bezier(.25, .6, .3, 1)' });
        setTimeout(() => Snd.thunk(), 560);
      }
    }
  }, [photos.length]);

  return (
    <section className={`scene scene-booth ${active ? 'on' : ''}`} id="sceneBooth">
      <div className={`booth-frame ${showDressBar ? 'dresspad' : ''}`} ref={boothRef} id="boothFrame">
        <div className="booth-glow" />

        <header className="booth-head">
          <div>
            <div className="bh-kicker">NOW SHOWING —</div>
            <div className="bh-title">{isSolo ? <>all to <em>yourself</em></> : <>the <em>two of us</em></>}</div>
          </div>
          <ul className="bh-status">
            <li id="connIndicator">
              <i className={`dot ${isSolo || joined ? 'green' : ''}`} id="connDot" />
              <span id="connLabel">{isSolo ? 'SOLO BOOTH' : (connLabel || (joined ? 'CONNECTED' : 'WAITING'))}</span>
            </li>
            <li id="stGuests">{isSolo ? 'GUESTS 1 OF 1' : (guestsLabel || (joined ? '2 OF 2' : '1 OF 2'))}</li>
            <li id="stFilm">FILM {String(Math.max(0, film)).padStart(2, '0')}</li>
            <li id="stReady" className={isSolo || joined ? '' : 'hide'}>
              <i className="dot green" />READY
            </li>
          </ul>
        </header>

        <div className="booth-grid">
          <div className="booth-editorial">
            <div className="ed-kicker">HOW THIS WORKS —</div>
            <h2 className="ed-title">Make a<br /><em>memory.</em></h2>
            <p className="ed-body">
              {isSolo
                ? <>One person. One quiet photo booth.<br />Three photos, then dress them up — tap a print to write on it, stick a heart on it. Then print.</>
                : <>Two people. One little photo booth.<br />Three photos, then dress them up — tap a print to write on it, stick a heart on it. Then print.</>}
            </p>
            <div className="ed-note">
              no filters needed. but pick one anyway.
              <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
              </svg>
            </div>
            <div className="ed-rules">
              {isSolo
                ? <>house rules:<br />1. look right here<br />2. don&apos;t overthink<br />3. one more.</>
                : <>house rules:<br />1. get close<br />2. don&apos;t overthink<br />3. one more.</>}
            </div>
          </div>

          {/* Silver Machine */}
          <div className={`booth-machine ${studio ? 'studio' : ''} ${joined || isSolo ? 'together' : ''} ${film > 0 && !shutterDisabled ? 'ready' : ''}`} ref={machineRef} id="machineEl">
            <div className="lightbox">
              <span className="screw s-tl" /><span className="screw s-tr" />
              <div className="lb-text">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z"/></svg>
                PHOTOS
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z"/></svg>
              </div>
              <div className="lb-sub">{isSolo ? 'A LITTLE BOOTH FOR YOU' : 'A LITTLE BOOTH FOR TWO'}</div>
              <div className="price-tag">3 POSES<br />DIFFERENTES — FREE</div>
            </div>

            <div className="machine-body">
              {/* ZONE A : CAMERA BAY */}
              <div className={`viewports ${isSolo ? 'solo-mode' : ''}`}>
                <figure className={`viewport ${isSolo ? 'solo' : ''} ${youMode === 'live' ? 'live' : ''}`} id="vpYou">
                  <figcaption className="vp-top">{isSolo ? 'YOUR CAMERA' : 'ON YOUR SIDE'}</figcaption>
                  <div className="screen">
                    <video ref={camYouRef} id="camYou" autoPlay playsInline muted style={{ display: youMode === 'live' ? 'block' : 'none' }} />
                    <canvas ref={fbYouRef} id="fbYou" className="fb" width={480} height={540} style={{ display: youMode === 'live' ? 'block' : 'none' }} />
                    <div className="screen-fx" />
                    <div className="screen-live"><i />LIVE</div>
                    <span className="studio-chip">STUDIO</span>
                    <div className="studio-flash" ref={sfYouRef} id="sfYou" />
                    {youMode === 'init' && (
                      <div className="cam-init-chip">
                        <span><i />CAMERA INITIALIZING...</span>
                      </div>
                    )}
                    {youMode === 'lost' && (
                      <div className="camctl" id="camPanel">
                        <span className="camctl-msg">NO CAMERA — ACCESS OFF</span>
                        <button className="pbtn pbtn--sm" onClick={() => onStartCamera(true)} data-cursor="CAM">TURN ON CAMERA</button>
                      </div>
                    )}
                  </div>
                  <figcaption className="vp-plate"><span className="screw" />{isSolo ? 'SOLO' : 'YOU'}<span className="screw" /></figcaption>
                </figure>

                {!isSolo && (
                  <>
                    <div className="vp-mid">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z"/></svg>
                      <span>{joined ? 'ONE FRAME' : 'TOGETHER'}</span>
                      <i className="vline" />
                    </div>

                    <figure className={`viewport ${remoteStream ? 'live' : ''}`} id="vpThem">
                      <figcaption className="vp-top">ON THEIR SIDE</figcaption>
                      <div className="screen">
                        <video ref={camThemRef} id="camThem" autoPlay playsInline style={{ display: remoteStream ? 'block' : 'none' }} />
                        <canvas ref={themCvRef} id="themCv" className="fb" width={480} height={540} style={{ display: remoteStream ? 'block' : 'none' }} />
                        <div className="screen-fx" />
                        <div className="screen-live"><i />LIVE</div>
                        <span className="studio-chip">STUDIO</span>
                        <div className="studio-flash" ref={sfThemRef} id="sfThem" />
                        <div className={`wait-chip ${waitChipGone ? 'gone' : ''}`} id="waitChip">
                          <span>— WAITING FOR OTHER PERSON —</span>
                        </div>
                      </div>
                      <figcaption className="vp-plate"><span className="screw" />THEM<span className="screw" /></figcaption>
                    </figure>
                  </>
                )}
              </div>

              {/* TONE dial + STUDIO toggle */}
              <div className="tone-dial" role="group" aria-label="photo tone filter">
                <span className="tone-label">TONE</span>
                <div className="tones">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      className={`tone-btn ${curFilter.id === f.id ? 'is-on' : ''}`}
                      onClick={() => onApplyFilter(f, true)}
                      aria-pressed={curFilter.id === f.id}
                      data-cursor="TONE"
                    >
                      <i style={{ '--sw': f.id === 'mono' ? '#909090' : f.id === 'noir' ? '#55555C' : f.id === 'vintage' ? '#D8C49E' : f.id === 'grain' ? '#ABA79F' : f.id === 'warm' ? '#EFE3C8' : '#FFFFFF' }} />
                      {f.name}
                    </button>
                  ))}
                </div>
                <span className="tone-sep" />
                <button
                  className={`tone-btn ${studio ? 'is-on' : ''}`}
                  onClick={onToggleStudio}
                  aria-pressed={studio}
                  data-cursor="STUDIO"
                >
                  <i style={{ '--sw': '#FFFFFF' }} />STUDIO
                </button>
              </div>

              {/* ZONE B : STATUS & INVITE */}
              <div className="mstatus" id="mstatus">
                <span className="screw s-tl" /><span className="screw s-tr" />
                <span className="screw s-bl" /><span className="screw s-br" />
                <div className="mstat-left">
                  <i className={`dot ${isSolo || joined ? 'green' : ''}`} />
                  <span>
                    {isSolo
                      ? 'SOLO BOOTH — ALL YOURS'
                      : (statusMessage || (joined ? `YOU'RE BOTH IN — ROOM ${roomCode}` : 'WAITING FOR THE OTHER ONE'))}
                  </span>
                </div>
                {isSolo ? (
                  <button className="invite-copy" onClick={onToggleSoloMode} data-cursor="DUET" style={{ whiteSpace: 'nowrap' }}>
                    WANT COMPANY? SWITCH TO DUET
                  </button>
                ) : (
                  <div className={`invite ${joined ? 'gone' : ''}`} id="invite">
                    <span className="invite-url">{inviteUrlStr}</span>
                    <button className="invite-copy" onClick={onCopyInvite} data-cursor="COPY">COPY</button>
                    {onToggleSoloMode && (
                      <button className="invite-copy" onClick={onToggleSoloMode} data-cursor="SOLO" style={{ marginLeft: 4 }}>GO SOLO</button>
                    )}
                  </div>
                )}
              </div>

              {/* ZONE C : CONTROLS */}
              <div className="mcontrols">
                <div className="film-block">
                  <div className="film">
                    <span className="film-label">FILM LEFT</span>
                    <div className="film-win" id="filmWin">
                      <span id="filmNum">{String(Math.max(0, film)).padStart(2, '0')}</span>
                    </div>
                    <div className="sprockets" id="sprockets">
                      <i className={film <= 2 ? 'used' : ''} />
                      <i className={film <= 1 ? 'used' : ''} />
                      <i className={film <= 0 ? 'used' : ''} />
                    </div>
                  </div>
                  <div className="rlamp-wrap">
                    <i className="rlamp" id="rlamp" />READY
                  </div>
                </div>
                <div className="shutter-block">
                  <button
                    className="shutter"
                    onClick={onShutterClick}
                    disabled={shutterDisabled}
                    aria-label="take a photo"
                    data-cursor="PRESS"
                  >
                    PRESS
                  </button>
                  <div className="shutter-label">TAKE A PHOTO</div>
                  <div className="shutter-hint">{shutterHint}</div>
                </div>
              </div>

              <div className="machine-slot" ref={machineSlotRef} id="machineSlot" />
            </div>

            <div className="machine-feet"><i /><i /></div>
            <div className="machine-shadow" />
            <div className="machine-plate">FOTO AUTOMAT · 3 POSES DIFFERENTES · {isSolo ? 'SOLO' : 'DUET'}</div>
          </div>

          {/* Polaroid bench */}
          <div className={`booth-bench ${photos.length > 0 ? 'has-photos' : ''} ${showDressBar ? 'dressing' : ''}`} id="bench">
            <div className="anno-slot">
              <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6"/></svg>
              photos drop out here
            </div>
            <div className={`bench-hint ${photos.length > 0 ? 'hidden' : ''}`}>— your prints collect here —</div>
            <div className="bench-row" ref={benchRowRef} id="benchRow">
              {photos.map((ph, idx) => {
                const isEditing = editingIdx === idx;
                const rot = ROTS[idx] || 0;
                return (
                  <div
                    key={idx}
                    className={`polaroid final ${isEditing ? 'editing' : ''}`}
                    style={{ '--rot': `${rot}deg` }}
                    onClick={() => onStartEdit(idx)}
                    data-cursor="WRITE"
                  >
                    <span className="tape" />
                    <div className="pola-photo">
                      <img src={ph.url} alt={`photograph ${idx + 1}`} />
                      {ph.stickers.map((s) => (
                        <div
                          key={s.id}
                          className="stk"
                          style={{
                            left: `${s.x * 100}%`,
                            top: `${s.y * 100}%`,
                            transform: `translate(-50%,-50%) rotate(${s.r}deg)`
                          }}
                          onClick={(e) => {
                            if (isEditing) {
                              e.stopPropagation();
                              onRemoveSticker(idx, s.id);
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: stickersDict[s.type]?.html || '' }}
                        />
                      ))}
                    </div>
                    <div className="pola-cap">
                      <textarea
                        rows={2}
                        maxLength={45}
                        className="cap-input"
                        placeholder={PH[idx]}
                        value={ph.caption || ''}
                        onChange={(e) => onCaptionChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onFinalizeCaption(idx);
                          }
                        }}
                      />
                      <div className="stk-tray">
                        {stkKeys.map((k) => (
                          <button
                            key={k}
                            type="button"
                            className="stk-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddSticker(idx, k);
                            }}
                            dangerouslySetInnerHTML={{ __html: stickersDict[k]?.html || '' }}
                          />
                        ))}
                      </div>
                      <div className="stk-hint">tap a sticker to remove</div>
                      <div className="cap-tools">
                        <span className="cap-count">{(ph.caption || '').length} / 45</span>
                        <button
                          type="button"
                          className="cap-done"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFinalizeCaption(idx);
                          }}
                        >
                          KEEP IT
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dressing bar */}
      <div className={`dress-bar ${showDressBar ? 'show' : ''}`} id="dressBar">
        <div className="dress-copy">
          <div className="dress-title">make them <em>yours</em></div>
          <div className="dress-sub">tap any print — write a little something, stick a sticker on</div>
        </div>
        <button className="pbtn pbtn--red pbtn--sm" onClick={onPrintStrip} data-cursor="PRINT">
          PRINT THE STRIP
          <svg viewBox="0 0 34 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 8 C 10 3 20 4 30 9 M24 4 l7 4 -5 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
