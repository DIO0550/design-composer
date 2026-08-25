import { render } from "@testing-library/react";
import { vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { type TokenRef, TokenSet } from "@/domains/token";
import { TokenSelection } from "@/domains/token-selection";
import { Option } from "@/utils/Option";
import { TokenDashedNodes } from "../index";

/** どのカテゴリでも土台に使う色トークン。 */
export const Gray900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を、渡した名前のノードそれぞれの `color` から指すドキュメント。
 *
 * @param nodeNames artboard へ並べるノードの名前。並べた順がそのまま破線の順になる
 * @returns そのノードだけが `gray-900` を指す 1 枚の artboard を持つドキュメント
 */
export function gray900Document(nodeNames: readonly string[]): DesignDocument {
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

/**
 * トークンを選んだ状態の帯を描く。
 * 出る中身は選んでいるトークンから決まるので、どのテストも「ドキュメントを作って選ぶ」から始まる。
 * 観点ごとに土台のドキュメントが違うため、ドキュメントは引数で受け取る。
 *
 * @param document 帯が参照元を数える相手
 * @param ref 選んでいるトークンの種別と名前
 * @returns `reveal in tree` が渡した名前を読むための代役
 */
export function renderDashedNodes(document: DesignDocument, ref: TokenRef) {
  const onReveal = vi.fn<(nodeName: string) => void>();
  render(
    <TokenDashedNodes
      selection={TokenSelection.create(document, Option.some(ref))}
      onReveal={onReveal}
    />,
  );
  return onReveal;
}

/**
 * トークンを選んでいない状態の帯を描く。
 * 選択が無いことと参照が 0 件であることは別の入力なので、選ぶ側と分けて持つ。
 */
export function renderWithoutSelection(document: DesignDocument): void {
  render(
    <TokenDashedNodes
      selection={TokenSelection.create(document, Option.none)}
      onReveal={vi.fn()}
    />,
  );
}
