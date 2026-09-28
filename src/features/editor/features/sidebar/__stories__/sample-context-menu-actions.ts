import { fn } from "storybook/test";
import type { LeftPaneContextMenuActions } from "@/features/editor/features/sidebar/types/LeftPaneContextMenuActions";

/**
 * 行の右クリックの受け口。行を描くのに要るので、左ペインのストーリーで共有する。
 *
 * @returns どの口も記録するだけの受け口
 */
export function sampleContextMenuActions(): LeftPaneContextMenuActions {
  return { openForNode: fn(), openForArtboard: fn() };
}
