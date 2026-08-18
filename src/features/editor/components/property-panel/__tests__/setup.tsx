import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { type InstanceActions, PropertyPanel } from "../index";

/**
 * その状態のパネルを描画する。
 *
 * 編集の渡し先とインスタンスの操作を既定で埋めるのは、パネルの表示だけを見る
 * テストがそれらを毎回組み立てずに済むようにするため。
 *
 * @param state 選択とドキュメントの出どころ
 * @param instance インスタンスの節から呼ぶ操作。押した結果を見るテストだけが渡す
 */
export function renderPanel(
  state: EditorState,
  instance: InstanceActions = {
    goToSource: vi.fn(),
    selectAllInstances: vi.fn(),
    detach: vi.fn(),
  },
) {
  render(
    <PropertyPanel
      state={state}
      instance={instance}
      onEditProp={vi.fn()}
      onClearSelection={vi.fn()}
    />,
  );
}
