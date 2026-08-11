import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { type Elapsed, ElapsedUnits } from "@/features/editor/domains/elapsed";
import { EditorTopBar } from "./index";

const OPENED = {
  path: "/work/settings-ui/app.dcmp",
  document: DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT),
};

/**
 * 帯は children で組むので、ストーリーは中身を揃えた 1 本を描き、保存状態だけを
 * 差し替えて 3 つの見え方を比べられるようにする。倍率の操作は表示だけを見たいので繋がない。
 */
function TopBar({
  state,
  elapsed,
}: Readonly<{ state: DocumentSaveState; elapsed?: Elapsed }>) {
  return (
    <EditorTopBar>
      <EditorTopBar.Breadcrumb opened={OPENED} />
      <EditorTopBar.SaveBadge state={state} />
      <EditorTopBar.Zoom
        view={CanvasView.create()}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onReset={() => {}}
      />
      {elapsed ? <EditorTopBar.LastValidRender elapsed={elapsed} /> : null}
    </EditorTopBar>
  );
}

const meta = {
  title: "features/editor/EditorTopBar",
  component: TopBar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  name: "保存済み",
  args: { state: DocumentSaveState.SAVED },
};

export const Saving: Story = {
  name: "保存中",
  args: { state: DocumentSaveState.SAVING },
};

export const Failed: Story = {
  name: "保存に失敗",
  args: {
    state: DocumentSaveState.fromError({
      kind: "permissionDenied",
      message: "/work/settings-ui/app.dcmp: 書き込みが許可されていない",
    }),
  },
};

/**
 * 外部編集でファイルが不正になり、映っているのが最後に正常だった表示になっている状態（#183）。
 *
 * このストーリーだけが、古さの行と倍率が**同じ帯へ並ぶ**ところを映す。UI 案の Error 画面には
 * 倍率が無く、凍結表示（#135）が入るまでの過渡的な並びなので、視覚差分で見えるようにしておく。
 */
export const LastValidRender: Story = {
  name: "最後に正常だった表示を出している状態",
  args: {
    state: DocumentSaveState.SAVED,
    elapsed: { unit: ElapsedUnits.Seconds, count: 4 },
  },
};
