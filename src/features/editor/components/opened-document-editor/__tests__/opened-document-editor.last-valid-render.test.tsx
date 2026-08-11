import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { changeFileExternally } from "@/features/editor/__tests__/document-change";
import { SAMPLE_DOCUMENT } from "@/features/editor/__tests__/sample-document";
import { DocumentJson } from "@/libs/document-json";
import {
  breakFileExternally,
  PATH,
  renderOpenedDocumentWithClock,
} from "./setup";

/** 上部バーに出ている「最後に正常だった表示がどれだけ古いか」の行。 */
function lastValidRenderRow(): HTMLElement | null {
  return screen.queryByText(/^showing last valid render · /);
}

test("外部編集でファイルが壊れると、上部バーに最後に正常だった表示の古さが出る", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();

  await breakFileExternally(ipc);
  act(() => {
    clock.advanceSeconds(4);
  });

  expect(screen.getByText("showing last valid render · 4s ago")).toBeDefined();
});

test("ファイルが壊れたまま時間が経つと、上部バーの古さも進む", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();
  await breakFileExternally(ipc);
  act(() => {
    clock.advanceSeconds(4);
  });

  act(() => {
    clock.advanceSeconds(1);
  });

  expect(screen.getByText("showing last valid render · 5s ago")).toBeDefined();
});

test("外部編集でファイルが直ると、上部バーから古さの行が消える", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();
  await breakFileExternally(ipc);
  act(() => {
    clock.advanceSeconds(4);
  });

  await changeFileExternally({
    fake: ipc,
    path: PATH,
    content: DocumentJson.serialize(SAMPLE_DOCUMENT),
  });

  expect(lastValidRenderRow()).toBeNull();
});

test("ファイルが正常なあいだは、上部バーに古さの行が出ない", async () => {
  const { clock } = await renderOpenedDocumentWithClock();

  act(() => {
    clock.advanceSeconds(4);
  });

  expect(lastValidRenderRow()).toBeNull();
});

/*
 * UI 案の Error 画面の上部バーには倍率が無いが、凍結表示（#135）が入るまでは
 * 倍率と古さの行が同じ帯に並ぶ。並ぶこと自体をここで固定しておく。
 */
test("ファイルが不正になっても、上部バーの倍率の操作は残る", async () => {
  const { ipc } = await renderOpenedDocumentWithClock();

  await breakFileExternally(ipc);

  expect(screen.getByRole("toolbar", { name: "表示倍率" })).toBeDefined();
});
