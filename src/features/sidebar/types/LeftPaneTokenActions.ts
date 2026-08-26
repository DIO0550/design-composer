import type { TokenKind, TokenRef } from "@/domains/dcmp/token";

/**
 * 左ペインから届くトークン編集の受け口（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 値・改名・削除を持たないのは、それらの入口が右ペインの編集欄（`features/tokens` の
 * `TokenEditor`）にあり、左ペインの一覧が持つのは「選ぶ」と「種別に足す」の 2 つだけ
 * だから。理由は `LeftPaneNodeActions` と同じで、`features/editor` の `TokenActions` を
 * そのまま受け取ると循環する。
 */
export type LeftPaneTokenActions = Readonly<{
  /** 一覧の行を押したときに、そのトークンを選択として伝える。 */
  select: (ref: TokenRef) => void;
  /** 見出しの `+` を押したときに、その種別へ 1 つ足すことを伝える。 */
  add: (kind: TokenKind) => void;
}>;
