import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DropParent } from "../index";
import { moving, setupDocument, setupFreeArtboardDocument } from "./setup";

test("Box の上へ運ぶとその Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("card");
});

test("子を持てない Text の上へ運ぶと外側の Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "title",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品インスタンスの上へ運ぶと外側の artboard が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品定義の中身の名前は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "label",
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノード自身は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("body"), [
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノードの子孫は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("body"), [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("受け入れられる候補が1つも無ければ受け入れ先は決まらない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "title",
  ]);

  expect(parent.some).toBe(false);
});

test("子を並べない Box も座標の受け入れ先になる", () => {
  // 外側に `home` を置いて、飛ばされたときに素通りせず外が選ばれることを見えるようにする
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "free",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("free");
});

test("子を並べない artboard も座標の受け入れ先になる", () => {
  const parent = DropParent.innermost(
    setupFreeArtboardDocument(),
    moving("moved"),
    ["home"],
  );

  expect(Option.unwrap(parent).name).toBe("home");
});
