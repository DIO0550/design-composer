import { expect, test } from "vitest";
import { Artboard } from "../index";

test("artboard も Box の塗りを受け付ける", () => {
  expect(Object.keys(Artboard.propDefinitions())).toContain("background");
});

test("artboard も opacity を受け付ける", () => {
  expect(Object.keys(Artboard.propDefinitions())).toContain("opacity");
});

test("サイズのモードは artboard では読み捨てるので、パネルに出さない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("widthMode");
  expect(names).not.toContain("heightMode");
});

test("サイズの長さは artboard 自身が持つので、props の側は読み捨ててパネルに出さない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("width");
  expect(names).not.toContain("height");
});

test("親の中での置かれ方は artboard では読み捨てるので、パネルに出さない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("placement");
  expect(names).not.toContain("x");
  expect(names).not.toContain("y");
});

test("親のリサイズへの追従は artboard では読み捨てるので、パネルに出さない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("constraintX");
  expect(names).not.toContain("constraintY");
});

test("はみ出しの既定は clip になる", () => {
  expect(Artboard.propDefinitions().overflow.default).toBe("clip");
});

test("既定を差し替えない prop は Box の既定のまま", () => {
  expect(Artboard.propDefinitions().layout.default).toBe("column");
});

test("表示 / 非表示は artboard の props でも受け付ける", () => {
  expect(Object.keys(Artboard.propDefinitions())).toContain("visibility");
});

test("回転は artboard では読み捨てるので、パネルに出さない", () => {
  expect(Object.keys(Artboard.propDefinitions())).not.toContain("rotation");
});

test("最小 / 最大のサイズは artboard では読み捨てるので、パネルに出さない", () => {
  const names = Object.keys(Artboard.propDefinitions());

  expect(names).not.toContain("minWidth");
  expect(names).not.toContain("maxWidth");
  expect(names).not.toContain("minHeight");
  expect(names).not.toContain("maxHeight");
});

test("ロックは artboard では読み捨てるので、パネルに出さない", () => {
  expect(Object.keys(Artboard.propDefinitions())).not.toContain("locking");
});
