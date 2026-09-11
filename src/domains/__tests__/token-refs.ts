import type { TokenRefs } from "@/domains/dcmp/css-declaration";

/**
 * カスタムプロパティ名の綴り方。出力層の知識なので、テストからも引数で渡す。
 *
 * コンパイル結果を組み立てるテストが `compiled-element` と `compiled-artboard` の両方に
 * あるので、同じ綴り方をそれぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ
 * 以上のテストファイルに書いたら共通化する」）。
 */
export const TokenRefSpelling = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;
