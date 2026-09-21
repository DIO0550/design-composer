import type { TokenKind, TokenRef } from "@/domains/dcmp/token";

/**
 * 左ペインから届くトークン編集の受け口（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 */
export type LeftPaneTokenActions = Readonly<{
  /** 一覧の行を押したときに、そのトークンを選択として伝える。 */
  select: (ref: TokenRef) => void;
  /** 見出しの `+` を押したときに、その種別へ 1 つ足すことを伝える。 */
  add: (kind: TokenKind) => void;
}>;
