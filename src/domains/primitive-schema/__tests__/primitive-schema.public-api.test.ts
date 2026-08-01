import { expect, test } from "vitest";
import { BOX_SCHEMA, PrimitiveSchema, TEXT_SCHEMA } from "../index";

/*
 * PrimitiveSchema コンパニオンはサブフォルダに分かれた実装を index.ts で
 * 組み立てている。分割で公開APIが欠けないことをここで確かめる。
 */

test("primitive の型を指定するとその仕様が得られる", () => {
  expect(PrimitiveSchema.forType("Box")).toBe(BOX_SCHEMA);
  expect(PrimitiveSchema.forType("Text")).toBe(TEXT_SCHEMA);
});

test("primitive として宣言されている名前だけが primitive の型と判定される", () => {
  expect(PrimitiveSchema.isPrimitiveType("Box")).toBe(true);
  expect(PrimitiveSchema.isPrimitiveType("Unknown")).toBe(false);
});

test("子を持てるかは仕様の宣言どおりに答える", () => {
  expect(PrimitiveSchema.allowsChildren("Box")).toBe(true);
  expect(PrimitiveSchema.allowsChildren("Text")).toBe(false);
});

test("トークン参照 prop は仕様で宣言されたトークン種別を答える", () => {
  expect(PrimitiveSchema.tokenKind("gap")).toBe("spacing");
  expect(PrimitiveSchema.tokenKind("typography")).toBe("typography");
});
