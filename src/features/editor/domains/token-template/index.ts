import { DesignDocument } from "@/domains/design-document";
import type { ScalarTokenKind, Token, TokenValue } from "@/domains/token";

/**
 * これから追加するトークンの指定（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 種別だけを持ち、名前を持たない。種別の中で一意な名前は追加先のドキュメントを
 * 見ないと決まらないため（採番は `toToken` が行う / `NodeTemplate` と同じ）。
 *
 * 受け付けるのは値が1つの値で表せる種別だけ。複合オブジェクトの種別
 * （shadows / typography）は、どのフィールドを初期値にするかがフォームの設計と
 * 対になっていて、フォームの無い今は追加しても直せない（#42 の単位 2）。
 */
export type TokenTemplate = Readonly<{ kind: ScalarTokenKind }>;

/**
 * 追加直後のトークンに入れる値。
 *
 * 色を黒にしているのは、白だと一覧の色見本が背景と同化して「足したのに見えない」
 * ことになるため（`NodeTemplate` が潰れた矩形を避けて初期サイズを与えるのと同じ理由）。
 * 長さは 0。足した時点で見た目を変えない値が、直す前の既定として素直なため。
 */
const INITIAL_VALUES = {
  colors: { kind: "colors", value: "#000000" },
  spacing: { kind: "spacing", value: 0 },
  radius: { kind: "radius", value: 0 },
} as const satisfies Readonly<Record<ScalarTokenKind, TokenValue>>;

/**
 * 採番の元になる名前。
 *
 * 種別名を機械的に単数形へ倒さない。`colors` は複数形だが `radius` は複数形ではなく、
 * 末尾の `s` を落とす規則では `radiu` になる。どれも識別子の規則（kebab-case）を
 * 満たす綴りにしておき、衝突したときの連番は `DesignDocument.uniqueName` が付ける。
 */
const BASE_NAMES = {
  colors: "color",
  spacing: "spacing",
  radius: "radius",
} as const satisfies Readonly<Record<ScalarTokenKind, string>>;

export const TokenTemplate = {
  /** 採番の元になる名前。 */
  baseName(template: TokenTemplate): string {
    return BASE_NAMES[template.kind];
  },

  /**
   * 指定を、そのトークン集合へ足せるトークンにする。
   * `usedNames` はその種別の中で使われている名前（一意性は種別の中でしか
   * 保証されない / docs/04-tokens.md「命名規則」）。
   */
  toToken(template: TokenTemplate, usedNames: ReadonlySet<string>): Token {
    const name = DesignDocument.uniqueName(
      TokenTemplate.baseName(template),
      usedNames,
    );
    return { ...INITIAL_VALUES[template.kind], name };
  },
} as const;
