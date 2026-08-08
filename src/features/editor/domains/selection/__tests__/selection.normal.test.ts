import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import type { Node } from "@/domains/node";
import { Option } from "@/utils/Option";
import { Selection } from "../index";

test("artboard を渡すと artboard の種別になる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  expect(Option.unwrap(Selection.ofArtboard(artboard).kind)).toBe("artboard");
});

test("artboard を渡すとその名前になる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  expect(Selection.ofArtboard(artboard).name).toBe("home");
});

test("参照ノードを渡すと部品の種別になる", () => {
  const node: Node = { name: "home-action", ref: "primary-button" };

  expect(Option.unwrap(Selection.ofNode(node).kind)).toBe("component");
});

test("プリミティブを渡すとその type が種別になる", () => {
  const node: Node = { name: "home-title", type: "Text" };

  expect(Option.unwrap(Selection.ofNode(node).kind)).toBe("Text");
});

test("スキーマに無い type のノードは種別が決まらない", () => {
  const node: Node = { name: "mystery", type: "Widget" };

  expect(Selection.ofNode(node).kind.some).toBe(false);
});

test("スキーマに無い type のノードでも名前は決まる", () => {
  const node: Node = { name: "mystery", type: "Widget" };

  expect(Selection.ofNode(node).name).toBe("mystery");
});
