import { useState } from "react";
import { StoreProvider } from "./store/store";
import { WorldBg } from "./ui/components/WorldBg";
import { Emj, type EmjName } from "./ui/components/Emj";
import { Home } from "./ui/screens/Home";
import { AnalysisScreen } from "./ui/screens/AnalysisScreen";
import { Records } from "./ui/screens/Records";
import { You } from "./ui/screens/You";

export type Tab = "home" | "analysis" | "records" | "you";

const TABS: { id: Tab; icon: EmjName; label: string }[] = [
  { id: "home", icon: "home", label: "ホーム" },
  { id: "analysis", icon: "chart", label: "分析" },
  { id: "records", icon: "book", label: "ふたりの記録" },
  { id: "you", icon: "flowers", label: "あなた" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  return (
    <StoreProvider>
      {/* 各画面のイラスト背景（花びら・光はその上を舞う） */}
      <div className={`screen-bg ${tab}`} aria-hidden />
      <WorldBg />
      <div className="shell">
        {/* パソコン（広い画面）ではサイドバー */}
        <aside className="sidenav">
          <div className="side-brand">
            <span className="brand">Lirror<small>.</small></span>
            <div className="side-tagline">ふたりの関係を、<br />やさしく映す鏡。</div>
          </div>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
              <span className="ticon"><Emj name={t.icon} /></span>
              {t.label}
            </button>
          ))}
          <div className="side-foot">
            <Emj name="lock" /> 分析はぜんぶ端末の中。
            <br />
            トークは外に出ません。
          </div>
        </aside>

        <div className="app">
          {tab === "home" && <Home go={setTab} />}
          {tab === "analysis" && <AnalysisScreen />}
          {tab === "records" && <Records />}
          {tab === "you" && <You />}
        </div>
      </div>

      {/* スマホ（狭い画面）では下タブ */}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            <span className="ticon"><Emj name={t.icon} /></span>
            {t.label}
          </button>
        ))}
      </nav>
    </StoreProvider>
  );
}
