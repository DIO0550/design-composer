import { render } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { EditContinuity } from "@/domains/session/edit-continuity";
import { Result } from "@/utils/Result";
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
 * その選択のパネルを、凍結中として描画する（外部編集でファイルが壊れ、表示が最後に正常だっ
 * たもので止まっている状態）。
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
 * @param selection 選択とドキュメントの出どころ
 */
export function renderTitle(selection: DocumentSelection) {
  render(<PropertyPanel.Title selection={selection} />);
}

/**
 * 編集の往復を見るテストが使うドキュメント。Text・部品インスタンス・Box に加えて、
 * 2 軸とも長さを持つ `home-panel`（数値の欄が 2 つ出る）を並べる。
 */
const EditedDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-title", type: "Text", props: { content: "ホーム" } },
        { name: "home-action", ref: "primary-button" },
        { name: "home-body", type: "Box" },
        {
          name: "home-panel",
          type: "Box",
          props: {
            widthMode: "fixed",
            width: 200,
            heightMode: "fixed",
            height: 100,
          },
        },
      ],
    },
  ],
});

/**
 * 渡した編集がドキュメントに入り、その結果が欄へ戻ってくるパネル。書き込みは
 * `DesignDocument.applyPropEdit`（編集画面の reducer が呼ぶのと同じ関数）で、通らな
 * かった編集は捨てて今の値を保つ。
 *
 * 編集画面の配線（reducer → 履歴 → キャンバス）は
 * `opened-document-editor.prop-edit.test.tsx` が通す。ここが見るのはパネルの往復だけ。
 */
function EditablePanel({
  selected,
  onContinuity,
}: Readonly<{
  selected: string;
  onContinuity: (continuity: EditContinuity) => void;
}>) {
  const [selection, setSelection] = useState(() =>
    DocumentSelection.fromNames(EditedDocument, [selected]),
  );

  return (
    <PropertyPanel.Body
      selection={selection}
      isFrozen={false}
      instance={{
        goToSource: vi.fn(),
        selectAllInstances: vi.fn(),
        detach: vi.fn(),
      }}
      onEditProp={(edit, continuity) => {
        onContinuity(continuity);
        setSelection((current) => {
          const edited = DesignDocument.applyPropEdit(
            current.document,
            selected,
            edit,
          );
          return Result.isOk(edited)
            ? DocumentSelection.fromNames(edited.value, [selected])
            : current;
        });
      }}
      onClearSelection={vi.fn()}
    />
  );
}

/**
 * 編集が往復するパネルを描画する。
 *
 * @param selected 編集する artboard / ノードの名前
 * @returns 操作の口と、届いた編集の続き方が届いた順に入る並び
 */
export function setupEditablePanel(selected: string): Readonly<{
  user: UserEvent;
  continuities: EditContinuity[];
}> {
  const continuities: EditContinuity[] = [];
  render(
    <EditablePanel
      selected={selected}
      onContinuity={(continuity) => continuities.push(continuity)}
    />,
  );
  return { user: userEvent.setup(), continuities };
}
