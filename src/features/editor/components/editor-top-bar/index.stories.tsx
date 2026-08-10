import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { EditorTopBar } from "./index";

const OPENED = {
  path: "/work/settings-ui/app.dcmp",
  document: DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT),
};

/**
 * 帯は children で組むので、ストーリーは中身を揃えた 1 本を描き、保存状態だけを
 * 差し替えて 3 つの見え方を比べられるようにする。倍率の操作は表示だけを見たいので繋がない。
 */
function TopBar({ state }: Readonly<{ state: DocumentSaveState }>) {
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
