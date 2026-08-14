import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { COLOR_SWATCH_TEST_ID } from "@/components/color-swatch";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { renderLegend } from "./render";

const GRAY_900 = { kind: "colors", name: "gray-900" } as const;

/** `gray-900` を、渡した名前のノードそれぞれの `color` から指すドキュメント。 */
function setupDocument(nodeNames: readonly string[]): DesignDocument {
  return DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: nodeNames.map((name) => ({
          name,
          type: "Text" as const,
          props: { color: "gray-900" },
        })),
      },
    ],
  });
}

test("トークンを選ぶと、そのトークンの名前が帯に出る", () => {
  renderLegend(setupDocument(["title", "caption"]), GRAY_900);

  expect(screen.getByText("gray-900")).toBeDefined();
});

test("参照しているノードが2つあると、帯の件数が2になる", () => {
  renderLegend(setupDocument(["title", "caption"]), GRAY_900);

  expect(screen.getByText("2 nodes · dashed in canvas")).toBeDefined();
});

test("1つのノードが2つの prop から同じトークンを指しても、帯の件数は1になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), spacing: { md: 16 } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: { paddingX: "md", paddingY: "md" },
            children: [],
          },
        ],
      },
    ],
  });

  renderLegend(document, { kind: "spacing", name: "md" });

  expect(screen.getByText("1 node · dashed in canvas")).toBeDefined();
});

test("部品定義の中の参照は帯の件数に入らない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      badge: {
        type: "Box",
        children: [
          {
            name: "badge-body",
            type: "Box",
            props: { background: "gray-900" },
          },
        ],
      },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        // キャンバス上からも 1 件指させ、数え漏れと数えすぎの両方で落ちるようにする
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  renderLegend(document, GRAY_900);

  expect(screen.getByText("1 node · dashed in canvas")).toBeDefined();
});

test("色トークンを選ぶと、その色の見本が帯に出る", () => {
  renderLegend(setupDocument(["title"]), GRAY_900);

  expect(screen.getByTestId(COLOR_SWATCH_TEST_ID)).toBeDefined();
});

test("色以外のトークンを選ぶと、帯に見本は出ない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), spacing: { md: 16 } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: { paddingX: "md" },
            children: [],
          },
        ],
      },
    ],
  });

  renderLegend(document, { kind: "spacing", name: "md" });

  // 帯そのものは出ている（見本だけが出ない、を確かめる）
  expect(
    screen.getByRole("region", { name: "キャンバスの破線" }),
  ).toBeDefined();
  expect(screen.queryByTestId(COLOR_SWATCH_TEST_ID)).toBeNull();
});
