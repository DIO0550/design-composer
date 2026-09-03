import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CommandSources } from "@/features/document-start/hooks/use-document-session";
import { Option } from "@/utils/Option";
import { renderDocumentStart } from "./setup";

test("開く操作の最中は、開くボタンを押せない", () => {
  renderDocumentStart({ session: { kind: "opening" } });

  expect(
    screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("開く操作の最中は、新規作成ボタンも押せない", () => {
  renderDocumentStart({ session: { kind: "opening" } });

  expect(
    screen.getByRole("button", { name: "新規作成" }).hasAttribute("disabled"),
  ).toBe(true);
});

/*
 * 見出しだけが残らないことを確かめたいので、行の数ではなく枠そのものを見る
 * （0 件で行が無いのは入力から決まるので、行を数えても実装を守れない）。
 */
test("最近使ったファイルが 1 件も無ければ、枠ごと出さない", () => {
  renderDocumentStart({ recentPaths: [] });

  expect(
    screen.queryByRole("navigation", { name: "最近使ったファイル" }),
  ).toBeNull();
});

test("メニューを受け取れないときは、メニューの理由が出る", () => {
  renderDocumentStart({
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した",
    }),
  });

  expect(screen.getByText("メニューからの操作を受け取れません")).toBeDefined();
});

/*
 * 経路ごとに文言を出し分けていること。メニュー固定の実装だと、ドロップが落ちても
 * メニューの文言が出てしまうので、ドロップの文言が出ることを見て捕まえる。
 */
test("ドロップを受け取れないときは、ドロップの理由が出る", () => {
  renderDocumentStart({
    commandFailure: Option.some({
      source: CommandSources.Drop,
      message: "listen が失敗した",
    }),
  });

  expect(screen.getByText("ファイルのドロップを受け取れません")).toBeDefined();
});

test("受け取れているときは、その理由は出ない", () => {
  renderDocumentStart({ commandFailure: Option.none });

  expect(screen.queryByText("メニューからの操作を受け取れません")).toBeNull();
});
