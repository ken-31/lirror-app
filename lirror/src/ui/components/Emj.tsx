// 独自絵文字：UI参考資料から切り出した画像アイコン（/public/assets/emoji/）
// OS絵文字の代わりにUIの飾りとして使う。読み上げ不要なので alt は空。
export type EmjName =
  | "mirror"
  | "home"
  | "book"
  | "flowers"
  | "moon"
  | "scales"
  | "clock"
  | "clover"
  | "chat"
  | "doc"
  | "lock"
  | "calendar"
  | "map"
  | "chart"
  | "thermo"
  | "cat"
  | "brain"
  | "bubbles"
  | "gear"
  | "sun"
  | "rain"
  | "phone"
  | "cloud"
  | "sakura"
  | "fog"
  | "zzz"
  | "tea"
  | "heart"
  | "trash";

export function Emj({ name, size }: { name: EmjName; size?: number }) {
  return (
    <img
      className="emj"
      src={`/assets/emoji/${name}.png`}
      alt=""
      style={size ? { width: size, height: size } : undefined}
    />
  );
}
