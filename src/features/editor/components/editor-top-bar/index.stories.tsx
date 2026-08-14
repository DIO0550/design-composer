import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import {
  EDITOR_TOP_BAR_TONES,
  EditorTopBar,
  type EditorTopBarTone,
} from "./index";

const OPENED = {
  path: "/work/settings-ui/app.dcmp",
  document: DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT),
};

/** ファイルが不正なときに帯へ出る件数の元。中身は一覧（キャンバス下端）が出す。 */
const FILE_ERRORS: readonly DocumentError[] = [
  {
    kind: "syntax-error",
    message: "expected ',' or '}'",
    location: { kind: "text-position", position: 42 },
  },
  {
    kind: "dangling-ref",
    message: "colors.brand-red が見つからない",
    location: { kind: "node", nodeName: "password-input", prop: "background" },
  },
];

/**
 * 帯は children で組むので、ストーリーは中身を揃えた 1 本を描き、色味と保存状態だけを
 * 差し替えて見え方を比べられるようにする。倍率の操作は表示だけを見たいので繋がない。
 *
 * 保存状態とファイルのエラーは**同時に出さない**（本物も入れ替える / #135）。
 */
function TopBar({
  tone,
  saveState,
  fileErrors,
}: Readonly<{
  tone: EditorTopBarTone;
  saveState?: DocumentSaveState;
  fileErrors?: readonly DocumentError[];
}>) {
  return (
    <EditorTopBar tone={tone}>
      <EditorTopBar.Breadcrumb opened={OPENED} tone={tone} />
      {saveState ? <EditorTopBar.SaveBadge state={saveState} /> : null}
      {fileErrors ? (
        <EditorTopBar.FileInvalidBadge errors={fileErrors} />
      ) : null}
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
  args: { tone: EDITOR_TOP_BAR_TONES.normal },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  name: "保存済み",
  args: { saveState: DocumentSaveState.SAVED },
};

export const Saving: Story = {
  name: "保存中",
  args: { saveState: DocumentSaveState.SAVING },
};

export const Failed: Story = {
  name: "保存に失敗",
  args: {
    saveState: DocumentSaveState.fromError({
      kind: "permissionDenied",
      message: "/work/settings-ui/app.dcmp: 書き込みが許可されていない",
    }),
  },
};

/**
 * 外部編集でファイルが壊れている状態（#135）。帯ごと赤へ振れ、保存状態の代わりに
 * エラーの件数が出る。パンくずも同じ色味へ寄ることをここで確かめる。
 */
export const FileInvalid: Story = {
  name: "ファイルが不正",
  args: {
    tone: EDITOR_TOP_BAR_TONES.error,
    fileErrors: FILE_ERRORS,
  },
};
