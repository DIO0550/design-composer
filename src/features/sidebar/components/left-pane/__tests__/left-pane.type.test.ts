import type { ReactElement } from "react";
import { expectTypeOf, test } from "vitest";
import type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";

type SearchableContent = Extract<LeftPaneViewContent, { kind: "searchable" }>;
type UnsearchableContent = Extract<
  LeftPaneViewContent,
  { kind: "unsearchable" }
>;

/*
 * 2 つの形を 1 つにまとめても器は動くので、まとめ直されたことに気づく手段がこれしかない
 * （分けている理由は `LeftPaneViewContent` の doc）。
 */
test("検索欄を持つ中身は検索語を受け取って組み立てる", () => {
  expectTypeOf<SearchableContent["body"]>().toEqualTypeOf<
    (query: string) => ReactElement
  >();
});

test("検索欄を持たない中身は検索語を受け取らない", () => {
  expectTypeOf<UnsearchableContent["body"]>().toEqualTypeOf<ReactElement>();
});
