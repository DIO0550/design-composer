import type { Meta, StoryObj } from "@storybook/react-vite";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { ClockFake } from "@/libs/clock/fake";
import { DialogChoice, DocumentDialogFake } from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { FileDropFake } from "@/libs/file-drop/fake";
import { EditorScreen } from "./index";

const SamplePath = "/work/sample.dcmp";

/**
 * ファイルへの口はインメモリの代役に差し替える。Storybook には Tauri が無く、
 * 実物の口では「開く」を押した先が動かないため。
 */
const files = DocumentIpcFake.create({
  [SamplePath]: DocumentJson.serialize(EditorState.document(SampleEditorState)),
});

const dialog = DocumentDialogFake.create({
  open: DialogChoice.chosen(SamplePath),
  save: DialogChoice.chosen("/work/untitled.dcmp"),
});

/** 時計も Storybook には無いので代役にする。 */
const clock = ClockFake.create();

/*
 * OS のメニューとウィンドウへのドロップも Storybook には無い。代役を差し込むのは、
 * 実物だと購読が張れず「メニューやドロップからの操作を受け取れません」が出てしまい、
 * 開始画面の絵が実物と変わるため。
 */
const menu = AppMenuFake.create();
const drop = FileDropFake.create();

const meta = {
  title: "features/editor/EditorScreen",
  component: EditorScreen,
  parameters: { layout: "fullscreen" },
  args: {
    clock: clock.clock,
    ports: {
      ipc: files.ipc,
      dialog: dialog.dialog,
      menu: menu.menu,
      drop: drop.drop,
    },
  },
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
