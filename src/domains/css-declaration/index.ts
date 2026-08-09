import type { TokenKind, TypographyCssProperty } from "@/domains/token";

/**
 * 出力し得る CSS プロパティ名。
 * プリミティブの語彙が閉じている (docs/03) ため、そこから出力されるプロパティも
 * 閉じた集合として型で表し、任意の文字列を宣言にできないようにする。
 * typography 由来のプロパティはトークン側の対応表から取り込み二重管理しない。
 */
export type CssProperty =
  | "display"
  | "flex-direction"
  | "flex-grow"
  | "align-self"
  | "align-items"
  | "justify-content"
  | "gap"
  | "padding"
  | "width"
  | "height"
  | "background"
  | "border-radius"
  | "box-shadow"
  | "overflow"
  | "color"
  | "text-align"
  | TypographyCssProperty;

/** CSS カスタムプロパティ名。 */
export type CssVariableName = `--${string}`;

/** 宣言の左辺に書けるもの。プロパティか、カスタムプロパティの定義。 */
export type CssDeclarationName = CssProperty | CssVariableName;

/**
 * 1トークンが1つのカスタムプロパティで表せる種別。
 * typography だけは複数の CSS プロパティへ展開されるため単一の参照を持てず、除外する。
 * (ドメイン上の scalar / 複合の区別ではなく CSS への出力単位による区別)
 */
export type SingleVariableTokenKind = Exclude<TokenKind, "typography">;

/**
 * トークン参照を CSS の値へ変換する手段。
 * カスタムプロパティ名の綴り方は CSS 出力層 (services) の知識なので、
 * ドメインはこの形で受け取り、規則そのものは持たない。
 */
export type TokenRefs = Readonly<{
  ref(kind: SingleVariableTokenKind, name: string): string;
  typographyRef(name: string, property: TypographyCssProperty): string;
}>;

/** CSS の1宣言。プロパティ名と値は対で意味を持つため1つの型にまとめる。 */
export type CssDeclaration = Readonly<{
  property: CssDeclarationName;
  value: string;
}>;

/**
 * 1 宣言を `プロパティ:値` の 1 行にする。
 *
 * @param property CSS のプロパティ名
 * @param value そのプロパティに与える値
 * @returns `プロパティ:値` の 1 行
 */
function declarationText(property: string, value: string): string {
  return `${property}:${value}`;
}

export const CssDeclaration = {
  create(property: CssDeclarationName, value: string): CssDeclaration {
    return { property, value };
  },

  /** style 属性へ載せる形の1宣言。 */
  text(declaration: CssDeclaration): string {
    return declarationText(declaration.property, declaration.value);
  },
} as const;

/**
 * CSS プロパティ名 → 値の対応。style 属性へそのまま展開できる形で持つ。
 * 同じプロパティは1度しか現れないことと、宣言の順序を同時に表す。
 */
export type CssDeclarations = Readonly<Record<string, string>>;

export const CssDeclarations = {
  /** 宣言の並びをまとめる。同じプロパティが複数あるときは後の宣言が優先される。 */
  from(declarations: readonly CssDeclaration[]): CssDeclarations {
    return Object.fromEntries(
      declarations.map((declaration) => [
        declaration.property,
        declaration.value,
      ]),
    );
  },

  /** style 属性へ載せられる宣言の並びに直列化する。 */
  toStyleText(declarations: CssDeclarations): string {
    return Object.entries(declarations)
      .map(([property, value]) => declarationText(property, value))
      .join(";");
  },
} as const;
