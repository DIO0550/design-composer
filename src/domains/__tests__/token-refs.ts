import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import { DocumentTemplate } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";

/**
 * トークン参照の綴り方と、塗りの名前の解決。出力層の知識なので、テストからも引数で渡す。
 *
 * コンパイル結果を組み立てるテストが `compiled-element` と `compiled-artboard` の両方に
 * あるので、同じ綴り方をそれぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ
 * 以上のテストファイルに書いたら共通化する」）。
 *
 * 解決は `TokenSet.resolvePaintName` をそのまま呼ぶ。ここで自前に判定を書くと、3 つの状態を
 * どの宣言にするかを確かめるテストが実装ではなくこのフィクスチャを固定してしまう。
 *
 * @param tokens 塗りの名前を引くトークン一式
 * @returns そのトークン一式に対する綴り方
 */
export function tokenRefsFrom(tokens: TokenSet): TokenRefs {
  return {
    ref: (kind, name) => `var(--${kind}-${name})`,
    paintResolution: (name) => TokenSet.resolvePaintName(tokens, name),
    typographyRef: (name, property) => `var(--typography-${name}-${property})`,
  };
}

/**
 * 既定テンプレートのトークン一式に束縛した綴り方。
 *
 * 空のトークン一式にすると、塗りの名前がすべて dangling になって既定の種別へ倒れるので、
 * 「その名前を持っている種別の var を出す」を確かめているテストが実装を壊しても通る。
 */
export const DefaultTokenRefs = tokenRefsFrom(DocumentTemplate.Default.tokens);
