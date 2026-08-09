import type { Axis } from "@/domains/css-direction";
import { Px } from "@/domains/px";
import { Option } from "@/utils/Option";

/**
 * キャンバス上の位置・移動量。
 * x と y は片方だけでは位置が決まらないため、対で 1 つの型にする。
 */
export type CanvasOffset = Readonly<{ x: number; y: number }>;

export const CanvasOffset = {
  ORIGIN: { x: 0, y: 0 },

  add(offset: CanvasOffset, delta: CanvasOffset): CanvasOffset {
    return { x: offset.x + delta.x, y: offset.y + delta.y };
  },

  /** `from` から `to` への移動量。 */
  delta(from: CanvasOffset, to: CanvasOffset): CanvasOffset {
    return { x: to.x - from.x, y: to.y - from.y };
  },

  /** 軸に沿った成分。1 軸だけを見る操作（リサイズ）が使う。 */
  along(offset: CanvasOffset, axis: Axis): number {
    return axis === "width" ? offset.x : offset.y;
  },

  /** 2点の直線距離。「どれだけ動いたか」を向きに依らず1つの値で見るために使う。 */
  distance(from: CanvasOffset, to: CanvasOffset): number {
    const delta = CanvasOffset.delta(from, to);
    return Math.hypot(delta.x, delta.y);
  },
} as const;

/**
 * キャンバスの見え方（docs/06-ui.md「中央 | キャンバス…ズーム / パンは非永続の view state」）。
 * ドキュメント（source of truth）には含めない実行時だけの状態なので、
 * `EditorState` ではなくキャンバスの中に閉じて持つ（docs/01「作業スペースの
 * 見た目（配置・ズーム等）は source of truth に含めない」）。
 *
 * `dragFrom` はドラッグ中だけ意味を持つ**直前のポインタ位置**で、移動量はここからの
 * 差分で決まる。ドラッグしていない状態で開始位置だけが残る、という矛盾した状態を
 * 作れないよう `Option` で表す。
 */
export type CanvasView = Readonly<{
  scale: number;
  offset: CanvasOffset;
  dragFrom: Option<CanvasOffset>;
}>;

/** 等倍。開いた直後とリセット後の倍率。 */
const DEFAULT_SCALE = 1;

/**
 * 倍率の下限・上限。artboard が判別できないほど潰れる / 画面から溢れて
 * 現在位置を見失う状態を作れなくするための境界。
 */
const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

/** 1 操作あたりの拡大率。倍率は等比で動かす（等差だと拡大側ほど変化が鈍る）。 */
const ZOOM_FACTOR = 1.2;

/** 倍率を上下限の内側へ収める。 */
function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** 今の倍率へ係数を掛けた表示。上下限は超えない。 */
function scaleBy(view: CanvasView, factor: number): CanvasView {
  return { ...view, scale: clampScale(view.scale * factor) };
}

export const CanvasView = {
  /** 等倍・原点から始める（ズーム / パンは保存しないので毎回この状態で開く）。 */
  create(): CanvasView {
    return {
      scale: DEFAULT_SCALE,
      offset: CanvasOffset.ORIGIN,
      dragFrom: Option.none,
    };
  },

  zoomIn(view: CanvasView): CanvasView {
    return scaleBy(view, ZOOM_FACTOR);
  },

  zoomOut(view: CanvasView): CanvasView {
    return scaleBy(view, 1 / ZOOM_FACTOR);
  },

  /**
   * 移動量を現在の位置へ足す。
   * 移動量は画面上の px のまま足す。`transform` では translate が scale より先に
   * 適用され、translate は拡大前の座標系で効くため、倍率で割る必要はない。
   */
  panBy(view: CanvasView, delta: CanvasOffset): CanvasView {
    return { ...view, offset: CanvasOffset.add(view.offset, delta) };
  },

  /** ドラッグによるパンを始める。以後の移動はこの位置からの差分で決まる。 */
  startDrag(view: CanvasView, pointer: CanvasOffset): CanvasView {
    return { ...view, dragFrom: Option.some(pointer) };
  },

  /**
   * ドラッグ中のポインタ移動を反映する。
   * ドラッグしていないときのポインタ移動（ボタンを離したあとのマウス移動）では
   * 何も起きない。基準となる位置が無く、移動量が決まらないため。
   */
  dragTo(view: CanvasView, pointer: CanvasOffset): CanvasView {
    if (!view.dragFrom.some) {
      return view;
    }
    const moved = CanvasView.panBy(
      view,
      CanvasOffset.delta(view.dragFrom.value, pointer),
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
