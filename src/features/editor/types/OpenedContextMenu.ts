import type { Offset } from "@/domains/unit/offset";
import type { EditMenuTarget } from "@/features/editor/domains/edit-menu";

/**
 * 開いているコンテキストメニュー（docs/06-ui.md「コンテキストメニュー」）。
 *
 * 出す位置と対象は片方だけではメニューを描けない（どこに出すかと何が並ぶかの両方が要る）
 * ため 1 つの型にまとめる。
 */
export type OpenedContextMenu = Readonly<{
  /** 出す位置。窓の左上を原点にした座標（ポインタの位置）。 */
  at: Offset;
  /** 何に対するメニューか。押された場所が決める。 */
  target: EditMenuTarget;
}>;
