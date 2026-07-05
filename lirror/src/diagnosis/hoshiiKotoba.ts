// 「ほしい言葉」タイプ診断 ── 恋愛で不安になった瞬間、どんな言葉なら効くか。
// 測るのはこの一点だけ。お守りの文体を決めるためだけの診断。

export type KotobaType = "kotei" | "konkyo" | "kyori" | "humor" | "bansou";

export interface KotobaTypeInfo {
  id: KotobaType;
  name: string;
  emoji: string;
  desc: string;
  color: string;
}

export const KOTOBA_TYPES: KotobaTypeInfo[] = [
  { id: "kotei", name: "肯定型", emoji: "🌷", desc: "「あなたは十分やってる」と存在を認められたい", color: "#e88aa8" },
  { id: "konkyo", name: "根拠型", emoji: "📖", desc: "「この返信間隔は通常範囲」と事実で安心したい", color: "#8a9fe8" },
  { id: "kyori", name: "距離型", emoji: "🌙", desc: "「今は自分の時間に戻ろう」と関係から離れる許可がほしい", color: "#9b8ae8" },
  { id: "humor", name: "ユーモア型", emoji: "🐰", desc: "深刻さを笑いに変えてほしい", color: "#e8b06a" },
  { id: "bansou", name: "伴走型", emoji: "🫧", desc: "解決も断定もいらない、「不安だよね」とただ隣にいてほしい", color: "#7bc4b3" },
];

export interface Question {
  text: string;
  choices: { label: string; type: KotobaType }[];
}

export const QUESTIONS: Question[] = [
  {
    text: "既読無視が2日続いた。今いちばんかけてほしい言葉は？",
    choices: [
      { label: "「あなたは何も悪くないよ、十分やってる」", type: "kotei" },
      { label: "「過去のデータだと2日空くのは普通の範囲だよ」", type: "konkyo" },
      { label: "「いったんスマホ置いて、自分の予定に戻ろう」", type: "kyori" },
      { label: "「向こうの充電、3日切れてる説🔋」", type: "humor" },
    ],
  },
  {
    text: "自分ばかり話しかけてる気がして落ち込んだ夜。ほしいのは？",
    choices: [
      { label: "「話しかけられるのは、ちゃんとした才能だよ」", type: "kotei" },
      { label: "「実際の比率を見てみよう。思ってるほど偏ってないかも」", type: "konkyo" },
      { label: "「不安だよね。焦らなくていいよ、いっしょにいるよ」", type: "bansou" },
      { label: "「吹き出し、今日もあなた側デカいね笑」", type: "humor" },
    ],
  },
  {
    text: "返信がそっけなく感じた。どう受け止めたい？",
    choices: [
      { label: "「文面の長さと気持ちは別物、という事実を見たい」", type: "konkyo" },
      { label: "「そっけなく感じたんだね。その気持ちのまま隣にいてほしい」", type: "bansou" },
      { label: "「一回画面を閉じて、好きなことをする許可がほしい」", type: "kyori" },
      { label: "「向こうは文章書くのが苦手なだけ説を笑い飛ばしたい」", type: "humor" },
    ],
  },
  {
    text: "SNSは更新してるのに返信がない…！",
    choices: [
      { label: "「SNSと返信は別腹。よくあること」と言われたい", type: "konkyo" },
      { label: "「モヤモヤするよね、わかるよ」と共感してほしい", type: "bansou" },
      { label: "「あなたの魅力は返信速度で決まらない」と言い切ってほしい", type: "kotei" },
      { label: "「今は自分の楽しみに時間を使うターン」と背中を押されたい", type: "kyori" },
    ],
  },
  {
    text: "デートの誘いを送ったあと、返事待ちの30分。どう過ごしたい？",
    choices: [
      { label: "「誘えた時点で今日は勝ち」と自分を認めたい", type: "kotei" },
      { label: "「平均返信時間はあと40分後」と目安を知って落ち着きたい", type: "konkyo" },
      { label: "「スマホを裏返してお茶でも淹れよう」と離れたい", type: "kyori" },
      { label: "「返事待ちのBGM選手権」でも開いて笑っていたい", type: "humor" },
    ],
  },
  {
    text: "ケンカ気味のやりとりのあと。いちばん効くのは？",
    choices: [
      { label: "「伝えようとしたこと自体がえらい」と認められたい", type: "kotei" },
      { label: "「前も同じ波があって、1週間で戻ってる」と事実がほしい", type: "konkyo" },
      { label: "「今夜は考えるのをおしまいにしよう」と区切ってほしい", type: "kyori" },
      { label: "「つらいよね。急がなくていいよ」とそばにいてほしい", type: "bansou" },
    ],
  },
];

export function judge(answers: KotobaType[]): { type: KotobaTypeInfo; scores: Record<KotobaType, number> } {
  const scores: Record<KotobaType, number> = { kotei: 0, konkyo: 0, kyori: 0, humor: 0, bansou: 0 };
  for (const a of answers) scores[a]++;
  const order: KotobaType[] = ["kotei", "konkyo", "kyori", "humor", "bansou"];
  let bestId = order[0];
  for (const t of order) if (scores[t] > scores[bestId]) bestId = t;
  return { type: KOTOBA_TYPES.find((t) => t.id === bestId)!, scores };
}
