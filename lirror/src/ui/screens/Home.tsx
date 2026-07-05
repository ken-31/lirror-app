import { useStore, todayStr } from "../../store/store";
import { WEATHER_INFO, recentTempShare, tempShareText, aiHitokoto, daysBetween, mdLabel } from "../helpers";
import { TwoLineChart } from "../components/charts";
import type { Tab } from "../../App";

export function Home({ go }: { go: (t: Tab) => void }) {
  const { analysis, profile, omamoris } = useStore();
  const today = todayStr();
  const todayOmamori = omamoris.find((o) => o.date === today);

  return (
    <div className="fade-in">
      {/* 上部＝イラストを見せるロゴの空間。視線は自然と下のUIへ */}
      <div className="home-hero-space">
        <h1 className="brand">
          Lirror<span style={{ fontSize: "0.5em" }}>.</span>
        </h1>
        <div className="home-tagline">ふたりの関係を、やさしく映す鏡。</div>
        <div className="home-lead">
          ふたりのLINEを、
          <br />
          「わたし」を知るヒントに。
        </div>
      </div>

      {analysis ? (
        <div className="cols">
          <div>
            {/* プロフィールカード */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                <span
                  style={{
                    width: 40, height: 40, borderRadius: "50%", background: "var(--rose-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, zIndex: 1,
                  }}
                >
                  🌷
                </span>
                <span
                  style={{
                    width: 40, height: 40, borderRadius: "50%", background: "var(--lavender-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: -10,
                  }}
                >
                  🌙
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {analysis.you} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>と</span> {analysis.partner}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {profile.anniversary
                    ? `付き合って ${daysBetween(profile.anniversary, today)} 日目 💗`
                    : `トークをはじめて ${daysBetween(analysis.firstDate, today)} 日目`}
                </div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 20 }}>💗</span>
            </div>

            {/* 今日のふたり＝天気 */}
            <div className="card weather-card">
              <div className="weather-emoji">{WEATHER_INFO[analysis.weather].emoji}</div>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>今日のふたり</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{WEATHER_INFO[analysis.weather].label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.7 }}>{analysis.weatherReason}</div>
              </div>
            </div>

            <div className="grid2 grid-wrap">
              <div className="card card-link" onClick={() => go("analysis")}>
                <div className="card-title">🌡️ 温度差</div>
                <div className="big-num" style={{ color: "var(--rose-strong)" }}>
                  {Math.round(recentTempShare(analysis) * 100)}
                  <small>%</small>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{tempShareText(recentTempShare(analysis))}</div>
                <TwoLineChart
                  series={[analysis.days.slice(-14).map((d) => d.temp[0]), analysis.days.slice(-14).map((d) => d.temp[1])]}
                  labels={analysis.days.slice(-14).map((d) => mdLabel(d.date))}
                  height={70}
                />
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div className="card card-link" onClick={() => go("analysis")}>
                  <div className="card-title">⚖️ 吹き出し天秤</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {analysis.asymmetry.score > 0.55 ? "ややあなた多め" : analysis.asymmetry.score < 0.45 ? "やや相手多め" : "いいバランス"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    あなた {Math.round(analysis.asymmetry.score * 100)}%
                  </div>
                </div>
                <div className="card card-link" onClick={() => go("analysis")}>
                  <div className="card-title">⏱️ 返信速度</div>
                  <div className="big-num" style={{ fontSize: 24, color: "var(--rose-strong)" }}>
                    {analysis.rhythm.avgReplyMin[1]}
                    <small>分</small>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>相手の平均</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* 今日のお守り入口 */}
            <div className="card card-link" onClick={() => go("you")} style={{ background: "linear-gradient(135deg, #f3effc, #fdeef4)" }}>
              <div className="card-title">🍀 今日のお守り</div>
              {todayOmamori ? (
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.8 }}>{todayOmamori.message}</div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  今日の気持ちを選んで、世界に一枚のお守りを受け取ろう →
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">🐈 白猫のひとこと</div>
              <div className="ai-row">
                <img className="ai-avatar" src="/assets/cat.png" alt="案内役の白猫" />
                <div className="ai-bubble">{aiHitokoto(analysis)}</div>
              </div>
              <div className="note" style={{ marginTop: 8 }}>※ v1.0 は端末内テンプレートで生成しています（送信ゼロ）</div>
            </div>

            <div className="card" style={{ textAlign: "center" }}>
              <img
                src="/assets/bear.png"
                alt=""
                style={{ width: "58%", maxWidth: 190, borderRadius: 20, display: "block", margin: "4px auto 8px" }}
              />
              <div className="note">気になったことがあったら、「分析」でふたりの今を見に行こう🪞</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="home-load-bottom">
          <button className="btn btn-main" onClick={() => go("analysis")}>
            LINEを読み込む
          </button>
        </div>
      )}
    </div>
  );
}
