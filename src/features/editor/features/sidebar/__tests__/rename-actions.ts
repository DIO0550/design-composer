import { vi } from "vitest";
import type { LeftPaneRenameActions } from "@/features/editor/features/sidebar/types/LeftPaneRenameActions";

/**
 * 名前の変更の受け口。名前の変更を見ないテストでも行を描くのに要るので、呼ばれたことだけ
 * 記録するものを共有する。
 *
 * @returns どの口も記録するだけの受け口
 */
export function spyRenameActions(): LeftPaneRenameActions {
  return {
    startAt: vi.fn(),
    commit: vi.fn(),
    finish: vi.fn(),
    cancel: vi.fn(),
  };
}
