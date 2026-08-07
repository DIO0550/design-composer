import type { Meta, StoryObj } from "@storybook/react-vite";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DialogChoice, DocumentDialogFake } from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { EditorScreen } from "./index";

const SAMPLE_PATH = "/work/sample.dcmp";

/**
 * ファイルへの口はインメモリの代役に差し替える。Storybook には Tauri が無く、
 * 実物の口では「開く」を押した先が動かないため。
 */
const files = DocumentIpcFake.create({
  [SAMPLE_PATH]: DocumentJson.serialize(
    EditorState.document(SAMPLE_EDITOR_STATE),
  ),
});

const dialog = DocumentDialogFake.create({
  open: DialogChoice.chosen(SAMPLE_PATH),
  save: DialogChoice.chosen("/work/untitled.dcmp"),
});

const meta = {
  title: "features/editor/EditorScreen",
  component: EditorScreen,
  parameters: { layout: "fullscreen" },
  args: { ipc: files.ipc, dialog: dialog.dialog },
} satisfies Meta<typeof EditorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
 * 「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。
 */
export const Default: Story = {
  name: "開始画面",
};
