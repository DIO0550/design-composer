/** CSS の1宣言。プロパティ名と値は対で意味を持つため1つの型にまとめる。 */
export type CssDeclaration = Readonly<{
  property: string;
  value: string;
}>;

export const CssDeclaration = {
  create(property: string, value: string): CssDeclaration {
    return { property, value };
  },

  /** style 属性へ載せる形の1宣言。 */
  text(declaration: CssDeclaration): string {
    return `${declaration.property}:${declaration.value}`;
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

  entries(declarations: CssDeclarations): readonly CssDeclaration[] {
    return Object.entries(declarations).map(([property, value]) =>
      CssDeclaration.create(property, value),
    );
  },

  /** style 属性へ載せられる宣言の並びに直列化する。 */
  toStyleText(declarations: CssDeclarations): string {
    return CssDeclarations.entries(declarations)
      .map(CssDeclaration.text)
      .join(";");
  },
} as const;
