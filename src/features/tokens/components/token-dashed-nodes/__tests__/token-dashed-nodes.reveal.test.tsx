import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { Gray900, gray900Document, renderDashedNodes } from "./setup";

/** 帯のリンクを押す。 */
async function clickRevealInTree(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "reveal in tree" }));
}

test("参照しているノードが2つあるとき、reveal in tree を押すと先頭のノードが渡る", async () => {
  const onReveal = renderDashedNodes(
    gray900Document(["title", "caption"]),
    Gray900,
  );

  await clickRevealInTree();

  expect(onReveal).toHaveBeenCalledWith("title");
});

test("artboard 自身も同じトークンを参照しているとき、reveal in tree が渡すのは破線が掛かっているノードの先頭", async () => {
  /*
   * artboard の props を先に走るのは `TokenReferrer.collectInArtboard` の並びなので、
   * 参照元全体（`collectReferrers`）の先頭はこの artboard になる。破線が掛かるのは
   * ノードだけなので、飛び先は `title` でなければならない。
   */
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        props: { background: "gray-900" },
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });
  const onReveal = renderDashedNodes(document, Gray900);

  await clickRevealInTree();

  expect(onReveal).toHaveBeenCalledWith("title");
});
