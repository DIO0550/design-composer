import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { changeFileExternally } from "@/features/editor/__tests__/document-change";
import { ClockFake } from "@/libs/clock/fake";
import {
  type DialogChoices,
  DocumentDialogFake,
} from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { EditorScreen } from "../index";

/** 既に置いてあるファイル。 */
export const Path = "/work/login.dcmp";
/** 新規作成やファイルの切り替えで使うもう 1 つのパス。 */
export const OtherPath = "/work/settings.dcmp";

/**
 * 置いてあるファイルと、利用者がダイアログで行う選択を決めて画面を描画する。
 * 戻り値のファイル表で、書き出された内容の確認と外部変更の再現ができる。
 */
export function renderEditorScreen(
  files: Readonly<Record<string, string>>,
  choices: DialogChoices,
): DocumentIpcFake {
  const ipcFake = DocumentIpcFake.create(files);
  const dialogFake = DocumentDialogFake.create(choices);

  render(
    <EditorScreen
      clock={ClockFake.create().clock}
      ipc={ipcFake.ipc}
      dialog={dialogFake.dialog}
    />,
  );
  return ipcFake;
}

/**
 * 「開く」を押す。ダイアログ・読み込み・監視の開始は非同期に進むので、
 * 画面を確かめる前にここで待ち合わせる。
 */
export async function clickOpen(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "開く" }));
  await act(async () => {});
}

/** 「新規作成」を押し、保存と監視の開始まで待つ。 */
export async function clickCreate(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "新規作成" }));
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
