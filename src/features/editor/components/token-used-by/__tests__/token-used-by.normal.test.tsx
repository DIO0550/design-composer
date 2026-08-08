import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { type TokenRef, TokenSet } from "@/domains/token";
import { renderUsedBy } from "./render";

/**
 * 参照元の出どころが 3 通りあるドキュメント。
 *
 * - `white`: artboard 自身の `background` と Box の `background` の 2 件
 * - `accent`: インスタンスの上書き 1 件
 */
const DOCUMENT = DesignDocument.create({
  tokens: {
    ...TokenSet.empty(),
    colors: { white: "#ffffff", accent: "#f97316" },
  },
  components: {
    badge: {
      type: "Box",
      publicProps: { tone: { node: "badge-body", prop: "background" } },
      children: [{ name: "badge-body", type: "Box", children: [] }],
    },
  },
  artboards: [
    {
      name: "login",
      width: 375,
      height: 812,
      props: { background: "white" },
      children: [
        {
          name: "surface",
          type: "Box",
          props: { background: "white" },
          children: [],
        },
        { name: "login-badge", ref: "badge", overrides: { tone: "accent" } },
      ],
    },
  ],
});

function renderFor(ref: TokenRef): void {
  renderUsedBy(DOCUMENT, ref);
}

test("参照元の行に「名前.prop 名」が出る", () => {
  renderFor({ kind: "colors", name: "white" });

  expect(screen.getByText("surface.background")).toBeDefined();
});

test("参照元の件数が出る", () => {
  renderFor({ kind: "colors", name: "white" });

  expect(screen.getByTestId("used-by-count").textContent).toBe("2");
});

test("artboard の props からの参照元には artboard のアイコンが出る", () => {
  renderFor({ kind: "colors", name: "white" });

  expect(screen.getByText("#")).toBeDefined();
});

test("インスタンスの上書きからの参照元には部品のアイコンが出る", () => {
  renderFor({ kind: "colors", name: "accent" });

  expect(screen.getByText("◆")).toBeDefined();
});
