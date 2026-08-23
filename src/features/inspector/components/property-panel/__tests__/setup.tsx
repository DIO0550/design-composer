import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { DocumentSelection } from "@/domains/document-selection";
import { type InstanceActions, PropertyPanel } from "../index";

/** 押した結果を見ないテストが毎回組み立てずに済むよう埋める、インスタンスの操作。 */
function noopInstanceActions(): InstanceActions {
  return {
    goToSource: vi.fn(),
    selectAllInstances: vi.fn(),
    detach: vi.fn(),
  };
}

/**
 * 帯の中身と本文を並べて描画する。
 *
 * 帯そのもの（`PaneHeading`）は着せない。着せるのは編集画面の組み立ての側で、
 * 帯が残ること自体は `opened-document-editor.selection.test.tsx` が見ている。
 */
function renderParts({
  selection,
  isFrozen,
  instance,
}: Readonly<{
  selection: DocumentSelection;
  isFrozen: boolean;
  instance: InstanceActions;
}>) {
  render(
    <>
      <PropertyPanel.Title selection={selection} />
      <PropertyPanel.Body
        selection={selection}
        isFrozen={isFrozen}
        instance={instance}
        onEditProp={vi.fn()}
        onClearSelection={vi.fn()}
      />
    </>,
  );
}

/**
 * その選択のパネルを描画する。
 *
 * @param selection 選択とドキュメントの出どころ
 * @param instance インスタンスの節から呼ぶ操作。押した結果を見るテストだけが渡す
 */
export function renderPanel(
  selection: DocumentSelection,
  instance: InstanceActions = noopInstanceActions(),
) {
  renderParts({ selection, isFrozen: false, instance });
}

/**
 * その選択のパネルを、凍結中として描画する
 * （外部編集でファイルが壊れ、表示が最後に正常だったもので止まっている状態 / #135）。
 *
 * @param selection 凍結する前に選んでいたものと、そのドキュメント
 */
export function renderFrozenPanel(selection: DocumentSelection) {
  renderParts({
    selection,
    isFrozen: true,
    instance: noopInstanceActions(),
  });
}

/**
 * その選択の帯の中身だけを描画する。
 *
 * 本文を描かないのは、同じ綴りが本文にも出る種別（`Instance` は公開 prop の節の
 * 見出しにもある）を、器で絞らずに引けるようにするため。
 *
 * @param selection 選択とドキュメントの出どころ
 */
export function renderTitle(selection: DocumentSelection) {
  render(<PropertyPanel.Title selection={selection} />);
}
