import {
  type Token,
  type TokenKind,
  TokenSet,
  type TokenValue,
} from "@/domains/dcmp/token";

/**
 * これから追加するトークンの指定（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 種別だけを持ち、名前を持たない。
 */
export type TokenTemplate = Readonly<{ kind: TokenKind }>;

/**
 * 追加直後のトークンに入れる値。
 *
 * 影と書体は 0 や空から始めない（影を 0/0/0 にすると一覧の見本にもキャンバスにも何も
 * 出ない）。どちらも docs/04-tokens.md「初期トークンセット」が挙げている値（`shadows.sm`
 * / `typography.body`）を選んだ。デフォルトテーマとは値が一致するだけで参照はしていない
 * （追加直後の見え方はこちらの関心事）。
 *
 * グラデーションは種別を網羅するために置いている。一覧がグラデーションの見出しを出さない
 * ので、いまこの値から始まる経路は無い。
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
  gradients: {
    kind: "gradients",
    value: {
      shape: "linear",
      angle: 90,
      stops: [
        { color: "#3b82f6", ratio: 0 },
        { color: "#1d4ed8", ratio: 1 },
      ],
    },
  },
} as const satisfies Readonly<Record<TokenKind, TokenValue>>;

/**
 * 採番の元になる名前。
 *
 * 種別名を機械的に単数形へ倒さない。`colors` は複数形だが `radius` は複数形ではなく、
 * 末尾の `s` を落とす規則では `radiu` になる。どれも識別子の規則（kebab-case）を
 * 満たす綴りにしておき、衝突したときの連番は `TokenSet.uniqueName` が付ける。
 */
const BaseNames = {
  colors: "color",
  spacing: "spacing",
  radius: "radius",
  shadows: "shadow",
  typography: "typography",
  gradients: "gradient",
} as const satisfies Readonly<Record<TokenKind, string>>;

export const TokenTemplate = {
  /**
   * 追加するトークンの名前を採番するときの基底名。
   *
   * @param template 追加するトークンの指定
   * @returns その種別の `BaseNames` の綴り
   */
  baseName(template: TokenTemplate): string {
    return BaseNames[template.kind];
  },

  /**
   * 指定を、そのトークン集合へ足せるトークンにする。
   *
   * @param template 追加するトークンの指定
   * @param tokens 足す先のトークン一式
   * @returns 種別の初期値と、`tokens` の同じ種別の名前と衝突しない名前を持つトークン
   */
  toToken(template: TokenTemplate, tokens: TokenSet): Token {
    const name = TokenSet.uniqueName(
      tokens,
      template.kind,
      TokenTemplate.baseName(template),
    );
    return { ...InitialValues[template.kind], name };
  },
} as const;
