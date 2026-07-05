import type { Analysis, Weather } from "../core/analyze";
import type { EmjName } from "./components/Emj";

export const WEATHER_INFO: Record<Weather, { emoji: string; icon: EmjName; label: string }> = {
  sunny: { emoji: "☀️", icon: "sun", label: "晴れ" },
  cloudy: { emoji: "⛅", icon: "cloud", label: "くもり" },
  rainy: { emoji: "🌧️", icon: "rain", label: "雨のち晴れ待ち" },
};

export function mdLabel(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 直近の温度シェア（あなた側 0-1）。ホームの「72% ややあなたが高温」用 */
export function recentTempShare(a: Analysis): number {
  const recent = a.days.slice(-7);
  const y = recent.reduce((s, d) => s + d.temp[0], 0);
  const p = recent.reduce((s, d) => s + d.temp[1], 0);
  return y + p === 0 ? 0.5 : y / (y + p);
}

export function tempShareText(share: number): string {
  if (share > 0.6) return "ややあなたが高温";
  if (share < 0.4) return "やや相手が高温";
  return "ふたりは同じくらい";
}

export function balanceText(a: Analysis): string {
  const r = a.asymmetry.score;
  if (r > 0.62) return `${a.you}さんが多めに送っています。いつも話題を広げてくれてありがとう。たまには、相手からの話を待ってみるのも◎`;
  if (r < 0.38) return `${a.partner}さんが多めに送っています。受け取った分、気になる話題をひとつ振ってみるのもいいかも`;
  return "ふたりのやりとりは、いいバランスで釣り合っています";
}

/** AIひとこと（v1.0 は端末内テンプレ）。感情の断定はしない */
export function aiHitokoto(a: Analysis): string {
  const share = recentTempShare(a);
  if (a.weather === "rainy" && share > 0.6)
    return "最近はあなたの吹き出しが多めみたい。少し疲れていないかな？自分のペースも大切にしてね🌷";
  if (a.weather === "rainy") return "やりとりが落ち着いてる時期。こういう波は前にもあって、ちゃんと戻ってるよ🫧";
  if (a.weather === "sunny") return "ここ数日、ふたりのやりとりがあたたかい流れ。いい時間を覚えておこうね☀️";
  return "大きな波のない、おだやかな時期。ふつうの日を重ねられるのも、ふたりの力だよ🍵";
}

export function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to + "T00:00:00").getTime() - new Date(from + "T00:00:00").getTime()) / 86400000) + 1;
}
