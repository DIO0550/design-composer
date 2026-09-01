import { Px } from "@/domains/unit/px";
import { SelectionColor } from "../artboard-frame-list";
import { nameSelector } from "../name-style-rule";

/**
 * ハンドルの枠の内側の一辺（UI 案 docs/Design Composer.html の `width:7px;height:7px`）。
 *
 * `Fill` と呼ばないのは、このリポジトリの `fill` が `hug` / `fill` / `fixed` の
 * サイズモードを指す語で、ハンドルの出し分けの条件そのものだから。
 */
const HandleInnerPx = 7;

/** ハンドルの枠の太さ（UI 案の `border:1.5px solid`）。 */
const HandleBorderPx = 1.5;

/** 枠を含めたハンドル 1 個の一辺。 */
const HandleSizePx = HandleInnerPx + HandleBorderPx * 2;

/**
 * ハンドルの枠の色。UI 案は `#0d99ff` だが、選択の枠を据え置いたままここだけ寄せると
 * 同じ選択表示に青が 2 色出るので、枠と同じ色を引いて使う。
 */
const HandleBorderColor = SelectionColor;

/** ハンドルの枠の内側の色。UI 案どおり白（下に何色が来てもハンドルが見えるようにするため）。 */
const HandleInnerColor = "#fff";

/**
 * ハンドルを出す 8 箇所（四隅と各辺の中間）。値は背景レイヤーを置く位置（x, y の順）。
 * 並びは左上から時計回り。
 *
 * 掴める軸ごとではなく常に 8 個出す。片方の軸しか固定していなくてもハンドルを出すのは
 * UI 案（`login-form` は width=fixed / height=hug なのにハンドルが出ている）に合わせたもの。
 */
const HandlePositions = {
  TopLeft: "0 0",
  Top: "50% 0",
  TopRight: "100% 0",
  Right: "100% 50%",
  BottomRight: "100% 100%",
  Bottom: "50% 100%",
  BottomLeft: "0 100%",
  Left: "0 50%",
} as const;

/** 8 箇所に置く四角 1 種類ぶんの描き方（枠と、その内側で 1 種類ずつ）。 */
type HandleSquare = Readonly<{
  color: string;
  /** 一辺の長さ（画面上の px）。倍率で割り戻してから使う。 */
  sizePx: number;
  /** 位置の基準にする box。`background` ショートハンドでは clip も同じ box になる。 */
  box: "padding-box" | "content-box";
}>;

/**
 * 同じ四角を 8 箇所へ 1 枚ずつ置く背景レイヤー。
 *
 * @param square 塗る色・一辺の長さ・位置の基準にする box
 * @param scale 今のキャンバスの倍率（一辺を割り戻すのに使う）
 * @returns 8 箇所ぶんのレイヤーを `,` で繋いだ `background` の値
 */
function handleLayers(square: HandleSquare, scale: number): string {
  const side = Px.create(square.sizePx / scale);
  const paint = `linear-gradient(${square.color},${square.color})`;
  return Object.values(HandlePositions)
    .map(
      (position) =>
        `${paint} ${position}/${side} ${side} no-repeat ${square.box}`,
    )
    .join(",");
}

/**
 * 8 箇所のハンドルを描く規則。
 *
 * 1 要素が持てる擬似要素は 2 つなので 8 個は割れない。背景レイヤーなら
 * 1 つの擬似要素に 16 枚（内側 8 + 枠 8）置ける。枠の太さは `padding` で作り、
 * 内側のレイヤーだけを content box 基準にすることで枠の中へ寄せる
 * （`calc(100% - 1.5px)` を 8 箇所書かずに済む）。
 *
 * UI 案の四角が持つ `border-radius:1px` は落としている。背景レイヤーは矩形しか
 * 塗れず、角丸にするには要素を 8 つ置く形へ戻すことになるため。
 *
 * ハンドルにカーソル（`ew-resize` / `ns-resize`）を載せていないのは、掴めるのが
 * 右辺・下辺の帯（`NodeResize.handleAt`）で、描いている 8 箇所とは範囲が違うため。
 * 載せると掴めない場所で形が変わる。残った擬似要素 1 つでは 2 種類のカーソルを
 * 別々の辺へ載せられないので、全部が掴めるようになるまで置かない。
 *
 * @param name ハンドルを出す artboard / ノードの名前
 * @param scale 今のキャンバスの倍率（寸法を割り戻すのに使う）
 * @returns 8 箇所に四角を描く CSS 規則 1 本
 */
function handleRule(name: string, scale: number): string {
  const border = Px.create(HandleBorderPx / scale);
  /*
   * 先に並べたレイヤーが上に描かれるので、内側 → 枠 の順に並べる。
   * 逆にすると枠が内側を覆って、白抜きではなく塗り潰しの四角になる。
   */
  const inners = handleLayers(
    { color: HandleInnerColor, sizePx: HandleInnerPx, box: "content-box" },
    scale,
  );
  const borders = handleLayers(
    { color: HandleBorderColor, sizePx: HandleSizePx, box: "padding-box" },
    scale,
  );
  /*
   * UI 案は四角を辺をまたぐ位置（`-5px`）へ置くが、artboard は既定で `overflow:hidden`
   * なので外へ出した部分が切られる。artboard とノードで描き方を分けるほうが
   * 乖離が増えるので、どちらも要素の内側（`inset:0`）に揃えた。
   *
   * `pointer-events:none` は必須。要素全体を覆うので、受けてしまうと選択中の
   * 要素の中のノードを押したときに当たる相手が親へ変わり、入れ子が選べなくなる。
   */
  const declarations = `content:"";position:absolute;inset:0;padding:${border};pointer-events:none;background:${inners},${borders}`;
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
