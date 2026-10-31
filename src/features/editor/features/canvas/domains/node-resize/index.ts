import { BoxElement } from "@/domains/compiled/compiled-element";
import type { Artboard } from "@/domains/dcmp/artboard";
import { AxisLength, type AxisLengths } from "@/domains/dcmp/axis-length";
import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Placement } from "@/domains/dcmp/placement";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Angle } from "@/domains/unit/angle";
import { Axes, type Axis, type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { Offset } from "@/domains/unit/offset";
import { ArrangedArtboard } from "@/features/editor/features/canvas/domains/arranged-artboard";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import {
  type GrabbedEnds,
  SideSnap,
  type SideSnapped,
  type SnapGuides,
} from "@/features/editor/features/canvas/domains/side-snap";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 掴める帯の太さ（画面上の px）。辺からこの幅までが `grabAt` の当たり判定に入る。
 *
 * ハンドルの四角（`HandleAnchors`）とは別に、**掴める辺の全長が掴める**。描かれている
 * 四角だけを掴み口にすると、辺のどこでも掴めていたものが 10px の的になって操作性が落ち
 * るので、四角の掴み口をこの帯に上乗せしている。
 *
 * 角のための大きさは別に持たず、帯の重なりをそのまま角とする（角の規則は `grabAt`）。描いた
 * 四角（角を中心に置くので要素の内側へは角から 5px しか届かない）に合わせると、その外側・帯の
 * 内側に 1 軸の縁が残る。
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
 * 掴んだものが画面上で伸び縮みする向きを 45 度刻みに丸めたもの（度・時計回り。矢印は前後を
 * 区別しないので 180 度で一周する）。カーソルの矢印の向きを選ぶのに使う。
 */
export const GripOrientations = {
  Horizontal: 0,
  TopLeftToBottomRight: 45,
  Vertical: 90,
  TopRightToBottomLeft: 135,
} as const;

/** 掴んだものが画面上で伸び縮みする向き（`GripOrientations`）。 */
export type GripOrientation = ValueOf<typeof GripOrientations>;

/** 矢印は向きを区別しないので、半回りで同じ向きに戻る。 */
const HalfTurn = 180;

/** カーソルの向きを丸める刻み。 */
const OrientationStep = 45;

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
  grabs(grip: ResizeGrip): NonEmptyArray<AxisGrab> {
    switch (grip.kind) {
      case "width":
        return [grip.width];
      case "height":
        return [grip.height];
      case "both":
        return [grip.width, grip.height];
    }
  },

  /**
   * 掴んだものが動かす辺を、軸ごとに並べ直したもの（辺のスナップに渡す形）。
   *
   * @param grip 掴んだもの
   * @returns 軸ごとに掴んだ端。その軸を変えない掴みなら `none`
   */
  grabbedEnds(grip: ResizeGrip): GrabbedEnds {
    const grabs = ResizeGrip.grabs(grip);
    const endAlong = (axis: Axis): Option<AxisEnd> =>
      Option.map(
        Option.fromNullable(grabs.find((grab) => grab.length.axis === axis)),
        (grab) => grab.end,
      );
    return { width: endAlong(Axes.Width), height: endAlong(Axes.Height) };
  },

  /**
   * 掴んだものが画面上で伸び縮みする向き（docs/06-ui.md「リサイズハンドル」）。
   *
   * @param grip 掴んだもの
   * @param rotation 掴んだものの画面上の向き（自分と祖先の合計）
   * @returns 45 度刻みで最も近い向き。ちょうど中間（22.5 度など）は時計回りの側
   */
  orientationOf(grip: ResizeGrip, rotation: Angle): GripOrientation {
    const turned = (unrotatedOrientation(grip) + rotation) % HalfTurn;
    return nearestOrientation((turned + HalfTurn) % HalfTurn);
  },
} as const;

/**
 * 掴んだものが、回る前に伸び縮みする向き。
 *
 * @param grip 掴んだもの
 * @returns 幅なら横、高さなら縦。角は掴んだ 2 つの端が同じ側（左上・右下）なら左上 - 右下、
 *   違う側（右上・左下）なら右上 - 左下
 */
function unrotatedOrientation(grip: ResizeGrip): GripOrientation {
  switch (grip.kind) {
    case "width":
      return GripOrientations.Horizontal;
    case "height":
      return GripOrientations.Vertical;
    case "both":
      return grip.width.end === grip.height.end
        ? GripOrientations.TopLeftToBottomRight
        : GripOrientations.TopRightToBottomLeft;
  }
}

/**
 * 半回りの中の角度に最も近い 45 度刻みの向き。
 *
 * @param degrees 0 以上 180 未満の角度
 * @returns 最も近い向き。ちょうど中間は大きい側。157.5 度以上は 180 度（＝横）に近い
 */
function nearestOrientation(degrees: number): GripOrientation {
  const halfStep = OrientationStep / 2;
  if (degrees < GripOrientations.TopLeftToBottomRight - halfStep) {
    return GripOrientations.Horizontal;
  }
  if (degrees < GripOrientations.Vertical - halfStep) {
    return GripOrientations.TopLeftToBottomRight;
  }
  if (degrees < GripOrientations.TopRightToBottomLeft - halfStep) {
    return GripOrientations.Vertical;
  }
  return degrees < HalfTurn - halfStep
    ? GripOrientations.TopRightToBottomLeft
    : GripOrientations.Horizontal;
}

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
 * 選択中のものの向き（度・時計回り）。
 *
 * 伸びる向きは画面上の向きで決まり、位置の置き直しは親の座標（祖先の回転を含まない）で
 * 行うので、2 つを持つ。
 */
export type ResizeRotation = Readonly<{
  /** 自分の `rotation`。位置を書く親の座標の中での向き。 */
  own: Angle;
  /** 自分と包んでいるものの `rotation` の合計（`DesignDocument.totalRotationOf`）。 */
  total: Angle;
}>;

/**
 * 掴んだ辺を揃える先と、それが効く掴み方（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 名前は**リサイズしても動かないもの**だけで、並びは近さが同じときに先に寄る順。
 *
 * 掴み方で絞る前の名前を生のまま読めないよう直和にし、絞るのは `NodeResize.hold` が行う。
 */
export type ResizeSnapTargets =
  /** artboard と、回っていない `placement: "absolute"` のノード。どの掴み方でも効く。 */
  | Readonly<{ kind: "anyGrip"; names: readonly string[] }>
  /** 条件（`flowSnapTargets`）を満たすフロー配置のノード。`axis` の 1 軸だけを掴んだときに効く。 */
  | Readonly<{ kind: "axisOnly"; axis: Axis; names: readonly string[] }>
  /** 回っている・掴めない・条件を満たさないフロー配置のノード。 */
  | Readonly<{ kind: "none" }>;

const ResizeSnapTargets = {
  /** 揃え先の無い対象。 */
  None: { kind: "none" },

  /**
   * その掴み方で揃える先の名前。
   *
   * @param targets 選択中のものの揃え先
   * @param grip 掴んだもの
   * @returns 揃え先の名前。`axisOnly` でその軸の 1 軸だけを掴んでいないときと、`none` では空
   */
  namesFor(targets: ResizeSnapTargets, grip: ResizeGrip): readonly string[] {
    switch (targets.kind) {
      case "anyGrip":
        return targets.names;
      case "axisOnly":
        return grabsOnly(grip, targets.axis) ? targets.names : [];
      case "none":
        return [];
    }
  },
} as const;

/**
 * その 1 軸だけを変える掴み方か。
 *
 * @param grip 掴んだもの
 * @param axis 見る軸
 * @returns 変える軸がその 1 軸だけなら `true`。角で 2 軸を変える・別の軸を変えるなら `false`
 */
function grabsOnly(grip: ResizeGrip, axis: Axis): boolean {
  const grabs = ResizeGrip.grabs(grip);
  return grabs.length === 1 && grabs[0].length.axis === axis;
}

/**
 * リサイズの観点から見た選択。掴める軸の長さと、ドキュメントへ書ける今の位置と、掴んだ辺を
 * 揃える先。
 *
 * 始点側の辺を掴めるかは「その軸が固定か」だけでは決まらず、反対の辺を留めるための位置を
 * 書けるかにも依るので、対で 1 つの型にする。揃え先も置かれ方（artboard / 絶対配置 /
 * フロー配置）で決まるので、同じ分岐で決める。
 */
export type ResizableSelection = Readonly<{
  lengths: readonly AxisLength[];
  /** 掴んだ時点の位置。ドキュメントへ位置を書けない対象（フロー配置）なら `none`。 */
  origin: Option<Offset>;
  /** 掴んだ辺を揃える先（`ResizeSnapTargets`）。 */
  snapTargets: ResizeSnapTargets;
  rotation: ResizeRotation;
}>;

/**
 * 掴んでいるもの。何を変えるか、ポインタをどこから測るか、位置をどこから動かすか。
 */
export type ResizeHold = Readonly<{
  grip: ResizeGrip;
  pointerOrigin: Offset;
  /** 掴んだ時点の対象の位置。位置を書けない対象なら `none`。 */
  grabbedAt: Option<Offset>;
  rotation: ResizeRotation;
  /**
   * この掴み方で揃える先の名前（`ResizableSelection.snapTargets` を掴み方で絞ったもの）。
   * 並びは近さが同じときに先に寄る順。
   */
  snapTargetNames: readonly string[];
  /**
   * 掴んだ時点の辺のスナップの組（`moving` は掴んだ時点の矩形）。`hold` の直後と、掴んだ
   * 時点の矩形を測れなかったときは `none`。揃え先が無い掴み（`snapTargetNames` が空）と、
   * 揃え先を外した値（`withoutSnapTargets`）では `stationary` が空の組になる。
   *
   * 揃え先はリサイズしても動かないものに絞っている（`ResizeSnapTargets`）ので、動かすたびには
   * 測り直さない。
   */
  snapFrom: Option<SideSnap>;
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
  | (Readonly<{
      kind: "resizing";
      /** 最後に動かした位置で揃った線（画面上の px） */
      guides: SnapGuides;
    }> &
      ResizeHold)
  | Readonly<{ kind: "resized" }>;

/**
 * ポインタが動いた 1 回分の答え。書き込む編集と、その位置で揃った線。
 *
 * 別々の入口にすると、書き込む長さとガイド線が別々に寄せ量を決める余地が残る。
 */
export type TrackedResize = Readonly<{
  edit: ResizeEdit;
  /** 掴んだ辺が揃った線（画面上の px） */
  guides: SnapGuides;
}>;

/** 掴める軸も位置も無い選択。未選択・掴めない対象・凍結中に使う。 */
const UnresizableSelection: ResizableSelection = {
  lengths: [],
  origin: Option.none,
  snapTargets: ResizeSnapTargets.None,
  rotation: { own: 0, total: 0 },
};

/**
 * 名前で指した artboard / ノードの、掴める軸のハンドル（docs/06-ui.md「`hug` / `fill` では
 * ハンドルを出さない」）。
 *
 * 部品インスタンスに出さないのは、上書きできるのが publicProps に宣言のある prop だけで、宣言の
 * 追加は AI / JSON 編集の担当だから（docs/06-ui.md「部品化」）。出すと掴めるのに何も起きない。
 *
 * @param document 引き先になるドキュメント
 * @param name ハンドルを出したい artboard / ノードの名前
 * @returns `fixed` の軸のハンドルの並び。`DesignDocument.fixedLengthOf` が `none` を返す軸は
 *   出さない
 */
function fixedLengthsOf(
  document: DesignDocument,
  name: string,
): readonly AxisLength[] {
  return Object.values(Axes).flatMap((axis) => {
    const length = DesignDocument.fixedLengthOf(document, name, axis);
    return Option.isSome(length) ? [AxisLength.create(axis, length.value)] : [];
  });
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
 * その軸をその端から掴めるか。箇所（比率）から引くときも帯から引くときもここを通す。
 *
 * @param resizable 選択中のものの掴める軸と位置
 * @param axis 見る軸
 * @param pointedEnd 掴もうとしている端。その軸を掴まない位置なら `none`
 * @returns 掴めるならその掴み。その軸が固定でない・端が無い・始点側なのに位置を書けない
 *   ときは `none`
 */
function axisGrabAt(
  resizable: ResizableSelection,
  axis: Axis,
  pointedEnd: Option<AxisEnd>,
): Option<AxisGrab> {
  return Option.flatMap(pointedEnd, (end) =>
    Option.flatMap(AxisLength.find(resizable.lengths, axis), (length) =>
      grabFor(resizable, length, end),
    ),
  );
}

/**
 * その軸をその端から掴む掴み。始点側から縮めるには、反対の辺をその場に留めるための位置が
 * 要る（フロー配置のノードは持たない）。
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
 * @param bounds 選択中のものの回る前の矩形
 * @param pointer 押された位置を回る前へ戻した点
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
  /** 掴める軸も位置も無い選択（未選択・掴めない対象・ロック中・凍結中）。 */
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
      axisGrabAt(resizable, Axes.Width, endAt(anchor.x)),
      axisGrabAt(resizable, Axes.Height, endAt(anchor.y)),
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
   * 選択中の artboard / ノードの、掴める軸のハンドルと掴んだ時点の位置と揃え先
   * （docs/06-ui.md「リサイズハンドル」）。
   *
   * 揃え先は、artboard なら他の artboard のうち幅を変えても動かないもの
   * （`ArrangedArtboard.isShiftedByWidth` を外す）、`placement: "absolute"` のノードなら
   * 今の親と、その直下にある自分以外の子（孫は含めない。絶対配置はフローから外れるので、
   * 親の大きさにも兄弟の配置にも関わらない）。フロー配置のノードは `flowSnapTargets` の条件を
   * 満たすときだけ同じ名前を持つ。画面上で回っているノード（自分と祖先の合計が 360 の倍数で
   * ない）は揃え先を持たない（docs/06-ui.md「辺のスナップ」）。
   *
   * @param selection ハンドルを出す対象を決める、ドキュメントと選択の対
   * @returns 掴める軸のハンドルと、ドキュメントへ書ける今の位置と、揃え先。単一選択
   *   でないとき・ロック中のノード（docs/03「ロック」）・非表示のノード（docs/03「表示 /
   *   非表示」。包んでいるノード・artboard が非表示のものを含む）は掴める軸が空で揃え先も無い
   */
  resizable(selection: DocumentSelection): ResizableSelection {
    const selected = DocumentSelection.singleName(selection);
    if (!Option.isSome(selected)) {
      return UnresizableSelection;
    }
    const name = selected.value;
    const rotation = resizeRotationOf(selection.document, name);
    if (!Option.isSome(rotation)) {
      return UnresizableSelection;
    }
    const artboards = selection.document.artboards;
    const index = artboards.findIndex((artboard) => artboard.name === name);
    if (index >= 0) {
      return {
        lengths: fixedLengthsOf(selection.document, name),
        origin: Option.some(ArrangedArtboard.positionAt(artboards, index)),
        snapTargets: {
          kind: "anyGrip",
          names: artboards
            .filter((_, other) =>
              isStillWhileResizing(artboards, { resized: index, other }),
            )
            .map((artboard) => artboard.name),
        },
        rotation: rotation.value,
      };
    }
    const node = DesignDocument.findNode(selection.document, name);
    if (!Option.isSome(node)) {
      return UnresizableSelection;
    }
    const isUnresizableOnCanvas =
      DesignDocument.isLocked(selection.document, name) ||
      DesignDocument.isHidden(selection.document, name);
    if (isUnresizableOnCanvas) {
      return UnresizableSelection;
    }
    const placement = DesignDocument.childPlacementOf(selection.document, name);
    return {
      lengths: fixedLengthsOf(selection.document, name),
      origin: Option.map(placement, (child) =>
        Placement.offset(child.placement),
      ),
      snapTargets: Angle.isWholeTurns(rotation.value.total)
        ? nodeSnapTargets(selection.document, { name, placement })
        : ResizeSnapTargets.None,
      rotation: rotation.value,
    };
  },

  /**
   * 掴んだものを、ポインタの起点と対象の位置と対にする。
   *
   * ハンドルを直に押した経路も帯の経路もここを通すので、掴んだ時点の位置の取り方が
   * 2 箇所へ散らない。
   *
   * 揃え先もここで掴み方に合わせて絞る（`ResizeSnapTargets`）。
   *
   * @param resizable 選択中のものの掴める軸と位置と揃え先
   * @param grip 掴んだもの
   * @param pointerOrigin 押された位置
   * @returns 掴んでいるもの
   */
  hold(
    resizable: ResizableSelection,
    grip: ResizeGrip,
    pointerOrigin: Offset,
  ): ResizeHold {
    return {
      grip,
      pointerOrigin,
      grabbedAt: resizable.origin,
      rotation: resizable.rotation,
      snapTargetNames: ResizeSnapTargets.namesFor(resizable.snapTargets, grip),
      snapFrom: Option.none,
    };
  },

  /**
   * 掴んだものに、掴んだ時点の辺のスナップの組を載せる。載せると、掴んだ辺が揃え先の辺の
   * 近くで吸い付く（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
   *
   * @param held 掴んだもの
   * @param snap 掴んだ時点の矩形（`moving`）と、`ResizeHold.snapTargetNames` の揃え先の実測
   * @returns その組を載せた掴み
   */
  withSideSnap(held: ResizeHold, snap: SideSnap): ResizeHold {
    return { ...held, snapFrom: Option.some(snap) };
  },

  /**
   * 掴んでいる最中の状態から揃え先を外す。外した状態で `trackedAt` を通すと、揃え先の近くでも
   * 寄せず、ガイド線も出ない（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
   *
   * `snapFrom` を `none` にはせず揃え先を空にする。`none` は `hold` の直後か、掴んだ時点に
   * 測れなかったことを表しており、吸い付かないことは揃え先の無い掴みもノードの移動も「揃え先が空」で表している。
   *
   * @param resize 今のリサイズの状態
   * @returns 揃え先を空にした状態。掴んでいない / 組が載っていなければ `resize` のまま
   */
  withoutSnapTargets(resize: NodeResize): NodeResize {
    if (resize.kind !== "resizing") {
      return resize;
    }
    return {
      ...resize,
      snapFrom: Option.map(resize.snapFrom, (snap) =>
        SideSnap.create(snap.moving, []),
      ),
    };
  },

  /**
   * ポインタが乗っている帯で掴めるもの。辺から内側へ `ResizeHandleThicknessPx` までを
   * 掴める帯とする（描かれている四角より広い / 上の定数を参照）。
   *
   * 2 本の帯が重なる角では掴める軸をすべて掴む。片方しか掴めない（fixed でない / 始点側
   * なのに位置を書けない）ならその 1 軸（描いたハンドルの角と同じ規則。docs/06-ui.md
   * 「リサイズハンドル」）。
   *
   * 回って描かれているものは、押された位置を回る前へ戻してから回る前の矩形で判定する
   * ので、帯は回った辺に沿う。
   *
   * @param resizable 選択中のものの掴める軸と位置
   * @param bounds 選択中のものが回って描かれている矩形
   * @param pointer 押された位置
   * @returns その位置で掴めるもの。回った矩形の外か、どの帯でも掴める軸が 1 つも無い
   *   （帯に入っていない / 始点側なのに位置を書けない / 固定でない）ときは `none`
   */
  grabAt(
    resizable: ResizableSelection,
    bounds: RotatedBounds,
    pointer: Offset,
  ): Option<ResizeHold> {
    const unrotated = bounds.unrotated;
    const unrotatedPointer = RotatedBounds.unrotatePoint(bounds, pointer);
    if (!CanvasBounds.contains(unrotated, unrotatedPointer)) {
      return Option.none;
    }
    const grabOnBand = (axis: Axis): Option<AxisGrab> =>
      axisGrabAt(resizable, axis, bandEndAt(unrotated, unrotatedPointer, axis));
    return Option.map(
      combinedGrip(grabOnBand(Axes.Width), grabOnBand(Axes.Height)),
      (grip) => NodeResize.hold(resizable, grip, pointer),
    );
  },

  /**
   * 掴む。以後の長さは掴んだ位置と長さからの差分で決まる。
   *
   * @param held 掴んだ時点の状態（`ResizeHold`）
   * @returns リサイズしている状態
   */
  grab(held: ResizeHold): NodeResize {
    return { kind: "resizing", ...held, guides: SideSnap.NoGuides };
  },

  /**
   * 掴んでいる状態に、最後に動かした位置で揃った線を載せる。
   *
   * @param resize 今のリサイズの状態
   * @param guides 揃った線（`trackedAt` の答え）
   * @returns 線を差し替えた状態。掴んでいなければ `resize` のまま
   */
  withSnapGuides(resize: NodeResize, guides: SnapGuides): NodeResize {
    return resize.kind === "resizing" ? { ...resize, guides } : resize;
  },

  /**
   * 今出すガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
   *
   * @param resize 今のリサイズの状態
   * @returns 最後に動かした位置で揃った線。掴んでいなければ線の無いガイド
   */
  snapGuides(resize: NodeResize): SnapGuides {
    return resize.kind === "resizing" ? resize.guides : SideSnap.NoGuides;
  },

  /**
   * 今のポインタ位置で書き込む長さと位置と、掴んだ辺が揃った線。掴んでいなければ決まらない
   * （ボタンを離したあとのマウス移動）。
   *
   * 長さはポインタの移動量を掴んだものの画面上の向きの分だけ戻し、その軸へ射影した量だけ
   * 変わる（docs/06-ui.md「リサイズハンドル」）。
   *
   * @param resize 今のリサイズの状態
   * @param pointer 今のポインタの位置
   * @param view 画面上の量をドキュメント上の量へ直す倍率
   * @returns 書き込む編集と揃った線。掴んでいなければ `none`
   */
  trackedAt(
    resize: NodeResize,
    pointer: Offset,
    view: CanvasView,
  ): Option<TrackedResize> {
    if (resize.kind !== "resizing") {
      return Option.none;
    }

    const pointerMoved = Offset.delta(resize.pointerOrigin, pointer);
    const snapped = snappedAt(resize, pointerMoved);
    const screenMoved = Offset.add(pointerMoved, snapped.offset);
    // 掴んだものの軸に沿って伸びるよう、画面の移動量を回る前の向きへ戻す
    const moved = Offset.rotate(screenMoved, -resize.rotation.total);

    const resized = ArrayEx.mapNonEmpty(ResizeGrip.grabs(resize.grip), (grab) =>
      resizedLength(grab, moved, view),
    );
    const lengths: AxisLengths = ArrayEx.mapNonEmpty(
      resized,
      (each) => each.length,
    );
    const position = placedPosition(resize, resized);

    return Option.some({
      edit: Option.isSome(position)
        ? ResizeEdit.placedAt(lengths, position.value)
        : ResizeEdit.create(lengths),
      guides: snapped.guides,
    });
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

/**
 * 名前で指したものの、自分の向きと画面上の向き。
 *
 * @param document 引き先になるドキュメント
 * @param name 選択中の artboard / ノードの名前
 * @returns 2 つの向き。向きが引けない（`DesignDocument.rotationOf` が `none`）なら `none`
 */
function resizeRotationOf(
  document: DesignDocument,
  name: string,
): Option<ResizeRotation> {
  return Option.flatMap(DesignDocument.rotationOf(document, name), (own) =>
    Option.map(DesignDocument.totalRotationOf(document, name), (total) => ({
      own,
      total,
    })),
  );
}

/**
 * その artboard が、並びの中の 1 枚をリサイズしても動かない揃え先になるか。
 *
 * 高さだけを変えるときも、幅につられて動くものを外す（docs/06-ui.md「辺のスナップ」の
 * artboard の項）。
 *
 * @param artboards artboard の並び（`.dcmp` の並び順）
 * @param pair リサイズする artboard（`resized`）と、揃え先になるかを知りたい artboard
 *   （`other`）の並びの中の位置
 * @returns 自分自身でなく、幅につられて動くものでもなければ `true`
 */
function isStillWhileResizing(
  artboards: readonly Artboard[],
  pair: Readonly<{ resized: number; other: number }>,
): boolean {
  if (pair.other === pair.resized) {
    return false;
  }
  return !ArrangedArtboard.isShiftedByWidth(artboards, pair);
}

/**
 * 今の親と、その直下にある自分以外の子の名前。
 *
 * @param document 引き先になるドキュメント
 * @param placed 自分の名前と、今の親の名前
 * @returns 親を先に、あとは子の並び順。親が子の並びを持たなければ `none`
 */
function parentWithSiblingNames(
  document: DesignDocument,
  placed: Readonly<{ name: string; parentName: string }>,
): Option<readonly string[]> {
  return Option.map(
    DesignDocument.findChildren(document, placed.parentName),
    (children) => [
      placed.parentName,
      ...children
        .map((child) => child.name)
        .filter((sibling) => sibling !== placed.name),
    ],
  );
}

/**
 * 回っていないノードの揃え先。絶対配置ならどの掴み方でも効き、フロー配置なら `flowSnapTargets`。
 *
 * @param document 引き先になるドキュメント
 * @param selected 自分の名前と、絶対配置なら今の親と位置（`DesignDocument.childPlacementOf`）
 * @returns 揃え先。親が子の並びを持たなければ揃え先は無い
 */
function nodeSnapTargets(
  document: DesignDocument,
  selected: Readonly<{ name: string; placement: Option<ChildPlacement> }>,
): ResizeSnapTargets {
  if (!Option.isSome(selected.placement)) {
    return flowSnapTargets(document, selected.name);
  }
  const names = parentWithSiblingNames(document, {
    name: selected.name,
    parentName: selected.placement.value.parentName,
  });
  return Option.isSome(names)
    ? { kind: "anyGrip", names: names.value }
    : ResizeSnapTargets.None;
}

/**
 * フロー配置のノードの揃え先（docs/06-ui.md「辺のスナップ」）。親が交差軸の始点を動かさない
 * ときだけ、その軸を掴んだときに今の親と、その直下にある自分以外の子へ揃える。
 *
 * @param document 引き先になるドキュメント
 * @param name 自分の名前
 * @returns 親の交差軸だけで効く揃え先。親が引けない・交差軸の始点が動きうる
 *   （`BoxElement.stillCrossAxis` が `none`）なら揃え先は無い
 */
function flowSnapTargets(
  document: DesignDocument,
  name: string,
): ResizeSnapTargets {
  const position = DesignDocument.findChildPosition(document, name);
  if (!Option.isSome(position)) {
    return ResizeSnapTargets.None;
  }
  const parentName = position.value.parentName;
  const axis = Option.flatMap(
    DesignDocument.boxPropsOf(document, parentName),
    BoxElement.stillCrossAxis,
  );
  const names = parentWithSiblingNames(document, { name, parentName });
  const hasSnapTargets = Option.isSome(axis) && Option.isSome(names);
  if (!hasSnapTargets) {
    return ResizeSnapTargets.None;
  }
  return { kind: "axisOnly", axis: axis.value, names: names.value };
}

/**
 * 掴んだ辺を揃え先の辺へ寄せる量と、揃った線。軸ごとに、その軸で掴んだ辺だけを見る。
 *
 * 掴み方に揃え先が無い（`ResizeHold.snapTargetNames` が空）と、組の `stationary` も空なので
 * 寄せず、線も出ない。
 *
 * @param held 掴んでいるもの
 * @param moved 掴んでからのポインタの移動量（画面上の px）
 * @returns 寄せ量（画面上の px）と揃った線。組が載っていなければ寄せ量 0・線無し。掴んだ辺が
 *   閾値に届かない軸は寄せ量 0・線無し
 */
function snappedAt(held: ResizeHold, moved: Offset): SideSnapped {
  if (!Option.isSome(held.snapFrom)) {
    return SideSnap.Unsnapped;
  }
  return SideSnap.toEdgeSnapped(
    held.snapFrom.value,
    ResizeGrip.grabbedEnds(held.grip),
    moved,
  );
}

/** 掴んだ 1 軸ぶんの結果。新しい長さと、掴んだ端と、縮んだ量。 */
type ResizedLength = Readonly<{
  length: AxisLength;
  end: AxisEnd;
  /** 掴んだ時点の長さから縮んだ量（ドキュメント上の px）。伸びたなら負。 */
  shrunk: number;
}>;

/**
 * 掴んだ軸を、ポインタの移動量ぶんだけ伸び縮みさせた結果。
 *
 * 縮んだ量は**丸めたあとの長さから**逆算する。長さが 0 で止まると辺もそこで止まり、
 * 反対側の辺がその場に留まる。
 *
 * @param grab 掴んだ軸とその時点の長さ・端
 * @param moved 掴んでからのポインタの移動量を回る前の向きへ戻したもの（画面上の px）
 * @param view 画面上の量をドキュメント上の量へ直す倍率
 * @returns 新しい長さと、掴んだ端と、縮んだ量
 */
function resizedLength(
  grab: AxisGrab,
  moved: Offset,
  view: CanvasView,
): ResizedLength {
  const axis = grab.length.axis;
  const along = CanvasView.toDocumentLength(view, Offset.along(moved, axis));
  const before = grab.length.length;
  const length = AxisLength.create(
    axis,
    grab.end === AxisEnds.Start ? before - along : before + along,
  );
  return { length, end: grab.end, shrunk: before - length.length };
}

/**
 * 反対の辺・角が親の座標で動かないよう置き直したあとの位置（docs/06-ui.md「リサイズ
 * ハンドル」）。掴んだ軸ごとに、反対側の端を留める。
 *
 * 回っていなければ、始点側を掴んだ軸は縮んだ量だけ動き、終点側を掴んだ軸は動かない。
 * 回っていれば、中心を軸に回るので終点側を掴んでも左上が動く。
 *
 * @param held 掴んでいるもの（掴んだ時点の位置と、自分の向き）
 * @param resized 掴んだ軸ぶんの結果
 * @returns 置き直したあとの位置。左上が動かないか、位置を書けない対象なら `none`
 */
function placedPosition(
  held: ResizeHold,
  resized: readonly ResizedLength[],
): Option<Offset> {
  const centerMoved = resized.reduce<Offset>(
    (sum, each) => Offset.add(sum, centerShift(each)),
    Offset.Origin,
  );
  const halfShrunk = resized.reduce<Offset>(
    (sum, each) =>
      Offset.add(sum, axisOffset(each.length.axis, each.shrunk / 2)),
    Offset.Origin,
  );
  // 左上は中心から長さの半分だけ戻った位置なので、中心の動きに縮んだ量の半分を足す
  const shift = Offset.add(
    Offset.rotate(centerMoved, held.rotation.own),
    halfShrunk,
  );
  if (Offset.isOrigin(shift)) {
    return Option.none;
  }
  return Option.map(held.grabbedAt, (from) => Offset.add(from, shift));
}

/**
 * 反対側の端を留めたまま 1 軸の長さが変わったときに、中心が動く量（回る前の向き）。
 *
 * 中心は縮んだ量の半分だけ、留めている端のほうへ寄る。始点側を掴んだなら留めている
 * のは終点側（+）、終点側を掴んだなら始点側（-）。
 *
 * @param resized 掴んだ 1 軸ぶんの結果
 * @returns その軸だけが動く差
 */
function centerShift(resized: ResizedLength): Offset {
  const half = resized.shrunk / 2;
  return axisOffset(
    resized.length.axis,
    resized.end === AxisEnds.Start ? half : -half,
  );
}

/**
 * 1 軸に沿った量を平面の差にする。
 *
 * @param axis 量が沿う軸
 * @param amount その軸に沿った量
 * @returns その軸だけが動く差
 */
function axisOffset(axis: Axis, amount: number): Offset {
  return axis === Axes.Width ? { x: amount, y: 0 } : { x: 0, y: amount };
}
