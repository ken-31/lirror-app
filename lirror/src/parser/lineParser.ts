// LINE トーク履歴 .txt → Message[]
// iOS / Android の書式差を吸収する。全処理は端末内で完結する（送信ゼロ）。

export interface Message {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  ts: number; // epoch ms
  sender: string;
  text: string;
}

export interface ParsedTalk {
  title: string; // トーク相手名（ヘッダから取れた場合）
  participants: string[]; // 登場順
  messages: Message[];
}

const DATE_PATTERNS: RegExp[] = [
  /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s*(?:\(.\))?$/, // 2024/12/24(火)
  /^(\d{4})\.(\d{1,2})\.(\d{1,2})\s*.*$/, // 2024.12.24 火曜日 (iOS旧)
  /^(\d{4})年(\d{1,2})月(\d{1,2})日\s*(?:\(.\))?.*$/, // 2024年12月24日(火)
];

// 「23:45\t名前\tメッセージ」（Android/現行iOS）
const MSG_TAB = /^(\d{1,2}):(\d{2})\t([^\t]*)\t?(.*)$/;
// 「23:45 名前 メッセージ」（旧書式フォールバック）
const MSG_SPACE = /^(\d{1,2}):(\d{2})\s+(\S+)\s+(.*)$/;

const SYSTEM_TEXTS = [
  "メッセージの送信を取り消しました",
  "がグループに参加しました",
  "が退出しました",
];

function matchDate(line: string): string | null {
  for (const re of DATE_PATTERNS) {
    const m = line.trim().match(re);
    if (m) {
      const [, y, mo, d] = m;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return null;
}

export function parseLineTalk(raw: string): ParsedTalk {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let title = "";
  let currentDate: string | null = null;
  const messages: Message[] = [];
  const participants: string[] = [];

  const headerTitle = lines
    .slice(0, 3)
    .map((l) => l.match(/\[LINE\]\s*(.+?)\s*との?トーク履歴/))
    .find(Boolean);
  if (headerTitle) title = headerTitle[1];

  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^\[LINE\]/.test(line) || /^保存日時[:：]/.test(line)) continue;

    const d = matchDate(line);
    if (d) {
      currentDate = d;
      continue;
    }
    if (!currentDate) continue;

    let m = line.match(MSG_TAB);
    if (!m || !m[3]) m = line.match(MSG_SPACE);
    if (m && m[3]) {
      const [, hh, mm, sender, text] = m;
      if (SYSTEM_TEXTS.some((s) => text.includes(s) || sender.includes(s))) continue;
      // 通話・スタンプ等の定型は本文として残す（活動量には数える）
      const time = `${hh.padStart(2, "0")}:${mm}`;
      const ts = new Date(`${currentDate}T${time}:00`).getTime();
      if (!participants.includes(sender)) participants.push(sender);
      messages.push({ date: currentDate, time, ts, sender, text });
    } else if (messages.length > 0) {
      // 複数行メッセージの続き
      messages[messages.length - 1].text += "\n" + line;
    }
  }

  return { title, participants, messages };
}

/** 参加者が3人以上のときは発言数上位2人に絞る（1対1トーク前提のアプリのため） */
export function pickTopTwo(talk: ParsedTalk): ParsedTalk {
  if (talk.participants.length <= 2) return talk;
  const counts = new Map<string, number>();
  for (const m of talk.messages) counts.set(m.sender, (counts.get(m.sender) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]);
  return {
    ...talk,
    participants: top,
    messages: talk.messages.filter((m) => top.includes(m.sender)),
  };
}
