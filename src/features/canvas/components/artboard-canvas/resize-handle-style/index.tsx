import { Px } from "@/domains/unit/px";
import { nameSelector } from "../name-style-rule";

/** ハンドルの中身の一辺（UI 案 docs/Design Composer.html の `width:7px;height:7px`）。 */
const HandleFillPx = 7;

/** ハンドルの枠の太さ（UI 案の `border:1.5px solid`）。 */
const HandleBorderPx = 1.5;

/** 枠を含めたハンドル 1 個の一辺。 */
const HandleSizePx = HandleFillPx + HandleBorderPx * 2;

/**
 * ハンドルの枠の色。UI 案は `#0d99ff` だが、選択の枠（`artboard-frame-list` の
 * `SelectionOutline`）を据え置いたままここだけ寄せると、同じ選択表示に青が 2 色出る。
 */
const HandleBorderColor = "#3b82f6";

/** ハンドルの中身の色。UI 案どおり白（下に何色が来てもハンドルが見えるようにするため）。 */
const HandleFillColor = "#fff";

/**
 * ハンドルを出す四隅。値は背景レイヤーを置く位置（x, y の順）。
 *
 * 掴める軸ごとではなく常に 4 個出すのは UI 案に合わせたもの。UI 案の `login-form` は
 * width=fixed / height=hug（画面末尾の Design notes）で、片方の軸しか固定していなくても
 * 四隅に 4 個描かれている。
 */
const HandleCorners = {
  TopLeft: "0 0",
  TopRight: "100% 0",
  BottomLeft: "0 100%",
  BottomRight: "100% 100%",
} as const;

/** 四隅に置く四角 1 種類ぶんの描き方。 */
type HandleSquare = Readonly<{
  color: string;
  /** 一辺の長さ（画面上の px）。倍率で割り戻してから使う。 */
  sizePx: number;
  /** 位置の基準にする box。`background` ショートハンドでは clip も同じ box になる。 */
  box: "padding-box" | "content-box";
}>;

/**
 * 同じ四角を四隅へ 1 枚ずつ置く背景レイヤー。
 *
 * @param square 塗る色・一辺の長さ・位置の基準にする box
 * @param scale 今のキャンバスの倍率（一辺を割り戻すのに使う）
 * @returns 四隅ぶんのレイヤーを `,` で繋いだ `background` の値
 */
function cornerLayers(square: HandleSquare, scale: number): string {
  const side = Px.create(square.sizePx / scale);
  const paint = `linear-gradient(${square.color},${square.color})`;
  return Object.values(HandleCorners)
    .map(
      (position) =>
        `${paint} ${position}/${side} ${side} no-repeat ${square.box}`,
    )
    .join(",");
}

/**
 * 四隅のハンドルを描く規則。
 *
 * 1 要素が持てる擬似要素は 2 つなので四隅 4 個は割れない。背景レイヤーなら
 * 1 つの擬似要素に 8 枚（中身 4 + 枠 4）置ける。枠の太さは `padding` で作り、
 * 中身のレイヤーだけを content box 基準にすることで内側へ寄せる
 * （`calc(100% - 1.5px)` を 4 箇所書かずに済む）。
 *
 * @param name ハンドルを出す artboard / ノードの名前
 * @param scale 今のキャンバスの倍率（寸法を割り戻すのに使う）
 * @returns 四隅に四角を描く CSS 規則 1 本
 */
function handleRule(name: string, scale: number): string {
  const border = Px.create(HandleBorderPx / scale);
  /*
   * 先に並べたレイヤーが上に描かれるので、中身 → 枠 の順に並べる。
   * 逆にすると枠が中身を覆って、白抜きではなく塗り潰しの四角になる。
   */
  const fills = cornerLayers(
    { color: HandleFillColor, sizePx: HandleFillPx, box: "content-box" },
    scale,
  );
  const borders = cornerLayers(
    { color: HandleBorderColor, sizePx: HandleSizePx, box: "padding-box" },
    scale,
  );
  /*
   * 要素の外へはみ出さない（UI 案は辺の中心へ置くが、artboard は既定で
   * `overflow:hidden` なので、外へ出した部分は artboard 自身に切られる）。
   *
   * `pointer-events:none` は必須。要素全体を覆うので、受けてしまうと選択中の
   * 要素の中のノードを押したときに当たる相手が親へ変わり、入れ子が選べなくなる。
   */
  const declarations = `content:"";position:absolute;inset:0;padding:${border};pointer-events:none;background:${fills},${borders}`;
  return `${nameSelector(name)}::after{${declarations}}`;
}

/**
 * 選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * 子要素ではなく擬似要素で描くのは、キャンバスの中身が React の管理外にあり
 * ハンドルを差し込む場所が無いため。位置決めを CSS に任せることで、ズーム / パンや
 * リサイズ中の描き直しでハンドルがずれない（実測した座標で置くと測り直しが要る）。
 *
 * 出す・出さないを決めるのは呼び出し側（`ArtboardCanvas`）で、ここは出すと決まった
 * ものだけを受け取る。
 */
export function ResizeHandleStyle({
  name,
  scale,
}: Readonly<{
  name: string;
  scale: number;
}>) {
  // 擬似要素を辺へ貼り付ける基準にするため、選択中の要素自身を位置指定済みにする。
  // これが効くのはフローの Text だけ。Box と絶対配置の要素は自分のインライン
  // `position` を持ち、インラインのほうが勝つので既にそれ自身が基準になっている
  return (
    <style>{`${nameSelector(name)}{position:relative}${handleRule(name, scale)}`}</style>
  );
}
