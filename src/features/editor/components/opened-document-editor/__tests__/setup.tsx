import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLE_DOCUMENT } from "@/features/editor/__tests__/sample-document";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { OpenedDocumentEditor } from "../index";

/** 開いているファイル。テストの中で開いているファイルは常に 1 つ。 */
export const PATH = "/work/sample.dcmp";

/**
 * サンプルのドキュメントを開いた編集画面を描画する。
 *
 * 監視と購読は非同期に成立するので、操作を始める前にここで待ち合わせる
 * （待たずに操作すると、成立したときの状態更新が act の外で起きる）。
 *
 * 代役を返すのは、外部変更を起こすテスト（`breakFileExternally`）が同じものを
 * 必要とするため。使わないテストは戻り値を無視してよい。
 */
export async function renderOpenedDocument(): Promise<DocumentIpcFake> {
  const fake = DocumentIpcFake.create({
    [PATH]: DocumentJson.serialize(SAMPLE_DOCUMENT),
  });

  render(
    <OpenedDocumentEditor
      ipc={fake.ipc}
      opened={{ path: PATH, document: SAMPLE_DOCUMENT }}
    />,
  );
  await act(async () => {});
  return fake;
}

/**
 * 外部（AI・エディタ・git 操作等）がファイルを壊したことにする。
 * 解釈できない中身なので取り込みは拒まれ、画面はエラーを抱えたまま
 * 最後に正常だった表示を保つ（docs/03-schema.md「不正ファイル時の挙動」）。
 */
export async function breakFileExternally(
  fake: DocumentIpcFake,
): Promise<void> {
  await act(async () => {
    fake.changeExternally(PATH, "{ 壊れた");
  });
}

/**
 * ツリーの領域。行を読む相手はここに絞る。左ペインにはレールの行き先ボタンも並び、
 * そちらも `aria-current` を持つため、ペイン全体を渡すと行き先が行として混ざる
 * （`row-names` の注意書きのとおり）。
 */
export function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/**
 * artboard の一覧の領域。artboard はツリーの行ではなく上段の一覧に並ぶので（#112）、
 * 選ぶのも今どれを見ているかを読むのもこちらから行う。
 */
export function artboardList(): HTMLElement {
  return screen.getByRole("region", { name: "artboard 一覧" });
}

/** ツリーの行を名前で押して選ぶ。同じ名前はキャンバスにも出るのでツリーに絞る。 */
export async function selectInTree(name: string): Promise<void> {
  await userEvent.click(within(tree()).getByRole("button", { name }));
}

/** artboard の一覧から選ぶ。artboard はツリーの行ではないのでこちらから押す。 */
export async function selectArtboard(name: string): Promise<void> {
  await userEvent.click(within(artboardList()).getByRole("button", { name }));
}
