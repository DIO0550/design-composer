import type { Artboard } from "@/domains/dcmp/artboard";
import { AxisLength, type AxisLengths } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import { Placement } from "@/domains/dcmp/placement";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { Size } from "@/domains/dcmp/size";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Axes, type Axis, type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { Offset } from "@/domains/unit/offset";
import { ArrangedArtboard } from "@/features/editor/features/canvas/domains/arranged-artboard";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";

/**
 * 掴める帯の太さ（画面上の px）。辺からこの幅までが `grabAt` の当たり判定に入る。
 *
 * ハンドルの四角（`HandleAnchors`）とは別に、**掴める辺の全長が掴める**。描かれている
 * 四角だけを掴み口にすると、辺のどこでも掴めていたものが 10px の的になって操作性が落ち
 * るので、四角の掴み口をこの帯に上乗せしている。
 *
 * **帯は角でも 1 軸のまま。** 2 本の帯が重なる角では `ResizableSelection.lengths` の並び順で
 * 先にある軸（幅が固定なら幅）を掴む。角の付近を 2 軸にするには**どこからを角とみなすか
 * **の設計が要るので見送っている（角の四角の外側・帯の内側を押すと 1 軸しか変わらない）。
 */
const ResizeHandleThicknessPx = 8;

/**
 * ハンドルの中心を矩形のどこに留めるかの割合。0 が始点、0.5 が中央、1 が終端で、3 つ以外
 * を取らないので辺と中央だけを綴れる形に閉じる。
 */
type AnchorRatio = 0 | 0.5 | 1;

/**
 * 掴んだ 1 軸ぶん。掴んだ時点の長さと、掴んだのがどちらの端か。
 *
 * 端を `unit/side` の `Side` で持たないのは、枝が既に軸で分かれているため。辺で持つと軸が
 * 2 箇所に載り、「幅の枝に上辺が入っている」が書けてしまう。
 */
type AxisGrab = Readonly<{
  length: AxisLength;
  end: AxisEnd;
}>;

/**
 * 掴んだハンドルが変える大きさ。
 *
 * 出し分ける側も `switch` で網羅を強制できる。
 */
export type ResizeGrip =
  | Readonly<{ kind: "width"; width: AxisGrab }>
  | Readonly<{ kind: "height"; height: AxisGrab }>
  | Readonly<{ kind: "both"; width: AxisGrab; height: AxisGrab }>;

export const ResizeGrip = {
  /**
   * 1 軸だけを掴む。軸は長さ自身が持っているので、どちらの枝になるかもそこで決まる。
   *
   * @param grab 掴んだ軸とその時点の長さ・端
   * @returns その軸だけを変える掴み方
   */
  create(grab: AxisGrab): ResizeGrip {
    return grab.length.axis === Axes.Width
      ? { kind: "width", width: grab }
      : { kind: "height", height: grab };
  },

  /**
   * 掴んだものが変える軸ぶんの掴み。
   *
   * @param grip 掴んだもの
   * @returns 変える軸ぶんの掴み。2 軸なら幅・高さの順
   */
  grabs(grip: ResizeGrip): readonly [AxisGrab, ...AxisGrab[]] {
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
 * どの軸のどちらの端を掴む箇所かは比率そのものが表す（0 が始点側、1 が終点側、0.5 は
 * その軸を掴まない）ので、掴めるものを別のフィールドには持たない。
 */
export type ResizeHandleAnchor = Readonly<{
  x: AnchorRatio;
  y: AnchorRatio;
}>;

/**
 * リサイズの観点から見た選択。掴める軸の長さと、ドキュメントへ書ける今の位置。
 *
 * 始点側の辺を掴めるかは「その軸が固定か」だけでは決まらず、反対の辺を留めるための位置を
 * 書けるかにも依るので、対で 1 つの型にする。
 */
export type ResizableSelection = Readonly<{
  lengths: readonly AxisLength[];
  /** 掴んだ時点の位置。ドキュメントへ位置を書けない対象（フロー配置）なら `none`。 */
  origin: Option<Offset>;
}>;

/**
 * 掴んでいるもの。何を変えるか、ポインタをどこから測るか、位置をどこから動かすか。
 */
export type ResizeHold = Readonly<{
  grip: ResizeGrip;
  pointerOrigin: Offset;
  /** 掴んだ時点の対象の位置。位置を書けない対象なら `none`。 */
  grabbedAt: Option<Offset>;
}>;

/**
 * キャンバス上でリサイズハンドルを掴んでから離すまでの状態
 * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * 掴んだ辺と押した位置を持つのは掴んでいる間だけ、と状態ごとに持つものが変わるため
 * 直和で列挙する（「掴んでいないのに掴んだ辺がある」を作れなくするため）。
 *
 * `resized` は離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火させるので、
 * これを挟まないと大きさを変えただけで選択が動く（選択を持つのは編集画面の側）。
 */
export type NodeResize =
  | Readonly<{ kind: "idle" }>
  | (Readonly<{ kind: "resizing" }> & ResizeHold)
  | Readonly<{ kind: "resized" }>;

/** 掴める軸も位置も無い選択。未選択・掴めない対象・凍結中に使う。 */
const UnresizableSelection: ResizableSelection = {
  lengths: [],
  origin: Option.none,
};

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
 * モードが `fixed` でも長さが未設定なら出さない。
 *
 * @param props ハンドルの出し分けに使う props
 * @returns `fixed` で長さも設定されている軸のハンドルだけの並び
 */
function propsHandles(props: Props): readonly AxisLength[] {
  return Object.values(Axes).flatMap((axis) => {
    const length = Size.fixedLengthFromProps(props, axis);
    return Option.isSome(length) ? [AxisLength.create(axis, length.value)] : [];
  });
}

/**
 * 参照ノードにはハンドルを出さない。インスタンスが上書きできるのは publicProps に宣言の
 * ある prop だけで、宣言の追加は AI / JSON 編集の担当（docs/06-ui.md「部品化」）。
 *
 * 出すと「掴めるのに何も起きない」操作になる。
 *
 * @param node ハンドルを出したいノード
 * @returns 掴める軸のハンドルの並び。参照ノードなら空
 */
function nodeHandles(node: Node): readonly AxisLength[] {
  return Node.isRef(node) ? [] : propsHandles(node.props ?? {});
}

/**
 * その比率が指す端。
 *
 * @param ratio 箇所の比率
 * @returns 指している端。中央（その軸を掴まない箇所）なら `none`
 */
function endAt(ratio: AnchorRatio): Option<AxisEnd> {
  if (ratio === 0.5) {
    return Option.none;
  }
  return Option.some(ratio === 0 ? AxisEnds.Start : AxisEnds.End);
}

/**
 * その軸をその端から掴めるか。
 *
 * @param resizable 選択中のものの掴める軸と位置
 * @param axis 見る軸
 * @param ratio 箇所のその軸ぶんの比率
 * @returns 掴めるならその掴み。その軸が固定でない・箇所が中央・始点側なのに位置を
 *   書けないときは `none`
 */
function axisGrabAt(
  resizable: ResizableSelection,
  axis: Axis,
  ratio: AnchorRatio,
): Option<AxisGrab> {
  const end = endAt(ratio);
  if (!Option.isSome(end)) {
    return Option.none;
  }
  return Option.flatMap(AxisLength.find(resizable.lengths, axis), (length) =>
    grabFor(resizable, length, end.value),
  );
}

/**
 * その軸をその端から掴む掴み。始点側から縮めるには、反対の辺をその場に留めるための位置が
 * 要る（フロー配置のノードは持たない）。
 *
 * 箇所から引くときも帯から引くときもここを通すので、始点側の可否が 1 箇所で決まる。
 *
 * @param resizable 選択中のものの掴める軸と位置
 * @param length 掴む軸と、その時点の長さ
 * @param end 掴もうとしている端
 * @returns その掴み。始点側なのに位置を書けないときは `none`
 */
function grabFor(
  resizable: ResizableSelection,
  length: AxisLength,
  end: AxisEnd,
): Option<AxisGrab> {
  const grabbable = end === AxisEnds.End || Option.isSome(resizable.origin);
  return grabbable ? Option.some({ length, end }) : Option.none;
}

/**
 * 掴める軸の掴みからひとまとまりの掴み方を組む。両軸が掴めるなら 2 軸、片方だけならその
 * 1 軸。
 *
 * @param width 幅の掴み。幅を掴めなければ `none`
 * @param height 高さの掴み。高さを掴めなければ `none`
 * @returns 変えられるもの。どちらも掴めなければ `none`
 */
function combinedGrip(
  width: Option<AxisGrab>,
  height: Option<AxisGrab>,
): Option<ResizeGrip> {
  // 名前を付けた変数にすると narrowing が効かないので、条件はここへ直に書く
  if (Option.isSome(width) && Option.isSome(height)) {
    return Option.some({
      kind: "both",
      width: width.value,
      height: height.value,
    });
  }
  return Option.map(Option.or(width, height), ResizeGrip.create);
}

/**
 * ポインタがその軸の帯に入っているなら、掴んだ端。
 *
 * 両方の帯に入る（長さが帯 2 本ぶん未満）ときは**近いほうの辺**を取る。
 *
 * @param bounds 選択中のものが描かれている矩形
 * @param pointer 押された位置
 * @param axis 見る軸
 * @returns 入っている帯の端。どちらの帯にも入っていなければ `none`
 */
function bandEndAt(
  bounds: CanvasBounds,
  pointer: Offset,
  axis: Axis,
): Option<AxisEnd> {
  const along = Offset.along(pointer, axis);
  const distanceTo = (end: AxisEnd): number =>
    Math.abs(CanvasBounds.edgeAt(bounds, axis, end) - along);
  const nearest = Object.values(AxisEnds).reduce((nearer, end) =>
    distanceTo(end) < distanceTo(nearer) ? end : nearer,
  );
  return distanceTo(nearest) <= ResizeHandleThicknessPx
    ? Option.some(nearest)
    : Option.none;
}

export const NodeResize = {
  /** 掴める軸も位置も無い選択（未選択・掴めない対象・凍結中）。 */
  Unresizable: UnresizableSelection,

  /**
   * ハンドルを留める 8 箇所（四隅と各辺の中間）。左上から時計回り。
   *
   * 描く側と掴める側がここ 1 箇所から決まるようにしている。並びを 2 箇所に持つと、
   * 片方だけ変えたときに「カーソルが出る場所」と「掴める場所」が黙って割れる。
   */
  HandleAnchors: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 0.5 },
    { x: 1, y: 1 },
    { x: 0.5, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 0.5 },
  ] as const satisfies readonly ResizeHandleAnchor[],

  /**
   * 操作を受ける前の状態を作る。
   *
   * @returns 何も掴んでいない状態
   */
  create(): NodeResize {
    return { kind: "idle" };
  },

  /**
   * その箇所で今つかめるもの。
   *
   * 角でも片方の軸しか掴めなければ、その 1 軸だけを掴む。
   *
   * @param resizable 選択中のものの掴める軸と位置
   * @param anchor 見ている箇所
   * @returns その箇所で変えられるもの。対応する軸が 1 つも掴めなければ `none`
   */
  gripFor(
    resizable: ResizableSelection,
    anchor: ResizeHandleAnchor,
  ): Option<ResizeGrip> {
    return combinedGrip(
      axisGrabAt(resizable, Axes.Width, anchor.x),
      axisGrabAt(resizable, Axes.Height, anchor.y),
    );
  },

  /**
   * 今まさに掴んで動かしているもの。
   *
   * ハンドル自身はそのあいだポインタを通すので出せない。
   *
   * @param resize 今のリサイズの状態
   * @returns 掴んでいるもの。掴んでいなければ `none`
   */
  grabbed(resize: NodeResize): Option<ResizeHold> {
    return resize.kind === "resizing" ? Option.some(resize) : Option.none;
  },

  /**
   * 選択中の artboard / ノードの、掴める軸のハンドルと掴んだ時点の位置
   * （docs/06-ui.md「リサイズハンドル」）。
   *
   * @param selection ハンドルを出す対象を決める、ドキュメントと選択の対
   * @returns 掴める軸のハンドルと、ドキュメントへ書ける今の位置。単一選択でなければ
   *   掴める軸が空
   */
  resizable(selection: DocumentSelection): ResizableSelection {
    const selected = DocumentSelection.singleName(selection);
    if (!Option.isSome(selected)) {
      return UnresizableSelection;
    }
    const name = selected.value;
    const artboards = selection.document.artboards;
    const index = artboards.findIndex((artboard) => artboard.name === name);
    if (index >= 0) {
      return {
        lengths: artboardHandles(artboards[index]),
        origin: Option.some(ArrangedArtboard.positionAt(artboards, index)),
      };
    }
    const node = DesignDocument.findNode(selection.document, name);
    if (!Option.isSome(node)) {
      return UnresizableSelection;
    }
    const placement = DesignDocument.childPlacementOf(selection.document, name);
    return {
      lengths: nodeHandles(node.value),
      origin: Option.map(placement, (child) =>
        Placement.offset(child.placement),
      ),
    };
  },

  /**
   * 掴んだものを、ポインタの起点と対象の位置と対にする。
   *
   * ハンドルを直に押した経路も帯の経路もここを通すので、掴んだ時点の位置の取り方が
   * 2 箇所へ散らない。
   *
   * @param resizable 選択中のものの掴める軸と位置
   * @param grip 掴んだもの
   * @param pointerOrigin 押された位置
   * @returns 掴んでいるもの
   */
  hold(
    resizable: ResizableSelection,
    grip: ResizeGrip,
    pointerOrigin: Offset,
  ): ResizeHold {
    return { grip, pointerOrigin, grabbedAt: resizable.origin };
  },

  /**
   * ポインタが乗っている帯で掴めるもの。辺から内側へ `ResizeHandleThicknessPx` までを
   * 掴める帯とする（描かれている四角より広い / 上の定数を参照）。
   *
   * 角では 2 本の帯が重なるので、先にある方（`resizable.lengths` の並び順）を掴む。
   * **帯は角でも 1 軸**なので、順序を決めておけば足りる（上の定数を参照）。
   *
   * @param resizable 選択中のものの掴める軸と位置
   * @param bounds 選択中のものが描かれている矩形
   * @param pointer 押された位置
   * @returns その位置で掴めるもの。矩形の外か、どの帯にも入っていないか、入っている
   *   帯が始点側なのに位置を書けないときは `none`
   */
  grabAt(
    resizable: ResizableSelection,
    bounds: CanvasBounds,
    pointer: Offset,
  ): Option<ResizeHold> {
    if (!CanvasBounds.contains(bounds, pointer)) {
      return Option.none;
    }
    const onBand = resizable.lengths.flatMap((handle) => {
      const end = bandEndAt(bounds, pointer, handle.axis);
      const grab = Option.flatMap(end, (side) =>
        grabFor(resizable, handle, side),
      );
      return Option.isSome(grab) ? [grab.value] : [];
    });
    return Option.map(Option.fromNullable(onBand[0]), (grab) =>
      NodeResize.hold(resizable, ResizeGrip.create(grab), pointer),
    );
  },

  /**
   * 掴む。以後の長さは掴んだ位置と長さからの差分で決まる。
   *
   * @param held 掴んだ時点の状態（`ResizeHold`）
   * @returns リサイズしている状態
   */
  grab(held: ResizeHold): NodeResize {
    return { kind: "resizing", ...held };
  },

  /**
   * 今のポインタ位置で書き込む長さと位置。掴んでいなければ決まらない
   * （ボタンを離したあとのマウス移動）。
   *
   * @param resize 今のリサイズの状態
   * @param pointer 今のポインタの位置
   * @param view 画面上の量をドキュメント上の量へ直す倍率
   * @returns 書き込む編集。掴んでいなければ `none`
   */
  editAt(
    resize: NodeResize,
    pointer: Offset,
    view: CanvasView,
  ): Option<ResizeEdit> {
    if (resize.kind !== "resizing") {
      return Option.none;
    }
    const moved = Offset.delta(resize.pointerOrigin, pointer);
    // 先頭を分けて組み立てるのは、`map` だと並びが空になりうる型へ落ちるため
    const [first, ...rest] = ResizeGrip.grabs(resize.grip);
    const resized: readonly [ResizedLength, ...ResizedLength[]] = [
      resizedLength(first, moved, view),
      ...rest.map((grab) => resizedLength(grab, moved, view)),
    ];
    const lengths: AxisLengths = [
      resized[0].length,
      ...resized.slice(1).map((each) => each.length),
    ];
    const position = placedPosition(resize.grabbedAt, resized);
    return Option.some(
      Option.isSome(position)
        ? ResizeEdit.placedAt(lengths, position.value)
        : ResizeEdit.create(lengths),
    );
  },

  /**
   * 指を離す。
   *
   * @param resize 今のリサイズの状態
   * @returns 掴んでいたなら直後の `click` を飲み込む状態、そうでなければ何も掴んでいない状態
   */
  release(resize: NodeResize): NodeResize {
    return resize.kind === "resizing"
      ? { kind: "resized" }
      : NodeResize.create();
  },

  /**
   * 直後の `click` を選択に使わせないか。
   *
   * @param resize 今のリサイズの状態
   * @returns `resized`（`NodeResize` の型の doc）にいれば `true`
   */
  consumesClick(resize: NodeResize): boolean {
    return resize.kind === "resized";
  },
} as const;

/** 掴んだ 1 軸ぶんの結果。新しい長さと、そのために辺が動いた量。 */
type ResizedLength = Readonly<{
  length: AxisLength;
  /** 始点側の辺が動いた量（ドキュメント上の px）。終点側を掴んだ軸は 0。 */
  shift: number;
}>;

/**
 * 掴んだ軸を、ポインタの移動量ぶんだけ伸び縮みさせた結果。
 *
 * 始点側を掴んだ軸は、**丸めたあとの長さから**動いた量を逆算する。長さが 0 で止まると
 * 辺もそこで止まり、反対側の辺がその場に留まる。
 *
 * @param grab 掴んだ軸とその時点の長さ・端
 * @param moved 掴んでからのポインタの移動量（画面上の px）
 * @param view 画面上の量をドキュメント上の量へ直す倍率
 * @returns 新しい長さと、始点側の辺が動いた量
 */
function resizedLength(
  grab: AxisGrab,
  moved: Offset,
  view: CanvasView,
): ResizedLength {
  const axis = grab.length.axis;
  const along = CanvasView.toDocumentLength(view, Offset.along(moved, axis));
  const before = grab.length.length;
  const isStart = grab.end === AxisEnds.Start;
  const length = AxisLength.create(
    axis,
    isStart ? before - along : before + along,
  );
  return { length, shift: isStart ? before - length.length : 0 };
}

/**
 * 反対側の辺をその場に留めるための、置き直したあとの位置。
 *
 * @param grabbedAt 掴んだ時点の対象の位置。位置を書けない対象なら `none`
 * @param resized 掴んだ軸ぶんの結果
 * @returns 置き直したあとの位置。始点側を掴んだ軸が無いか、位置を書けない対象なら `none`
 */
function placedPosition(
  grabbedAt: Option<Offset>,
  resized: readonly ResizedLength[],
): Option<Offset> {
  const shifts = resized.filter((each) => each.shift !== 0);
  if (shifts.length === 0) {
    return Option.none;
  }
  return Option.map(grabbedAt, (from) =>
    shifts.reduce((moved, each) => Offset.add(moved, shiftOffset(each)), from),
  );
}

/**
 * 1 軸ぶんの辺の動きを平面の差にする。
 *
 * @param resized 掴んだ 1 軸ぶんの結果
 * @returns その軸だけが動く差
 */
function shiftOffset(resized: ResizedLength): Offset {
  return resized.length.axis === Axes.Width
    ? { x: resized.shift, y: 0 }
    : { x: 0, y: resized.shift };
}
