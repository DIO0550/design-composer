import type { ReactNode } from "react";
import { DesignDocument } from "@/domains/design-document";
import { AssetsPanel } from "@/features/editor/components/assets-panel";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { LeftPanePanel } from "@/features/editor/components/left-pane-panel";
import {
  LEFT_PANE_VIEW_LABELS,
  LeftPaneRail,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import { NodeEditToolbar } from "@/features/editor/components/node-edit-toolbar";
import { TokenList } from "@/features/editor/components/token-list";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";

type LeftPaneProps = Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  state: EditorState;
  node: NodeActions;
  token: TokenActions;
}>;

/**
 * 行き先ごとの中身。対応表にしているのは、行き先を足したときに中身を足し忘れると
 * コンパイルエラーになるようにするため（`if` の連なりだと、足し忘れた行き先が
 * 黙って最後の枝＝ツリーに落ちる）。
 *
 * 値を関数にしているのは、`Assets` の一覧の組み立て（ドキュメント全体の走査）を
 * その行き先を見ているときだけ行うため。
 */
const CONTENTS = {
  layers: ({ state, node }: LeftPaneProps) => (
    <>
      <NodeEditToolbar
        isInsertEnabled={node.isInsertEnabled}
        isRemoveEnabled={node.isRemoveEnabled}
        onInsert={node.insert}
        onRemove={node.remove}
      />
      <DocumentTree
        state={state}
        onSelect={node.select}
        onReorder={node.reorder}
      />
    </>
  ),
  assets: ({ state, node }: LeftPaneProps) => (
    <AssetsPanel
      assets={DesignDocument.componentAssets(EditorState.document(state))}
      isInsertEnabled={node.isInsertEnabled}
      onInsert={node.insertInstance}
    />
  ),
  tokens: ({ state, token }: LeftPaneProps) => (
    <TokenList
      state={state}
      onSelectToken={token.select}
      onAddToken={token.add}
    />
  ),
} as const satisfies Readonly<
  Record<LeftPaneView, (props: LeftPaneProps) => ReactNode>
>;

/**
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px の見出し付き
 * パネルを横に並べる / #129）。レールで選んだ行き先の中身をパネルへ出す。
 *
 * どこを見ているか（`view`）を自分で持たないのは、右ペインに何を出すかも同じ行き先で
 * 決まるため。ここが握ると右ペインから読めなくなるので、両ペインを組む側に置いて
 * もらう（`opened-document-editor`）。
 */
export function LeftPane({
  view,
  onSelectView,
  state,
  node,
  token,
}: LeftPaneProps) {
  return (
    <>
      <LeftPaneRail current={view} onSelect={onSelectView} />
      <LeftPanePanel title={LEFT_PANE_VIEW_LABELS[view]}>
        {CONTENTS[view]({ view, onSelectView, state, node, token })}
      </LeftPanePanel>
    </>
  );
}
