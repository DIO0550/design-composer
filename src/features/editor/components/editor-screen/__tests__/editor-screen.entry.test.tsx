import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  artboardContent,
  SAMPLE_DOCUMENT,
} from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import {
  clickCreate,
  clickOpen,
  OTHER_PATH,
  PATH,
  renderEditorScreen,
} from "./setup";

test("起動直後はドキュメントを開くよう案内される", () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.CANCELED, save: DialogChoice.CANCELED },
  );

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

test("起動直後はキャンバスが表示されない", () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.CANCELED, save: DialogChoice.CANCELED },
  );

  expect(screen.queryByRole("main", { name: "キャンバス" })).toBeNull();
});

test("ファイルを開くと、そのドキュメントがキャンバスに表示される", async () => {
  renderEditorScreen(
    { [PATH]: DocumentJson.serialize(SAMPLE_DOCUMENT) },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );

  await clickOpen();

  const canvas = screen.getByRole("main", { name: "キャンバス" });
  expect(within(canvas).getByRole("button", { name: /home/ })).toBeDefined();
});

test("ファイルを開くと、開いているファイルのパスが分かる", async () => {
  renderEditorScreen(
    { [PATH]: DocumentJson.serialize(SAMPLE_DOCUMENT) },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );

  await clickOpen();

  const toolbar = screen.getByRole("banner");
  expect(within(toolbar).getByText(PATH)).toBeDefined();
});

test("新規作成すると、雛形の部品を持つドキュメントが開かれる", async () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.CANCELED, save: DialogChoice.chosen(OTHER_PATH) },
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
    { open: DialogChoice.CANCELED, save: DialogChoice.chosen(OTHER_PATH) },
  );

  await clickCreate();

  expect(files.contentOf(OTHER_PATH).some).toBe(true);
});

test("内容が不正なファイルを開くと、開けない理由が表示される", async () => {
  renderEditorScreen(
    { [PATH]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );

  await clickOpen();

  expect(
    screen.getByText("ファイルの内容が正しくないため開けませんでした"),
  ).toBeDefined();
});

test("読み込めないファイルを開くと、見つからないことが表示される", async () => {
  renderEditorScreen(
    {},
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );

  await clickOpen();

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("開いている途中でダイアログを閉じても、開いていたドキュメントは表示されたまま", async () => {
  renderEditorScreen(
    { [OTHER_PATH]: artboardContent("settings") },
    { open: DialogChoice.CANCELED, save: DialogChoice.chosen(PATH) },
  );
  await clickCreate();

  await clickOpen();

  const toolbar = screen.getByRole("banner");
  expect(within(toolbar).getByText(PATH)).toBeDefined();
});
