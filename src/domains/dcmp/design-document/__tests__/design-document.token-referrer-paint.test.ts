import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { TokenSet } from "@/domains/dcmp/token";
import { DesignDocument } from "../index";

test("background が gradients のトークンを指していると、そのノードが参照元になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), gradients: { fade: Fade } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "hero", type: "Box", props: { background: "fade" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "gradients",
    name: "fade",
  });

  expect(referrers).toEqual([
    expect.objectContaining({ name: "hero", prop: "background" }),
  ]);
});

test("colors しか指せない prop が gradients と同じ名前を指していても、その gradients の参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), gradients: { fade: Fade } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "fade" } },
          { name: "hero", type: "Box", props: { background: "fade" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "gradients",
    name: "fade",
  });

  expect(referrers).toEqual([
    expect.objectContaining({ name: "hero", prop: "background" }),
  ]);
});

test("colors と gradients に同じ名前があると、それを指す background は両方の参照元になる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#3b82f6" },
      gradients: { brand: Fade },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "hero", type: "Box", props: { background: "brand" } },
        ],
      },
    ],
  });

  const colorReferrers = DesignDocument.collectTokenReferrers(document, {
    kind: "colors",
    name: "brand",
  });
  const gradientReferrers = DesignDocument.collectTokenReferrers(document, {
    kind: "gradients",
    name: "brand",
  });

  expect([colorReferrers, gradientReferrers]).toEqual([
    [expect.objectContaining({ name: "hero", prop: "background" })],
    [expect.objectContaining({ name: "hero", prop: "background" })],
  ]);
});
