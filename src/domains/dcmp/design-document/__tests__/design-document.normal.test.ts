import { expect, test } from "vitest";
import { FormatVersion } from "@/domains/dcmp/format-version";
import { TokenSet } from "@/domains/dcmp/token";
import { DesignDocument } from "../index";

test("パラメータを省略して DesignDocument を作成すると現在の formatVersion が設定される", () => {
  expect(DesignDocument.create({}).formatVersion).toEqual(
    FormatVersion.Current,
  );
});

test("tokens を省略して DesignDocument を作成すると空の TokenSet になる", () => {
  expect(DesignDocument.create({}).tokens).toEqual(TokenSet.empty());
});

test("components を省略して DesignDocument を作成すると空オブジェクトになる", () => {
  expect(DesignDocument.create({}).components).toEqual({});
});

test("artboards を省略して DesignDocument を作成すると空配列になる", () => {
  expect(DesignDocument.create({}).artboards).toEqual([]);
});

test("指定した artboards を持つ DesignDocument を作成できる", () => {
  const artboard = {
    name: "login-screen",
    width: 375,
    height: 812,
    children: [],
  };
  expect(DesignDocument.create({ artboards: [artboard] }).artboards).toEqual([
    artboard,
  ]);
});
