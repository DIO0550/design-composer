import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { DocumentToolbar } from "../index";

/** 押しても何もしない導線。ここで見るのは押せるかどうかだけ。 */
function noop() {}

test("開く操作の最中は、開くボタンを押せない", () => {
  render(
    <DocumentToolbar
      session={DocumentSession.Opening}
      onOpen={noop}
      onCreate={noop}
    />,
  );

  expect(
    screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("開く操作の最中は、新規作成ボタンも押せない", () => {
  render(
    <DocumentToolbar
      session={DocumentSession.Opening}
      onOpen={noop}
      onCreate={noop}
    />,
  );

  expect(
    screen.getByRole("button", { name: "新規作成" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("何も開いていない間は、開くボタンを押せる", () => {
  render(
    <DocumentToolbar
      session={DocumentSession.Closed}
      onOpen={noop}
      onCreate={noop}
    />,
  );

  expect(
    screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
  ).toBe(false);
});

test("何も開いていない間は、新規作成ボタンも押せる", () => {
  render(
    <DocumentToolbar
      session={DocumentSession.Closed}
      onOpen={noop}
      onCreate={noop}
    />,
  );

  expect(
    screen.getByRole("button", { name: "新規作成" }).hasAttribute("disabled"),
  ).toBe(false);
});
