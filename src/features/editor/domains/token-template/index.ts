import { DesignDocument } from "@/domains/design-document";
import type { Token, TokenKind, TokenValue } from "@/domains/token";

/**
 * これから追加するトークンの指定（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 種別だけを持ち、名前を持たない。種別の中で一意な名前は追加先のドキュメントを
 * 見ないと決まらないため（採番は `toToken` が行う / `NodeTemplate` と同じ）。
 */
export type TokenTemplate = Readonly<{ kind: TokenKind }>;

/**
 * 追加直後のトークンに入れる値。
 *
 * 色を黒にしているのは、白だと一覧の色見本が背景と同化して「足したのに見えない」
 * ことになるため（`NodeTemplate` が潰れた矩形を避けて初期サイズを与えるのと同じ理由）。
 * 長さは 0。足した時点で見た目を変えない値が、直す前の既定として素直なため。
 *
 * 影と書体だけは 0 や空から始めない。影を 0/0/0 にすると一覧の見本にも
 * キャンバスにも何も出ず、色を白にしたときと同じ「足したのに見えない」になる。
 * どちらも docs/04-tokens.md「初期トークンセット」が挙げている値（`shadows.sm` /
 * `typography.body`）を選んだ。デフォルトテーマ（`domains/design-document/template`）
 * とは値が一致するだけで、参照はしていない。追加直後の見え方を決めるのはこちらの
 * 関心事で、テーマを直したときに連動して変わってよいものではないため。
 */
const InitialValues = {
  colors: { kind: "colors", value: "#000000" },
  spacing: { kind: "spacing", value: 0 },
  radius: { kind: "radius", value: 0 },
  shadows: {
    kind: "shadows",
    value: { x: 0, y: 1, blur: 3, color: "#0000001a" },
  },
  typography: {
    kind: "typography",
    value: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
  },
} as const satisfies Readonly<Record<TokenKind, TokenValue>>;

/**
 * 採番の元になる名前。
 *
 * 種別名を機械的に単数形へ倒さない。`colors` は複数形だが `radius` は複数形ではなく、
 * 末尾の `s` を落とす規則では `radiu` になる。どれも識別子の規則（kebab-case）を
 * 満たす綴りにしておき、衝突したときの連番は `DesignDocument.uniqueName` が付ける。
 */
const BaseNames = {
  colors: "color",
  spacing: "spacing",
  radius: "radius",
  shadows: "shadow",
  typography: "typography",
} as const satisfies Readonly<Record<TokenKind, string>>;

export const TokenTemplate = {
  /** 採番の元になる名前。 */
  baseName(template: TokenTemplate): string {
    return BaseNames[template.kind];
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
    return { ...InitialValues[template.kind], name };
  },
} as const;
