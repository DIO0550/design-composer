import { PropDefinition, type TokenPropDefinition } from "../prop-definition";
import {
  type PrimitiveSchema,
  PrimitiveSchemas,
  type PrimitiveType,
} from "../schema";

/*
 * このフォルダは「スキーマが宣言した事実」を型として取り出すための導出を持つ。
 * スキーマ（`BoxSchema` / `TextSchema`）を `as const satisfies` で書いているため
 * prop 名も `domain` も `tokenKind` もリテラル型として残っており、
 * 対応表を別に書き写さずに型レベルで走査できる。
 */

/**
 * ある primitive のスキーマが宣言している props。
 * `PropDefinitionRecord`（`Record<string, PropDefinition>`）へ広げると
 * prop 名も `tokenKind` もリテラル型が失われるため、スキーマの実体から直接引く。
 */
type SchemaPropsOf<T extends PrimitiveType> =
  (typeof PrimitiveSchemas)[T]["props"];

/**
 * ある primitive のうち `domain: "token"` と宣言された prop の名前。
 *
 * props の各キーを走査し、トークン参照でないものを `never` に潰してから
 * `[keyof ...]` で値側を union として取り出す（`never` は union から消える）。
 * 例: Box なら `"gap" | "paddingTop" | "paddingRight" | "paddingBottom" |
 * "paddingLeft" | "background" | "radius" | "shadow"`。
 */
type TokenPropNameOf<T extends PrimitiveType> = {
  [K in keyof SchemaPropsOf<T>]: SchemaPropsOf<T>[K] extends { domain: "token" }
    ? K
    : never;
}[keyof SchemaPropsOf<T>];

/**
 * スキーマが `domain: "token"` と宣言した prop の名前（全 primitive 分）。
 *
 * `TokenPropNameOf` を primitive ごとに求めて union へまとめている。
 * 名前は primitive をまたいで重複しないため、型を問わず名前だけで引ける
 * （`gap` は Box にしか、`color` は Text にしか無い）。
 * トークンを引かない prop（`direction` などの enum、`width` などの literal）は
 * 含まれないので、この型で受ければ非トークン prop を渡せない。
 */
export type TokenPropName = {
  [T in PrimitiveType]: TokenPropNameOf<T>;
}[PrimitiveType];

/**
 * その prop が引くトークン種別。スキーマの `tokenKind` の宣言をそのまま取り出す。
 *
 * `P` を持つスキーマの props を `Extract` で選び出し（持たない primitive は落ちる）、
 * その prop の定義から `tokenKind` を読む。例: `TokenKindOfProp<"gap">` は `"spacing"`。
 * 種別をここに書き写していないので、スキーマを直せば自動的に追従する。
 */
type TokenKindOfProp<P extends TokenPropName> = Extract<
  SchemaPropsOf<PrimitiveType>,
  Readonly<Record<P, TokenPropDefinition>>
>[P]["tokenKind"];

/**
 * トークン参照 prop → 引くトークン種別の対応。
 *
 * スキーマの `tokenKind` から導出するので、種別の宣言はスキーマだけが持つ
 * （対応表を別に書き写して二重管理しない）。値がリテラル型で残るため、
 * 出力側は `TokenPropKinds["gap"]` を `"spacing"` として受け取れる。
 */
export type TokenPropKinds = {
  readonly [P in TokenPropName]: TokenKindOfProp<P>;
};

/**
 * `TokenPropKinds` の実体。全 primitive のスキーマを走査し、
 * `domain: "token"` の prop だけを prop 名 → `tokenKind` の対応として集める。
 *
 * 集めているのはスキーマの宣言そのものなので、`TokenPropKinds` が表す事実は
 * この構築処理で成立している（狭い型への表明が許されるのはこの1箇所）。
 */
const TokenKindByProp = Object.fromEntries(
  Object.values(PrimitiveSchemas).flatMap((schema: PrimitiveSchema) =>
    Object.entries(schema.props).flatMap(([name, definition]) =>
      PropDefinition.isToken(definition)
        ? [[name, definition.tokenKind] as const]
        : [],
    ),
  ),
) as TokenPropKinds;

export const TokenPropKinds = {
  /**
   * トークン参照 prop が引くトークン種別。
   * 出力側が「どの種別から引くか」を書き写さずに済むよう、スキーマの宣言を引かせる。
   */
  kindOf<P extends TokenPropName>(prop: P): TokenPropKinds[P] {
    return TokenKindByProp[prop];
  },
} as const;
