import { fn } from "storybook/test";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";

/**
 * 名前の変更の受け口。行を描くのに要るので、左ペインの 3 つのストーリーで共有する。
 *
 * @returns 4 つとも記録するだけの受け口
 */
export function sampleRenameActions(): LeftPaneRenameActions {
  return { startAt: fn(), commit: fn(), finish: fn(), cancel: fn() };
}
