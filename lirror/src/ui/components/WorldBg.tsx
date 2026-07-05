// 世界観レイヤー ──『恋愛を映す鏡の世界』の背景。
// 三日月・星・雲・舞う花びら・きらめく光の粒子を、画面のいちばん奥に敷く。

const PETALS = Array.from({ length: 10 }, (_, i) => ({
  left: (i * 37 + 8) % 100,
  delay: (i * 2.3) % 14,
  dur: 11 + (i % 5) * 2.4,
  size: 10 + (i % 4) * 4,
  sway: i % 2 === 0 ? 1 : -1,
}));

const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 53 + 13) % 100,
  top: (i * 31 + 7) % 92,
  delay: (i * 1.1) % 6,
  size: i % 3 === 0 ? 14 : 9,
  blue: i % 4 === 0,
}));

function Petal({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        d="M12 2 C17 6 18 12 12 22 C6 12 7 6 12 2 Z"
        fill="#f6b8cd"
        opacity="0.75"
      />
      <path d="M12 5 C15 8 15.5 12 12 19" stroke="#ee9cba" strokeWidth="0.8" fill="none" opacity="0.6" />
    </svg>
  );
}

export function WorldBg() {
  return (
    <div className="world-bg" aria-hidden>
      {/* 三日月とほのかな光 */}
      <svg className="world-moon" viewBox="0 0 120 120" width="110" height="110">
        <defs>
          <radialGradient id="moonglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fdf0c0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fdf0c0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#moonglow)" opacity="0.55" />
        <path
          d="M74 22 A40 40 0 1 0 98 74 A32 32 0 1 1 74 22 Z"
          fill="#f8df9d"
          opacity="0.9"
        />
      </svg>

      {/* 遠くの雲 */}
      <div className="world-cloud c1">☁️</div>
      <div className="world-cloud c2">☁️</div>

      {/* きらめく光の粒子 */}
      {SPARKLES.map((s, i) => (
        <svg
          key={`s${i}`}
          className="world-sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
          viewBox="0 0 24 24"
          width={s.size}
          height={s.size}
        >
          <path
            d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
            fill={s.blue ? "#b9d9f2" : "#f4cfa4"}
          />
        </svg>
      ))}

      {/* 舞い落ちる花びら */}
      {PETALS.map((p, i) => (
        <div
          key={`p${i}`}
          className="world-petal"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ["--sway" as string]: p.sway,
          }}
        >
          <Petal size={p.size} />
        </div>
      ))}
    </div>
  );
}
