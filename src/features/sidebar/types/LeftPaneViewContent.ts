import type { ReactElement } from "react";
import type { Option } from "@/utils/Option";

/**
 * 左ペインの行き先 1 つぶんの中身。器（`LeftPane`）は行き先ごとの中身を持たず、組む側から
 * これを受け取って出す。
 *
 * 検索欄を持つかどうかで形を分けるのは、1 つの形にまとめると検索欄を持たない行き先の中身も
 * 検索語を受け取る形のままになり、その語に意味が無いことが型に出ないため。
 */
export type LeftPaneViewContent = Readonly<{
  /** パネル下端へ固定するもの。持たない行き先では不在。 */
  footer: Option<ReactElement>;
}> &
  (
    | Readonly<{
        kind: "searchable";
        /** 検索欄の案内文（UI 案 docs/Design Composer.html の綴り）。 */
        search: string;
        /** 今の検索語で絞った中身。 */
        body: (query: string) => ReactElement;
      }>
    | Readonly<{
        kind: "unsearchable";
        /** そのまま出す中身。 */
        body: ReactElement;
      }>
  );
