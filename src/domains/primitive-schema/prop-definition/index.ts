import { type PropAssignment, Props, type PropValue } from "@/domains/node";
import type { TokenKind, TokenRef } from "@/domains/token";
import { TokenSet } from "@/domains/token";

/**
 * その prop が編集可能になる条件。
 * 「別の prop が特定の値のときだけ意味を持つ」prop を表す
 * （`width` は `widthMode` が `fixed` のときだけ効く、など）。
 */
export type EnabledWhen = Readonly<{
  prop: string;
  equals: PropValue;
}>;

/** prop 定義のうち、値の決め方（`domain`）によらず共通の部分。 */
type PropDefinitionBase = Readonly<{
  default?: PropValue;
  group: string;
  enabledWhen?: EnabledWhen;
}>;

/** 決まった選択肢から選ぶ prop。取りうる値を `values` が列挙する。 */
export type EnumPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "enum";
    values: readonly string[];
  }>;

/**
 * トークンを名前で参照する prop。どの種別のトークンから引くかを `tokenKind` が持つ。
 * この宣言が種別の唯一の情報源で、検証も CSS 出力もここを見る。
 */
export type TokenPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "token";
    tokenKind: TokenKind;
  }>;

/** 生の値をそのまま持つ prop。受け付ける型を `literalType` が持つ。 */
export type LiteralPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "literal";
    literalType: "number" | "string";
  }>;

/**
 * prop 1つ分の定義。値の決め方ごとに持つフィールドが違うため直和で表す
 * （enum なのに `tokenKind` を持つ、といった状態を作れない）。
 */
export type PropDefinition =
  | EnumPropDefinition
  | TokenPropDefinition
  | LiteralPropDefinition;

/** prop 名 → 定義。primitive が受け付ける props 全体を表す。 */
export type PropDefinitionRecord = Readonly<Record<string, PropDefinition>>;

/** props がスキーマに適合しない理由。 */
export type PropValidationErrorKind =
  | "unknown-prop"
  | "enum-violation"
  | "literal-type-mismatch"
  | "dangling-token";

/** 適合しない prop 1件分の報告。どの prop かは `prop` が持つ。 */
export type PropValidationError = Readonly<{
  kind: PropValidationErrorKind;
  prop: string;
  message: string;
}>;

export const PropDefinition = {
  /** 値を列挙から選ぶ prop か。 */
  isEnum(definition: PropDefinition): definition is EnumPropDefinition {
    return definition.domain === "enum";
  },

  /** 値をトークン名で指す prop か。 */
  isToken(definition: PropDefinition): definition is TokenPropDefinition {
    return definition.domain === "token";
  },

  /** 値を生のリテラル（数値・文字列）で持つ prop か。 */
  isLiteral(definition: PropDefinition): definition is LiteralPropDefinition {
    return definition.domain === "literal";
  },

  /**
   * その prop 設定が、指したトークンを参照しているか。
   *
   * 種別まで見るのは、トークン名の一意性が種別の中だけで保証されるため
   * （docs/04-tokens.md「命名規則」）。`colors` と `spacing` に同名があってもよく、
   * 名前だけで一致を見ると別の種別の同名トークンを参照しているものまで拾う。
   *
   * トークンが実在するかは見ない（`collectErrors` の担当）。この判定が答えるのは
   * 「この設定はその参照を指しているか」だけなので、宙に浮いた参照にも同じ答えを返す。
   */
  isRefTo(
    definition: PropDefinition,
    assignment: PropAssignment,
    ref: TokenRef,
  ): boolean {
    const isSameKind =
      PropDefinition.isToken(definition) && definition.tokenKind === ref.kind;
    return isSameKind && assignment.value === ref.name;
  },

  /**
   * その prop が今の props の下で編集可能か（`enabledWhen` の条件を満たすか）。
   * 条件を持たない prop は常に編集可能。
   */
  isEnabled(
    definition: PropDefinition,
    props: Readonly<Record<string, PropValue>>,
  ): boolean {
    if (!definition.enabledWhen) {
      return true;
    }
    return props[definition.enabledWhen.prop] === definition.enabledWhen.equals;
  },

  /**
   * 1件の prop 設定がこの定義に適合しないときのエラーを集める。
   * 適合していれば空配列。何を見るかは `domain` ごとに違う
   * （enum は値が `values` に含まれるか、literal は型が一致するか、
   * token はその種別のトークンが存在するか）。
   */
  collectErrors(
    definition: PropDefinition,
    assignment: PropAssignment,
    tokens: TokenSet,
  ): readonly PropValidationError[] {
    const { name, value } = assignment;

    if (PropDefinition.isEnum(definition)) {
      if (typeof value === "string" && definition.values.includes(value)) {
        return [];
      }
      return [
        {
          kind: "enum-violation",
          prop: name,
          message: `prop "${name}" must be one of ${definition.values.join(", ")}`,
        },
      ];
    }

    if (PropDefinition.isLiteral(definition)) {
      if (typeof value === definition.literalType) {
        return [];
      }
      return [
        {
          kind: "literal-type-mismatch",
          prop: name,
          message: `prop "${name}" must be of type ${definition.literalType}`,
        },
      ];
    }

    if (
      typeof value === "string" &&
      TokenSet.has(tokens, definition.tokenKind, value)
    ) {
      return [];
    }
    return [
      {
        kind: "dangling-token",
        prop: name,
        message: `prop "${name}" references unknown ${definition.tokenKind} token "${String(value)}"`,
      },
    ];
  },
} as const;

export const PropDefinitionRecord = {
  /** スキーマが宣言している prop の名前。宣言順で返る。 */
  propNames(schema: PropDefinitionRecord): readonly string[] {
    return Object.keys(schema);
  },

  /**
   * 設定されている props のうち、指したトークンを参照しているものの prop 名。
   *
   * 見るのは設定されている props だけで、スキーマのデフォルトで解決される値は含まない。
   * 「どの prop がそのトークンを指しているか」に答えるものなので、指せる実体
   * （設定された prop）が無いものは答えに入らない（`collectErrors` が設定済み props
   * しか検証しないのと同じ範囲）。
   *
   * スキーマに宣言の無い prop も含まない（値の意味が決まらない。
   * `unknown-prop` として `collectErrors` が報告する）。
   */
  collectRefPropNames(
    schema: PropDefinitionRecord,
    props: Props,
    ref: TokenRef,
  ): readonly string[] {
    return Props.toAssignments(props).flatMap((assignment) => {
      const definition = schema[assignment.name];
      if (definition === undefined) {
        return [];
      }
      return PropDefinition.isRefTo(definition, assignment, ref)
        ? [assignment.name]
        : [];
    });
  },

  /**
   * 設定されている props をスキーマに照らしてエラーを集める。
   * 最初の1件で止めず全件返す（不正なファイルのエラー一覧を出せるようにするため）。
   * スキーマに宣言の無い prop は `unknown-prop` として報告する。
   */
  collectErrors(
    schema: PropDefinitionRecord,
    props: Props,
    tokens: TokenSet,
  ): readonly PropValidationError[] {
    return Props.toAssignments(props).flatMap((assignment) => {
      const definition = schema[assignment.name];
      if (definition === undefined) {
        return [
          {
            kind: "unknown-prop" as const,
            prop: assignment.name,
            message: `unknown prop "${assignment.name}"`,
          },
        ];
      }
      return PropDefinition.collectErrors(definition, assignment, tokens);
    });
  },
} as const;
