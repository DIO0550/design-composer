import type { Meta, StoryObj } from "@storybook/react-vite";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { OpenedDocumentEditor } from "./index";

const SAMPLE_PATH = "/work/sample.dcmp";

/** Storybook には Tauri が無いので、自動保存と監視の相手はインメモリの代役にする。 */
const files = DocumentIpcFake.create({
  [SAMPLE_PATH]: DocumentJson.serialize(SAMPLE_EDITOR_STATE.document),
});

const meta = {
  title: "features/editor/OpenedDocumentEditor",
  component: OpenedDocumentEditor,
  parameters: { layout: "fullscreen" },
  args: {
    ipc: files.ipc,
    opened: { path: SAMPLE_PATH, document: SAMPLE_EDITOR_STATE.document },
  },
} satisfies Meta<typeof OpenedDocumentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
 * ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。
 */
export const Default: Story = {
  name: "編集画面",
};

/**
 * ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
 * 失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。
 */
export const SyncFailed: Story = {
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: SAMPLE_EDITOR_STATE.document,
    },
  },
};
