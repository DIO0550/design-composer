import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { DocumentError } from "../index";

test("名前が識別子規則に違反しているトークンは、そのトークンを指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { Primary: "#112233" } },
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([{ kind: "token", tokenName: "Primary" }]);
});

test("colors と gradients の両方にある名前は、そのトークンを指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#3b82f6" },
      gradients: { brand: Fade },
    },
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([{ kind: "token", tokenName: "brand" }]);
});

test("値が hex でない色トークンは、そのトークンを指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { brand: "red" } },
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([{ kind: "token", tokenName: "brand" }]);
});

test("ノードの prop の不正は、そのノードと prop を指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: TokenSet.empty(),
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "hero", type: "Box", props: { layout: "diagonal" } },
        ],
      },
    ],
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([{ kind: "node", nodeName: "hero", prop: "layout" }]);
});

test("同じ綴りの部品とトークンの識別子違反は、部品はノード・トークンはトークンを指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { Primary: "#112233" } },
    components: { Primary: { type: "Box" } },
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([
    { kind: "node", nodeName: "Primary" },
    { kind: "token", tokenName: "Primary" },
  ]);
});

test("未知の型のノードは、prop を持たずにそのノードを指すエラーになる", () => {
  const document = DesignDocument.create({
    tokens: TokenSet.empty(),
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "widget", type: "Widget" }],
      },
    ],
  });

  expect(
    DocumentError.collectFrom(document).map((error) => error.location),
  ).toStrictEqual([{ kind: "node", nodeName: "widget" }]);
});
