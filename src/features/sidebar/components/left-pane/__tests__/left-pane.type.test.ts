import { expect, test } from "vitest";
import type { LeftPaneView } from "@/features/sidebar/components/left-pane-rail";
import { LeftPaneViews } from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";

const plain: LeftPaneViewContent = {
  kind: "plain",
  footer: Option.none,
  render: () => null as never,
};

test("行き先が 1 つでも欠けた対応表は代入できない", () => {
  const missingTokens = {
    [LeftPaneViews.Layers]: plain,
    [LeftPaneViews.Assets]: plain,
  };

  // @ts-expect-error Tokens が無いので Record を満たさない
  const views: Readonly<Record<LeftPaneView, LeftPaneViewContent>> =
    missingTokens;

  expect(Object.keys(views)).toHaveLength(2);
});

test("検索欄を持たない行き先の組み立ては語を受け取らない", () => {
  const withQuery = {
    kind: "plain" as const,
    footer: Option.none,
    render: (query: string) => query as never,
  };

  // @ts-expect-error plain の render は引数を取らないので、語を要求する実装は入らない
  const content: LeftPaneViewContent = withQuery;

  expect(content.kind).toBe("plain");
});
