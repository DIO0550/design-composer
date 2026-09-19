import { expect, test } from "vitest";
import { setupBoxStyle } from "./element-style-setup";

test("子を並べる Box に折り返しを書くと flex-wrap が出る", () => {
  const style = setupBoxStyle({ layout: "row", wrap: "wrap" });

  expect(style["flex-wrap"]).toBe("wrap");
});

test("自由配置の Box は折り返しを書いても flex-wrap を出さない", () => {
  const free = setupBoxStyle({ layout: "free", wrap: "wrap" });
  const column = setupBoxStyle({ layout: "column", wrap: "wrap" });

  expect(free).not.toHaveProperty("flex-wrap");
  expect(column["flex-wrap"]).toBe("wrap");
});

test("折り返しを書いていない Box は flex-wrap を出さない", () => {
  const style = setupBoxStyle({ layout: "row" });

  expect(style).not.toHaveProperty("flex-wrap");
});
