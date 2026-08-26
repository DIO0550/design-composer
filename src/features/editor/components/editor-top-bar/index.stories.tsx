import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/document-error";
import { DocumentSaveState } from "@/domains/document-save-state";
import { type Elapsed, ElapsedUnits } from "@/domains/unit/elapsed";
import { CanvasView } from "@/features/canvas";
import { SampleFileErrors } from "@/features/editor/__stories__/sample-editor-state";
import {
  EditorTopBar,
  type EditorTopBarTone,
  EditorTopBarTones,
} from "./index";

const Opened = {
  path: "/work/settings-ui/app.dcmp",
  document: DesignDocument.createFromTemplate(DocumentTemplate.Default),
};

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
  elapsed,
}: Readonly<{
  tone: EditorTopBarTone;
  saveState?: DocumentSaveState;
  fileErrors?: readonly DocumentError[];
  elapsed?: Elapsed;
}>) {
  return (
    <EditorTopBar tone={tone}>
      <EditorTopBar.Breadcrumb opened={Opened} />
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
      {elapsed ? <EditorTopBar.LastValidRender elapsed={elapsed} /> : null}
    </EditorTopBar>
  );
}

const meta = {
  title: "features/editor/EditorTopBar",
  component: TopBar,
  parameters: { layout: "fullscreen" },
  args: { tone: EditorTopBarTones.Normal },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  name: "保存済み",
  args: { saveState: DocumentSaveState.Saved },
};

export const Saving: Story = {
  name: "保存中",
  args: { saveState: DocumentSaveState.Saving },
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
 * 古さの行だけを出した状態（#183）。帯の色味と保存状態は普段のままなので、
 * **古さの行と倍率が同じ帯へ並ぶ**ところだけを見られる。
 *
 * UI 案の Error 画面には倍率が無いが、倍率はファイルにも編集履歴にも触れない表示の操作
 * なので凍結中も残す（判断は #135）。並びは過渡ではなくこの形で確定している。
 */
export const LastValidRender: Story = {
  name: "最後に正常だった表示を出している状態",
  args: {
    saveState: DocumentSaveState.Saved,
    elapsed: { unit: ElapsedUnits.Seconds, count: 4 },
  },
};

/**
 * 外部編集でファイルが壊れている状態（#135）。帯ごと赤へ振れ、保存状態の代わりに
 * エラーの件数が出る。パンくずも同じ色味へ寄ることと、古さの行が同じ帯に並ぶことを
 * ここで確かめる（実画面で凍結中に見えるのはこの組み合わせ）。
 */
export const FileInvalid: Story = {
  name: "ファイルが不正",
  args: {
    tone: EditorTopBarTones.Error,
    fileErrors: SampleFileErrors,
    elapsed: { unit: ElapsedUnits.Seconds, count: 4 },
  },
};
