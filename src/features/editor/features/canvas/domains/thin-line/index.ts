import { type SidePair, SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Range } from "@/utils/Range";

/**
 * キャンバスに引く細い線 1 本（ガイド線・隙間と距離の短い線）。画面上の px。
 */
export type ThinLine = Readonly<{
  /** 線が伸びる向きの 2 辺の組（垂直の組なら縦に伸びる） */
  along: SidePair;
  /** 線の中心の座標（伸びる向きと直交する軸） */
  at: number;
  /** 線が伸びる範囲 */
  span: Range;
}>;

export const ThinLine = {
  /**
   * ガイド線・隙間の短い線・Alt / Option の距離の短い線の太さ（px）。
   *
   * 挿入位置に引く線（`DropZone` の `MarkerThicknessPx`）と同じ太さ・同じ中心合わせにして、
   * キャンバスに出る線の流儀を割らない（2 つは排他なので、太さが同じでも混ざらない）。
   *
   * **揃えているのは値ではなく見せ方の約束**なので、拠り所は docs/06-ui.md 側に置いてある
   * （片方だけ変えてもここは落ちない）。
   */
  ThicknessPx: 2,

  /**
   * 線を描く矩形にする。太さのぶんは線の中心を `at` に合わせて振り分ける（`DropZone` の
   * 挿入線と同じ）。
   *
   * @param line 描く線
   * @returns 線として描く矩形（画面上の px）
   */
  toBounds(line: ThinLine): CanvasBounds {
    const start = line.at - ThinLine.ThicknessPx / 2;
    const length = Range.length(line.span);
    return line.along === SidePairs.Vertical
      ? {
          left: start,
          top: line.span.min,
          width: ThinLine.ThicknessPx,
          height: length,
        }
      : {
          left: line.span.min,
          top: start,
          width: length,
          height: ThinLine.ThicknessPx,
        };
  },

  /**
   * 2 本の線が同じ向き・同じ位置・同じ範囲か。
   *
   * 浮動小数を許容幅なしで比べる。同じ入力から同じ式で作った線どうしだけを比べる前提。
   *
   * @param line 見る線
   * @param other 比べる相手の線
   * @returns 向き・中心の座標・範囲の両端がすべて一致すれば真
   */
  equals(line: ThinLine, other: ThinLine): boolean {
    return (
      line.along === other.along &&
      line.at === other.at &&
      line.span.min === other.span.min &&
      line.span.max === other.span.max
    );
  },
} as const;
