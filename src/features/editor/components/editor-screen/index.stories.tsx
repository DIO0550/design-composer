import type { Meta, StoryObj } from "@storybook/react-vite";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { AppStateIpcFake } from "@/libs/app-state-ipc/fake";
import { AppStateJson } from "@/libs/app-state-json";
import { ClockFake } from "@/libs/clock/fake";
import { DialogChoice, DocumentDialogFake } from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { FileDropFake } from "@/libs/file-drop/fake";
import { EditorScreen } from "./index";

const SamplePath = "/work/sample.dcmp";

/**
 * ファイルへの口はインメモリの代役に差し替える。
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

/*
 * アプリ自身の状態も Storybook には無いので代役にする。何も保存されていない代役を
 * 既定に置くのは、起動時の復元が走らず開始画面のまま止まるようにするため。
 */
const appState = AppStateIpcFake.create();

/** 前回 `SamplePath` を開いていた状態。起動時の復元の結果を見るために持つ。 */
const restoredAppState = AppStateIpcFake.create(
  AppStateJson.serialize({ recentPaths: [SamplePath] }),
);

const ports = {
  ipc: files.ipc,
  dialog: dialog.dialog,
  menu: menu.menu,
  drop: drop.drop,
  appState: appState.ipc,
};

const meta = {
  title: "features/editor/EditorScreen",
  component: EditorScreen,
  parameters: { layout: "fullscreen" },
  args: {
    clock: clock.clock,
    ports,
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

/** 前回開いていたファイルが起動時にそのまま開いた状態。 */
export const RestoredDocument: Story = {
  name: "前回のファイルを開いた直後",
  args: { ports: { ...ports, appState: restoredAppState.ipc } },
};
