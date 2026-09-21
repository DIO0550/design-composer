import type { ReactElement } from "react";
import type { Option } from "@/utils/Option";

/** 中身を絞れない行き先。検索欄を持たないので、組み立てに語を取らない。 */
type PlainViewContent = Readonly<{
  kind: "plain";
  footer: Option<ReactElement>;
  render: () => ReactElement;
}>;

/** 中身を絞れる行き先。パネルが持つ検索欄の語を受け取って組み立てる。 */
type SearchableViewContent = Readonly<{
  kind: "searchable";
  /** 検索欄の案内文（UI 案 docs/Design Composer.html の綴り）。 */
  searchLabel: string;
  footer: Option<ReactElement>;
  render: (query: string) => ReactElement;
}>;

/**
 * 左ペインの行き先 1 つ分の中身（docs/06-ui.md「画面構成」の左ペイン）。器（`sidebar`）は
 * これを引いて出すだけで、何が入るかは組む側が決める。
 *
 * 検索欄の有無で組み立ての引数が変わるので直和にする。1 つの形にまとめると、欄を持たない
 * 行き先にも常に空の語が渡り、その語を読んでも意味が無いことが型に出ない。
 */
export type LeftPaneViewContent = PlainViewContent | SearchableViewContent;
