import { useEffect, useState } from "react";
import { useStore, todayStr } from "../../store/store";
import { MBTI_LIST, SERIES, CHARAS, loveNo, loadProfiles, type Profile, type Series } from "../../data/loveTypes";
import { KOTOBA_TYPES, QUESTIONS, judge, type KotobaType } from "../../diagnosis/hoshiiKotoba";
import { MOODS, buildJikkyo, generateOmamori, type Mood } from "../../diagnosis/omamori";
import { recentTempShare } from "../helpers";
import { Emj } from "../components/Emj";

type View = "menu" | "profile" | "quiz" | "omamori" | "settings";

export function You() {
  const [view, setView] = useState<View>("menu");
  return (
    <div className="fade-in">
      <h2 className="screen-title"><Emj name="flowers" /> あなた</h2>
      {view === "menu" && <Menu go={setView} />}
      {view === "profile" && <LoveProfile back={() => setView("menu")} />}
      {view === "quiz" && <Quiz back={() => setView("menu")} />}
      {view === "omamori" && <OmamoriView back={() => setView("menu")} goQuiz={() => setView("quiz")} />}
      {view === "settings" && <Settings back={() => setView("menu")} />}
    </div>
  );
}

function BackBar({ back, title }: { back: () => void; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <button
        onClick={back}
        style={{ border: "none", background: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", boxShadow: "var(--shadow)", color: "var(--rose-strong)", fontWeight: 700 }}
      >
        ‹
      </button>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
    </div>
  );
}

function Menu({ go }: { go: (v: View) => void }) {
  const { profile } = useStore();
  const kotoba = profile.kotobaType ? KOTOBA_TYPES.find((t) => t.id === profile.kotobaType) : null;
  const chara = profile.charaIndex != null ? CHARAS[profile.charaIndex] : null;
  const series = profile.series ? SERIES.find((s) => s.id === profile.series) : null;
  return (
    <div className="narrow">
      <div className="card" style={{ background: "linear-gradient(135deg, #fdf0f5, #f3effc)" }}>
        <div className="card-title"><Emj name="brain" /> わたしの恋愛の型（カルテ）</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {profile.mbti ? <span className="tag">{profile.mbti}</span> : <span className="tag" style={{ opacity: 0.5 }}>MBTI 未設定</span>}
          {series && chara ? (
            <span className="tag lav">{series.name}・{chara.name} {chara.emoji}</span>
          ) : (
            <span className="tag lav" style={{ opacity: 0.5 }}>ラブタイプ 未設定</span>
          )}
          {kotoba ? (
            <span className="tag gold">{kotoba.emoji} {kotoba.name}</span>
          ) : (
            <span className="tag gold" style={{ opacity: 0.5 }}>ほしい言葉 未診断</span>
          )}
        </div>
      </div>
      <div className="card" style={{ padding: "6px 16px" }}>
        <button className="list-item" onClick={() => go("profile")}>
          <Emj name="brain" /> 恋愛プロフィール <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>MBTI × ラブタイプ64</span>
          <span className="chev">›</span>
        </button>
        <button className="list-item" onClick={() => go("quiz")}>
          <Emj name="bubbles" /> 「ほしい言葉」タイプ診断
          <span className="chev">›</span>
        </button>
        <button className="list-item" onClick={() => go("omamori")}>
          <Emj name="clover" /> 今日のお守り
          <span className="chev">›</span>
        </button>
        <button className="list-item" onClick={() => go("settings")}>
          <Emj name="gear" /> 設定・プライバシー
          <span className="chev">›</span>
        </button>
      </div>
      <div className="privacy">
        <Emj name="mirror" /> このアプリは、相手を解読する道具ではなく、<b>自分を客観視する鏡</b>です。診断はぜんぶ自己申告 ──
        自分がどんな言葉で安心するかは、あなただけが知っているから。
      </div>
    </div>
  );
}

/* ---------- 恋愛プロフィール（MBTI × ラブタイプ64 = 1024通り） ---------- */
function LoveProfile({ back }: { back: () => void }) {
  const { profile, setProfile } = useStore();
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = profile.mbti && profile.series && profile.charaIndex != null;

  useEffect(() => {
    if (!ready) {
      setData(null);
      return;
    }
    setLoading(true);
    const no = loveNo(profile.series as Series, profile.charaIndex!);
    loadProfiles(profile.mbti!)
      .then((all) => setData(all[String(no)] ?? null))
      .finally(() => setLoading(false));
  }, [profile.mbti, profile.series, profile.charaIndex]);

  const mbtiInfo = MBTI_LIST.find((m) => m.code === profile.mbti);

  return (
    <>
      <BackBar back={back} title="恋愛プロフィール" />
      <div className="cols">
      <div>
      <div className="card">
        <div className="card-title">① MBTI（自己入力）</div>
        <div className="select-grid">
          {MBTI_LIST.map((m) => (
            <button
              key={m.code}
              className={`select-cell ${profile.mbti === m.code ? "on" : ""}`}
              onClick={() => setProfile({ mbti: m.code })}
            >
              {m.code}
              <small>{m.nickname}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title">② ラブタイプ64（自己入力）── 系統</div>
        <div className="select-grid cols2">
          {SERIES.map((s) => (
            <button
              key={s.id}
              className={`select-cell ${profile.series === s.id ? "on" : ""}`}
              onClick={() => setProfile({ series: s.id })}
            >
              {s.id}・{s.name}
              <small>{s.theme}</small>
            </button>
          ))}
        </div>
        <div className="card-title" style={{ marginTop: 14 }}>── キャラ</div>
        <div className="select-grid cols2">
          {CHARAS.map((c, i) => (
            <button
              key={c.name}
              className={`select-cell ${profile.charaIndex === i ? "on" : ""}`}
              onClick={() => setProfile({ charaIndex: i })}
              style={{ textAlign: "left", padding: "9px 10px" }}
            >
              {c.emoji} {c.name}
              <small>{c.intro}</small>
            </button>
          ))}
        </div>
      </div>
      </div>

      {ready && (
        <div>
        <div className="card" style={{ background: "linear-gradient(160deg, #fff, #fdf0f5)" }}>
          {loading || !data ? (
            <div className="note" style={{ textAlign: "center", padding: 20 }}>💗 プロフィールを読み込み中…</div>
          ) : (
            <div className="fade-in">
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.1em" }}>
                  No.{String(data.no).padStart(4, "0")} ／ 1024通りのうちの、あなたの一枚
                </div>
                <h3 style={{ fontSize: 17, margin: "6px 0 2px" }}>
                  {profile.mbti} × {SERIES.find((s) => s.id === data.series)?.name}
                  {data.chara}
                </h3>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {mbtiInfo?.nickname} × {CHARAS[profile.charaIndex!]?.emoji} {data.oneline}
                </div>
              </div>
              <div className="hr-deco">♡ ⸜ ♡ ⸝ ♡</div>
              <ProfileSection title="💪 強み" items={data.strengths} />
              <ProfileSection title="⚠️ 気を付けたいこと" items={data.cautions} />
              <ProfileSection title="💝 相手が喜ぶ接し方" items={data.pleased} />
              <div style={{ background: "var(--lavender-bg)", borderRadius: 14, padding: "12px 14px", marginTop: 12 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>💬 AIから一言</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.9 }}>{data.ai}</div>
              </div>
              <div className="note" style={{ marginTop: 10 }}>
                これは「性格傾向」であって、占いでも予言でも、あなたを型にはめるラベルでもありません。共感した部分だけ、お守りみたいに持ち帰ってね。
              </div>
            </div>
          )}
        </div>
        </div>
      )}
      </div>
    </>
  );
}

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="card-title" style={{ marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 4, listStyle: "none" }}>
        {items.map((s) => (
          <li key={s} style={{ fontSize: 13.5, lineHeight: 1.7, padding: "4px 0 4px 20px", position: "relative" }}>
            <span style={{ position: "absolute", left: 0, color: "var(--rose)" }}>♡</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 「ほしい言葉」タイプ診断 ---------- */
function Quiz({ back }: { back: () => void }) {
  const { profile, setProfile } = useStore();
  const [answers, setAnswers] = useState<KotobaType[]>([]);
  const [done, setDone] = useState(false);

  const i = answers.length;
  const result = profile.kotobaType ? KOTOBA_TYPES.find((t) => t.id === profile.kotobaType) : null;

  if (done || (result && answers.length === 0)) {
    const r = result!;
    return (
      <>
        <BackBar back={back} title="「ほしい言葉」タイプ診断" />
        <div className="card narrow" style={{ textAlign: "center", background: "linear-gradient(160deg, #fff, #f3effc)" }}>
          <div className="note">恋愛で不安になった瞬間、あなたに効く言葉は──</div>
          <div style={{ fontSize: 52, margin: "10px 0 4px" }}>{r.emoji}</div>
          <h3 style={{ fontSize: 22, color: r.color }}>{r.name}</h3>
          <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--ink)" }}>{r.desc}</p>
          <div className="note" style={{ marginBottom: 12 }}>
            この型は、お守りの<b>文体</b>を決めるためだけに使われます。性格全般のラベルではありません。
          </div>
          <button
            className="btn btn-sub"
            onClick={() => {
              setAnswers([]);
              setDone(false);
              setProfile({ kotobaType: null, kotobaScores: null });
            }}
          >
            もういちど診断する
          </button>
        </div>
      </>
    );
  }

  const q = QUESTIONS[i];
  return (
    <>
      <BackBar back={back} title="「ほしい言葉」タイプ診断" />
      <div className="card narrow">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="tag">Q{i + 1} / {QUESTIONS.length}</span>
        </div>
        <div style={{ height: 6, background: "#f6eef2", borderRadius: 4, marginBottom: 14 }}>
          <div
            style={{ height: 6, width: `${(i / QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg, var(--rose), var(--lavender))", borderRadius: 4, transition: "width .3s" }}
          />
        </div>
        <h3 style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 14 }}>{q.text}</h3>
        {q.choices.map((c) => (
          <button
            key={c.label}
            className="q-choice"
            onClick={() => {
              const next = [...answers, c.type];
              if (next.length === QUESTIONS.length) {
                const { type, scores } = judge(next);
                setProfile({ kotobaType: type.id, kotobaScores: scores });
                setDone(true);
              }
              setAnswers(next);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- 今日のお守り（型 × 気持ち × 実況） ---------- */
function OmamoriView({ back, goQuiz }: { back: () => void; goQuiz: () => void }) {
  const { profile, analysis, omamoris, addOmamori, todayMood, setTodayMood } = useStore();
  const today = todayStr();
  const existing = omamoris.find((o) => o.date === today);
  const [mood, setMood] = useState<Mood | null>(todayMood?.date === today ? todayMood.mood : null);

  if (!profile.kotobaType) {
    return (
      <>
        <BackBar back={back} title="今日のお守り" />
        <div className="card empty narrow">
          <img src="/assets/bear.png" alt="" />
          <p>
            お守りの文体は「ほしい言葉」タイプで決まります。
            <br />
            まずは1分の診断から🫧
          </p>
          <button className="btn btn-main" onClick={goQuiz}>
            診断をはじめる
          </button>
        </div>
      </>
    );
  }

  const kotoba = KOTOBA_TYPES.find((t) => t.id === profile.kotobaType)!;

  if (existing) {
    return (
      <>
        <BackBar back={back} title="今日のお守り" />
        <div className="omamori-card with-photo narrow" style={{ backgroundImage: "url(/assets/moon.png)" }}>
          {existing.jikkyo && <div className="om-jikkyo">今日の観測 ── {existing.jikkyo}</div>}
          <div className="om-msg">{existing.message}</div>
          <div className="om-suffix">{existing.suffix}</div>
        </div>
        <div className="note" style={{ textAlign: "center", marginTop: 12 }}>
          {kotoba.emoji} {kotoba.name}の文体で生成 ／ お守りは1日1枚。また明日🌙
        </div>
      </>
    );
  }

  const weather = analysis?.weather ?? "cloudy";
  const generate = (m: Mood) => {
    const jikkyo = analysis
      ? buildJikkyo(weather, analysis.tempGap, recentTempShare(analysis), analysis.rhythm.avgReplyMin[1])
      : "";
    addOmamori(generateOmamori(profile.kotobaType!, m, weather, jikkyo));
  };

  return (
    <>
      <BackBar back={back} title="今日のお守り" />
      <div className="card narrow">
        <div className="card-title"><Emj name="sun" /> 今日の気持ち診断 ── いまのあなたに近いのは？</div>
        <div className="select-grid cols2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`select-cell ${mood === m.id ? "on" : ""}`}
              style={{ padding: 14, fontSize: 14 }}
              onClick={() => {
                setMood(m.id);
                setTodayMood(m.id);
              }}
            >
              <Emj name={m.icon} /> {m.label}
            </button>
          ))}
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          {analysis
            ? "型（文体）× 今日の気持ち × LINEの実況 ── 三層で世界に一枚を生成します"
            : "LINEを読み込むと、お守りに「今日の実況」も織り込まれます"}
        </div>
        <button className="btn btn-main" style={{ marginTop: 12 }} disabled={!mood} onClick={() => mood && generate(mood)}>
          <Emj name="clover" /> お守りを受け取る
        </button>
      </div>
    </>
  );
}

/* ---------- 設定 ---------- */
function Settings({ back }: { back: () => void }) {
  const { profile, setProfile, resetAll } = useStore();
  return (
    <>
      <BackBar back={back} title="設定・プライバシー" />
      <div className="narrow">
      <div className="card">
        <div className="card-title"><Emj name="heart" /> 付き合った日（任意）</div>
        <input
          type="date"
          value={profile.anniversary ?? ""}
          onChange={(e) => setProfile({ anniversary: e.target.value || null })}
          style={{ padding: 10, borderRadius: 12, border: "1.5px solid var(--line)", fontFamily: "inherit", width: "100%" }}
        />
        <div className="note" style={{ marginTop: 6 }}>ホームに「付き合ってN日目」を表示します</div>
      </div>
      <div className="privacy" style={{ marginBottom: 14 }}>
        <Emj name="lock" /> <b>プライバシー・ファースト</b>
        <br />
        ・分析はすべて端末内で完結し、ネットワーク送信はゼロです
        <br />
        ・保存されるのは集計結果と自己入力のみ。トーク本文は保持しません
        <br />
        ・通知でお知らせすることはありません（見たいときに開く pull 型）
      </div>
      <button
        className="btn btn-sub"
        style={{ color: "#c76", borderColor: "#f2d4cc" }}
        onClick={() => {
          if (confirm("すべてのデータ（分析結果・プロフィール・お守り）を端末から削除しますか？")) resetAll();
        }}
      >
        <Emj name="trash" /> すべてのデータを削除する
      </button>
      </div>
    </>
  );
}
