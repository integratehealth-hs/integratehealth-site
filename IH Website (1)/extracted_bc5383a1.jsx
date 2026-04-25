// screens.jsx — Integrate Health UI screens, pixel-matched to reference.
// All screens render inside an 820×520 card area. They expose animatable state
// via props so the timeline can drive them.

const IH_TEAL = '#2FB4BF';          // primary accent (button fill top)
const IH_TEAL_DEEP = '#1E8A94';     // button fill bottom / active
const IH_TEAL_SOFT = '#BFE5E9';     // disabled button / light fill
const IH_BORDER = '#9FD8DE';        // input + card outlines
const IH_TEXT = '#2B3741';          // primary dark text (slate)
const IH_TEXT_MUTED = '#6C7680';    // secondary
const IH_TEXT_SOFT = '#A8B0B8';     // placeholders
const IH_BG_CARD = '#F4F6F7';       // screen card bg
const IH_BG_PAGE = '#FFFFFF';       // stage bg
const IH_INACTIVE = '#D5DADE';      // inactive step ring

// Serif + sans pairing — matches the reference (serif italic headings, sans body)
const FONT_SERIF = "'Petrona', Georgia, serif";
const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

// ── Welcome screen ──────────────────────────────────────────────────────────
function WelcomeScreen({ buttonHover = false, buttonPressed = false, completedVisible = true }) {
  const btnScale = buttonPressed ? 0.985 : (buttonHover ? 1.008 : 1);
  const btnShadow = buttonPressed
    ? '0 2px 8px rgba(30,138,148,0.25)'
    : (buttonHover
      ? '0 10px 28px rgba(30,138,148,0.32)'
      : '0 6px 18px rgba(30,138,148,0.22)');

  return (
    <div style={screenCardStyle}>
      <div style={{ padding: '36px 36px 32px' }}>
        <div style={{
          fontFamily: FONT_SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 36,
          color: IH_TEXT,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>welcome back</div>
        <div style={{
          fontFamily: FONT_SANS,
          fontSize: 15,
          color: IH_TEXT_MUTED,
          marginTop: 10,
        }}>Here's your practice overview</div>

        {/* Primary CTA */}
        <div style={{
          marginTop: 34,
          height: 88,
          borderRadius: 14,
          background: `linear-gradient(180deg, #6FCFD6 0%, ${IH_TEAL} 45%, ${IH_TEAL_DEEP} 100%)`,
          boxShadow: btnShadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          fontFamily: FONT_SANS,
          fontSize: 22,
          fontWeight: 400,
          transform: `scale(${btnScale})`,
          transformOrigin: 'center',
          transition: 'transform 120ms ease, box-shadow 180ms ease',
          cursor: 'pointer',
          letterSpacing: '0.01em',
        }}>start a new session</div>

        {/* Recent activity */}
        <div style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 22,
              color: IH_TEXT,
              whiteSpace: 'nowrap',
            }}>Recent Activity</div>
            <div style={{
              fontFamily: FONT_SANS,
              fontSize: 13,
              color: IH_TEAL_DEEP,
            }}>view all →</div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Patricia — the just-finished entry; animates in */}
            <RecentItem
              date="Dec 18, 9:24 AM"
              patient="Patricia Lawson"
              visit="Follow Up Visit"
              status="completed"
              visible={completedVisible}
              collapsible={true}
            />
            <RecentItem
              date="Dec 17, 3:10 PM"
              patient="Marcus Chen"
              visit="Initial Consult"
              status="completed"
              visible={true}
            />
            <RecentItem
              date="Dec 15, 11:45 AM"
              patient="Elena Rivera"
              visit="Follow Up Visit"
              status="completed"
              visible={true}
            />
            <RecentItem
              date="Dec 11, 2:00 PM"
              patient="Jordan Okafor"
              visit="Lab Review"
              status="completed"
              visible={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Session modal/card ─────────────────────────────────────────────────
function NewSessionScreen({ typedName = '', inputFocused = false, createHover = false, createPressed = false }) {
  const hasInput = typedName.length > 0;
  const createActive = hasInput;
  const createBg = !createActive
    ? IH_TEAL_SOFT
    : (createPressed ? IH_TEAL_DEEP : IH_TEAL);
  const createShadow = !createActive
    ? 'none'
    : (createHover ? '0 8px 20px rgba(30,138,148,0.28)' : '0 4px 12px rgba(30,138,148,0.18)');
  const createScale = createPressed ? 0.985 : (createHover && createActive ? 1.01 : 1);

  return (
    <div style={screenCardStyle}>
      <div style={{ padding: '36px 36px 32px' }}>
        <div style={{
          fontFamily: FONT_SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 28,
          color: IH_TEXT,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}>New Patient Session</div>

        {/* Input */}
        <div style={{
          marginTop: 26,
          height: 54,
          borderRadius: 10,
          border: `2px solid ${inputFocused ? IH_TEAL : IH_BORDER}`,
          background: '#fff',
          display: 'flex', alignItems: 'center',
          padding: '0 22px',
          transition: 'border-color 180ms ease, box-shadow 180ms ease',
          boxShadow: inputFocused ? '0 0 0 4px rgba(47,180,191,0.12)' : 'none',
          position: 'relative',
        }}>
          <div style={{
            fontFamily: FONT_SANS,
            fontSize: 17,
            color: hasInput ? IH_TEXT : IH_TEXT_SOFT,
            whiteSpace: 'pre',
          }}>
            {hasInput ? typedName : 'Patient name or ID'}
          </div>
          {inputFocused && (
            <div style={{
              width: 1.5,
              height: 20,
              background: IH_TEAL_DEEP,
              marginLeft: 1,
              animation: 'ih-caret 1s step-end infinite',
            }}/>
          )}
        </div>

        <div style={{
          marginTop: 14,
          fontFamily: FONT_SANS,
          fontSize: 13,
          color: IH_TEXT_MUTED,
          fontWeight: 500,
        }}>Friday, December 18</div>

        {/* Buttons row */}
        <div style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}>
          <div style={{
            height: 56,
            borderRadius: 10,
            border: `2px solid ${IH_BORDER}`,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_SANS,
            fontSize: 16,
            color: IH_TEXT,
            cursor: 'pointer',
          }}>cancel</div>
          <div style={{
            height: 56,
            borderRadius: 10,
            background: createBg,
            boxShadow: createShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_SANS,
            fontSize: 16,
            color: createActive ? '#fff' : IH_TEXT_SOFT,
            transform: `scale(${createScale})`,
            transition: 'background 200ms ease, color 200ms ease, box-shadow 180ms ease, transform 120ms ease',
            cursor: createActive ? 'pointer' : 'default',
          }}>create session</div>
        </div>
      </div>
    </div>
  );
}

// ── Active Visit / Speak screen ────────────────────────────────────────────
function ActiveVisitScreen({
  step = 1,           // 1=speak, 2=summarize, 3=sync
  recording = false,  // has user clicked start?
  recordPulse = 0,    // 0..1 breathing pulse value
  transcriptTurns = [], // [{speaker, text, revealed, isLast}]
  btnHover = false,
  btnPressed = false,
  emphasize = false,  // scene 4 emphasis on Speak step
}) {
  return (
    <div style={screenCardStyle}>
      <div style={{ padding: '30px 34px 34px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 30,
              color: IH_TEXT,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>Patricia Lawson</div>
            <div style={{
              marginTop: 10,
              fontFamily: FONT_SANS,
              fontSize: 13,
              color: IH_TEXT_MUTED,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontStyle: 'italic', fontFamily: FONT_SERIF, fontSize: 14 }}>Follow Up Visit</span>
              {'  •  Dec 18  •  9:24 AM'}
            </div>
          </div>
          <div style={{ opacity: 0.5, paddingTop: 6 }}>
            <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
              <path d="M3 6h12M8 10v5M10 10v5M6 6l1-3h4l1 3M4 6v12a1 1 0 001 1h8a1 1 0 001-1V6" stroke={IH_TEXT_MUTED} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Stepper */}
        <div style={{
          marginTop: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0,
          transform: emphasize ? 'scale(1.04)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 500ms cubic-bezier(.4,.1,.2,1)',
        }}>
          <Step num={1} label="speak" active={step === 1} done={step > 1} emphasize={emphasize && step === 1} />
          <StepConnector active={step > 1} />
          <Step num={2} label="summarize" active={step === 2} done={step > 2} />
          <StepConnector active={step > 2} />
          <Step num={3} label="sync" active={step === 3} done={false} />
        </div>

        {/* Transcript area */}
        <div style={{
          marginTop: 30,
          minHeight: 148,
          maxHeight: 148,
          borderRadius: 10,
          border: `2px solid ${recording ? IH_TEAL : IH_BORDER}`,
          background: '#fff',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: recording ? 'flex-start' : 'center',
          alignItems: recording ? 'stretch' : 'center',
          transition: 'border-color 260ms ease, box-shadow 260ms ease',
          boxShadow: recording ? `0 0 0 4px rgba(47,180,191,0.10)` : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!recording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LoadingRing />
              <div style={{
                fontFamily: FONT_SANS,
                fontSize: 17,
                color: IH_TEXT,
              }}>Transcribing...</div>
            </div>
          ) : (
            <TranscriptConversation turns={transcriptTurns} />
          )}
        </div>

        {/* Record button */}
        <div style={{
          marginTop: 18,
          height: 62,
          borderRadius: 10,
          background: recording
            ? `linear-gradient(180deg, #1E5E68 0%, #0F3E47 100%)`
            : `linear-gradient(180deg, #6FCFD6 0%, ${IH_TEAL} 50%, ${IH_TEAL_DEEP} 100%)`,
          boxShadow: btnPressed
            ? '0 2px 8px rgba(30,138,148,0.2)'
            : (btnHover ? '0 10px 24px rgba(30,138,148,0.30)' : '0 6px 16px rgba(30,138,148,0.20)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          color: '#fff',
          fontFamily: FONT_SANS,
          fontSize: 17,
          fontWeight: 400,
          transform: `scale(${btnPressed ? 0.985 : (btnHover ? 1.006 : 1)})`,
          transition: 'transform 120ms ease, box-shadow 180ms ease, background 300ms ease',
          cursor: 'pointer',
          letterSpacing: '0.01em',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {recording && (
            <div style={{
              width: 10, height: 10, borderRadius: 5,
              background: '#fff',
              opacity: 0.6 + 0.4 * recordPulse,
              boxShadow: `0 0 ${6 + 10 * recordPulse}px rgba(255,255,255,${0.5 * recordPulse})`,
            }}/>
          )}
          {recording ? 'stop recording' : 'start recording'}
        </div>
      </div>
    </div>
  );
}

function RecentItem({ date, patient, visit, status, visible, collapsible = false }) {
  const wrapperStyle = collapsible ? {
    maxHeight: visible ? 80 : 0,
    marginBottom: visible ? 0 : -8, // cancel parent gap when collapsed
    overflow: 'hidden',
    transition: 'max-height 420ms cubic-bezier(.4,.1,.2,1), margin-bottom 420ms cubic-bezier(.4,.1,.2,1)',
  } : null;
  const item = (
    <div style={{
      padding: '10px 14px',
      border: `1px solid ${IH_BORDER}`,
      borderRadius: 10,
      background: '#fff',
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 8}px)`,
      transition: 'opacity 320ms ease, transform 320ms ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 10,
      }}>
        <div style={{
          fontFamily: FONT_SANS,
          fontSize: 13.5,
          color: IH_TEXT,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {patient}
          <span style={{ color: IH_TEXT_MUTED, fontWeight: 400 }}> — {visit}</span>
        </div>
        <div style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          color: IH_TEXT_MUTED,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>{date}</div>
      </div>
      <div style={{
        fontFamily: FONT_SERIF,
        fontStyle: 'italic',
        fontSize: 12,
        color: IH_TEAL_DEEP,
        marginTop: 2,
      }}>{status}</div>
    </div>
  );
  return collapsible ? <div style={wrapperStyle}>{item}</div> : item;
}

function Step({ num, label, active, done, emphasize }) {
  const circleBg = active ? IH_TEAL_DEEP : (done ? IH_TEAL : '#fff');
  const circleBorder = active || done ? 'transparent' : IH_INACTIVE;
  const circleColor = active || done ? '#fff' : IH_TEXT_SOFT;
  const labelColor = active ? IH_TEAL_DEEP : (done ? IH_TEXT_MUTED : IH_TEXT_SOFT);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: emphasize ? 42 : 36,
        height: emphasize ? 42 : 36,
        borderRadius: 999,
        background: circleBg,
        border: `1.5px solid ${circleBorder}`,
        color: circleColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_SANS,
        fontWeight: 600,
        fontSize: emphasize ? 17 : 15,
        transition: 'width 300ms ease, height 300ms ease, background 300ms ease, font-size 300ms ease, box-shadow 300ms ease',
        boxShadow: emphasize ? `0 0 0 6px rgba(47,180,191,0.18)` : 'none',
      }}>{done ? '✓' : num}</div>
      <div style={{
        marginTop: 8,
        fontFamily: FONT_SANS,
        fontSize: 13,
        color: labelColor,
        fontStyle: active ? 'normal' : 'normal',
        fontWeight: active ? 500 : 400,
        transition: 'color 300ms ease',
      }}>{label}</div>
    </div>
  );
}

function StepConnector({ active }) {
  return (
    <div style={{
      width: 52,
      height: 1.5,
      background: IH_INACTIVE,
      margin: '0 10px',
      marginBottom: 24, // align with circle center
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: IH_TEAL,
        transform: `scaleX(${active ? 1 : 0})`,
        transformOrigin: 'left',
        transition: 'transform 500ms ease',
      }}/>
    </div>
  );
}

function LoadingRing() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 999,
      border: `2.5px solid ${IH_BORDER}`,
      borderTopColor: IH_TEAL,
      borderRightColor: IH_TEAL,
      animation: 'ih-spin 1.1s linear infinite',
    }}/>
  );
}

function TranscriptConversation({ turns }) {
  // Auto-scroll container keeps latest turn in view
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns.map(t => t.revealed).join('|')]);

  return (
    <div ref={scrollRef} style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      fontFamily: FONT_SANS,
    }}>
      {turns.map((turn, i) => {
        const isPatient = turn.speaker === 'Patient';
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <div style={{
              flexShrink: 0,
              width: 66,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isPatient ? IH_TEAL_DEEP : IH_TEXT_MUTED,
              paddingTop: 3,
            }}>{turn.speaker}</div>
            <div style={{
              flex: 1,
              fontSize: 14.5,
              lineHeight: 1.5,
              color: IH_TEXT,
            }}>
              {turn.revealed}
              {turn.isLast && (
                <span style={{
                  display: 'inline-block',
                  width: 2, height: 15,
                  background: IH_TEAL,
                  marginLeft: 2,
                  verticalAlign: '-3px',
                  animation: 'ih-caret 0.9s step-end infinite',
                }}/>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TranscriptView({ words }) {
  return (
    <div style={{
      fontFamily: FONT_SANS,
      fontSize: 15,
      color: IH_TEXT,
      lineHeight: 1.55,
      width: '100%',
      minHeight: 84,
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'flex-start',
    }}>
      {words.map((w, i) => (
        <span key={i} style={{
          marginRight: 6,
          opacity: w.opacity,
          color: w.recent ? IH_TEAL_DEEP : IH_TEXT,
          transition: 'color 400ms ease',
          fontStyle: w.recent ? 'normal' : 'normal',
        }}>{w.text}</span>
      ))}
      {/* Typing cursor */}
      <span style={{
        display: 'inline-block',
        width: 2, height: 18,
        background: IH_TEAL,
        marginLeft: 2,
        animation: 'ih-caret 0.9s step-end infinite',
      }}/>
    </div>
  );
}

// ── Shared screen card ─────────────────────────────────────────────────────
const screenCardStyle = {
  width: 500,
  minHeight: 640,
  background: IH_BG_CARD,
  borderRadius: 20,
  boxShadow: '0 30px 80px rgba(30,55,65,0.14), 0 8px 24px rgba(30,55,65,0.06)',
  overflow: 'hidden',
  position: 'relative',
};

// Expose globally for other babel scripts
Object.assign(window, {
  WelcomeScreen,
  NewSessionScreen,
  ActiveVisitScreen,
  IH_TEAL, IH_TEAL_DEEP, IH_TEAL_SOFT, IH_BORDER,
  IH_TEXT, IH_TEXT_MUTED, IH_TEXT_SOFT,
  IH_BG_CARD, IH_BG_PAGE,
  FONT_SERIF, FONT_SANS,
});
