// timeline.jsx — Scene orchestration for the IH product demo.
// Drives state of the three screens across time, plus cursor, captions, transitions.

const { Stage, Sprite, useTime, useTimeline, Easing, interpolate, animate, clamp } = window;

// ── Scene timing (seconds) ─────────────────────────────────────────────────
// Total ~28s, loopable.
const SCENES = {
  headline: { start: 0.0,  end: 2.8  }, // optional opener (overlay on welcome)
  welcome:  { start: 0.0,  end: 4.6  }, // dashboard, cursor approaches button
  newSess:  { start: 4.2,  end: 9.8  }, // typing Patricia Lawson
  speak:    { start: 9.4,  end: 18.8 }, // active visit, record pulses, transcript streams
  dash2:    { start: 18.4, end: 24.8 }, // back to dashboard w/ completed entry
};
const TOTAL = 25.0;

// Cursor path anchor points (stage-coordinates, px)
// Stage is 1280x720. Card is centered.

function Scene({ name, children }) {
  const s = SCENES[name];
  return <Sprite start={s.start} end={s.end}>{children}</Sprite>;
}

// ── Opening headline (optional, toggled by tweak) ───────────────────────────
function Headline({ text }) {
  const { localTime, duration } = window.useSprite();
  const fadeIn = clamp(localTime / 0.45, 0, 1);
  const fadeOut = clamp((duration - localTime) / 0.55, 0, 1);
  const opacity = Easing.easeOutCubic(fadeIn) * Easing.easeInCubic(fadeOut);
  const ty = (1 - Easing.easeOutCubic(fadeIn)) * 10;

  // Split into two lines for impact
  const lines = text.split('\n');
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity,
      transform: `translateY(${ty}px)`,
      pointerEvents: 'none',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: window.FONT_SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 54,
          color: window.IH_TEXT,
          letterSpacing: '-0.015em',
          lineHeight: 1.15,
          textAlign: 'center',
          textWrap: 'balance',
          maxWidth: 900,
        }}>{line}</div>
      ))}
    </div>
  );
}

// ── Captions ─────────────────────────────────────────────────────────────
function Caption({ text, visible, position }) {
  // Small floating callout at a fixed corner/edge of the stage (1280x720).
  return (
    <div style={{
      position: 'absolute',
      ...position,
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 8}px) scale(${visible ? 1 : 0.96})`,
      transformOrigin: 'center',
      transition: 'opacity 420ms cubic-bezier(.4,.1,.2,1), transform 420ms cubic-bezier(.4,.1,.2,1)',
      zIndex: 8,
    }}>
      <div style={{
        display: 'inline-block',
        maxWidth: 260,
        background: '#fff',
        border: `1px solid ${window.IH_BORDER}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 10px 30px rgba(30,55,65,0.12), 0 2px 6px rgba(30,55,65,0.06)',
        fontFamily: window.FONT_SERIF,
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: 17,
        lineHeight: 1.3,
        color: window.IH_TEXT,
        letterSpacing: '-0.005em',
        textWrap: 'balance',
      }}>{text}</div>
    </div>
  );
}

// ── Cursor ──────────────────────────────────────────────────────────────
function Cursor({ x, y, clicking = false, visible = true }) {
  const clickRing = clicking ? 1 : 0;
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(-6px, -4px) scale(${clicking ? 0.92 : 1})`,
      transition: 'transform 120ms ease',
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      zIndex: 10,
    }}>
      {/* click ripple */}
      <div style={{
        position: 'absolute',
        left: -2, top: -2,
        width: 28, height: 28,
        borderRadius: 999,
        border: `2px solid ${window.IH_TEAL_DEEP}`,
        opacity: clickRing * 0.5,
        transform: `translate(-50%,-50%) scale(${clickRing ? 1.6 : 0.2})`,
        transition: 'transform 400ms ease, opacity 400ms ease',
        pointerEvents: 'none',
      }}/>
      {/* pointer svg */}
      <svg width="22" height="26" viewBox="0 0 22 26" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' }}>
        <path d="M2 1.5 L2 20 L7.2 16 L10.5 23 L13.3 21.8 L10 15 L16.5 14.5 Z"
              fill="#ffffff" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Smooth positional interpolation between scene waypoints ────────────────
// cursor animates between a list of {t, x, y, clicking?} stops.
function useCursorState(stops) {
  const time = useTime();
  // Before first stop: show at first pos, hidden if firstVisible=false
  if (time <= stops[0].t) return { ...stops[0] };
  if (time >= stops[stops.length - 1].t) return { ...stops[stops.length - 1] };
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (time >= a.t && time <= b.t) {
      const local = (time - a.t) / (b.t - a.t);
      const eased = (b.ease || Easing.easeInOutCubic)(local);
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        clicking: b.clickAt != null && local >= b.clickAt && local <= b.clickAt + 0.15,
        visible: a.visible !== false,
      };
    }
  }
  return stops[stops.length - 1];
}

// Typing driver: given word list + start/end, returns words with opacity fade-in
function useStreamingWords(words, start, end) {
  const time = useTime();
  if (time < start) return [];
  const span = end - start;
  const perWord = span / words.length;
  return words.map((text, i) => {
    const wStart = start + i * perWord;
    const wEnd = wStart + perWord * 0.6;
    let opacity = 0;
    let recent = false;
    if (time >= wStart) {
      opacity = clamp((time - wStart) / (wEnd - wStart), 0, 1);
      opacity = Easing.easeOutCubic(opacity);
      if (time - wStart < perWord * 1.8) recent = true;
    }
    return { text, opacity, recent };
  });
}

// Streaming turns: reveal one turn at a time, character-progressive for the current turn.
// Returns [{speaker, text, revealed (substring)}, ...] up to current time.
function useStreamingTurns(turns, start, end) {
  const time = useTime();
  if (time < start) return [];
  const totalChars = turns.reduce((s, t) => s + t.text.length, 0);
  const charsPerSec = totalChars / Math.max(0.1, (end - start));
  const elapsed = Math.max(0, time - start);
  const charsRevealed = elapsed * charsPerSec;

  const out = [];
  let acc = 0;
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const turnChars = t.text.length;
    if (charsRevealed <= acc) break;
    const localRevealed = Math.min(turnChars, charsRevealed - acc);
    out.push({
      speaker: t.speaker,
      text: t.text,
      revealed: t.text.slice(0, Math.floor(localRevealed)),
      isLast: localRevealed < turnChars,
    });
    acc += turnChars;
  }
  return out;
}

// Progressive name typing, returns substring at time t
function useTypedName(fullName, start, end) {
  const time = useTime();
  if (time < start) return '';
  if (time >= end) return fullName;
  const local = (time - start) / (end - start);
  const n = Math.floor(Easing.easeInOutCubic(local) * fullName.length);
  return fullName.slice(0, n);
}

// Background crossfade between scenes — we just keep one solid bg for now
function StageBackground({ tone }) {
  if (tone === 'transparent') return null;
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: tone,
      zIndex: -1,
    }}/>
  );
}

// ── Scene positions ────────────────────────────────────────────────────
// Card centered. 1280x720 stage.
// Welcome card is ~820 × ~560 (padding reduces inner) - we measure visually.
// Start button is around y=330-ish inside the card, card centered at x=640.
// The card's left edge: (1280-820)/2 = 230. So button center ~ (230+410)=640, y ~ 380

// Compute cursor target coords (stage-px) for the "start a new session" button
const START_BTN = { x: 640, y: 350 };
// Input field (new session screen): center ~ 640, y ~ 320
const INPUT_FIELD = { x: 520, y: 320 };
// Create session button
const CREATE_BTN = { x: 760, y: 452 };
// Record button (speak screen)
const RECORD_BTN = { x: 640, y: 550 };

function CursorTrack() {
  // Timeline of cursor positions
  const stops = [
    // Cursor enters as welcome scene starts
    { t: 0,    x: 1100, y: 560, visible: true },
    { t: 0.4,  x: 1100, y: 560, visible: true, ease: Easing.easeOutCubic },
    // Drifts toward start button
    { t: 1.9,  x: START_BTN.x, y: START_BTN.y, ease: Easing.easeInOutCubic },
    // Hover beat
    { t: 2.8,  x: START_BTN.x, y: START_BTN.y, clickAt: 0.6, ease: Easing.easeOutCubic },
    // Click happens ~3.35
    { t: 3.35, x: START_BTN.x, y: START_BTN.y, ease: Easing.easeOutCubic },
    // Fade to next screen — move toward input field
    { t: 4.8,  x: INPUT_FIELD.x, y: INPUT_FIELD.y, ease: Easing.easeInOutCubic },
    // Click to focus input
    { t: 5.2,  x: INPUT_FIELD.x, y: INPUT_FIELD.y, clickAt: 0.3, ease: Easing.easeOutCubic },
    // Typing beat (cursor stays near input)
    { t: 7.6,  x: INPUT_FIELD.x + 110, y: INPUT_FIELD.y, ease: Easing.easeInOutCubic },
    // Move to create session button
    { t: 8.6,  x: CREATE_BTN.x, y: CREATE_BTN.y, ease: Easing.easeInOutCubic },
    // Click create
    { t: 9.1,  x: CREATE_BTN.x, y: CREATE_BTN.y, clickAt: 0.3, ease: Easing.easeOutCubic },
    // Glide to record button
    { t: 10.4, x: RECORD_BTN.x, y: RECORD_BTN.y, ease: Easing.easeInOutCubic },
    // Click start recording
    { t: 11.0, x: RECORD_BTN.x, y: RECORD_BTN.y, clickAt: 0.25, ease: Easing.easeOutCubic },
    // Drift off while transcription plays
    { t: 12.6, x: 950, y: 600, ease: Easing.easeInOutCubic, visible: true },
    { t: 13.4, x: 1200, y: 700, visible: false },
    { t: 30,   x: 1200, y: 700, visible: false },
  ];
  const state = useCursorState(stops);
  return <Cursor x={state.x} y={state.y} clicking={!!state.clicking} visible={state.visible !== false} />;
}

// ── Scene renderers ─────────────────────────────────────────────────────
function SceneWelcome({ showCompleted }) {
  return (
    <Scene name="welcome">
      {({ localTime, duration }) => {
        const t = useTime();
        // Fade card in, fade out
        const fadeIn = clamp(localTime / 0.55, 0, 1);
        const fadeOut = clamp((duration - localTime) / 0.55, 0, 1);
        const opacity = Easing.easeOutCubic(fadeIn) * Easing.easeInCubic(fadeOut);
        const ty = (1 - Easing.easeOutCubic(fadeIn)) * 12 - (1 - Easing.easeInCubic(fadeOut)) * 8;
        const scale = 0.985 + 0.015 * Easing.easeOutCubic(fadeIn);

        // Button hover / press based on cursor time in scene
        const absStart = SCENES.welcome.start;
        const hoverStart = 4.6 - absStart;
        const pressAt = 5.9 - absStart;
        const btnHover = localTime >= hoverStart && localTime < pressAt + 0.2;
        const btnPressed = localTime >= pressAt && localTime < pressAt + 0.18;

        return (
          <div style={centeredCardWrap(opacity, ty, scale)}>
            <WelcomeScreen buttonHover={btnHover} buttonPressed={btnPressed} completedVisible={showCompleted} />
          </div>
        );
      }}
    </Scene>
  );
}

function SceneNewSessionInner({ localTime, duration }) {
  const fadeIn = clamp(localTime / 0.55, 0, 1);
  const fadeOut = clamp((duration - localTime) / 0.55, 0, 1);
  const opacity = Easing.easeOutCubic(fadeIn) * Easing.easeInCubic(fadeOut);
  const ty = (1 - Easing.easeOutCubic(fadeIn)) * 14 - (1 - Easing.easeInCubic(fadeOut)) * 10;
  const scale = 0.985 + 0.015 * Easing.easeOutCubic(fadeIn);

  const typedName = useTypedName('Patricia Lawson', SCENES.newSess.start + 1.3, SCENES.newSess.start + 3.7);
  const absLocal = SCENES.newSess.start + localTime;
  const inputFocused = absLocal >= SCENES.newSess.start + 0.9 && absLocal < SCENES.newSess.start + 4.2;
  const hoverStart = SCENES.newSess.start + 4.3;
  const pressAt = SCENES.newSess.start + 4.7;
  const createHover = absLocal >= hoverStart && absLocal < pressAt + 0.2;
  const createPressed = absLocal >= pressAt && absLocal < pressAt + 0.18;

  return (
    <div style={centeredCardWrap(opacity, ty, scale)}>
      <NewSessionScreen
        typedName={typedName}
        inputFocused={inputFocused}
        createHover={createHover}
        createPressed={createPressed}
      />
    </div>
  );
}

function SceneNewSession() {
  return (
    <Scene name="newSess">
      {(ctx) => <SceneNewSessionInner localTime={ctx.localTime} duration={ctx.duration} />}
    </Scene>
  );
}

function SceneSpeakInner({ localTime, duration }) {
  const fadeIn = clamp(localTime / 0.55, 0, 1);
  const fadeOut = clamp((duration - localTime) / 0.55, 0, 1);
  const opacity = Easing.easeOutCubic(fadeIn) * Easing.easeInCubic(fadeOut);
  const ty = (1 - Easing.easeOutCubic(fadeIn)) * 14 - (1 - Easing.easeInCubic(fadeOut)) * 10;
  const scale = 0.985 + 0.015 * Easing.easeOutCubic(fadeIn);

  const recStart = SCENES.speak.start + 1.8;
  const absT = SCENES.speak.start + localTime;
  const recording = absT >= recStart;
  const pulse = recording ? (Math.sin((absT - recStart) * 3.5) * 0.5 + 0.5) : 0;

  const turns = [
    { speaker: 'Provider', text: 'How have you been feeling since we started the magnesium?' },
    { speaker: 'Patient',  text: "Honestly, a lot better. My energy is up and I'm sleeping through the night." },
    { speaker: 'Provider', text: "That's great. Any afternoon fatigue still?" },
    { speaker: 'Patient',  text: 'A little, around three. But nothing like before.' },
  ];
  const transcript = useStreamingTurns(turns, recStart + 0.3, recStart + 5.8);

  const emphasize = absT >= SCENES.speak.start + 6.2 && absT < SCENES.speak.start + 8.0;
  const hoverStart = SCENES.speak.start + 1.1;
  const pressAt = SCENES.speak.start + 1.65;
  const btnHover = absT >= hoverStart && absT < pressAt + 0.2;
  const btnPressed = absT >= pressAt && absT < pressAt + 0.18;

  return (
    <div style={centeredCardWrap(opacity, ty, scale)}>
      <ActiveVisitScreen
        step={1}
        recording={recording}
        recordPulse={pulse}
        transcriptTurns={transcript}
        btnHover={btnHover}
        btnPressed={btnPressed}
        emphasize={emphasize}
      />
    </div>
  );
}

function SceneSpeak() {
  return (
    <Scene name="speak">
      {(ctx) => <SceneSpeakInner localTime={ctx.localTime} duration={ctx.duration} />}
    </Scene>
  );
}

function SceneDash2() {
  return (
    <Scene name="dash2">
      {({ localTime, duration }) => {
        const fadeIn = clamp(localTime / 0.55, 0, 1);
        const fadeOut = clamp((duration - localTime) / 0.6, 0, 1);
        const opacity = Easing.easeOutCubic(fadeIn) * Easing.easeInCubic(fadeOut);
        const ty = (1 - Easing.easeOutCubic(fadeIn)) * 14;
        const scale = 0.985 + 0.015 * Easing.easeOutCubic(fadeIn);

        // Completed entry appears 0.9s in (fresh "just finished" beat)
        const completedVisible = localTime >= 0.9;

        return (
          <div style={centeredCardWrap(opacity, ty, scale)}>
            <WelcomeScreen completedVisible={completedVisible} />
          </div>
        );
      }}
    </Scene>
  );
}

function centeredCardWrap(opacity, ty, scale) {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity,
    transform: `translateY(${ty}px) scale(${scale})`,
    willChange: 'transform, opacity',
  };
}

// ── Caption scheduler ────────────────────────────────────────────────
function Captions({ show }) {
  if (!show) return null;
  const t = useTime();
  // 3 callouts overlapping the centered card by ~half their width.
  // Card spans roughly x=390–890 in the 1280-wide stage.
  const caps = [
    {
      at: 1.0,  until: 5.0,
      text: 'Start a visit in seconds.',
      position: { top: 70, right: 260 },
    },
    {
      at: 10.2, until: 17.8,
      text: 'Capture the visit without typing.',
      position: { top: 310, left: 260 },
    },
    {
      at: 19.8, until: 24.4,
      text: 'Finished before you leave the room.',
      position: { bottom: 70, right: 260 },
    },
  ];
  return (
    <>
      {caps.map((c, i) => (
        <Caption
          key={i}
          text={c.text}
          visible={t >= c.at && t <= c.until}
          position={c.position}
        />
      ))}
    </>
  );
}

// ── Main composition ───────────────────────────────────────────────
function Demo({ settings }) {
  return (
    <>
      <StageBackground tone={settings.bgTone} />

      {/* Optional opening headline — overlays intro briefly */}
      {settings.headline !== 'none' && (
        <Sprite start={0} end={2.6}>
          {({ localTime, duration }) => {
            // Also dims the card during headline
            return (
              <>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: settings.bgTone,
                  opacity: clamp((duration - localTime) / 0.6, 0, 1) * 0.92,
                  pointerEvents: 'none', zIndex: 5,
                }}/>
                <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}>
                  <Headline text={settings.headline === 'time'
                    ? "Most clinics don't have a patient problem.\nThey have a time problem."
                    : "Spend more time with patients.\nLess time documenting."} />
                </div>
              </>
            );
          }}
        </Sprite>
      )}

      <SceneWelcome showCompleted={false} />
      <SceneNewSession />
      <SceneSpeak />
      <SceneDash2 />

      {settings.captions && <Captions show={true} />}
      {settings.cursor && <CursorTrack />}

      {/* Subtle loop transition vignette at very end */}
      <Sprite start={23.8} end={TOTAL}>
        {({ localTime, duration }) => {
          const t = localTime / duration;
          return (
            <div style={{
              position: 'absolute', inset: 0,
              background: settings.bgTone,
              opacity: Easing.easeInCubic(t) * 0.7,
              pointerEvents: 'none',
            }}/>
          );
        }}
      </Sprite>
    </>
  );
}

Object.assign(window, {
  Demo, TOTAL, SCENES,
});
