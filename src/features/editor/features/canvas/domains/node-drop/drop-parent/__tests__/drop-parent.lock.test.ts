import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DropParent, InsertionParent } from "../index";
import { moving, placingBox, setupLockedDocument } from "./setup";

test("ロックした Box の上で離すと、並びへ挿す先にはその外側のロックしていない Box が選ばれる", () => {
  const parent = InsertionParent.innermost(
    setupLockedDocument(),
    moving("moved"),
    ["sealed", "panel", "home"],
  );

  expect(Option.unwrap(parent).name).toBe("panel");
});

test("祖先がロックしている Box は、自身にロックしていないと書いてあっても挿す先にならずロックの外側が選ばれる", () => {
  const parent = InsertionParent.innermost(
    setupLockedDocument(),
    moving("moved"),
    ["nested", "inner", "sealed", "panel", "home"],
  );

  expect(Option.unwrap(parent).name).toBe("panel");
});

test("座標の置き直しでも、ロックの中の Box の上で離すとロックの外側の親が選ばれる", () => {
  const parent = DropParent.innermost(setupLockedDocument(), moving("moved"), [
    "inner",
    "sealed",
    "panel",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("panel");
});

test("artboard 直下のロックした器の上で離すと、置き直し先は artboard になる", () => {
  const parent = DropParent.innermost(setupLockedDocument(), moving("moved"), [
    "free-lock",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("パレットの雛形を運んでいるときも、ロックの中の Box は挿す先にならない", () => {
  const parent = InsertionParent.innermost(setupLockedDocument(), placingBox, [
    "nested",
    "inner",
    "sealed",
    "panel",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("panel");
});

test("ロック中の Box を子に持つ Box は落とし先のまま選ばれる", () => {
  const parent = InsertionParent.innermost(
    setupLockedDocument(),
    moving("moved"),
    ["panel", "home"],
  );

  expect(Option.unwrap(parent).name).toBe("panel");
});
