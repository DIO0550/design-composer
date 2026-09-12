import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ContextMenu, ContextMenuTones } from "../index";

/*
 * 器の外で子を使ったときの扱いを確かめる。
 *
 * 行は閉じるきっかけを器から context で受け取るので、器の外では受け取れない。既定値で埋め
 * ると「押しても閉じないメニュー」が画面に出たまま残る（rules/coding.md「Context のアクセ
 * サフック」）。
 */

test("器の外で行を使おうとするとエラーになる", () => {
  expect(() =>
    render(
      <ContextMenu.Item
        label="Copy"
        shortcut={Option.none}
        tone={ContextMenuTones.Normal}
        isEnabled={true}
        onSelect={() => {}}
      />,
    ),
  ).toThrow();
});
