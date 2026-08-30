import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { Axis } from "@/domains/unit/axis";
import { Px } from "@/domains/unit/px";
import { ResizeHandleThicknessPx } from "@/features/canvas/domains/node-resize";
import { nameSelector } from "../name-style-rule";

/**
 * 軸ごとの、掴める帯の描き方。幅は右辺、高さは下辺に貼り付ける
 * （終端側だけを掴む / `NodeResize.handleAt`）。
 * 2 本を別々の擬似要素へ割り当てるのは、1 要素が持てる擬似要素が 2 つだからで、
 * 3 本目（角）を足すなら描き方から見直すことになる。
 */
const HandleFaces = {
  width: {
    pseudo: "::after",
    edge: "top:0;right:0;height:100%",
    extent: "width",
    cursor: "ew-resize",
  },
  height: {
    pseudo: "::before",
    edge: "left:0;bottom:0;width:100%",
    extent: "height",
    cursor: "ns-resize",
  },
} as const satisfies Readonly<
  Record<
    Axis,
    Readonly<{
      pseudo: string;
      edge: string;
      extent: string;
      cursor: string;
    }>
  >
>;

/** ハンドルの色。選択枠と同じ青（Tailwind の `blue-500`）を、中身が透けるよう薄くして使う。 */
const HandleColor = "rgb(59 130 246 / 0.6)";

/**
 * リサイズハンドル 1 本を描く規則。掴める帯と見た目の帯を倍率にかかわらず一致させる。
 *
 * @param name ハンドルを出す artboard / ノードの名前
 * @param handle どの軸のハンドルか
 * @param scale 今のキャンバスの倍率（帯の太さを割り戻すのに使う）
 * @returns その辺に帯を描く CSS 規則 1 本
 */
function handleRule(name: string, handle: AxisLength, scale: number): string {
  const face = HandleFaces[handle.axis];
  /*
   * 太さを倍率で割るのは、掴める帯（当たり判定は client 座標 = 画面上の px）と
   * 見た目の帯を一致させるため。中身は倍率をかけて描かれている。
   */
  const thickness = Px.create(ResizeHandleThicknessPx / scale);
  return `${nameSelector(name)}${face.pseudo}{content:"";position:absolute;${face.edge};${face.extent}:${thickness};cursor:${face.cursor};background:${HandleColor}}`;
}

/**
 * 選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * 子要素ではなく擬似要素で描くのは、キャンバスの中身が React の管理外にあり
 * ハンドルを差し込む場所が無いため。位置決めを CSS に任せることで、ズーム / パンや
 * リサイズ中の描き直しでハンドルがずれない（実測した座標で置くと測り直しが要る）。
 */
export function ResizeHandleStyle({
  name,
  handles,
  scale,
}: Readonly<{
  name: string;
  handles: readonly AxisLength[];
  scale: number;
}>) {
  if (handles.length === 0) {
    return null;
  }
  const faces = handles.map((handle) => handleRule(name, handle, scale));
  // 擬似要素を辺へ貼り付ける基準にするため、選択中の要素自身を位置指定済みにする。
  // これが効くのはフローの Text だけ。Box と絶対配置の要素は自分のインライン
  // `position` を持ち、インラインのほうが勝つので既にそれ自身が基準になっている
  return (
    <style>{`${nameSelector(name)}{position:relative}${faces.join("")}`}</style>
  );
}
