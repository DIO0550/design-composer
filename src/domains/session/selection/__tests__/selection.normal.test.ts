import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import type { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Selection } from "../index";

test("artboard を渡すと artboard の種別になる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  expect(Option.unwrap(Selection.fromArtboard(artboard).kind)).toBe("artboard");
});

test("artboard を渡すとその名前になる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  expect(Selection.fromArtboard(artboard).name).toBe("home");
});

test("参照ノードを渡すと部品の種別になる", () => {
  const node: Node = { name: "home-action", ref: "primary-button" };

  expect(Option.unwrap(Selection.fromNode(node).kind)).toBe("component");
});

test("プリミティブを渡すとその type が種別になる", () => {
  const node: Node = { name: "home-title", type: "Text" };

  expect(Option.unwrap(Selection.fromNode(node).kind)).toBe("Text");
});

test("スキーマに無い type のノードは種別が決まらない", () => {
  const node: Node = { name: "mystery", type: "Widget" };

  expect(Selection.fromNode(node).kind.some).toBe(false);
});

test("スキーマに無い type のノードでも名前は決まる", () => {
  const node: Node = { name: "mystery", type: "Widget" };

  expect(Selection.fromNode(node).name).toBe("mystery");
});
