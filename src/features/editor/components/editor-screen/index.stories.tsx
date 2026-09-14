import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";
import { artboardContent } from "@/domains/__tests__/sample-document";
import type { DocumentSessionPorts } from "@/features/document-start";
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
const SettingsPath = "/work/settings.dcmp";
/** 置かれていないパス。開けなかった状態を作るのに使う。 */
const MissingPath = "/work/missing.dcmp";

/** 外の世界の口を差し替えたひと組と、ストーリーから動かす手がかり。 */
type Harness = Readonly<{
  ports: DocumentSessionPorts;
  drop: FileDropFake;
}>;

/**
 * ファイル・ダイアログ・メニュー・ドロップの口を代役で用意する。
 *
 * ストーリーごとに作り直すのは、開いた結果が口の中に残るため（1 つを使い回すと、先に
 * 撮ったストーリーの操作が後のストーリーの絵に出る）。メニューとドロップまで代役にする
 * のは、実物だと購読が張れず「メニューやドロップからの操作を受け取れません」が出て、
 * 開始画面の絵が実物と変わるため。
 *
 * @param files 置いてあるファイル
 * @returns 画面へ渡す口と、ドロップを起こす手がかり
 */
function createHarness(files: Readonly<Record<string, string>>): Harness {
  const ipc = DocumentIpcFake.create(files);
  const dialog = DocumentDialogFake.create({
    open: DialogChoice.chosen(SamplePath),
    save: DialogChoice.chosen("/work/untitled.dcmp"),
  });
  const drop = FileDropFake.create();

  return {
    ports: {
      ipc: ipc.ipc,
      dialog: dialog.dialog,
      menu: AppMenuFake.create().menu,
      drop: drop.drop,
    },
    drop,
  };
}

/** 置いてあるサンプルのファイル表。 */
const SampleFiles = {
  [SamplePath]: DocumentJson.serialize(EditorState.document(SampleEditorState)),
  [SettingsPath]: artboardContent("settings"),
};

const started = createHarness(SampleFiles);
const twoOpened = createHarness(SampleFiles);
const openFailed = createHarness(SampleFiles);

/** 時計も Storybook には無いので代役にする。 */
const clock = ClockFake.create();

const meta = {
  title: "features/editor/EditorScreen",
  component: EditorScreen,
  parameters: { layout: "fullscreen" },
  args: { clock: clock.clock, ports: started.ports },
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

/**
 * 2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
 * （タブ列だけのストーリーでは器との合わせ目が映らない）。
 */
export const MultipleDocuments: Story = {
  name: "複数開いている",
  args: { ports: twoOpened.ports },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
      ).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(
        screen.getByRole("navigation", { name: "開いているドキュメント" }),
      ).toBeDefined();
    });
  },
};

/**
 * 開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
 * 理由だけを帯で出す。
 */
export const OpenFailedWhileOpened: Story = {
  name: "開いたまま開けなかった",
  args: { ports: openFailed.ports },
  play: async () => {
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
      ).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(
        screen.getByRole("navigation", { name: "開いているドキュメント" }),
      ).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(
        screen.getByRole("alert", { name: "ファイルを開けませんでした" }),
      ).toBeDefined();
    });
  },
};
