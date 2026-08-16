import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DocumentSyntaxError } from "@/features/editor/__tests__/document-errors";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentErrorList, DocumentErrorOrigins } from "../index";

/**
 * 飛べる行と飛べない行を混ぜた一覧。片方だけだと「常に出す」「常に出さない」の
 * どちらの実装でも通ってしまうので、4 種類の場所を 1 つの入力に入れる。
 */
const MixedErrors: readonly DocumentError[] = [
  DocumentSyntaxError,
  {
    kind: "unknown-prop",
    message: 'unknown prop "colour"',
    location: { kind: "node", nodeName: "home-title", prop: "colour" },
  },
  {
    kind: "unsupported-format-version",
    message: "file format version 99.0 is newer than this app (1.0)",
    location: { kind: "whole-document" },
  },
  {
    kind: "dangling-ref",
    message: 'unknown component "missing-button"',
    location: { kind: "node", nodeName: "cta" },
  },
];

test("ノードを指すエラーの行にだけ、そのノードを表示するボタンが出る", () => {
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.OpenedFile}
      onReveal={vi.fn()}
      onRevertFile={vi.fn()}
      isReverting={false}
    />,
  );

  expect(
    screen
      .getAllByRole("button", { name: /を表示$/ })
      .map((button) => button.getAttribute("aria-label")),
  ).toStrictEqual(["home-title を表示", "cta を表示"]);
});

test("表示のボタンを押すと、その行が指すノード名が通知される", async () => {
  const onReveal = vi.fn();
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.OpenedFile}
      onReveal={onReveal}
      onRevertFile={vi.fn()}
      isReverting={false}
    />,
  );

  // 先頭ではなく 2 つ目を押す（先頭固定の実装で通らないようにする）
  await userEvent.click(screen.getByRole("button", { name: "cta を表示" }));

  expect(onReveal).toHaveBeenCalledWith("cta");
});

test("編集で作った不正でも、ノードを指す行から表示できる", () => {
  const onReveal = vi.fn();
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.Document}
      onReveal={onReveal}
    />,
  );

  expect(screen.getAllByRole("button", { name: /を表示$/ })).toHaveLength(2);
});

test("開けなかったファイルの一覧には、表示のボタンが出ない", () => {
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.UnopenedFile}
    />,
  );

  // 一覧そのものは出ていることを確かめてから、その中にボタンが無いことを見る
  const errorList = screen.getByRole("alert", { name: "エラー一覧" });
  expect(errorList).toBeDefined();
  expect(screen.queryAllByRole("button", { name: /を表示$/ })).toStrictEqual(
    [],
  );
});

test("開いているファイルが不正なときは、ファイルを書き戻せる", async () => {
  const onRevertFile = vi.fn();
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.OpenedFile}
      onReveal={vi.fn()}
      onRevertFile={onRevertFile}
      isReverting={false}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "revert file" }));

  expect(onRevertFile).toHaveBeenCalledTimes(1);
});

test("書き戻しの最中は、書き戻しを押し直せない", () => {
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.OpenedFile}
      onReveal={vi.fn()}
      onRevertFile={vi.fn()}
      isReverting
    />,
  );

  expect(
    screen
      .getByRole("button", { name: "revert file" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("編集で作った不正の一覧には、ファイルを書き戻すボタンが出ない", () => {
  render(
    <DocumentErrorList
      errors={MixedErrors}
      origin={DocumentErrorOrigins.Document}
      onReveal={vi.fn()}
    />,
  );

  const errorList = screen.getByRole("alert", {
    name: "ドキュメントのエラー一覧",
  });
  expect(errorList).toBeDefined();
  expect(screen.queryByRole("button", { name: "revert file" })).toBeNull();
});
