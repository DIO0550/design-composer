import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import {
  clickCreate,
  clickOpen,
  OtherPath,
  Path,
  renderEditorScreen,
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
  renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await clickOpen();

  const canvas = screen.getByRole("main", { name: "キャンバス" });
  expect(within(canvas).getByRole("button", { name: /home/ })).toBeDefined();
});

test("ファイルを開くと、開いているファイルのパスが分かる", async () => {
  renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await clickOpen();

  const toolbar = screen.getByRole("banner");
  expect(within(toolbar).getByText(Path)).toBeDefined();
});

test("新規作成すると、雛形の部品を持つドキュメントが開かれる", async () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(OtherPath) },
  );

  await clickCreate();

  // 雛形の部品はパレットに出るので、左ペインを Assets へ切り替えてから見る（#129）。
  await userEvent.click(screen.getByRole("button", { name: "Assets" }));

  const leftPane = screen.getByRole("complementary", { name: "左ペイン" });
  expect(within(leftPane).getByText("primary-button")).toBeDefined();
});

test("新規作成すると、選んだ保存先にファイルが作られる", async () => {
  const files = renderEditorScreen(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(OtherPath) },
  );

  await clickCreate();

  expect(files.contentOf(OtherPath).some).toBe(true);
});

test("解釈できないファイルを開くと、開けない理由が表示される", async () => {
  renderEditorScreen(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await clickOpen();

  expect(
    screen.getByText(
      "ファイルをドキュメントとして読み取れなかったため開けませんでした",
    ),
  ).toBeDefined();
});

test("解釈できないファイルを開くと、ファイルのエラー一覧が並ぶ", async () => {
  renderEditorScreen(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await clickOpen();

  // 読み上げ名で引くのは、由来（unopened-file）まで固定するため。開始画面は
  // 「開けませんでした」の 1 行にも role="alert" を付けるので、名前無しでは引けない。
  expect(screen.getByRole("alert", { name: "エラー一覧" })).toBeDefined();
});

test("読み込めないファイルを開くと、見つからないことが表示される", async () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await clickOpen();

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("開いている途中でダイアログを閉じても、開いていたドキュメントは表示されたまま", async () => {
  renderEditorScreen(
    { [OtherPath]: artboardContent("settings") },
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(Path) },
  );
  await clickCreate();

  await clickOpen();

  const toolbar = screen.getByRole("banner");
  expect(within(toolbar).getByText(Path)).toBeDefined();
});
