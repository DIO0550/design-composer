import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import {
  OtherPath,
  Path,
  renderEditorScreen,
  startCreate,
  startOpen,
} from "./setup";

test("起動直後はドキュメントを開くよう案内される", () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

test("起動直後はキャンバスが表示されない", () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  expect(screen.queryByRole("main", { name: "キャンバス" })).toBeNull();
});

test("ファイルを開くと、そのドキュメントがキャンバスに表示される", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  const canvas = screen.getByRole("main", { name: "キャンバス" });
  expect(within(canvas).getByRole("button", { name: /home/ })).toBeDefined();
});

/*
 * 帯が持つのはパンくずなので、末尾 2 つ（フォルダ / ファイル名）しか字にならない。
 * フルパスは `title` に載っているので、そちらで開いているファイルを確かめる。
 */
test("ファイルを開くと、上端の帯で開いているファイルが分かる", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  const topBar = screen.getByRole("banner");
  expect(
    within(topBar).getByTitle(Path).textContent?.includes("login.dcmp"),
  ).toBe(true);
});

/*
 * #374 の症状。以前は常設のツールバーと上端の帯が並んで banner が 2 つあった。
 * 開いた後にしか起きないので、開いてから数える。
 */
test("ファイルを開いても、上端の帯は 1 つだけ", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  expect(screen.getAllByRole("banner")).toHaveLength(1);
});

test("新規作成すると、雛形の部品を持つドキュメントが開かれる", async () => {
  const observer = renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(OtherPath) },
  );

  await startCreate(observer);

  // 雛形の部品はパレットに出るので、左ペインを Assets へ切り替えてから見る（#129）。
  await userEvent.click(screen.getByRole("button", { name: "Assets" }));

  const leftPane = screen.getByRole("complementary", { name: "左ペイン" });
  expect(within(leftPane).getByText("primary-button")).toBeDefined();
});

test("新規作成すると、選んだ保存先にファイルが作られる", async () => {
  const observer = renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(OtherPath) },
  );

  await startCreate(observer);

  expect(observer.files.contentOf(OtherPath).some).toBe(true);
});

test("解釈できないファイルを開くと、開けない理由が表示される", async () => {
  const observer = renderEditorScreen(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  expect(
    screen.getByText(
      "ファイルをドキュメントとして読み取れなかったため開けませんでした",
    ),
  ).toBeDefined();
});

test("解釈できないファイルを開くと、ファイルのエラー一覧が並ぶ", async () => {
  const observer = renderEditorScreen(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  // 読み上げ名で引くのは、由来（unopened-file）まで固定するため。開始画面は
  // 「開けませんでした」の 1 行にも role="alert" を付けるので、名前無しでは引けない。
  expect(screen.getByRole("alert", { name: "エラー一覧" })).toBeDefined();
});

test("読み込めないファイルを開くと、見つからないことが表示される", async () => {
  const observer = renderEditorScreen(
    {},
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await startOpen(observer);

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("開いている途中でダイアログを閉じても、開いていたドキュメントは表示されたまま", async () => {
  const observer = renderEditorScreen(
    { [OtherPath]: artboardContent("settings") },
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(Path) },
  );
  await startCreate(observer);

  await startOpen(observer);

  const topBar = screen.getByRole("banner");
  expect(within(topBar).getByTitle(Path)).toBeDefined();
});

test("ウィンドウへファイルを落とすと、そのドキュメントが開かれる", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.dropFiles([Path]);

  const canvas = screen.getByRole("main", { name: "キャンバス" });
  expect(within(canvas).getByRole("button", { name: /home/ })).toBeDefined();
});

/*
 * フック（受け取れなかったことを持つ）と画面（それを出す）の配線が、EditorScreen で
 * 実際に繋がっていること。片方だけを固定した実装だと落ちる。
 */
test("メニューの購読を張れないと、その旨が画面に出る", async () => {
  const observer = renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
    { denyMenu: true },
  );
  // 購読は描画のあとに非同期で成立する（張れない判断もそこで出る）ので待ち合わせる。
  await observer.dropFiles([]);

  expect(screen.getByText("メニューからの操作を受け取れません")).toBeDefined();
});
