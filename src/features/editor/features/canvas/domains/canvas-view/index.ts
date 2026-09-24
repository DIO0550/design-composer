import { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";

/**
 * キャンバスの見え方（docs/06-ui.md「中央 | キャンバス…ズーム / パンは非永続の view
 * state」）。
 *
 * ドキュメント（source of truth）には含めない実行時だけの状態なので、編集画面の状態では
 * なくキャンバスの中に閉じて持つ（docs/01「作業スペースの見た目（配置・ズーム等）は
 * source of truth に含めない」）。
 *
 * `dragFrom` はドラッグ中だけ意味を持つ**直前のポインタ位置**で、移動量はここからの差分
 * で決まる。ドラッグしていないのに開始位置だけが残る矛盾した状態を作れないよう `Option`
 * で表す。
 */
export type CanvasView = Readonly<{
  scale: number;
  offset: Offset;
  dragFrom: Option<Offset>;
}>;

/** 等倍。開いた直後とリセット後の倍率。 */
const DefaultScale = 1;

/**
 * 倍率の下限・上限。artboard が判別できないほど潰れる / 画面から溢れて
 * 現在位置を見失う状態を作れなくするための境界。
 */
const MinScale = 0.1;
const MaxScale = 4;

/** 1 操作あたりの拡大率。倍率は等比で動かす（等差だと拡大側ほど変化が鈍る）。 */
const ZoomFactor = 1.2;

/**
 * 収めるときに対象の四辺へ見込む余白（**ドキュメント上の px**）。
 *
 * artboard の見出しは箱の上へドキュメント px で 22px 描かれ（`artboard-label` の高さ 18px
 * + `pb-1` の 4px）、選択の枠も 3px ぶん外へ出る。
 *
 * 画面上の px で見込むと、倍率が上がるほど覆えなくなって見出しが切れる。22px より広い最小
 * の切りのいい値として 24 を採る。
 */
const FitPadding = 24;

/**
 * 収める対象（`target`）と、収める先（`viewport`）。どちらも実測した画面上の矩形。
 *
 * アクションへ載せる側も同じ対を運ぶので、綴りを 2 箇所に持たないようここから export する。
 */
export type FitBounds = Readonly<{
  target: CanvasBounds;
  viewport: CanvasBounds;
}>;

/**
 * 倍率を上下限の内側へ収める。
 *
 * @param scale 収めたい倍率
 * @returns 上下限の内側に収まった倍率
 */
function clampScale(scale: number): number {
  return NumberEx.clamp(scale, { min: MinScale, max: MaxScale });
}

/**
 * 中身を画面の真ん中へ置いたときの原点（1 軸ぶん）。
 *
 * 画面上の位置は「ドキュメント座標 × 倍率 + 原点」で決まる（`transform` は translate が
 * 先に効く / `panBy` の doc）。中身の左端をちょうど隙間の半分の位置へ置きたいので、
 * 余った隙間の半分から、中身の左端が倍率のぶんだけ進む量を引く。
 *
 * @param available 収める先の長さ（画面上の px）
 * @param scaledLength 収める中身の長さ（倍率を掛けたあとの画面上の px）
 * @param scaledStart 中身の左端 / 上端（倍率を掛けたあとの画面上の px）
 * @returns 中身が真ん中に来る原点（画面上の px）
 */
function centeredOrigin(
  available: number,
  scaledLength: number,
  scaledStart: number,
): number {
  return (available - scaledLength) / 2 - scaledStart;
}

/**
 * 描かれている矩形を、ドキュメント上の矩形へ割り戻して四辺へ余白を足したもの。
 *
 * @param view 割り戻しに使う今の見え方
 * @param drawn 土台の左上を原点にした、描かれている矩形
 * @returns ドキュメント上での、余白ぶん広げた矩形
 */
function paddedDocumentBounds(
  view: CanvasView,
  drawn: CanvasBounds,
): CanvasBounds {
  const toDocument = (screenLength: number): number =>
    CanvasView.toDocumentLength(view, screenLength);
  return {
    left: toDocument(drawn.left - view.offset.x) - FitPadding,
    top: toDocument(drawn.top - view.offset.y) - FitPadding,
    width: toDocument(drawn.width) + FitPadding * 2,
    height: toDocument(drawn.height) + FitPadding * 2,
  };
}

/**
 * 今の倍率へ係数を掛けた表示。上下限は超えない。
 *
 * @param view 掛ける元の表示
 * @param factor 今の倍率に掛ける係数
 * @returns 倍率だけが変わった表示（上下限は超えない）
 */
function scaleBy(view: CanvasView, factor: number): CanvasView {
  return { ...view, scale: clampScale(view.scale * factor) };
}

export const CanvasView = {
  /**
   * 開いた直後の表示（ズーム / パンは保存しないので毎回この状態で開く）。
   *
   * @returns 等倍・原点で、ドラッグでパンしていない表示
   */
  create(): CanvasView {
    return {
      scale: DefaultScale,
      offset: Offset.Origin,
      dragFrom: Option.none,
    };
  },

  /**
   * 倍率を一定の比で上げる。
   *
   * @param view 今の表示
   * @returns 倍率だけが上がった表示（上限は超えない）
   */
  zoomIn(view: CanvasView): CanvasView {
    return scaleBy(view, ZoomFactor);
  },

  /**
   * 倍率を `zoomIn` と同じ比で下げる。
   *
   * @param view 今の表示
   * @returns 倍率だけが下がった表示（下限は超えない）
   */
  zoomOut(view: CanvasView): CanvasView {
    return scaleBy(view, 1 / ZoomFactor);
  },

  /**
   * 指した矩形が画面に収まる倍率と位置にする（Figma の Zoom to fit / Zoom to selection）。
   * CSS の `fit-content` とは関係しない。
   *
   * 受け取るのはどちらも**実測した画面上の矩形**（client 座標）。`target` は倍率と位置が
   * 効いた状態で描かれているので今の見え方から割り戻す（押した時点の倍率・位置に依らず同
   * じ結果になる）。`viewport` は土台（`canvas-surface`）の左上が原点である前提。
   *
   * @param view 割り戻しに使う今の見え方
   * @param bounds 収めたい矩形（`target`）と、収める先の土台の矩形（`viewport`）
   * @returns 対象が余白ぶんの隙間を空けて中央に収まる倍率と位置。倍率は上下限を超
   *   えない。対象にも収める先にも面積が要るので、どちらかが潰れているときは今の
   *   見え方をそのまま返す
   */
  fitTo(view: CanvasView, bounds: FitBounds): CanvasView {
    const { target, viewport } = bounds;
    const drawn = CanvasBounds.relativeTo(target, viewport);
    /*
     * 面積を見るのは余白を足す前。足したあとだと、何も描かれていない（0 × 0 の）対象でも
     * 余白ぶんの大きさを持ってしまい、空の範囲へ寄る倍率が決まってしまう。
     */
    if (!CanvasBounds.hasArea(drawn) || !CanvasBounds.hasArea(viewport)) {
      return view;
    }
    const content = paddedDocumentBounds(view, drawn);
    const scale = clampScale(
      Math.min(
        viewport.width / content.width,
        viewport.height / content.height,
      ),
    );
    return {
      ...view,
      scale,
      offset: {
        x: centeredOrigin(
          viewport.width,
          content.width * scale,
          content.left * scale,
        ),
        y: centeredOrigin(
          viewport.height,
          content.height * scale,
          content.top * scale,
        ),
      },
    };
  },

  /**
   * 移動量を現在の位置へ足す。移動量は画面上の px のまま足す。
   *
   * `transform` では translate が scale より先に適用され、translate は拡大前の座標系で効
   * くため、倍率で割る必要はない。
   *
   * @param view 今の表示
   * @param delta 画面上の移動量
   * @returns 位置だけが動いた表示
   */
  panBy(view: CanvasView, delta: Offset): CanvasView {
    return { ...view, offset: Offset.add(view.offset, delta) };
  },

  /**
   * ドラッグによるパンを始める。以後の移動はこの位置からの差分で決まる。
   *
   * @param view 今の表示
   * @param pointer 押したときの画面上のポインタの位置
   * @returns パンしている表示
   */
  startDrag(view: CanvasView, pointer: Offset): CanvasView {
    return { ...view, dragFrom: Option.some(pointer) };
  },

  /**
   * ドラッグ中のポインタ移動を反映する。
   *
   * @param view 今の表示
   * @param pointer 画面上のポインタの位置
   * @returns 前のポインタからの差分だけ動いた表示。パンしていなければ（ボタンを離した
   *   あとのマウス移動）`view` のまま
   */
  dragTo(view: CanvasView, pointer: Offset): CanvasView {
    if (!Option.isSome(view.dragFrom)) {
      return view;
    }
    const moved = CanvasView.panBy(
      view,
      Offset.delta(view.dragFrom.value, pointer),
    );
    return { ...moved, dragFrom: Option.some(pointer) };
  },

  /**
   * ドラッグによるパンを終える。位置はそのまま残る。
   *
   * @param view 今の表示
   * @returns パンしていない表示
   */
  endDrag(view: CanvasView): CanvasView {
    return { ...view, dragFrom: Option.none };
  },

  /**
   * ドラッグでパンしている最中か。
   *
   * @param view 今の表示
   * @returns `startDrag` から `endDrag` までの間なら `true`
   */
  isDragging(view: CanvasView): boolean {
    return Option.isSome(view.dragFrom);
  },

  /**
   * 画面上の長さをドキュメント上の長さへ直す。
   * 中身は倍率をかけて描かれているので、画面で測った差はその分だけ割り戻す
   * （ドラッグでのリサイズ量は、倍率を変えても掴んだ点に追従する）。
   *
   * @param view 割り戻しに使う倍率を持つ表示
   * @param screenLength 画面で測った長さ
   * @returns ドキュメント上の長さ
   */
  toDocumentLength(view: CanvasView, screenLength: number): number {
    return screenLength / view.scale;
  },

  /**
   * 画面上の移動量をドキュメント上の移動量へ直す。
   *
   * 縦横に同じ割り戻しを効かせるだけだが、呼び出し側で 2 回書くと片方だけ倍率を
   * 忘れても動いてしまう（縦にだけ倍率が効かない、という壊れ方になる）。
   *
   * @param view 割り戻しに使う倍率を持つ表示
   * @param screenDelta 画面で測った移動量
   * @returns ドキュメント上の移動量
   */
  toDocumentOffset(view: CanvasView, screenDelta: Offset): Offset {
    return {
      x: CanvasView.toDocumentLength(view, screenDelta.x),
      y: CanvasView.toDocumentLength(view, screenDelta.y),
    };
  },

  /**
   * ドキュメント上の移動量を画面上の移動量へ直す。`toDocumentOffset` の逆向き。
   *
   * @param view 掛ける倍率を持つ表示
   * @param documentDelta ドキュメント上の移動量
   * @returns 画面上の移動量
   */
  toScreenOffset(view: CanvasView, documentDelta: Offset): Offset {
    return Offset.scale(documentDelta, view.scale);
  },

  /**
   * ドキュメント上の座標にあるものを、画面上で動かした先の位置。
   *
   * 絶対配置の子の行き先を画面上で求めるのに使う。座標は親の左上から測るので、
   * 返る位置も親の左上から測った画面上の値になる。
   *
   * @param view 掛ける倍率を持つ表示
   * @param placement 親の左上から見たドキュメント上の座標
   * @param screenDelta 画面上で動かした量
   * @returns 親の左上から見た、動かした先の画面上の位置
   */
  toScreenPoint(
    view: CanvasView,
    placement: Offset,
    screenDelta: Offset,
  ): Offset {
    return Offset.add(CanvasView.toScreenOffset(view, placement), screenDelta);
  },

  /**
   * 表示用の倍率（%）。
   *
   * @param view 今の表示
   * @returns 百分率を整数へ丸めた倍率
   */
  scalePercent(view: CanvasView): number {
    return Math.round(view.scale * 100);
  },

  /**
   * CSS の `transform` に載せる形。translate が先、scale が後（上の panBy 参照）。
   *
   * @param view 今の表示
   * @returns `transform` プロパティの値
   */
  transform(view: CanvasView): string {
    const x = Px.create(view.offset.x);
    const y = Px.create(view.offset.y);
    return `translate(${x}, ${y}) scale(${view.scale})`;
  },
} as const;
