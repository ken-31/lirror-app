// 端末内永続化つきの軽量ストア。
// プライバシー・ファースト：保存するのは解析結果と自己入力のみ。生のトーク本文は保持しない。
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Analysis, TimelineEvent } from "../core/analyze";
import type { KotobaType } from "../diagnosis/hoshiiKotoba";
import type { Mood, Omamori } from "../diagnosis/omamori";
import type { Series } from "../data/loveTypes";

export interface UserProfile {
  mbti: string | null;
  series: Series | null;
  charaIndex: number | null;
  kotobaType: KotobaType | null;
  kotobaScores: Record<KotobaType, number> | null;
  anniversary: string | null; // 付き合った日 YYYY-MM-DD
}

interface StoreState {
  analysis: Analysis | null;
  profile: UserProfile;
  omamoris: Omamori[];
  todayMood: { date: string; mood: Mood } | null;
  customEvents: TimelineEvent[];
  setAnalysis: (a: Analysis | null) => void;
  setProfile: (p: Partial<UserProfile>) => void;
  addOmamori: (o: Omamori) => void;
  setTodayMood: (m: Mood) => void;
  addCustomEvent: (e: TimelineEvent) => void;
  removeCustomEvent: (i: number) => void;
  resetAll: () => void;
}

const EMPTY_PROFILE: UserProfile = {
  mbti: null,
  series: null,
  charaIndex: null,
  kotobaType: null,
  kotobaScores: null,
  anniversary: null,
};

const KEY = "lirror-v1";

function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${KEY}:${k}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(`${KEY}:${k}`, JSON.stringify(v));
  } catch {
    /* 容量超過時は保存を諦める（アプリは動き続ける） */
  }
}

const Ctx = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<Analysis | null>(() => load("analysis", null));
  const [profile, setProfileState] = useState<UserProfile>(() => load("profile", EMPTY_PROFILE));
  const [omamoris, setOmamoris] = useState<Omamori[]>(() => load("omamoris", []));
  const [todayMood, setTodayMoodState] = useState<{ date: string; mood: Mood } | null>(() => load("mood", null));
  const [customEvents, setCustomEvents] = useState<TimelineEvent[]>(() => load("events", []));

  useEffect(() => save("analysis", analysis), [analysis]);
  useEffect(() => save("profile", profile), [profile]);
  useEffect(() => save("omamoris", omamoris), [omamoris]);
  useEffect(() => save("mood", todayMood), [todayMood]);
  useEffect(() => save("events", customEvents), [customEvents]);

  const value: StoreState = {
    analysis,
    profile,
    omamoris,
    todayMood,
    customEvents,
    setAnalysis: setAnalysisState,
    setProfile: (p) => setProfileState((prev) => ({ ...prev, ...p })),
    addOmamori: (o) =>
      setOmamoris((prev) => (prev.some((x) => x.id === o.id) ? prev : [o, ...prev].slice(0, 60))),
    setTodayMood: (mood) => {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setTodayMoodState({ date, mood });
    },
    addCustomEvent: (e) => setCustomEvents((prev) => [...prev, e].sort((a, b) => a.date.localeCompare(b.date))),
    removeCustomEvent: (i) => setCustomEvents((prev) => prev.filter((_, k) => k !== i)),
    resetAll: () => {
      setAnalysisState(null);
      setProfileState(EMPTY_PROFILE);
      setOmamoris([]);
      setTodayMoodState(null);
      setCustomEvents([]);
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(KEY))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* noop */ }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreState {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
