// SVG手描きチャート群：二本線（温度）、ドーナツ（話題）、天秤（非対称）、時間帯の帯（リズム）
// ローズ＝あなた、ラベンダー＝相手 を全チャートで一貫させる。

const ROSE = "#e88aa8";
const LAV = "#a99ae0";

/** 温度差グラフ：好き度の一本線は使わず、二本線の隙間で温度差を語る */
export function TwoLineChart({
  series,
  labels,
  height = 170,
}: {
  series: [number[], number[]];
  labels: string[];
  height?: number;
}) {
  const W = 340;
  const H = height;
  const pad = { l: 30, r: 10, t: 12, b: 22 };
  const n = series[0].length;
  if (n === 0) return null;
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  // 隙間を淡く塗る
  const area =
    series[0].map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") +
    " " +
    [...series[1]].reverse().map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") +
    " Z";
  const ticks = [0, 50, 100];
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#f3dde6" strokeDasharray="3 4" />
          <text x={pad.l - 6} y={y(t) + 3} fontSize={9} fill="#c2afba" textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      <path d={area} fill={ROSE} opacity={0.07} />
      <path d={path(series[1])} fill="none" stroke={LAV} strokeWidth={2.2} strokeLinecap="round" />
      <path d={path(series[0])} fill="none" stroke={ROSE} strokeWidth={2.2} strokeLinecap="round" />
      {n <= 40 &&
        series.map((arr, si) =>
          arr.map((v, i) => (
            <circle key={`${si}-${i}`} cx={x(i)} cy={y(v)} r={2.4} fill={si === 0 ? ROSE : LAV} />
          ))
        )}
      {labelIdx.map((i) => (
        <text key={i} x={x(i)} y={H - 6} fontSize={9.5} fill="#c2afba" textAnchor="middle">
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

const DONUT_COLORS = ["#e88aa8", "#a99ae0", "#f0b1c6", "#c9bdec", "#e8c46a", "#9fd0c3", "#e6d9de"];

export function Donut({ slices, centerLabel }: { slices: { name: string; ratio: number }[]; centerLabel: string }) {
  const R = 62;
  const r = 38;
  const C = 80;
  let acc = -Math.PI / 2;
  const arcs = slices.map((s, i) => {
    const a0 = acc;
    const a1 = (acc += s.ratio * Math.PI * 2);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a: number, rad: number) => `${(C + Math.cos(a) * rad).toFixed(2)},${(C + Math.sin(a) * rad).toFixed(2)}`;
    return (
      <path
        key={s.name}
        d={`M${p(a0, R)} A${R},${R} 0 ${large} 1 ${p(a1, R)} L${p(a1, r)} A${r},${r} 0 ${large} 0 ${p(a0, r)} Z`}
        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
        opacity={0.9}
      />
    );
  });
  return (
    <svg viewBox="0 0 160 160" style={{ width: 170, display: "block", margin: "0 auto" }}>
      {arcs}
      <text x={C} y={C - 2} textAnchor="middle" fontSize={11} fill="#9a8a92" fontWeight={700}>
        {centerLabel}
      </text>
      <text x={C} y={C + 13} textAnchor="middle" fontSize={10} fill="#c2afba">
        の割合
      </text>
    </svg>
  );
}

export function donutColor(i: number) {
  return DONUT_COLORS[i % DONUT_COLORS.length];
}

/** 吹き出し天秤：発信が偏ると自分側の吹き出しが重くなり傾く */
export function Balance({ youRatio, youName, partnerName }: { youRatio: number; youName: string; partnerName: string }) {
  const W = 320;
  const H = 170;
  const tilt = (youRatio - 0.5) * 26; // 度
  const cx = W / 2;
  const beamY = 78;
  const armLen = 108;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - Math.cos(rad) * armLen;
  const ly = beamY - Math.sin(-rad) * armLen;
  const rx = cx + Math.cos(rad) * armLen;
  const ry = beamY + Math.sin(-rad) * armLen;
  const youPct = Math.round(youRatio * 100);
  const bubble = (x: number, y: number, color: string, scale: number, flip: boolean) => (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-26} y={-40} width={52} height={34} rx={12} fill={color} opacity={0.9} />
      <path d={flip ? "M8,-8 L16,2 L2,-6 Z" : "M-8,-8 L-16,2 L-2,-6 Z"} fill={color} opacity={0.9} />
      <circle cx={-9} cy={-23} r={2.4} fill="#fff" />
      <circle cx={0} cy={-23} r={2.4} fill="#fff" />
      <circle cx={9} cy={-23} r={2.4} fill="#fff" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      {/* 支柱 */}
      <path d={`M${cx - 16},${H - 14} L${cx + 16},${H - 14} L${cx + 5},${beamY} L${cx - 5},${beamY} Z`} fill="#f0cdd9" />
      <circle cx={cx} cy={beamY} r={6} fill="#e0648d" />
      {/* 梁 */}
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#d9aabb" strokeWidth={5} strokeLinecap="round" />
      {/* 皿と吹き出し（重い側が下がる＝比率が大きい側） */}
      <line x1={lx} y1={ly} x2={lx} y2={ly + 16} stroke="#d9aabb" strokeWidth={2} />
      <ellipse cx={lx} cy={ly + 20} rx={30} ry={6} fill="#f6dbe5" />
      {bubble(lx, ly + 16, ROSE, 0.6 + youRatio * 0.8, false)}
      <line x1={rx} y1={ry} x2={rx} y2={ry + 16} stroke="#d9aabb" strokeWidth={2} />
      <ellipse cx={rx} cy={ry + 20} rx={30} ry={6} fill="#e9e3f8" />
      {bubble(rx, ry + 16, LAV, 0.6 + (1 - youRatio) * 0.8, true)}
      {/* ラベル */}
      <text x={lx} y={H - 24} textAnchor="middle" fontSize={11} fill="#9a8a92">
        {youName}
      </text>
      <text x={lx} y={H - 8} textAnchor="middle" fontSize={15} fontWeight={700} fill={ROSE}>
        {youPct}%
      </text>
      <text x={rx} y={H - 24} textAnchor="middle" fontSize={11} fill="#9a8a92">
        {partnerName}
      </text>
      <text x={rx} y={H - 8} textAnchor="middle" fontSize={15} fontWeight={700} fill={LAV}>
        {100 - youPct}%
      </text>
    </svg>
  );
}

/** 24時間の活動帯。ふたりの重なりが見える */
export function HourBands({ you, partner }: { you: number[]; partner: number[] }) {
  const W = 330;
  const rowH = 26;
  const pad = 30;
  const bw = (W - pad - 6) / 24;
  const row = (arr: number[], yBase: number, color: string) =>
    arr.map((v, h) => (
      <rect
        key={h}
        x={pad + h * bw + 1}
        y={yBase + (1 - v) * (rowH - 6)}
        width={bw - 2}
        height={Math.max(2, v * (rowH - 6))}
        rx={2}
        fill={color}
        opacity={0.25 + v * 0.65}
      />
    ));
  return (
    <svg viewBox={`0 0 ${W} 96`} style={{ width: "100%" }}>
      <text x={2} y={18} fontSize={10} fill={ROSE} fontWeight={700}>
        ♥
      </text>
      {row(you, 4, ROSE)}
      <text x={2} y={18 + rowH + 8} fontSize={10} fill={LAV} fontWeight={700}>
        ♦
      </text>
      {row(partner, 4 + rowH + 8, LAV)}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={pad + h * bw + bw / 2} y={92} fontSize={9} fill="#c2afba" textAnchor="middle">
          {h}時
        </text>
      ))}
    </svg>
  );
}

/** 横棒の比率バー（機能分類など） */
export function RatioBar({ left, right }: { left: number; right: number }) {
  const total = left + right || 1;
  return (
    <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: "#f6eef2" }}>
      <div style={{ width: `${(left / total) * 100}%`, background: ROSE, opacity: 0.85 }} />
      <div style={{ width: `${(right / total) * 100}%`, background: LAV, opacity: 0.85 }} />
    </div>
  );
}
