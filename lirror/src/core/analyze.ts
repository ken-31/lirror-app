// 分析エンジン（純TS関数群）。感情の断定は出力に含めない ── 観測できる行動のみ。
import type { Message, ParsedTalk } from "../parser/lineParser";

export interface DayStat {
  date: string;
  counts: [number, number]; // [あなた, 相手] 発言数
  chars: [number, number];
  questions: [number, number];
  emojis: [number, number];
  temp: [number, number]; // 0-100 温度（活動量の正規化）
}

export interface AsymmetryResult {
  sendRatio: number; // あなた側 0-1
  questionRatio: number;
  lengthRatio: number;
  initiativeRatio: number; // 会話の口火
  score: number; // 統合 0-1（0.5 が釣り合い）
  hourly: { you: number[]; partner: number[] }; // 24h 発言分布
}

export interface RhythmResult {
  avgReplyMin: [number, number];
  medianReplyMin: [number, number];
  type: [string, string]; // 即レス/のんびり/波あり/夜型
  activeHours: { you: number[]; partner: number[] }; // 正規化 0-1
  overlap: [number, number] | null; // ふたりが重なる時間帯
}

export interface TopicSlice {
  name: string;
  ratio: number;
  initiator: [number, number]; // 話題を振った回数 [you, partner]
}

export interface FunctionSlice {
  name: string;
  ratio: [number, number]; // 各人のメッセージに占める割合
}

export interface TimelineEvent {
  date: string;
  label: string;
  kind: "auto" | "user";
  note?: string;
}

export type Weather = "sunny" | "cloudy" | "rainy";

export interface Analysis {
  you: string;
  partner: string;
  firstDate: string;
  lastDate: string;
  totalDays: number;
  totalMessages: number;
  days: DayStat[];
  asymmetry: AsymmetryResult;
  rhythm: RhythmResult;
  topics: TopicSlice[];
  functions: FunctionSlice[];
  timeline: TimelineEvent[];
  weather: Weather;
  weatherReason: string;
  trendSlope: number; // ふたり合算の直近傾き
  tempGap: number; // 直近の温度差 0-100
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|😀|❤|♥|！{2,}|www|笑/u;
const QUESTION_RE = /[?？]/;

// ---- 話題辞書（内容は端末内でのみ照合） ----
const TOPIC_DICT: { name: string; words: RegExp }[] = [
  { name: "恋愛・気持ち", words: /好き|会いたい|大好き|愛|デート|ドキドキ|寂し|さみし|嬉し|うれし|幸せ|かわいい|可愛い|カッコいい|かっこいい/ },
  { name: "食べ物", words: /ご飯|ごはん|ランチ|カフェ|食べ|美味し|おいし|うま[いっ]|レストラン|スイーツ|ラーメン|焼肉|居酒屋|お腹/ },
  { name: "学校・仕事", words: /授業|課題|テスト|レポート|バイト|仕事|会議|残業|先生|先輩|上司|職場|学校|講義|資格|就活/ },
  { name: "趣味・遊び", words: /映画|ゲーム|アニメ|漫画|マンガ|音楽|ライブ|カラオケ|買い物|ショッピング|旅行|推し|ドラマ|YouTube|スポーツ|筋トレ/ },
  { name: "相談・悩み", words: /相談|悩ん|悩み|どうしよう|不安|つら[いく]|しんど|疲れ|大丈夫\?|大丈夫？|迷って/ },
  { name: "日常・報告", words: /今日|昨日|明日|起きた|寝る|おはよう|おやすみ|帰った|着いた|終わった|今から|なう/ },
];

const FUNC_DICT: { name: string; test: (t: string) => boolean }[] = [
  { name: "質問", test: (t) => QUESTION_RE.test(t) },
  { name: "共感", test: (t) => /わかる|それな|だよね|いいね|えらい|すごい|たしかに|確かに|よかった/.test(t) },
  { name: "報告", test: (t) => /した[よー!！]|だった|終わった|着いた|帰った|起きた|なう/.test(t) },
  { name: "相談", test: (t) => /どう思う|どうしよう|相談|迷って|悩んで/.test(t) },
  { name: "雑談", test: () => true },
];

function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d.getTime());
}

export function analyze(talk: ParsedTalk, youName?: string): Analysis {
  const [p0, p1] = talk.participants;
  // 「あなた」は指定がなければ2番目（LINEエクスポートでは相手が先に出ることが多いため発言比で決めない）
  const you = youName && talk.participants.includes(youName) ? youName : p1 ?? p0;
  const partner = talk.participants.find((p) => p !== you) ?? "相手";
  const idx = (m: Message) => (m.sender === you ? 0 : 1);

  const msgs = talk.messages;
  const firstDate = msgs[0]?.date ?? dateKey(Date.now());
  const lastDate = msgs[msgs.length - 1]?.date ?? firstDate;

  // ---- 日次集計 ----
  const dayMap = new Map<string, DayStat>();
  for (let d = firstDate; d <= lastDate; d = addDays(d, 1)) {
    dayMap.set(d, { date: d, counts: [0, 0], chars: [0, 0], questions: [0, 0], emojis: [0, 0], temp: [0, 0] });
    if (dayMap.size > 4000) break; // 安全弁
  }
  for (const m of msgs) {
    const st = dayMap.get(m.date);
    if (!st) continue;
    const i = idx(m);
    st.counts[i]++;
    st.chars[i] += m.text.length;
    if (QUESTION_RE.test(m.text)) st.questions[i]++;
    if (EMOJI_RE.test(m.text)) st.emojis[i]++;
  }
  const days = [...dayMap.values()];

  // 温度 = 発言数 + 絵文字・質問の重み付けを 0-100 に正規化（7日移動平均でならす）
  const rawTemp = (st: DayStat, i: 0 | 1) => st.counts[i] + st.emojis[i] * 0.8 + st.questions[i] * 0.6;
  const maxRaw = Math.max(1, ...days.map((s) => Math.max(rawTemp(s, 0), rawTemp(s, 1))));
  days.forEach((st, di) => {
    for (const i of [0, 1] as const) {
      const from = Math.max(0, di - 6);
      let sum = 0;
      for (let k = from; k <= di; k++) sum += rawTemp(days[k], i);
      const avg = sum / (di - from + 1);
      st.temp[i] = Math.round(Math.min(100, (avg / maxRaw) * 130));
    }
  });

  // ---- 非対称性 ----
  const tot = (f: (m: Message) => number) =>
    msgs.reduce((a, m) => (idx(m) === 0 ? [a[0] + f(m), a[1]] : [a[0], a[1] + f(m)]), [0, 0]);
  const [c0, c1] = tot(() => 1);
  const [l0, l1] = tot((m) => m.text.length);
  const [q0, q1] = tot((m) => (QUESTION_RE.test(m.text) ? 1 : 0));
  // 口火：6時間以上あいた後の最初の発言
  let init: [number, number] = [0, 0];
  for (let i = 0; i < msgs.length; i++) {
    if (i === 0 || msgs[i].ts - msgs[i - 1].ts > 6 * 3600e3) init[idx(msgs[i])]++;
  }
  const ratio = (a: number, b: number) => (a + b === 0 ? 0.5 : a / (a + b));
  const sendRatio = ratio(c0, c1);
  const questionRatio = ratio(q0, q1);
  const lengthRatio = ratio(l0, l1);
  const initiativeRatio = ratio(init[0], init[1]);
  const score = sendRatio * 0.35 + questionRatio * 0.2 + lengthRatio * 0.2 + initiativeRatio * 0.25;

  const hourly = { you: new Array(24).fill(0), partner: new Array(24).fill(0) };
  for (const m of msgs) {
    const h = new Date(m.ts).getHours();
    (idx(m) === 0 ? hourly.you : hourly.partner)[h]++;
  }

  // ---- 返信リズム ----
  const replies: [number[], number[]] = [[], []];
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].sender !== msgs[i - 1].sender) {
      const min = (msgs[i].ts - msgs[i - 1].ts) / 60000;
      // 3時間以上あいたものは「返信」ではなく新しい会話とみなす
      if (min >= 0 && min < 180) replies[idx(msgs[i])].push(min);
    }
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const median = (a: number[]) => {
    if (!a.length) return 0;
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };
  const rhythmType = (med: number, arr: number[], hours: number[]): string => {
    const night = hours.slice(22).concat(hours.slice(0, 3)).reduce((a, b) => a + b, 0);
    const total = hours.reduce((a, b) => a + b, 0) || 1;
    if (night / total > 0.45) return "夜型";
    if (med <= 10) return "即レス";
    const sd = Math.sqrt(avg(arr.map((x) => (x - avg(arr)) ** 2)));
    if (sd > med * 2.5) return "波あり";
    return "のんびり";
  };
  const norm = (a: number[]) => {
    const mx = Math.max(1, ...a);
    return a.map((x) => x / mx);
  };
  const activeHours = { you: norm(hourly.you), partner: norm(hourly.partner) };
  // 重なり帯：両者とも活動 0.5 以上の連続時間帯
  let overlap: [number, number] | null = null;
  let best = 0;
  for (let s = 0; s < 24; s++) {
    let len = 0;
    while (len < 24 && activeHours.you[(s + len) % 24] >= 0.45 && activeHours.partner[(s + len) % 24] >= 0.45) len++;
    if (len > best) {
      best = len;
      overlap = [s, (s + len) % 24];
    }
  }

  const rhythm: RhythmResult = {
    avgReplyMin: [Math.round(avg(replies[0])), Math.round(avg(replies[1]))],
    medianReplyMin: [Math.round(median(replies[0])), Math.round(median(replies[1]))],
    type: [rhythmType(median(replies[0]), replies[0], hourly.you), rhythmType(median(replies[1]), replies[1], hourly.partner)],
    activeHours,
    overlap: best >= 2 ? overlap : null,
  };

  // ---- 話題マップ × 主導権 ----
  const topicCount = new Map<string, { n: number; initiator: [number, number] }>();
  let lastTopic = "";
  for (const m of msgs) {
    let matched = "その他";
    for (const t of TOPIC_DICT) {
      if (t.words.test(m.text)) {
        matched = t.name;
        break;
      }
    }
    const e = topicCount.get(matched) ?? { n: 0, initiator: [0, 0] as [number, number] };
    e.n++;
    if (matched !== lastTopic && matched !== "その他") e.initiator[idx(m)]++;
    topicCount.set(matched, e);
    if (matched !== "その他") lastTopic = matched;
  }
  const totalTopics = [...topicCount.values()].reduce((a, e) => a + e.n, 0) || 1;
  const topics: TopicSlice[] = [...topicCount.entries()]
    .map(([name, e]) => ({ name, ratio: e.n / totalTopics, initiator: e.initiator }))
    .sort((a, b) => b.ratio - a.ratio);

  // ---- 機能分類（質問/共感/報告/相談/雑談） ----
  const funcCount: Record<string, [number, number]> = {};
  for (const f of FUNC_DICT) funcCount[f.name] = [0, 0];
  for (const m of msgs) {
    for (const f of FUNC_DICT) {
      if (f.test(m.text)) {
        funcCount[f.name][idx(m)]++;
        break;
      }
    }
  }
  const functions: FunctionSlice[] = FUNC_DICT.map((f) => ({
    name: f.name,
    ratio: [c0 ? funcCount[f.name][0] / c0 : 0, c1 ? funcCount[f.name][1] / c1 : 0] as [number, number],
  }));

  // ---- 転換点（簡易）。ラベルは出来事に付ける ----
  const timeline: TimelineEvent[] = [];
  timeline.push({ date: firstDate, label: "トークがはじまった日", kind: "auto" });
  const EVENT_WORDS: [RegExp, string][] = [
    [/初デート|はじめてのデート/, "初デートの話が出た日"],
    [/電話しよ|通話しよ|電話した/, "通話の話が出た日"],
    [/付き合|こくった|告白/, "「付き合う」の言葉が出た日"],
    [/誕生日おめでとう/, "誕生日を祝った日"],
    [/あけまして|明けまして/, "年明けのあいさつ"],
  ];
  const seen = new Set<string>();
  for (const m of msgs) {
    for (const [re, label] of EVENT_WORDS) {
      if (re.test(m.text) && !seen.has(label)) {
        seen.add(label);
        timeline.push({ date: m.date, label, kind: "auto" });
      }
    }
  }
  // 一番たくさん話した日
  let maxDay = days[0];
  for (const d of days) if (d.counts[0] + d.counts[1] > (maxDay?.counts[0] ?? 0) + (maxDay?.counts[1] ?? 0)) maxDay = d;
  if (maxDay && maxDay.counts[0] + maxDay.counts[1] > 0)
    timeline.push({ date: maxDay.date, label: `いちばん話した日（${maxDay.counts[0] + maxDay.counts[1]}通）`, kind: "auto" });
  // 長い沈黙のあと再開した日
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].ts - msgs[i - 1].ts > 5 * 24 * 3600e3) {
      timeline.push({ date: msgs[i].date, label: "しばらくぶりに再開した日", kind: "auto" });
      break;
    }
  }
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  // ---- 天気（直近7日の傾き＋温度差） ----
  const recent = days.slice(-7);
  const combined = recent.map((d) => d.temp[0] + d.temp[1]);
  const slope = combined.length > 1 ? (combined[combined.length - 1] - combined[0]) / combined.length : 0;
  const last = days[days.length - 1];
  const tempGap = last ? Math.abs(last.temp[0] - last.temp[1]) : 0;
  let weather: Weather = "cloudy";
  let weatherReason = "";
  if (slope > 2 && tempGap < 30) {
    weather = "sunny";
    weatherReason = "ここ数日、ふたりのやりとりがあたたまってきています";
  } else if (slope < -4 || tempGap > 45) {
    weather = "rainy";
    weatherReason = slope < -4 ? "ここ数日、やりとりが少し落ち着いてきています" : "いまは温度差がすこし開いています";
  } else {
    weather = "cloudy";
    weatherReason = "大きな変化はなく、おだやかに続いています";
  }

  return {
    you,
    partner,
    firstDate,
    lastDate,
    totalDays: days.length,
    totalMessages: msgs.length,
    days,
    asymmetry: { sendRatio, questionRatio, lengthRatio, initiativeRatio, score, hourly },
    rhythm,
    topics,
    functions,
    timeline,
    weather,
    weatherReason,
    trendSlope: slope,
    tempGap,
  };
}
