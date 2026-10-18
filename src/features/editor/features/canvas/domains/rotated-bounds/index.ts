import type { Angle } from "@/domains/unit/angle";
import { Offset } from "@/domains/unit/offset";
import { SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";

/**
 * 画面上で回って描かれている矩形。回る前の矩形と、その中心まわりの向きの対
 * （`rotate()` は中心を軸に回る / docs/03「回転」）。
 *
 * 実測（`getBoundingClientRect`）が返す軸に平行な外接矩形とは別の型にする。同じ
 * `CanvasBounds` で受けると、回る前の矩形を求める場所に外接矩形を渡しても通る。
 */
export type RotatedBounds = Readonly<{
  /** 回る前の矩形（画面上の px）。中心は回したあとも同じ位置にある。 */
  unrotated: CanvasBounds;
  /** 画面上の向き（度・時計回り）。 */
  rotation: Angle;
}>;

/**
 * 矩形の中心（左右の辺の中間と上下の辺の中間）。
 *
 * @param bounds 中心を知りたい矩形
 * @returns 中心の点（画面上の px）
 */
function centerOf(bounds: CanvasBounds): Offset {
  return {
    x: CanvasBounds.midline(bounds, SidePairs.Horizontal),
    y: CanvasBounds.midline(bounds, SidePairs.Vertical),
  };
}

/**
 * 回る前の矩形の上の点を、中心まわりに回した位置へ移す。
 *
 * 中心からの差を回すのではなく「回した差と元の差のずれ」を足すのは、0 度で元の点を
 * 浮動小数でもそのまま返すため（中心を経由すると端数が出て、回っていない矩形の角が
 * 今の位置からずれる）。
 *
 * @param bounds 回る前の矩形（中心を決める）
 * @param point 回す点（画面上の px）
 * @param degrees 回す角度（度・時計回り）
 * @returns 回したあとの点
 */
function rotatedAboutCenter(
  bounds: CanvasBounds,
  point: Offset,
  degrees: number,
): Offset {
  const fromCenter = Offset.delta(centerOf(bounds), point);
  return Offset.add(
    point,
    Offset.delta(fromCenter, Offset.rotate(fromCenter, degrees)),
  );
}

/**
 * 4 角を写した先を囲む軸に平行な矩形。
 *
 * @param pointOf 矩形の中の比率（左上 (0, 0)・右下 (1, 1)）で指した角を写す先
 * @returns 写した 4 角をすべて含む最小の軸に平行な矩形
 */
function enclosingCorners(pointOf: (ratio: Offset) => Offset): CanvasBounds {
  return CanvasBounds.enclosingAll([
    CanvasBounds.spanning(pointOf({ x: 0, y: 0 }), pointOf({ x: 1, y: 1 })),
    CanvasBounds.spanning(pointOf({ x: 1, y: 0 }), pointOf({ x: 0, y: 1 })),
  ]);
}

/**
 * 4 角を写した先を囲む軸に平行な矩形が、相手の矩形と重なっているか。
 *
 * @param pointOf 矩形の中の比率（左上 (0, 0)・右下 (1, 1)）で指した角を写す先
 * @param other 重なりを見る相手の矩形
 * @returns 写した 4 角を囲む矩形が相手と少しでも重なっていれば `true`
 */
function overlapsEnclosing(
  pointOf: (ratio: Offset) => Offset,
  other: CanvasBounds,
): boolean {
  return CanvasBounds.overlaps(enclosingCorners(pointOf), other);
}

export const RotatedBounds = {
  /**
   * 外接矩形の中心に、回る前の大きさを置き直す（`rotate()` は中心を動かさないので、
   * 外接矩形の中心が回る前の矩形の中心になる）。
   *
   * @param enclosing 回ったものを囲む軸に平行な矩形（実測）
   * @param size 回る前の大きさ（画面上の px）
   * @param rotation 画面上の向き
   * @returns 外接矩形と同じ中心を持つ、回る前の矩形と向き。大きさが外接矩形と同じなら
   *   回る前の矩形は外接矩形そのもの
   */
  fromEnclosing(
    enclosing: CanvasBounds,
    size: Readonly<{ width: number; height: number }>,
    rotation: Angle,
  ): RotatedBounds {
    return {
      unrotated: {
        left: enclosing.left + (enclosing.width - size.width) / 2,
        top: enclosing.top + (enclosing.height - size.height) / 2,
        width: size.width,
        height: size.height,
      },
      rotation,
    };
  },

  /**
   * 矩形の中の比率で指した箇所が、画面上で描かれている位置。
   *
   * @param bounds 回って描かれている矩形
   * @param ratio 回る前の矩形の左上を (0, 0)、右下を (1, 1) とした比率
   * @returns その箇所の画面上の点
   */
  pointAt(bounds: RotatedBounds, ratio: Offset): Offset {
    return rotatedAboutCenter(
      bounds.unrotated,
      CanvasBounds.pointAt(bounds.unrotated, ratio),
      bounds.rotation,
    );
  },

  /**
   * 画面上の点を、回る前の矩形の座標へ戻す。回った矩形の当たり判定を、回る前の矩形
   * （`unrotated`）に対する判定として行うために使う。
   *
   * @param bounds 回って描かれている矩形
   * @param point 画面上の点
   * @returns 矩形ごと回す前へ戻したときに、その点が来る位置
   */
  unrotatePoint(bounds: RotatedBounds, point: Offset): Offset {
    return rotatedAboutCenter(bounds.unrotated, point, -bounds.rotation);
  },

  /**
   * 回って描かれている矩形が、軸に平行な矩形と重なっているか。辺が接するだけでも重なり
   * とみなす（`CanvasBounds.overlaps` と同じ）。
   *
   * 分離軸定理を、画面の軸と回った矩形の軸のそれぞれで「軸に平行な矩形どうしの重なり」
   * として見る。どちらの軸でも重なっていれば重なり。
   *
   * @param bounds 回って描かれている矩形
   * @param other 重なりを見る相手の矩形（軸に平行・画面上の px）
   * @returns 少しでも重なっていれば `true`
   */
  overlaps(bounds: RotatedBounds, other: CanvasBounds): boolean {
    const onScreenAxes = overlapsEnclosing(
      (ratio) => RotatedBounds.pointAt(bounds, ratio),
      other,
    );
    const onRotatedAxes = overlapsEnclosing(
      (ratio) =>
        RotatedBounds.unrotatePoint(bounds, CanvasBounds.pointAt(other, ratio)),
      bounds.unrotated,
    );
    return onScreenAxes && onRotatedAxes;
  },

  /**
   * 別の矩形の左上を原点に置き直す（`CanvasBounds.relativeTo` と同じ。向きは変わらない）。
   *
   * @param bounds 置き直す矩形（client 座標）
   * @param origin 原点にする矩形（client 座標）
   * @returns `origin` の左上を (0, 0) とした矩形と向き
   */
  relativeTo(bounds: RotatedBounds, origin: CanvasBounds): RotatedBounds {
    return {
      unrotated: CanvasBounds.relativeTo(bounds.unrotated, origin),
      rotation: bounds.rotation,
    };
  },

  /**
   * 回った 4 角を囲む軸に平行な矩形（外接矩形。画面には描かれない計算上の矩形）。
   *
   * @param bounds 回って描かれている矩形
   * @returns 回った 4 角をすべて含む最小の軸に平行な矩形。向きが 360 度の倍数（0 を含む）
   *   なら回る前の矩形そのもの
   */
  toEnclosing(bounds: RotatedBounds): CanvasBounds {
    return enclosingCorners((ratio) => RotatedBounds.pointAt(bounds, ratio));
  },

  /**
   * 回る前の矩形を、親の座標（回る前の左上が原点・親の向きで測る）で見た位置へ置き直す。
   * 大きさと向きは変わらない。
   *
   * @param bounds 置き直す矩形
   * @param parent 原点と向きを決める親の、回って描かれている矩形
   * @param offset 親の座標で見た、回る前の矩形の左上の位置（画面上の px）
   * @returns 親と一緒に回った位置に中心がある、同じ大きさ・同じ向きの矩形。親が回って
   *   いなければ回る前の矩形の左上がそのまま `offset` の位置に来る
   */
  placedAt(
    bounds: RotatedBounds,
    parent: RotatedBounds,
    offset: Offset,
  ): RotatedBounds {
    const placed = CanvasBounds.placedAt(
      parent.unrotated,
      offset,
      bounds.unrotated,
    );
    const center = centerOf(placed);
    const turned = rotatedAboutCenter(
      parent.unrotated,
      center,
      parent.rotation,
    );
    return {
      unrotated: CanvasBounds.movedBy(placed, Offset.delta(center, turned)),
      rotation: bounds.rotation,
    };
  },

  /**
   * 別の矩形の座標（`placedAt` の親の座標と同じ測り方）で見た、この矩形の回る前の
   * 左上の角の位置。
   *
   * 絶対配置の座標の原点はこの角なので、これが**親を付け替えたときに座標を直す量**に
   * なる。返るのは実測したままの画面上の px で、ドキュメント上の px にするのは倍率を
   * 知っている側（`CanvasView`）の役目。
   *
   * @param bounds 原点の位置を知りたい矩形
   * @param origin 座標の原点と向きを決める矩形
   * @returns `origin` の座標で見た `bounds` の回る前の左上の角。どちらも回っていなければ
   *   左上どうしの差
   */
  originShift(bounds: RotatedBounds, origin: RotatedBounds): Offset {
    return Offset.delta(
      CanvasBounds.pointAt(origin.unrotated, { x: 0, y: 0 }),
      RotatedBounds.unrotatePoint(
        origin,
        RotatedBounds.pointAt(bounds, { x: 0, y: 0 }),
      ),
    );
  },

  /**
   * 2 つが同じ位置・同じ大きさ・同じ向きか。測り直した結果を持ち替えるかどうかの判定に
   * 使う（`useDrawnBounds`）。
   *
   * @param bounds 比べる矩形
   * @param other 比べる相手の矩形
   * @returns 回る前の矩形と向きがどちらも等しければ `true`
   */
  equals(bounds: RotatedBounds, other: RotatedBounds): boolean {
    return (
      CanvasBounds.equals(bounds.unrotated, other.unrotated) &&
      bounds.rotation === other.rotation
    );
  },
} as const;
