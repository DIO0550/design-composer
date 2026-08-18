import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesignDocument } from "@/domains/design-document";
import { PropEdit } from "@/domains/node";
import { changeFileExternally } from "@/features/editor/__tests__/document-change";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { ClockFake } from "@/libs/clock/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { Result } from "@/utils/Result";
import { OpenedDocumentEditor } from "../index";

/** 開いているファイル。テストの中で開いているファイルは常に 1 つ。 */
export const Path = "/work/sample.dcmp";

/** 編集画面が外部世界とやり取りする口の代役一式。 */
export type OpenedDocumentFakes = Readonly<{
  ipc: DocumentIpcFake;
  clock: ClockFake;
}>;

/**
 * サンプルのドキュメントを開いた編集画面を、時計の代役つきで描画する。
 *
 * 監視と購読は非同期に成立するので、操作を始める前にここで待ち合わせる
 * （待たずに操作すると、成立したときの状態更新が act の外で起きる）。
 *
 * 時計まで返すのは、経過時間（#183）を確かめるテストが時計を進める必要があるため。
 * 時計を要らないテストのほうが圧倒的に多いので、口を 1 つだけ返す
 * `renderOpenedDocument` を別に置いている。
 *
 * @param document 開くドキュメント。`SampleDocument` に無い形（同じ部品を指す
 *   インスタンスが 2 つ以上あるなど）を要るテストだけが渡す
 */
export async function renderOpenedDocumentWithClock(
  document: DesignDocument = SampleDocument,
): Promise<OpenedDocumentFakes> {
  const ipc = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(document),
  });
  const clock = ClockFake.create();

  render(
    <OpenedDocumentEditor
      clock={clock.clock}
      ipc={ipc.ipc}
      opened={{ path: Path, document }}
    />,
  );
  await act(async () => {});
  return { ipc, clock };
}

/**
 * サンプルのドキュメントを開いた編集画面を描画する。
 *
 * 代役を返すのは、外部変更を起こすテストが同じものを必要とするため。
 *
 * @param document 開くドキュメント。省略すると `SampleDocument`
 */
export async function renderOpenedDocument(
  document?: DesignDocument,
): Promise<DocumentIpcFake> {
  const { ipc } = await renderOpenedDocumentWithClock(document);
  return ipc;
}

/**
 * 外部がファイルを壊したことにする。取り込みは拒まれ、画面はエラーを抱えたまま
 * 最後に正常だった表示を保つ（docs/03-schema.md「不正ファイル時の挙動」）。
 */
export async function breakFileExternally(
  fake: DocumentIpcFake,
): Promise<void> {
  await changeFileExternally({ fake, path: Path, content: "{ 壊れた" });
}

/**
 * 外部がファイルを直したことにする。取り込みが成立し、ファイルのエラーは消えて
 * 通常表示へ戻る（docs/03-schema.md「不正ファイル時の挙動」）。
 */
export async function fixFileExternally(fake: DocumentIpcFake): Promise<void> {
  await changeFileExternally({
    fake,
    path: Path,
    content: DocumentJson.serialize(SampleDocument),
  });
}

/**
 * 外部が「読めるが仕様に反する」内容を書いたことにする。
 *
 * `breakFileExternally` の壊し方（字句スキャンで落ちる）ではエラーの場所が
 * 文字位置になり、ノードを指す行が 1 つも出ない。エラー行から該当ノードへ飛ぶ
 * 経路を確かめるには、**パースは通り、スキーマ検証で落ち、しかも指す先が
 * 最後に正常だった表示にも在る**内容が要る（#136）。
 *
 * `home-title` は `SampleDocument` にも在るので、飛び先が成立する。
 */
export async function invalidateFileExternally(
  fake: DocumentIpcFake,
): Promise<void> {
  const dangling = Result.unwrap(
    DesignDocument.applyPropEdit(
      SampleDocument,
      "home-title",
      PropEdit.set(["typography"], "居ないタイポグラフィ"),
    ),
  );
  await changeFileExternally({
    fake,
    path: Path,
    content: DocumentJson.serialize(dangling),
  });
}

/**
 * キャンバス。同じ名前がツリーにも出るので絞るのに使う。挿入のツールバーもこの中に
 * あり、絞らないと左ペインへ置き戻す実装でも通ってしまう（#112）。
 */
export function canvasPane(): HTMLElement {
  return screen.getByRole("main", { name: "キャンバス" });
}

/** 倍率の操作が並ぶところ。 */
export function zoomToolbar(): HTMLElement {
  return screen.getByRole("toolbar", { name: "表示倍率" });
}

/**
 * 下端に出ているファイル由来のエラー一覧。編集で作った不正の一覧とは
 * 読み上げ名で分かれている（`document-error-list` の `originPresentation`）。
 */
export function fileErrorList(): HTMLElement {
  return screen.getByRole("alert", { name: "エラー一覧" });
}

/** 下端に出ている、編集で作った不正の一覧。 */
export function documentErrorList(): HTMLElement {
  return screen.getByRole("alert", { name: "ドキュメントのエラー一覧" });
}

/** 左ペイン。 */
export function leftPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "左ペイン" });
}

/** 右ペイン。 */
export function propertyPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "プロパティパネル" });
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
