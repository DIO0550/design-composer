import { DesignDocument, TokenReferrer } from "@/domains/design-document";
import { type Token, type TokenRef, TokenSet } from "@/domains/token";
import { Option } from "@/utils/Option";

/**
 * ドキュメントと、その中で選ばれているトークンの対
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 2 つを 1 つの型にまとめるのは、**片方だけでは答えが決まらない**ため。
 * 選ばれているのは種別と名前（`TokenRef`）だけで、その値も参照元も、どのドキュメントの
 * 中の名前かが決まって初めて引ける。
 *
 * 選択そのものではなく `TokenRef` を持つのは、値を持ち回すと編集・undo のあとに古い値が
 * 残るため。中身は引き直す（`TokenSelection.token`）。
 *
 * `features/editor` の `Selection`（選んだ**ノード**の正体）とは別物で、あちらは
 * ドキュメントを持たない。
 */
export type TokenSelection = Readonly<{
  document: DesignDocument;
  ref: Option<TokenRef>;
}>;

/**
 * 選ばれているトークンの参照元を、渡された集め方で集める。
 *
 * 選択が無いときも空を返し、参照が 0 件であることと区別しない。消費側の見え方が
 * どちらでも同じ（`Used by` の枠も #147 の破線も出ない）ため、`Option` で区別しても
 * 分岐が増えるだけになる。区別が要る消費側が現れたら、選択を引数で受け取る形
 * （未選択の状態を渡せない形）にする。
 *
 * @param selection 選択とドキュメントの出どころ
 * @param collect 集める範囲（全体か、キャンバス上だけか）
 * @returns 集まった参照元の並び。トークンを選んでいなければ空
 */
function referrersOf(
  selection: TokenSelection,
  collect: (
    document: DesignDocument,
    ref: TokenRef,
  ) => readonly TokenReferrer[],
): readonly TokenReferrer[] {
  if (!selection.ref.some) {
    return [];
  }
  return collect(selection.document, selection.ref.value);
}

export const TokenSelection = {
  /**
   * ドキュメントと、その中で選ばれているトークンを対にする。
   *
   * @param document 選択先を引くドキュメント
   * @param ref 選ばれているトークンの種別と名前。選んでいなければ `none`
   * @returns 2 つを対にした選択
   */
  create(document: DesignDocument, ref: Option<TokenRef>): TokenSelection {
    return { document, ref };
  },

  /**
   * 選ばれているトークン。ドキュメントから引き直すので、値は常に現在のもの。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 選ばれているトークン。選んでいないとき、およびドキュメントから
   *   消えているときは `none`
   */
  token(selection: TokenSelection): Option<Token> {
    return Option.flatMap(selection.ref, (ref) =>
      TokenSet.find(selection.document.tokens, ref),
    );
  },

  /**
   * そのトークンが選ばれているか。名前は種別の中でしか一意でないので種別も見る。
   *
   * @param selection 選択の出どころ
   * @param ref 選ばれているかを知りたいトークンの種別と名前
   * @returns 種別と名前の両方が一致すれば真
   */
  isSelected(selection: TokenSelection, ref: TokenRef): boolean {
    const selected = selection.ref;
    return (
      selected.some &&
      selected.value.kind === ref.kind &&
      selected.value.name === ref.name
    );
  },

  /**
   * 選ばれているトークンを参照している箇所
   * （UI 案 docs/Design Composer.html の `Used by` / #127）。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 参照元の並び。トークンを選んでいなければ空
   */
  collectReferrers(selection: TokenSelection): readonly TokenReferrer[] {
    return referrersOf(selection, DesignDocument.collectTokenReferrers);
  },

  /**
   * 選ばれているトークンを参照している、キャンバス上のノードの名前（#147 の破線の相手）。
   *
   * artboard 自身の参照が落ちるのは `TokenReferrer.nodeNames` の担当で、
   * 部品定義の中の参照はそもそも集める範囲に入っていない。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 破線を引くノードの名前。重複は無い。artboard 自身と部品定義の中のノードは
   *   含まない。トークンを選んでいなければ空
   */
  collectCanvasReferrerNames(selection: TokenSelection): readonly string[] {
    return TokenReferrer.nodeNames(
      referrersOf(selection, DesignDocument.collectCanvasTokenReferrers),
    );
  },
} as const;
