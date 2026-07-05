// お守り生成 ── 型 × 気持ち × 実況の三層。
// 観測（実況）はどの型でも同じまま、伝え方（文体）だけを型で変える。
// データと矛盾する気休めは言わない。すべて端末内テンプレート（送信ゼロ）。

import type { KotobaType } from "./hoshiiKotoba";
import type { Weather } from "../core/analyze";
import type { EmjName } from "../ui/components/Emj";

export type Mood = "happy" | "uneasy" | "tired" | "calm";

export const MOODS: { id: Mood; emoji: string; icon: EmjName; label: string }[] = [
  { id: "happy", emoji: "🌸", icon: "sakura", label: "いい感じ" },
  { id: "uneasy", emoji: "🌫", icon: "fog", label: "すこし不安" },
  { id: "tired", emoji: "💤", icon: "zzz", label: "つかれ気味" },
  { id: "calm", emoji: "🍵", icon: "tea", label: "おだやか" },
];

// 実況（観測ベースの一文）── 分析結果から生成。断定・感情の読み取りはしない。
export function buildJikkyo(weather: Weather, tempGap: number, sendRatio: number, avgReplyMin: number): string {
  const parts: string[] = [];
  if (weather === "sunny") parts.push("ここ数日、やりとりはあたたまり気味");
  if (weather === "rainy") parts.push(tempGap > 45 ? "いまは温度差がすこし開いてる" : "やりとりは落ち着き気味");
  if (weather === "cloudy") parts.push("やりとりはおだやかに横ばい");
  if (sendRatio > 0.62) parts.push("吹き出しはあなた側が多め");
  else if (sendRatio < 0.38) parts.push("吹き出しは相手側が多め");
  if (avgReplyMin > 0) parts.push(`返信はだいたい${avgReplyMin}分`);
  return parts.join("。");
}

// 型 × 天気 のテンプレートマトリクス（5型 × 3天気 × バリエーション）
const M: Record<KotobaType, Record<Weather, string[]>> = {
  kotei: {
    sunny: [
      "いい流れのとき、それを作ってるのはあなたの言葉の丁寧さだよ。",
      "あたたかい空気は偶然じゃない。あなたがちゃんと育ててる。",
    ],
    cloudy: [
      "大きな波がない日も、あなたのやりとりはちゃんと丁寧だった。",
      "変わらない毎日を続けられるのは、立派な才能だよ。",
    ],
    rainy: [
      "いまは差が開き気味。でもあなたの言葉は、ちゃんと丁寧だった。",
      "うまくいかない日があっても、あなたの価値は変わらないよ。",
    ],
  },
  konkyo: {
    sunny: ["直近のやりとりは上向き。数字は嘘をつかないから、安心していい局面。", "ふたりの活動時間の重なりは保たれてる。土台は安定。"],
    cloudy: ["横ばいは悪化じゃない。関係の多くの時間は「ふつうの日」でできてる。", "返信間隔は通常範囲。データ上、心配のサインは出てないよ。"],
    rainy: ["いまは間隔が開き気味。ただ、波は来ては引くのがデータの常。", "落ち込みの波は過去にもあって、そのたび戻ってる。観測を続けよう。"],
  },
  kyori: {
    sunny: ["いい流れの日こそ、追いかけなくて大丈夫。自分の時間も楽しんで。", "今日は安心して、スマホの外の予定に出かけていい日。"],
    cloudy: ["変化のない日は、いったん画面を閉じて自分に戻るチャンス。", "待つ時間は、あなたの時間。好きなことに使っていいんだよ。"],
    rainy: ["差が開くタイミング。画面を閉じて自分の予定に戻っていい頃合い。", "今夜は考えるのをおしまいにして、あったかくして休もう。"],
  },
  humor: {
    sunny: ["ふたりの温度、本日好調。このままいくと天気予報いらず☀", "今日の会話、打率高め。ヒーローインタビューの準備を。"],
    cloudy: ["本日のトーク、くもり。つまり「いつも通り」という平和なやつ。", "ドラマチック展開？いや普通の日。普通の日バンザイ🙌"],
    rainy: ["天秤、あなた側にだいぶ傾き中。吹き出しダイエット推奨。", "返信、只今ゆっくり配達中🚚 郵便と同じで届くときは届く。"],
  },
  bansou: {
    sunny: ["いい日が続いてるね。この気持ち、覚えておこうね。", "うれしい流れのときも、無理に何かしなくていいからね。"],
    cloudy: ["特別なことのない日。それでも気になるよね、わかるよ。", "おだやかな日も、そわそわする日も、どっちもあっていい。"],
    rainy: ["差が開いてて、不安になるのは自然なこと。急がなくていい。", "今はしんどいよね。解決しなくていいから、深呼吸だけしよう。"],
  },
};

// 気持ちによる添え書き
const MOOD_SUFFIX: Record<Mood, string> = {
  happy: "今日のあなたの機嫌のよさ、ちゃんと伝わってるよ🌸",
  uneasy: "不安な日は、このお守りをポケットに入れておいて🫧",
  tired: "今日はがんばらないのが正解の日。おつかれさま💤",
  calm: "おだやかな今日のあなたに、ちょうどいい一枚を🍵",
};

export interface Omamori {
  id: string;
  date: string; // YYYY-MM-DD
  type: KotobaType;
  mood: Mood;
  weather: Weather;
  jikkyo: string; // 観測（どの型でも同じ）
  message: string; // 型で文体が変わる本文
  suffix: string;
}

export function generateOmamori(
  type: KotobaType,
  mood: Mood,
  weather: Weather,
  jikkyo: string,
  date = new Date()
): Omamori {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  // 日付でバリエーションを決める（同じ日は同じお守り＝毎日変わる）
  const seed = [...dateStr].reduce((a, c) => a + c.charCodeAt(0), 0);
  const variants = M[type][weather];
  const message = variants[seed % variants.length];
  return {
    id: `${dateStr}-${type}-${mood}`,
    date: dateStr,
    type,
    mood,
    weather,
    jikkyo,
    message,
    suffix: MOOD_SUFFIX[mood],
  };
}
