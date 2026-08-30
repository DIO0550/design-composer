import { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/**
 * キャンバスの見え方（docs/06-ui.md「中央 | キャンバス…ズーム / パンは非永続の view state」）。
 * ドキュメント（source of truth）には含めない実行時だけの状態なので、
 * 編集画面の状態ではなくキャンバスの中に閉じて持つ（docs/01「作業スペースの
 * 見た目（配置・ズーム等）は source of truth に含めない」）。
 *
 * `dragFrom` はドラッグ中だけ意味を持つ**直前のポインタ位置**で、移動量はここからの
 * 差分で決まる。ドラッグしていない状態で開始位置だけが残る、という矛盾した状態を
 * 作れないよう `Option` で表す。
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
 * 倍率を上下限の内側へ収める。
 *
 * @param scale 収めたい倍率
 * @returns 上下限の内側に収まった倍率
 */
function clampScale(scale: number): number {
  return Math.min(MaxScale, Math.max(MinScale, scale));
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
  /** 等倍・原点から始める（ズーム / パンは保存しないので毎回この状態で開く）。 */
  create(): CanvasView {
    return {
      scale: DefaultScale,
      offset: Offset.Origin,
      dragFrom: Option.none,
    };
  },

  zoomIn(view: CanvasView): CanvasView {
    return scaleBy(view, ZoomFactor);
  },

  zoomOut(view: CanvasView): CanvasView {
    return scaleBy(view, 1 / ZoomFactor);
  },

  /**
   * 移動量を現在の位置へ足す。
   * 移動量は画面上の px のまま足す。`transform` では translate が scale より先に
   * 適用され、translate は拡大前の座標系で効くため、倍率で割る必要はない。
   */
  panBy(view: CanvasView, delta: Offset): CanvasView {
    return { ...view, offset: Offset.add(view.offset, delta) };
  },

  /** ドラッグによるパンを始める。以後の移動はこの位置からの差分で決まる。 */
  startDrag(view: CanvasView, pointer: Offset): CanvasView {
    return { ...view, dragFrom: Option.some(pointer) };
  },

  /**
   * ドラッグ中のポインタ移動を反映する。
   * ドラッグしていないときのポインタ移動（ボタンを離したあとのマウス移動）では
   * 何も起きない。基準となる位置が無く、移動量が決まらないため。
   */
  dragTo(view: CanvasView, pointer: Offset): CanvasView {
    if (!view.dragFrom.some) {
      return view;
    }
    const moved = CanvasView.panBy(
      view,
      Offset.delta(view.dragFrom.value, pointer),
    );
    return { ...moved, dragFrom: Option.some(pointer) };
  },

  endDrag(view: CanvasView): CanvasView {
    return { ...view, dragFrom: Option.none };
  },

  isDragging(view: CanvasView): boolean {
    return view.dragFrom.some;
  },

  /**
   * 画面上の長さをドキュメント上の長さへ直す。
   * 中身は倍率をかけて描かれているので、画面で測った差はその分だけ割り戻す
   * （ドラッグでのリサイズ量は、倍率を変えても掴んだ点に追従する）。
   */
  toDocumentLength(view: CanvasView, screenLength: number): number {
    return screenLength / view.scale;
  },

  /** 表示用の倍率（%）。小数の倍率をそのまま出さないよう整数へ丸める。 */
  scalePercent(view: CanvasView): number {
    return Math.round(view.scale * 100);
  },

  /** CSS の `transform` に載せる形。translate が先、scale が後（上の panBy 参照）。 */
  transform(view: CanvasView): string {
    const x = Px.create(view.offset.x);
    const y = Px.create(view.offset.y);
    return `translate(${x}, ${y}) scale(${view.scale})`;
  },
} as const;
