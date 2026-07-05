// サンプルトーク生成（デモ用）。実データがなくてもアプリを体験できるようにする。
// LINE のエクスポート書式（Android系タブ区切り）を模して生成する。

const YOU = "ゆい";
const PARTNER = "そうた";

const CONVOS: [string, string[]][] = [
  ["morning", ["おはよ〜☀", "おはよう！今日もがんばろ", "ねむい〜〜", "昨日何時に寝たの笑"]],
  ["food", ["お昼なに食べた？", "学食のラーメン🍜", "いいな！私はコンビニパン", "今度あのカフェ行こうよ", "いいね！パンケーキ食べたい🥞", "土曜どう？"]],
  ["school", ["課題終わった？？", "まだ半分…レポートむずい", "わかる、あの先生の課題重すぎ", "テスト範囲どこまでだっけ", "5章までって言ってた気がする", "ありがと！！助かる"]],
  ["hobby", ["昨日のアニメ見た？？", "見た！！神回だった", "作画やばかったよね", "来週も楽しみすぎる", "一緒に映画も行きたいな🎬", "いいよ！何見る？"]],
  ["feeling", ["今日ちょっと会えて嬉しかった😊", "おれも！短かったけどね", "また会いたいな", "今週末どこか行こうよ", "デートしよ〜💕", "楽しみにしてる！"]],
  ["worry", ["ちょっと相談があるんだけど", "どうした？", "バイトの人間関係で悩んでて…", "それはしんどいね。話聞くよ", "ありがとう…どうしようか迷ってる", "焦らなくていいと思うよ", "うん、少し楽になった"]],
  ["night", ["今日もおつかれさま🌙", "おつかれ！", "おやすみ〜", "おやすみ、また明日"]],
  ["report", ["いま帰った〜", "おかえり！", "電車混んでた😵", "おつかれさま", "お風呂入ってくる"]],
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function generateSampleTalk(): string {
  const lines: string[] = [`[LINE] ${PARTNER}とのトーク履歴`, "保存日時：2026/07/04 12:00", ""];
  const rng = (() => {
    let s = 42;
    return () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  })();

  const start = new Date("2026-03-01T00:00:00");
  const days = 120;
  const week = ["日", "月", "火", "水", "木", "金", "土"];

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    // 中盤にすこし冷える谷を作る（80〜95日目）、直近は回復
    let activity = 0.85;
    if (d >= 80 && d < 95) activity = 0.3;
    if (d >= 110) activity = 0.95;
    if (rng() > activity) continue;

    lines.push(`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}(${week[date.getDay()]})`);

    const convoCount = 1 + Math.floor(rng() * (activity > 0.5 ? 3 : 1));
    let hour = 8 + Math.floor(rng() * 4);
    for (let c = 0; c < convoCount; c++) {
      const conv = CONVOS[Math.floor(rng() * CONVOS.length)][1];
      let min = Math.floor(rng() * 50);
      // あなた（ゆい）が先に話しかけることが多め＝非対称のデモ
      let turn = rng() < 0.68 ? 0 : 1;
      for (const text of conv) {
        const sender = turn === 0 ? YOU : PARTNER;
        lines.push(`${pad(hour % 24)}:${pad(min % 60)}\t${sender}\t${text}`);
        // 相手はすこし返信が遅い
        min += turn === 0 ? 3 + Math.floor(rng() * 12) : 8 + Math.floor(rng() * 35);
        if (min >= 60) {
          hour += Math.floor(min / 60);
          min %= 60;
        }
        turn = 1 - turn;
      }
      hour += 3 + Math.floor(rng() * 4);
    }
    // 特別イベント
    if (d === 20) lines.push(`21:00\t${YOU}\t初デートたのしかった！！🌸`, `21:05\t${PARTNER}\tおれも！また行こうね`);
    if (d === 45) lines.push(`22:30\t${PARTNER}\t電話しよっか`, `22:31\t${YOU}\tする〜！📞`);
  }
  return lines.join("\n");
}

export const SAMPLE_YOU = YOU;
