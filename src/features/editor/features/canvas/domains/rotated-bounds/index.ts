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
  const center = {
    x: CanvasBounds.midline(bounds, SidePairs.Horizontal),
    y: CanvasBounds.midline(bounds, SidePairs.Vertical),
  };
  const fromCenter = Offset.delta(center, point);
  return Offset.add(
    point,
    Offset.delta(fromCenter, Offset.rotate(fromCenter, degrees)),
  );
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
    const unrotated = bounds.unrotated;
    return rotatedAboutCenter(
      unrotated,
      {
        x: unrotated.left + unrotated.width * ratio.x,
        y: unrotated.top + unrotated.height * ratio.y,
      },
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
