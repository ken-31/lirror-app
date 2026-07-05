// ラブタイプ64（系統×キャラ）と MBTI 16タイプの定義。
// 出典：学習データまとめ（MBTI × ラブタイプ64 恋愛プロフィール大全）

export type Series = "VD" | "VI" | "ND" | "NI";

export const SERIES: { id: Series; name: string; theme: string; offset: number }[] = [
  { id: "VD", name: "溺愛系", theme: "未来を考えつつ深く寄り添う", offset: 0 },
  { id: "VI", name: "堅実系", theme: "計画性と自分軸のバランス型", offset: 16 },
  { id: "ND", name: "魅惑系", theme: "今を楽しみ、相手にも寄り添う", offset: 32 },
  { id: "NI", name: "自立系", theme: "今を重視しつつ自分軸も大切にする", offset: 48 },
];

export const CHARAS: { name: string; emoji: string; intro: string }[] = [
  { name: "ボス猫", emoji: "🐈", intro: "プライド高めの甘え下手、心を許すとデレ全開" },
  { name: "隠れベイビー", emoji: "🍼", intro: "外ではしっかり、二人きりでは甘えん坊" },
  { name: "主役体質", emoji: "🎬", intro: "恋も人生もドラマチックな主人公" },
  { name: "ツンデレヤンキー", emoji: "🔥", intro: "口は悪いが情に厚い、不器用な優しさ" },
  { name: "憧れの先輩", emoji: "🌟", intro: "余裕と包容力でリードする頼れる存在" },
  { name: "カリスマバランサー", emoji: "⚖️", intro: "場を回しながら中心にいる調和の達人" },
  { name: "パーフェクトカメレオン", emoji: "🦎", intro: "相手に合わせて変幻自在の対応力" },
  { name: "キャプテンライオン", emoji: "🦁", intro: "堂々と守り抜くリーダー気質" },
  { name: "ロマンスマジシャン", emoji: "🎩", intro: "ときめきとムードを操る演出家" },
  { name: "ちゃっかりうさぎ", emoji: "🐰", intro: "甘え上手で要領よく愛されるタイプ" },
  { name: "恋愛モンスター", emoji: "💘", intro: "好きになったら一直線の恋愛体質" },
  { name: "忠犬ハチ公", emoji: "🐶", intro: "一途に待てる忠誠心の持ち主" },
  { name: "不思議生命体", emoji: "👽", intro: "独自の世界観を持つマイペース星人" },
  { name: "敏腕マネージャー", emoji: "📋", intro: "先回りの気遣いで相手を支えるプロ" },
  { name: "デビル天使", emoji: "😈", intro: "天使と小悪魔の二面性で翻弄する魅力" },
  { name: "最後の恋人", emoji: "💍", intro: "永く深く、運命の愛を育てるタイプ" },
];

export const MBTI_LIST: { code: string; nickname: string }[] = [
  { code: "INTJ", nickname: "静かな戦略家" },
  { code: "INTP", nickname: "探究する賢者" },
  { code: "ENTJ", nickname: "頼れるリーダー" },
  { code: "ENTP", nickname: "遊び心の発明家" },
  { code: "INFJ", nickname: "神秘の共感者" },
  { code: "INFP", nickname: "夢見る理想家" },
  { code: "ENFJ", nickname: "世話焼き主人公" },
  { code: "ENFP", nickname: "太陽の冒険家" },
  { code: "ISTJ", nickname: "誠実な堅実家" },
  { code: "ISFJ", nickname: "やさしい守護者" },
  { code: "ESTJ", nickname: "しっかり者隊長" },
  { code: "ESFJ", nickname: "気配りの達人" },
  { code: "ISTP", nickname: "器用な職人" },
  { code: "ISFP", nickname: "静かな芸術家" },
  { code: "ESTP", nickname: "行動派エース" },
  { code: "ESFP", nickname: "陽気なスター" },
];

export function loveNo(series: Series, charaIndex: number): number {
  return SERIES.find((s) => s.id === series)!.offset + charaIndex + 1;
}

export interface Profile {
  no: number;
  mbti: string;
  love: number;
  series: Series;
  chara: string;
  oneline: string;
  strengths: string[];
  cautions: string[];
  pleased: string[];
  ai: string;
}

// 16分割した JSON を必要なときだけ読み込む（1024件・約1MBを一括ロードしない）
const cache = new Map<string, Record<string, Profile>>();

export async function loadProfiles(mbti: string): Promise<Record<string, Profile>> {
  if (cache.has(mbti)) return cache.get(mbti)!;
  const mod = await import(`./profiles/${mbti}.json`);
  cache.set(mbti, mod.default);
  return mod.default;
}
