import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { changeFileExternally } from "@/libs/__tests__/document-change";
import { DocumentJson } from "@/libs/document-json";
import {
  breakFileExternally,
  Path,
  renderOpenedDocumentWithClock,
} from "./setup";

/** 上部バーに出ている「最後に正常だった表示がどれだけ古いか」の行。 */
function lastValidRenderRow(): HTMLElement | null {
  return screen.queryByText(/^showing last valid render · /);
}

test("開いてしばらく経ってから壊れても、古さは壊れた時点から数える", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();
  // 開いた時刻と壊れた時刻をずらす（一致していると起点を固定値へ潰しても通る）
  act(() => {
    clock.advanceSeconds(10);
  });

  await breakFileExternally(ipc);
  act(() => {
    clock.advanceSeconds(4);
  });

  expect(screen.getByText("showing last valid render · 4s ago")).toBeDefined();
});

/*
 * 数え始めた時点の `now` は mount 時のままなので、追いつかせないと起点より古くなり
 * 負の経過時間が出る（`document-sync` の `use-elapsed` が購読前に時刻を
 * 読み直している理由）。
 */
test("壊れた直後は 0 秒から数え始める", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();
  act(() => {
    clock.advanceSeconds(600);
  });

  await breakFileExternally(ipc);

  expect(screen.getByText("showing last valid render · 0s ago")).toBeDefined();
});

test("ファイルが壊れたまま時間が経つと、上部バーの古さも進む", async () => {
  const { ipc, clock } = await renderOpenedDocumentWithClock();
  act(() => {
    clock.advanceSeconds(10);
  });
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
  act(() => {
    clock.advanceSeconds(10);
  });
  await breakFileExternally(ipc);
  act(() => {
    clock.advanceSeconds(4);
  });

  await changeFileExternally({
    fake: ipc,
    path: Path,
    content: DocumentJson.serialize(SampleDocument),
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
