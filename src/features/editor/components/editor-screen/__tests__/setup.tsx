import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { changeFileExternally } from "@/libs/__tests__/document-change";
import { type AppMenuCommand, AppMenuCommands } from "@/libs/app-menu";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { ClockFake } from "@/libs/clock/fake";
import {
  type DialogChoices,
  DocumentDialogFake,
} from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { FileDropFake } from "@/libs/file-drop/fake";
import { EditorScreen } from "../index";

/** 既に置いてあるファイル。 */
export const Path = "/work/login.dcmp";
/** 新規作成やファイルの切り替えで使うもう 1 つのパス。 */
export const OtherPath = "/work/settings.dcmp";

/** 画面と、その外側の口を動かす手段。 */
export type ScreenObserver = Readonly<{
  /** インメモリのファイル表。書き出された内容の確認と外部変更の再現に使う。 */
  files: DocumentIpcFake;
  /** OS のメニューから項目を選ぶ。 */
  chooseMenu: (command: AppMenuCommand) => Promise<void>;
  /** ウィンドウへファイルを落とす。 */
  dropFiles: (paths: readonly string[]) => Promise<void>;
}>;

/**
 * 置いてあるファイルと、利用者がダイアログで行う選択を決めて画面を描画する。
 * 戻り値でファイル表の確認と、メニュー / ドロップからの操作ができる。
 */
export function renderEditorScreen(
  files: Readonly<Record<string, string>>,
  choices: DialogChoices,
  faults: Readonly<{ denyMenu?: boolean }> = {},
): ScreenObserver {
  const ipcFake = DocumentIpcFake.create(files);
  const dialogFake = DocumentDialogFake.create(choices);
  const menuFake = AppMenuFake.create();
  const dropFake = FileDropFake.create();
  if (faults.denyMenu === true) {
    menuFake.denySubscribe();
  }

  render(
    <EditorScreen
      clock={ClockFake.create().clock}
      ports={{
        ipc: ipcFake.ipc,
        dialog: dialogFake.dialog,
        menu: menuFake.menu,
        drop: dropFake.drop,
      }}
    />,
  );

  /** 購読の成立と、進行中の開く操作が落ち着くまで待つ。 */
  const settle = (): Promise<void> => act(async () => {});

  return {
    files: ipcFake,
    chooseMenu: async (command) => {
      await settle();
      await act(async () => {
        menuFake.choose(command);
      });
    },
    dropFiles: async (paths) => {
      await settle();
      await act(async () => {
        dropFake.dropFiles(paths);
      });
    },
  };
}

/**
 * 「開く」を始める。
 * 開始画面が出ている間はボタンから、開いた後は OS のメニューからしか始められないので、
 * ボタンがあればボタンを、無ければメニューを使う。
 */
export async function startOpen(observer: ScreenObserver): Promise<void> {
  const button = screen.queryByRole("button", { name: "開く" });
  if (button === null) {
    await observer.chooseMenu(AppMenuCommands.Open);
    return;
  }
  await userEvent.click(button);
  await act(async () => {});
}

/** 「新規作成」を始める。始め方の選び方は `startOpen` と同じ。 */
export async function startCreate(observer: ScreenObserver): Promise<void> {
  const button = screen.queryByRole("button", { name: "新規作成" });
  if (button === null) {
    await observer.chooseMenu(AppMenuCommands.Create);
    return;
  }
  await userEvent.click(button);
  await act(async () => {});
}

/** 外部エディタがファイルを書き換え、通知が届くまで待つ。 */
export async function changeExternally(
  files: DocumentIpcFake,
  path: string,
  content: string,
): Promise<void> {
  await changeFileExternally({ fake: files, path, content });
}
