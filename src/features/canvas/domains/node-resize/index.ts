import type { Artboard } from "@/domains/dcmp/artboard";
import { AxisLength, type AxisLengths } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import { Size } from "@/domains/dcmp/size";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Axes } from "@/domains/unit/axis";
import { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";

/**
 * 掴める帯の太さ（画面上の px）。終端からこの幅までが `grabAt` の当たり判定に入る。
 *
 * ハンドルの四角（`HandleAnchors`）とは別に、**右辺・下辺の全長が掴める**。描かれている
 * 四角だけを掴み口にすると、辺のどこでも掴めていたものが 10px の的になって操作性が
 * 落ちるため、四角の掴み口をこの帯に上乗せしている。
 *
 * **帯は角でも 1 軸のまま。** 2 本の帯が重なる角では `handles` の並び順で先にある軸
 * （幅が固定なら幅）を掴む。角の付近を 2 軸にするには**どこからを角とみなすか**を
 * 決める必要があり、それは掴み口全体の設計そのものになるので #371 に残している。
 * 結果として、角の四角の外側・帯の内側を押すと 1 軸しか変わらない。
 */
const ResizeHandleThicknessPx = 8;

/**
 * ハンドルの中心を矩形のどこに留めるかの割合。0 が始点、0.5 が中央、1 が終端。
 * 3 つ以外を取らないので、辺と中央だけを綴れる形に閉じる。
 */
type AnchorRatio = 0 | 0.5 | 1;

/**
 * 掴んだハンドルが変える大きさ。
 *
 * 軸の並びではなく直和で列挙するのは、並びだと「同じ軸が 2 回」「0 軸」が書けてしまい、
 * 実際に取りうる 3 通りより広くなるため。出し分ける側も `switch` で網羅を強制できる。
 */
export type ResizeGrip =
  | Readonly<{ kind: "width"; width: AxisLength }>
  | Readonly<{ kind: "height"; height: AxisLength }>
  | Readonly<{ kind: "both"; width: AxisLength; height: AxisLength }>;

export const ResizeGrip = {
  /**
   * 1 軸だけを掴む。軸は長さ自身が持っているので、どちらの枝になるかもそこで決まる。
   *
   * @param length 掴んだ軸とその時点の長さ
   * @returns その軸だけを変える掴み方
   */
  create(length: AxisLength): ResizeGrip {
    return length.axis === Axes.Width
      ? { kind: "width", width: length }
      : { kind: "height", height: length };
  },

  /**
   * 掴んだものが変える長さ。
   *
   * @param grip 掴んだもの
   * @returns 変える軸ぶんの長さ。2 軸なら幅・高さの順
   */
  lengths(grip: ResizeGrip): AxisLengths {
    switch (grip.kind) {
      case "width":
        return [grip.width];
      case "height":
        return [grip.height];
      case "both":
        return [grip.width, grip.height];
    }
  },
} as const;

/**
 * ハンドルを留める 1 箇所（docs/06-ui.md「リサイズハンドル」）。
 *
 * `Placement` と呼ばないのは、このリポジトリの `placement` が「ノードが親の中で
 * どう置かれるか」（`flow` / `absolute`。`domains/dcmp/placement`）を既に指しているため。
 *
 * `grip` はその箇所で何を変えられるかで、掴めない箇所では `none`。右下の角だけが
 * `both` なのは、**原点（左上）が動かない**ので幅と高さを増やすだけで済むため。
 * 残る 3 隅と左辺・上辺は反対側の辺を留める位置の補正が要り、既定の
 * `placement: "flow"` のノードは座標を持たないので補正できない（#371）。
 */
export type ResizeHandleAnchor = Readonly<{
  x: AnchorRatio;
  y: AnchorRatio;
  grip: Option<ResizeGrip["kind"]>;
}>;

/**
 * 掴んでいるもの。何を変えるかと、どこから測るか。
 *
 * `Grab` と呼ばないのは、`features/assets` の `AssetGrab`（掴み口の props 束）が
 * 同じ語幹を別の意味で使っているため。
 */
export type ResizeHold = Readonly<{
  grip: ResizeGrip;
  origin: Offset;
}>;

/**
 * キャンバス上でリサイズハンドルを掴んでから離すまでの状態
 * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * 掴んだ辺と押した位置を持つのは掴んでいる間だけ、と状態ごとに持つものが変わるため
 * 直和で列挙する（「掴んでいないのに掴んだ辺がある」を作れなくするため）。
 *
 * `resized` は離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火させるので、
 * これを挟まないと大きさを変えただけで選択が動く（選択を持つのは編集画面の側 / #35）。
 */
export type NodeResize =
  | Readonly<{ kind: "idle" }>
  | (Readonly<{ kind: "resizing" }> & ResizeHold)
  | Readonly<{ kind: "resized" }>;

/**
 * artboard は 2 軸とも `fixed` 固定なので、常にどちらの辺も掴める（docs/03）。
 *
 * @param artboard ハンドルを出したい artboard
 * @returns 幅と高さの 2 件のハンドル
 */
function artboardHandles(artboard: Artboard): readonly AxisLength[] {
  return [
    AxisLength.create("width", artboard.width),
    AxisLength.create("height", artboard.height),
  ];
}

/**
 * `fixed` の軸だけを掴める（docs/06-ui.md「`hug` / `fill` ではハンドルを出さない」）。
 *
 * モードが `fixed` でも長さが未設定なら出さない。掴んだ時点の長さが無いと
 * ドラッグの基準が決まらないため（長さはプロパティパネルから入れる）。
 *
 * @param props ハンドルの出し分けに使う props
 * @returns `fixed` で長さも設定されている軸のハンドルだけの並び
 */
function propsHandles(props: Props): readonly AxisLength[] {
  return Object.values(Axes).flatMap((axis) => {
    const length = Size.fixedLength(
      Size.create(props[Size.modeProp(axis)], props[axis]),
    );
    return length.some ? [AxisLength.create(axis, length.value)] : [];
  });
}

/**
 * 参照ノードにはハンドルを出さない。インスタンスが上書きできるのは publicProps に
 * 宣言のある prop だけで、宣言の追加は AI / JSON 編集の担当（docs/06-ui.md「部品化」）。
 * 出すと「掴めるのに何も起きない」操作になる。
 *
 * @param node ハンドルを出したいノード
 * @returns 掴める軸のハンドルの並び。参照ノードなら空
 */
function nodeHandles(node: Node): readonly AxisLength[] {
  return Node.isRef(node) ? [] : propsHandles(node.props ?? {});
}

/**
 * 角で掴めるもの。両軸が固定なら 2 軸、片方だけならその 1 軸。
 *
 * @param width 幅のハンドル。幅が固定でなければ `none`
 * @param height 高さのハンドル。高さが固定でなければ `none`
 * @returns 変えられるもの。どちらも固定でなければ `none`
 */
function cornerGrip(
  width: Option<AxisLength>,
  height: Option<AxisLength>,
): Option<ResizeGrip> {
  // 名前を付けた変数にすると narrowing が効かないので、条件はここへ直に書く
  if (width.some && height.some) {
    return Option.some({
      kind: "both",
      width: width.value,
      height: height.value,
    });
  }
  return Option.map(Option.or(width, height), ResizeGrip.create);
}

/** 右辺の中央。幅だけを変える。帯（右辺の全長）で掴んだときもここを掴んだものとして扱う。 */
const RightAnchor = {
  x: 1,
  y: 0.5,
  grip: Option.some("width"),
} as const satisfies ResizeHandleAnchor;

/** 下辺の中央。高さだけを変える。下辺の帯で掴んだときもここになる。 */
const BottomAnchor = {
  x: 0.5,
  y: 1,
  grip: Option.some("height"),
} as const satisfies ResizeHandleAnchor;

/** 掴めない箇所（残る 3 隅と左辺・上辺）。位置だけが違うので `grip` は共通。 */
const DecorativeGrip = Option.none;

export const NodeResize = {
  /**
   * ハンドルを留める 8 箇所（四隅と各辺の中間）。左上から時計回り。
   *
   * 描く側と掴める側がここ 1 箇所から決まるようにしている。並びを 2 箇所に持つと、
   * 片方だけ変えたときに「カーソルが出る場所」と「掴める場所」が黙って割れる。
   */
  HandleAnchors: [
    { x: 0, y: 0, grip: DecorativeGrip },
    { x: 0.5, y: 0, grip: DecorativeGrip },
    { x: 1, y: 0, grip: DecorativeGrip },
    RightAnchor,
    { x: 1, y: 1, grip: Option.some("both") },
    BottomAnchor,
    { x: 0, y: 1, grip: DecorativeGrip },
    { x: 0, y: 0.5, grip: DecorativeGrip },
  ] as const satisfies readonly ResizeHandleAnchor[],

  /** 何も掴んでいない状態から始める。 */
  create(): NodeResize {
    return { kind: "idle" };
  },

  /**
   * その箇所で今つかめるもの。
   *
   * 角（`both`）でも片方の軸しか固定されていなければ、その 1 軸だけを掴む。
   * 固定されていない軸まで変えると `hug` / `fill` の指定を黙って壊すため。
   *
   * @param handles 選択中のものが持つ、掴める軸のハンドル
   * @param anchor 見ている箇所
   * @returns その箇所で変えられるもの。箇所が掴めない側か、対応する軸が 1 つも
   *   固定されていなければ `none`
   */
  gripFor(
    handles: readonly AxisLength[],
    anchor: ResizeHandleAnchor,
  ): Option<ResizeGrip> {
    if (!anchor.grip.some) {
      return Option.none;
    }
    const width = AxisLength.find(handles, Axes.Width);
    const height = AxisLength.find(handles, Axes.Height);
    switch (anchor.grip.value) {
      case "width":
        return Option.map(width, ResizeGrip.create);
      case "height":
        return Option.map(height, ResizeGrip.create);
      case "both":
        return cornerGrip(width, height);
    }
  },

  /**
   * 今まさに掴んで動かしているもの。
   *
   * 真偽値ではなく掴んだものを返すのは、掴んでいる間のカーソルを器が出すのに
   * 「どこを掴んだか（向き）」と「何軸か（自由度）」の両方が要るため。
   * ハンドル自身はそのあいだポインタを通すので出せない。
   *
   * @param resize 今のリサイズの状態
   * @returns 掴んでいるもの。掴んでいなければ `none`
   */
  grabbed(resize: NodeResize): Option<ResizeHold> {
    return resize.kind === "resizing" ? Option.some(resize) : Option.none;
  },

  /**
   * 選択中の artboard / ノードに出すハンドルと、掴んだ時点の長さ
   * （docs/06-ui.md「リサイズハンドル」）。
   *
   * 対象を選択から決めるのは、キャンバスがハンドルを描くのが選択中のものだけであり、
   * 名前で受け取れる形にすると「選択していないものにハンドルが出る」状態を
   * 呼び出し側が作れてしまうため。
   *
   * @param selection ハンドルを出す対象を決める、ドキュメントと選択の対
   * @returns 掴める軸のハンドルと、掴んだ時点の長さ。単一選択でなければ空
   */
  handles(selection: DocumentSelection): readonly AxisLength[] {
    const selected = DocumentSelection.singleName(selection);
    if (!selected.some) {
      return [];
    }
    const name = selected.value;
    const artboard = DesignDocument.findArtboard(selection.document, name);
    if (artboard.some) {
      return artboardHandles(artboard.value);
    }
    const node = DesignDocument.findNode(selection.document, name);
    return node.some ? nodeHandles(node.value) : [];
  },

  /**
   * ポインタが乗っている帯で掴めるもの。終端から内側へ `ResizeHandleThicknessPx`
   * までを掴める帯とする（描かれている四角より広い。上の定数を参照）。
   *
   * 角では 2 本の帯が重なるので、先にある方（`handles` の並び順）を掴む。
   * **帯は角でも 1 軸**なので、順序を決めておけば足りる（上の定数を参照）。
   *
   * @param handles 選択中のものが持つ、掴める軸のハンドル
   * @param bounds 選択中のものが描かれている矩形
   * @param pointer 押された位置
   * @returns その位置で掴めるもの。矩形の外か、どの帯にも入っていなければ `none`
   */
  grabAt(
    handles: readonly AxisLength[],
    bounds: CanvasBounds,
    pointer: Offset,
  ): Option<ResizeHold> {
    if (!CanvasBounds.contains(bounds, pointer)) {
      return Option.none;
    }
    const onBand = Option.fromNullable(
      handles.find(
        (handle) =>
          CanvasBounds.edge(bounds, handle.axis) -
            Offset.along(pointer, handle.axis) <=
          ResizeHandleThicknessPx,
      ),
    );
    return Option.map(onBand, (handle) => ({
      grip: ResizeGrip.create(handle),
      origin: pointer,
    }));
  },

  /** 掴む。以後の長さは掴んだ位置と長さからの差分で決まる。 */
  grab(held: ResizeHold): NodeResize {
    return { kind: "resizing", ...held };
  },

  /**
   * 今のポインタ位置での長さ。掴んでいなければ長さは決まらない
   * （ボタンを離したあとのマウス移動）。
   *
   * 毎回「掴んだ時点の長さ + 掴んでからの移動量」で出すのは、1 回の移動ごとに
   * 前回の長さへ足していくと丸め（`AxisLength.create`）の誤差が積み上がるため。
   */
  lengthsAt(
    resize: NodeResize,
    pointer: Offset,
    view: CanvasView,
  ): Option<AxisLengths> {
    if (resize.kind !== "resizing") {
      return Option.none;
    }
    const moved = Offset.delta(resize.origin, pointer);
    const movedTo = (length: AxisLength): AxisLength =>
      AxisLength.create(
        length.axis,
        length.length +
          CanvasView.toDocumentLength(view, Offset.along(moved, length.axis)),
      );
    // 先頭を分けて組み立てるのは、`map` だと並びが空になりうる型へ落ちるため
    const [first, ...rest] = ResizeGrip.lengths(resize.grip);
    return Option.some([movedTo(first), ...rest.map(movedTo)]);
  },

  /** 指を離す。掴んでいたなら直後の `click` を飲み込む状態へ。 */
  release(resize: NodeResize): NodeResize {
    return resize.kind === "resizing"
      ? { kind: "resized" }
      : NodeResize.create();
  },

  /** 直後の `click` を選択に使わせないか（上の `resized` の説明を参照）。 */
  consumesClick(resize: NodeResize): boolean {
    return resize.kind === "resized";
  },
} as const;
