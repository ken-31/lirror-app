import { useRef, useState, type ReactNode } from "react";
import { parseLineTalk, pickTopTwo, type ParsedTalk } from "../../parser/lineParser";
import { analyze } from "../../core/analyze";
import { generateSampleTalk, SAMPLE_YOU } from "../../data/sample";
import { useStore } from "../../store/store";
import { TwoLineChart, Donut, donutColor, Balance, HourBands, RatioBar } from "../components/charts";
import { WEATHER_INFO, mdLabel, balanceText, aiHitokoto } from "../helpers";
import { Emj } from "../components/Emj";

type SubTab = "temp" | "balance" | "topic" | "rhythm";
type Period = 7 | 30 | 90;

export function AnalysisScreen() {
  const { analysis, setAnalysis } = useStore();
  const [pendingTalk, setPendingTalk] = useState<ParsedTalk | null>(null);
  const [sub, setSub] = useState<SubTab>("temp");
  const [period, setPeriod] = useState<Period>(30);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [mirroring, setMirroring] = useState(false); // 鏡に映す演出
  const fileRef = useRef<HTMLInputElement>(null);

  const handleText = (text: string, youName?: string) => {
    setError("");
    const talk = pickTopTwo(parseLineTalk(text));
    if (talk.messages.length < 10 || talk.participants.length < 2) {
      setError("トーク履歴として読み取れませんでした。LINEの「トーク履歴を送信」で保存した .txt を選んでください。");
      return;
    }
    // トークが鏡へ吸い込まれる演出（処理自体は一瞬で終わる）
    setMirroring(true);
    setTimeout(() => {
      if (youName) {
        setAnalysis(analyze(talk, youName));
      } else {
        setPendingTalk(talk); // 「あなたはどっち？」を聞く
      }
      setMirroring(false);
    }, 1400);
  };

  const mirrorOverlay = mirroring && (
    <div className="mirror-loading">
      <div className="mirror-ring">
        <span><Emj name="mirror" size={36} /></span>
      </div>
      <div className="ml-text">鏡に映しています…</div>
      <div className="ml-sub"><Emj name="lock" /> トークは端末の外に出ません</div>
    </div>
  );

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => handleText(String(reader.result));
    reader.readAsText(f);
  };

  // ---------- 読み込み画面 ----------
  if (!analysis) {
    return (
      <div className="fade-in">
        {mirrorOverlay}
        <h2 className="screen-title"><Emj name="chat" /> LINE分析</h2>

        {pendingTalk ? (
          <div className="card narrow" style={{ textAlign: "center" }}>
            <div className="card-title" style={{ justifyContent: "center" }}>あなたはどちらですか？</div>
            <p className="note" style={{ marginTop: 0 }}>ローズ＝あなた、ラベンダー＝相手として全画面で色分けします</p>
            <div className="select-grid cols2">
              {pendingTalk.participants.map((p) => (
                <button key={p} className="select-cell" style={{ padding: 14 }}
                  onClick={() => { setAnalysis(analyze(pendingTalk, p)); setPendingTalk(null); }}>
                  <Emj name="flowers" /> {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cols">
            <div>
            <div
              className={`dropzone ${drag ? "drag" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <div><Emj name="doc" size={36} /></div>
              <div style={{ fontWeight: 700, margin: "6px 0" }}>トーク履歴（.txt）をここにドロップ</div>
              <div className="note">またはタップしてファイルを選択</div>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            {error && (
              <div className="card" style={{ borderColor: "var(--rose)", color: "var(--rose-strong)", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ margin: "14px 0" }}>
              <button className="btn btn-sub" onClick={() => handleText(generateSampleTalk(), SAMPLE_YOU)}>
                <Emj name="flowers" /> サンプルデータで試してみる
              </button>
            </div>
            </div>
            <div>
            <div className="privacy">
              <Emj name="lock" /> <b>あなたのトークは端末から出ません。</b>
              <br />
              分析はすべてこの端末の中だけで行われ、ネットワークへの送信はゼロです。保存されるのは集計結果だけで、トーク本文は保持しません。
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-title"><Emj name="phone" /> トーク履歴の保存方法</div>
              <ol style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 2, margin: 0, paddingLeft: 18 }}>
                <li>LINEで相手とのトークを開く</li>
                <li>右上メニュー → その他（設定）</li>
                <li>「トーク履歴を送信」で .txt を保存</li>
              </ol>
            </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- 分析結果 ----------
  const days = analysis.days.slice(-period);
  const a = analysis.asymmetry;

  return (
    <div className="fade-in">
      <h2 className="screen-title"><Emj name="chat" /> LINE分析</h2>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div className="segment">
          {(
            [
              ["temp", <><Emj name="thermo" /> 温度</>],
              ["balance", <><Emj name="scales" /> 天秤</>],
              ["topic", <><Emj name="map" /> 話題</>],
              ["rhythm", <><Emj name="clock" /> リズム</>],
            ] as [SubTab, ReactNode][]
          ).map(([id, label]) => (
            <button key={id} className={sub === id ? "on" : ""} onClick={() => setSub(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {sub === "temp" && (
        <div className="cols">
          <div className="card">
            <div className="card-title"><Emj name="thermo" /> 温度差グラフ</div>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div className="segment">
                {([7, 30, 90] as Period[]).map((p) => (
                  <button key={p} className={period === p ? "on" : ""} onClick={() => setPeriod(p)}>
                    {p}日間
                  </button>
                ))}
              </div>
            </div>
            <TwoLineChart
              series={[days.map((d) => d.temp[0]), days.map((d) => d.temp[1])]}
              labels={days.map((d) => mdLabel(d.date))}
            />
            <div className="legend">
              <span><span className="dot" style={{ background: "var(--rose)" }} />{analysis.you}</span>
              <span><span className="dot" style={{ background: "var(--lavender)" }} />{analysis.partner}</span>
            </div>
            <div className="note" style={{ marginTop: 8 }}>
              「好き度」の一本線ではなく、観測できる行動（発言・絵文字・質問の量）を二本線で描いています。二本の線の<b>隙間</b>が温度差です。
            </div>
          </div>
          <div>
            <div className="card weather-card">
              <div className="weather-emoji"><Emj name={WEATHER_INFO[analysis.weather].icon} size={44} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>{WEATHER_INFO[analysis.weather].label}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>{analysis.weatherReason}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-title"><Emj name="cat" /> 白猫のひとこと</div>
              <div className="ai-row">
                <img className="ai-avatar" src="/assets/cat.png" alt="案内役の白猫" />
                <div className="ai-bubble">{aiHitokoto(analysis)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sub === "balance" && (
        <div className="cols">
          <div
            className="card"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.82)), url(/assets/bg-balance.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="card-title"><Emj name="scales" /> 吹き出し天秤</div>
            <Balance youRatio={a.score} youName={analysis.you} partnerName={analysis.partner} />
            <div
              style={{ background: "var(--rose-bg)", borderRadius: 14, padding: "12px 14px", fontSize: 13, lineHeight: 1.8 }}
            >
              {balanceText(analysis)}
            </div>
          </div>
          <div className="card">
            <div className="card-title">内訳（あなた側の割合）</div>
            {(
              [
                ["発信量", a.sendRatio],
                ["質問", a.questionRatio],
                ["文の長さ", a.lengthRatio],
                ["会話の口火", a.initiativeRatio],
              ] as [string, number][]
            ).map(([label, v]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 700, color: "var(--rose-strong)" }}>{Math.round(v * 100)}%</span>
                </div>
                <RatioBar left={v} right={1 - v} />
              </div>
            ))}
            <div className="note">評価軸は見た目ではなく「やりとりの釣り合い」。差分は観測であって、「追いすぎ」という裁きではありません。</div>
          </div>
        </div>
      )}

      {sub === "topic" && (
        <div className="cols">
          <div className="card">
            <div className="card-title"><Emj name="map" /> 話題マップ</div>
            <Donut slices={analysis.topics} centerLabel="全期間の話題" />
            <div style={{ marginTop: 10 }}>
              {analysis.topics.map((t, i) => {
                const [yi, pi] = t.initiator;
                const who =
                  yi + pi === 0 ? "" : yi >= pi * 1.4 ? `${analysis.you}がよく振る` : pi >= yi * 1.4 ? `${analysis.partner}がよく振る` : "ふたりで振り合う";
                return (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 2px", fontSize: 13 }}>
                    <span className="dot" style={{ width: 10, height: 10, borderRadius: "50%", background: donutColor(i), display: "inline-block" }} />
                    <span style={{ fontWeight: 500 }}>{t.name}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 700 }}>{Math.round(t.ratio * 100)}%</span>
                    <span style={{ fontSize: 11, color: "var(--ink-soft)", width: 110, textAlign: "right" }}>{who}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Emj name="chat" /> メッセージの機能分類</div>
            {analysis.functions.map((f) => (
              <div key={f.name} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{f.name}</span>
                  <span style={{ color: "var(--ink-soft)" }}>
                    <span style={{ color: "var(--rose-strong)", fontWeight: 700 }}>{Math.round(f.ratio[0] * 100)}%</span>
                    {" / "}
                    <span style={{ color: "var(--lavender-strong)", fontWeight: 700 }}>{Math.round(f.ratio[1] * 100)}%</span>
                  </span>
                </div>
                <RatioBar left={f.ratio[0]} right={f.ratio[1]} />
              </div>
            ))}
            <div className="legend">
              <span><span className="dot" style={{ background: "var(--rose)" }} />{analysis.you}</span>
              <span><span className="dot" style={{ background: "var(--lavender)" }} />{analysis.partner}</span>
            </div>
          </div>
        </div>
      )}

      {sub === "rhythm" && (
        <div className="cols">
          <div className="grid2 grid-wrap">
            {[0, 1].map((i) => (
              <div className="card" key={i}>
                <div className="card-title">
                  {i === 0 ? <><Emj name="flowers" /> {analysis.you}</> : <><Emj name="moon" /> {analysis.partner}</>}
                </div>
                <div className="big-num" style={{ fontSize: 26, color: i === 0 ? "var(--rose-strong)" : "var(--lavender-strong)" }}>
                  {analysis.rhythm.avgReplyMin[i]}
                  <small>分</small>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>平均返信時間</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`tag ${i === 1 ? "lav" : ""}`}>{analysis.rhythm.type[i]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title"><Emj name="clock" /> 時間帯別の活動（重なり帯）</div>
            <HourBands you={analysis.rhythm.activeHours.you} partner={analysis.rhythm.activeHours.partner} />
            {analysis.rhythm.overlap ? (
              <div style={{ background: "var(--lavender-bg)", borderRadius: 12, padding: "10px 14px", fontSize: 13 }}>
                <Emj name="moon" /> ふたりが重なる時間帯：<b>{analysis.rhythm.overlap[0]}時 〜 {analysis.rhythm.overlap[1]}時</b> ごろ
              </div>
            ) : (
              <div className="note">はっきり重なる時間帯は見つかりませんでした</div>
            )}
            <div className="note" style={{ marginTop: 8 }}>リズムの一致を★で採点はしません。重なりは相性の点数ではなく、ただの観測です。</div>
          </div>
        </div>
      )}

      <button
        className="btn btn-sub"
        style={{ marginTop: 4 }}
        onClick={() => {
          if (confirm("いまの分析結果を消して、新しいトークを読み込みますか？")) setAnalysis(null);
        }}
      >
        別のトークを読み込む
      </button>
    </div>
  );
}
