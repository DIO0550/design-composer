import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ComponentList } from "../index";

test("部品の行から挿入するとその部品名が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: string[] = [];
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "card", publicPropNames: [], refCount: 0 }]}
      isInsertEnabled
      onInsert={(name) => inserted.push(name)}
    />,
  );

  await user.click(screen.getByRole("button", { name: "card を挿入" }));

  expect(inserted).toEqual(["card"]);
});

test("挿せる位置が無いときは挿入ボタンを押せない", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "card", publicPropNames: [], refCount: 0 }]}
      isInsertEnabled={false}
      onInsert={() => {}}
    />,
  );

  expect(
    screen
      .getByRole("button", { name: "card を挿入" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
