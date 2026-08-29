import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { renderUsedBy } from "./render";

/**
 * 参照元の出どころが 4 通りあるドキュメント。
 *
 * - `white`: artboard 自身の `background` と Box の `background` の 2 件
 * - `accent`: インスタンスの上書き 1 件
 * - `gray-900`: 明示した `color` 1 件と、Text の既定で効く 1 件
 *
 * `gray-900` は Text の `color` の既定なので、既定を数えない実装では 1 件にしかならない。
 */
const ReferringDocument = DesignDocument.create({
  tokens: {
    ...TokenSet.empty(),
    colors: { white: "#ffffff", accent: "#f97316", "gray-900": "#111827" },
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
        { name: "title", type: "Text", props: { color: "gray-900" } },
        { name: "caption", type: "Text" },
      ],
    },
  ],
});

test("参照元の行に「名前.prop 名」が出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "white" });

  expect(screen.getByText("surface.background")).toBeDefined();
});

test("参照元の件数が出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "white" });

  expect(screen.getByTestId("used-by-count").textContent).toBe("2");
});

test("artboard の props からの参照元には artboard のアイコンが出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "white" });

  expect(screen.getByText("#")).toBeDefined();
});

test("インスタンスの上書きからの参照元には部品のアイコンが出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "accent" });

  expect(screen.getByText("◆")).toBeDefined();
});

test("スキーマデフォルトで効いている参照も件数に入る", () => {
  /*
   * `caption` は `color` を書いていないが Text の既定（`gray-900`）が効いている。
   * 明示した `title` と合わせて 2 件。既定を数えないと 1 件になる。
   */
  renderUsedBy(ReferringDocument, { kind: "colors", name: "gray-900" });

  expect(screen.getByTestId("used-by-count").textContent).toBe("2");
});
