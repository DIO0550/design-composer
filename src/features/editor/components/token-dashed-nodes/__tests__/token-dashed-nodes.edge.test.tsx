import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { renderDashedNodes, renderWithoutSelection } from "./render";

const Gray900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を部品定義の中からだけ指し、キャンバス上には参照が無いドキュメント。
 * 「キャンバスに 1 本も破線が無い」を、参照そのものは在る入力で作れる。
 */
function setupComponentOnlyDocument(): DesignDocument {
  return DesignDocument.create({
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
    artboards: [{ name: "login", width: 375, height: 812, children: [] }],
  });
}

test("キャンバスに破線が1本も無いときは帯を出さない", () => {
  renderDashedNodes(setupComponentOnlyDocument(), Gray900);

  expect(screen.queryByRole("region", { name: "キャンバスの破線" })).toBeNull();
});

test("トークンを選んでいないときは帯を出さない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        // 選べば帯が出るドキュメントで確かめる（選択の有無だけが違いになる）
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  renderWithoutSelection(document);

  expect(screen.queryByRole("region", { name: "キャンバスの破線" })).toBeNull();
});
