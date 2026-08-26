import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ColorSwatchTestId } from "@/components/color-swatch";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { Gray900, gray900Document, renderDashedNodes } from "./setup";

test("トークンを選ぶと、そのトークンの名前が帯に出る", () => {
  renderDashedNodes(gray900Document(["title", "caption"]), Gray900);

  expect(screen.getByText("gray-900")).toBeDefined();
});

test("参照しているノードが2つあると、帯の件数が2になる", () => {
  renderDashedNodes(gray900Document(["title", "caption"]), Gray900);

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
            props: {
              paddingTop: "md",
              paddingRight: "md",
              paddingBottom: "md",
              paddingLeft: "md",
            },
            children: [],
          },
        ],
      },
    ],
  });

  renderDashedNodes(document, { kind: "spacing", name: "md" });

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

  renderDashedNodes(document, Gray900);

  expect(screen.getByText("1 node · dashed in canvas")).toBeDefined();
});

test("色トークンを選ぶと、その色の見本が帯に出る", () => {
  renderDashedNodes(gray900Document(["title"]), Gray900);

  expect(screen.getByTestId(ColorSwatchTestId)).toBeDefined();
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
            props: { paddingRight: "md", paddingLeft: "md" },
            children: [],
          },
        ],
      },
    ],
  });

  renderDashedNodes(document, { kind: "spacing", name: "md" });

  // 帯そのものは出ている（見本だけが出ない、を確かめる）
  expect(
    screen.getByRole("region", { name: "キャンバスの破線" }),
  ).toBeDefined();
  expect(screen.queryByTestId(ColorSwatchTestId)).toBeNull();
});
