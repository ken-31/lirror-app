import { useState } from "react";
import { useStore } from "../../store/store";
import { KOTOBA_TYPES } from "../../diagnosis/hoshiiKotoba";
import { mdLabel } from "../helpers";
import { Emj } from "../components/Emj";
import type { Omamori } from "../../diagnosis/omamori";

export function Records() {
  const { analysis, customEvents, addCustomEvent, removeCustomEvent, omamoris } = useStore();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [openOmamori, setOpenOmamori] = useState<Omamori | null>(null);

  const events = [...(analysis?.timeline ?? []), ...customEvents].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="fade-in">
      <h2 className="screen-title"><Emj name="book" /> ふたりの記録</h2>

      <div className="cols">
      <div className="card">
        <div className="card-title"><Emj name="calendar" /> 恋愛タイムライン</div>
        {events.length === 0 ? (
          <div className="empty">
            <p>
              まだ記録がありません。
              <br />
              LINEを読み込むと、転換点が自動で刻まれます。
            </p>
          </div>
        ) : (
          <div className="tl">
            {events.map((e, i) => (
              <div className="tl-item" key={`${e.date}-${e.label}`}>
                <div className="tl-date">{e.date.replace(/-/g, ".")}</div>
                <div className="tl-label">
                  {e.label}
                  {e.kind === "user" && (
                    <>
                      {" "}
                      <span className="tag" style={{ fontSize: 10 }}>手動</span>
                      <button
                        onClick={() => removeCustomEvent(customEvents.indexOf(e))}
                        style={{ border: "none", background: "none", color: "#d9c3ce", cursor: "pointer", fontSize: 12 }}
                        aria-label="削除"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: 10, borderRadius: 12, border: "1.5px solid var(--line)", fontFamily: "inherit" }}
            />
            <input
              type="text"
              placeholder="できごと（例：初めて写真を撮った日 📷）"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{ padding: 10, borderRadius: 12, border: "1.5px solid var(--line)", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-main btn-small"
                disabled={!date || !label}
                onClick={() => {
                  addCustomEvent({ date, label, kind: "user" });
                  setAdding(false);
                  setDate("");
                  setLabel("");
                }}
              >
                追加する
              </button>
              <button className="btn btn-sub btn-small" onClick={() => setAdding(false)}>
                やめる
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-sub btn-small" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>
            ＋ 節目を書き足す
          </button>
        )}
        <div className="note" style={{ marginTop: 10 }}>ラベルは出来事に付けます（人には付けません）</div>
      </div>

      <div className="card">
        <div className="card-title"><Emj name="clover" /> お守りコレクション</div>
        {omamoris.length === 0 ? (
          <div className="note">まだお守りがありません。「あなた」タブで今日の一枚を受け取ろう🌙</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {omamoris.map((o) => {
              const t = KOTOBA_TYPES.find((k) => k.id === o.type)!;
              return (
                <div
                  key={o.id}
                  className="omamori-mini"
                  style={{ backgroundImage: "url(/assets/moon.png)" }}
                  onClick={() => setOpenOmamori(o)}
                  title={o.date}
                >
                  <span style={{ textShadow: "0 1px 6px rgba(60,40,110,0.6)" }}>{t.emoji}</span>
                </div>
              );
            })}
          </div>
        )}
        {openOmamori && (
          <div style={{ marginTop: 12 }}>
            <div className="omamori-card with-photo" style={{ backgroundImage: "url(/assets/moon.png)" }}>
              <div className="om-jikkyo">
                {mdLabel(openOmamori.date)} ／ {KOTOBA_TYPES.find((k) => k.id === openOmamori.type)!.name}
                {openOmamori.jikkyo && <> ── {openOmamori.jikkyo}</>}
              </div>
              <div className="om-msg">{openOmamori.message}</div>
              <div className="om-suffix">{openOmamori.suffix}</div>
            </div>
            <button className="btn btn-sub btn-small" style={{ marginTop: 8 }} onClick={() => setOpenOmamori(null)}>
              とじる
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
