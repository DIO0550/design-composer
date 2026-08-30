import { expect, test } from "vitest";
import { Artboard } from "../index";

test("artboard は Box の props をそのまま受け付ける", () => {
  expect(Object.keys(Artboard.propDefinitions())).toContain("background");
});

test("サイズのモードは artboard の props では変えられないので受け付けない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("widthMode");
  expect(names).not.toContain("heightMode");
});

test("サイズの長さは artboard 自身が持つので props では受け付けない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("width");
  expect(names).not.toContain("height");
});

test("親の中での置かれ方は artboard の props では受け付けない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("placement");
  expect(names).not.toContain("x");
  expect(names).not.toContain("y");
});

test("はみ出しの既定は clip になる", () => {
  expect(Artboard.propDefinitions().overflow.default).toBe("clip");
});

test("既定を差し替えない prop は Box の既定のまま", () => {
  expect(Artboard.propDefinitions().direction.default).toBe("column");
});
