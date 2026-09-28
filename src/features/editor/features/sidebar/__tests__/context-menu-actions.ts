import { vi } from "vitest";
import type { LeftPaneContextMenuActions } from "@/features/editor/features/sidebar/types/LeftPaneContextMenuActions";

/**
 * 行の右クリックの受け口。右クリックを見ないテストでも行を描くのに要るので、呼ばれたこと
 * だけ記録するものを共有する。
 *
 * @returns どの口も記録するだけの受け口
 */
export function spyContextMenuActions(): LeftPaneContextMenuActions {
  return { openForNode: vi.fn(), openForArtboard: vi.fn() };
}
