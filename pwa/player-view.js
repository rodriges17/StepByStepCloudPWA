// Own the display mode; media state remains on the same video element.
export function createPlayerView({ screen, video, isActive = () => true, togglePlayback, resumePlayback, seekBy, native = () => window.stepNativePlayer }) {
  const doc = screen.ownerDocument, win = doc.defaultView;
  const header = screen.querySelector('.screen-header'), bottom = screen.querySelector('.player-bottom');
  const stage = video.closest('.video-stage');
  const timeline = bottom.querySelector('.timeline');
  const slider = timeline.querySelector('input');
  let full = false, controls = true, overlay = false, generation = 0;
  let hintTimer, hideTimer, overlayTimer, tapTimer, feedbackTimer;
  let gesture = null, scrub = null, pendingTap = null;
  let interacting = false, selectionOpen = false, pickerOpen = false, showInitialPlay = true;
  const tapInterval = 300;
  const isRotated = () => screen.classList.contains('is-landscape') && win.matchMedia('(orientation: portrait)').matches;

  function horizontalPosition(event, bounds) {
    if (isRotated()) return (event.clientY - bounds.top) / bounds.height;
    return (event.clientX - bounds.left) / bounds.width;
  }

  function overlayButton(className, label, text) {
    const button = doc.createElement('button');
    button.className = className;
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.textContent = text;
    stage.append(button);
    return button;
  }
  const playButton = overlayButton('player-play-feedback', 'Video starten', '▶');
  const rewindButton = overlayButton('player-seek-button', 'Im Video 5 Sekunden zurück', '−5 s');
  const forwardButton = overlayButton('player-seek-button', '5 Sekunden vor', '+5 s');
  rewindButton.dataset.side = 'left';
  forwardButton.dataset.side = 'right';

  const seekIcon = doc.createElement('span');
  seekIcon.className = 'player-seek-feedback';
  seekIcon.setAttribute('role', 'status');
  seekIcon.hidden = true;
  stage.append(seekIcon);

  const ready = () => isActive() && video.readyState >= 2 && !video.error &&
    screen.querySelector('#videoLoading')?.hidden !== false &&
    screen.querySelector('#retryPlayer')?.hidden !== false;

  function paintOverlay() {
    const available = ready() || scrub !== null;
    const showOverlay = available && overlay;
    if (showOverlay && !controls) {
      if (timeline.parentElement !== stage) stage.append(timeline);
    } else if (timeline.parentElement !== bottom) {
      bottom.prepend(timeline);
    }
    timeline.hidden = !controls && !showOverlay;
    playButton.hidden = !available || !(showOverlay || (video.paused && showInitialPlay));
    playButton.textContent = video.paused ? '▶' : '❚❚';
    playButton.setAttribute('aria-label', video.paused ? 'Video starten' : 'Video pausieren');
    rewindButton.hidden = !showOverlay;
    forwardButton.hidden = !showOverlay;
  }

  function scheduleOverlayHide() {
    clearTimeout(overlayTimer);
    if (overlay && !video.paused && !video.ended && !scrub) {
      overlayTimer = setTimeout(() => {
        overlay = false;
        paintOverlay();
      }, 3000);
    }
  }

  for (const element of [screen.querySelector('#videoLoading'), screen.querySelector('#retryPlayer')]) {
    if (element) new win.MutationObserver(paintOverlay).observe(element, {attributes:true, attributeFilter:['hidden']});
  }

  function cancelTap() {
    clearTimeout(tapTimer);
    pendingTap = null;
  }

  function clearActions({initialPlay = true} = {}) {
    cancelTap();
    clearTimeout(feedbackTimer);
    clearTimeout(overlayTimer);
    gesture = null;
    scrub = null;
    overlay = false;
    showInitialPlay = initialPlay;
    seekIcon.hidden = true;
    paintOverlay();
  }

  function singleTap() {
    if (!ready() || scrub) return;
    overlay = !overlay;
    showInitialPlay = false;
    controls = false;
    clearTimeout(hideTimer);
    paint();
    scheduleOverlayHide();
  }

  function finishTapSequence() {
    const single = pendingTap?.count === 1;
    cancelTap();
    if (single) singleTap();
  }

  function tap(event) {
    if (!ready()) return;
    const position = horizontalPosition(event, stage.getBoundingClientRect());
    if (!Number.isFinite(position)) return;
    const side = position < .5 ? -1 : 1;
    if (pendingTap && pendingTap.side !== side) finishTapSequence();
    if (!pendingTap) pendingTap = {side, count:0};
    const count = ++pendingTap.count;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(finishTapSequence, tapInterval);
    scheduleOverlayHide();

    if (count < 2) return;
    seekBy?.(side * (count === 2 ? 10 : 5));
    seekIcon.textContent = `${side < 0 ? '◀◀' : '▶▶'} ${count * 5} s`;
    seekIcon.dataset.side = side < 0 ? 'left' : 'right';
    seekIcon.hidden = false;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { seekIcon.hidden = true; }, 700);
    scheduleHide();
  }

  playButton.addEventListener('click', () => {
    cancelTap();
    if (ready()) togglePlayback?.();
  });
  for (const [button, seconds] of [[rewindButton, -5], [forwardButton, 5]]) {
    button.addEventListener('click', () => {
      cancelTap();
      if (ready()) seekBy?.(seconds);
      scheduleOverlayHide();
    });
  }
  for (const type of ['play', 'pause', 'loadeddata', 'seeked', 'ended']) {
    video.addEventListener(type, () => {
      if (type === 'play') showInitialPlay = false;
      paintOverlay();
      if (type === 'play' || type === 'pause' || type === 'ended') scheduleOverlayHide();
    });
  }
  for (const type of ['emptied', 'loadstart', 'error']) {
    video.addEventListener(type, () => clearActions());
  }

  function seekFromPointer(event) {
    const position = horizontalPosition(event, slider.getBoundingClientRect());
    if (!Number.isFinite(position)) return;
    const fraction = Math.max(0, Math.min(1, position));
    const value = slider.value;
    slider.value = String(fraction * video.duration);
    if (slider.value !== value) slider.dispatchEvent(new win.Event('input', {bubbles:true}));
  }

  slider.addEventListener('pointerdown', event => {
    if (!ready() || !Number.isFinite(video.duration) || event.isPrimary === false || event.button !== 0) return;
    event.preventDefault();
    cancelTap();
    scrub = {id:event.pointerId, resume:!video.paused};
    clearTimeout(overlayTimer);
    clearTimeout(hideTimer);
    slider.focus({preventScroll:true});
    slider.setPointerCapture?.(event.pointerId);
    if (scrub.resume) video.pause();
    seekFromPointer(event);
  });
  slider.addEventListener('pointermove', event => {
    if (scrub?.id === event.pointerId) seekFromPointer(event);
  });
  slider.addEventListener('input', scheduleOverlayHide);
  slider.addEventListener('keydown', cancelTap);
  function endScrub(event) {
    if (!scrub || scrub.id !== event.pointerId) return;
    if (event.type === 'pointerup') seekFromPointer(event);
    const {resume} = scrub;
    scrub = null;
    if (resume && isActive() && !video.error && !doc.hidden && video.paused && video.currentTime < video.duration) {
      resumePlayback?.();
    }
    scheduleOverlayHide();
  }
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && scrub) scrub.resume = false;
  });

  function scheduleHide() {
    clearTimeout(hideTimer);
    if (full && controls && !video.paused && !video.ended && !scrub && !interacting && !selectionOpen && !pickerOpen) {
      hideTimer = setTimeout(hide, 4000);
    }
  }
  function reveal() {
    overlay = false;
    controls = true;
    paint();
    scheduleHide();
  }
  function hide() {
    overlay = false;
    showInitialPlay = false;
    controls = false;
    clearTimeout(hideTimer);
    clearTimeout(overlayTimer);
    paint();
  }

  const hint = doc.createElement('p'); hint.className = 'player-fullscreen-hint'; hint.setAttribute('role', 'status'); hint.hidden = true; screen.append(hint);
  function paint() {
    screen.classList.toggle('is-immersive', full);
    screen.classList.toggle('is-native-fullscreen', full && !!native());
    screen.classList.toggle('controls-visible', controls);
    header.inert = full && !controls;
    bottom.inert = !controls;
    bottom.hidden = !controls;
    header.setAttribute('aria-hidden', String(header.inert));
    bottom.setAttribute('aria-hidden', String(bottom.inert));
    screen.querySelector('#fullscreen').textContent = full ? 'Verkleinern' : 'Vollbild';
    screen.querySelector('#playerBack').setAttribute('aria-label', full ? 'Vollbild verlassen' : 'Zurück zur Übersicht');
    paintOverlay();
  }
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Videobild');
  stage.setAttribute('aria-description', 'Eingabetaste zeigt die Zeitleiste. Pfeil nach oben öffnet die untere Videosteuerung.');
  stage.tabIndex = 0;
  async function exit({ history = true } = {}) {
    if (!full) return false;
    clearActions({initialPlay:false});
    full = false; controls = true; clearTimeout(hideTimer); generation++; clearTimeout(hintTimer); hint.hidden = true; paint();
    native()?.setFullscreen(false);
    if (doc.fullscreenElement === screen) try { await doc.exitFullscreen(); } catch { /* App chrome still returns. */ }
    if (history && win.history.state?.playerFullscreen) win.history.back();
    return true;
  }
  async function enter({ history = true } = {}) {
    if (full || !isActive()) return;
    clearActions({initialPlay:false});
    full = true; controls = false; gesture = null; interacting = false; selectionOpen = false; const request = ++generation; paint();
    stage.focus({preventScroll:true});
    if (history) win.history.pushState({...win.history.state, view:'player', playerFullscreen:true}, '', '#lernen');
    if (native()) { native().setFullscreen(true); return; }
    // Android browser fullscreen hides OS navigation. Keep the app-only layout
    // there; native Android controls its system bars through the platform bridge.
    if (/Android/i.test(win.navigator.userAgent)) return;
    try {
      if (!screen.requestFullscreen) throw new Error('Fullscreen unavailable');
      await screen.requestFullscreen();
      if (!full && doc.fullscreenElement === screen) await doc.exitFullscreen();
    } catch {
      if (!full || generation !== request) return;
      hint.textContent = 'Die verfügbare Fläche wird genutzt. Browserleisten können sichtbar bleiben.';
      hint.hidden = false; hintTimer = setTimeout(() => {hint.hidden = true;}, 4000);
    }
  }
  video.addEventListener('play', scheduleHide);
  video.addEventListener('pause', scheduleHide);
  video.addEventListener('ended', scheduleHide);
  stage.addEventListener('pointerdown', event => {
    if (!isActive() || event.target.closest('button,input,select,.timeline') || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    gesture = {id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
    stage.setPointerCapture?.(event.pointerId);
  });
  stage.addEventListener('pointerup', event => {
    const start = gesture; gesture = null;
    if (!isActive() || !start || start.id !== event.pointerId) return;
    const horizontal = event.clientX - start.x, vertical = event.clientY - start.y;
    const rotated = isRotated();
    const dx = rotated ? vertical : horizontal, dy = rotated ? -horizontal : vertical;
    if (Math.abs(dy) >= 35 && Math.abs(dy) > Math.abs(dx)*1.2) { cancelTap(); if (dy < 0) reveal(); else hide(); }
    else if (Math.hypot(dx,dy) < 12 && performance.now()-start.time < 600) tap(event);
  });
  stage.addEventListener('pointercancel', () => {gesture = null;cancelTap();});
  for (const panel of [header,bottom]) {
    panel.addEventListener('pointerdown', () => {cancelTap();interacting = true; clearTimeout(hideTimer);});
    panel.addEventListener('keydown', () => {interacting = true; clearTimeout(hideTimer);});
    panel.addEventListener('input', scheduleHide);
    panel.addEventListener('click', scheduleHide);
    panel.addEventListener('focusin', event => {if(event.target.matches('select')){selectionOpen = true;clearTimeout(hideTimer);}});
    panel.addEventListener('focusout', () => {selectionOpen = false;scheduleHide();});
    panel.addEventListener('change', () => {selectionOpen = false;scheduleHide();});
  }
  for (const type of ['pointerup','pointercancel','keyup']) win.addEventListener(type, event => {endScrub(event); interacting = false; scheduleHide();});
  doc.addEventListener('keydown', event => {
    if (!isActive() || pickerOpen || event.target.closest?.('input,select,textarea,[contenteditable="true"]')) return;
    if(event.key==='ArrowUp' && (full || event.target===stage)){event.preventDefault();reveal();}
    else if(event.key==='ArrowDown' && (full || event.target===stage)){event.preventDefault();hide();}
    else if((event.key===' '||event.key==='Enter')&&event.target===stage){event.preventDefault();cancelTap();singleTap();}
  });
  doc.addEventListener('fullscreenchange', () => { if (full && !native() && doc.fullscreenElement !== screen) void exit(); });
  return {
    mediaChanged() { clearActions(); },
    selectionChanged(open) { pickerOpen = open; scheduleHide(); },
    get full() { return full; }, get controlsVisible() { return full && controls; }, enter, exit,
    toggle() { return full ? exit() : enter(); },
    back() { if (!full) return false; if (controls) hide(); else void exit(); return true; },
    reset() { clearActions(); gesture = null; interacting = false; selectionOpen = false; pickerOpen = false; full = false; controls = true; clearTimeout(hideTimer); generation++; clearTimeout(hintTimer); hint.hidden = true; paint(); native()?.setFullscreen(false); }
  };
}
