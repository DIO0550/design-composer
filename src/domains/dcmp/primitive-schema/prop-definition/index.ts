import {
  type PropAssignment,
  Props,
  type PropValue,
} from "@/domains/dcmp/node";
import type { TokenKind, TokenRef } from "@/domains/dcmp/token";
import { TokenSet } from "@/domains/dcmp/token";
import type { Side } from "@/domains/unit/side";
import type { ValueOf } from "@/types/ValueOf";

/**
 * その prop が編集可能になる条件。
 * 「別の prop が特定の値のときだけ意味を持つ」prop を表す
 * （`width` は `widthMode` が `fixed` のときだけ効く、など）。
 */
export type EnabledWhen = Readonly<{
  prop: string;
  equals: PropValue;
}>;

/** 4 辺の longhand をまとめて指す名前（CSS の shorthand と同じ語）。 */
export const ShorthandNames = {
  Padding: "padding",
} as const;

/** shorthand の名前。 */
export type ShorthandName = ValueOf<typeof ShorthandNames>;

/**
 * その prop が、どの shorthand のどの辺にあたるか。
 *
 * 宣言するのは prop 自身の性質（`paddingTop` は padding の上辺の longhand である）で、
 * パネルがそれを畳んで見せているかどうかは持たない
 * （docs/03「畳み方は表示の都合なので持たない」）。
 *
 * 名前を素の `string` にしないのは、4 辺のうち 1 つだけ綴りを間違えても型では落ちず、
 * 行が 2 つに割れて画面に出るまで気づけないため。
 */
export type PropShorthand = Readonly<{
  name: ShorthandName;
  side: Side;
}>;

/** prop 定義のうち、値の決め方（`domain`）によらず共通の部分。 */
type PropDefinitionBase = Readonly<{
  default?: PropValue;
  group: string;
  enabledWhen?: EnabledWhen;
  shorthand?: PropShorthand;
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

/**
 * 実際に効いている prop 設定の並び。明示設定に、未設定の prop のデフォルトを足したもの。
 * この並びが `collectRefPropNames` と `collectErrors` の共通の走査対象で、並びを決めるのもここ。
 *
 * Why: 片方だけがデフォルトを見ると、参照が 0 件のトークンを消して dangling が出る、という
 * 食い違いが利用者に見える。
 * Why not: `ResolvedProps.resolve` は使えない。あちらは宣言済みの prop だけに絞ったレコードを
 * 返すが、ここは `unknown-prop` を報告するために未宣言の prop も残す必要がある。
 *
 * `session/prop-control` の `effectiveProps` とは範囲が違う（あちらは binding 由来の既定も含む）。
 *
 * @param schema 効いている値の出どころになる prop 定義
 * @param props 実際に設定されている props
 * @returns 明示設定（props の並び順）を先に、デフォルトで補われた prop
 *   （スキーマの宣言順）を後に並べた prop 設定の並び
 */
function collectEffectiveAssignments(
  schema: PropDefinitionRecord,
  props: Props,
): readonly PropAssignment[] {
  const assigned = Props.toAssignments(props);
  const defaulted = PropDefinitionRecord.collectDefaultsIfAbsent(schema, props);
  return [...assigned, ...defaulted];
}

export const PropDefinitionRecord = {
  /** スキーマが宣言している prop の名前。宣言順で返る。 */
  propNames(schema: PropDefinitionRecord): readonly string[] {
    return Object.keys(schema);
  },

  /**
   * 設定されていない prop に効くデフォルト。並びはスキーマの宣言順。
   *
   * 「未設定ならどの値が効くか」はスキーマ自身の性質なので、デフォルト解決を要する側
   * がそれぞれ走査を持たずここを呼ぶ（今の呼び出しは `collectEffectiveAssignments` と
   * `ResolvedProps.resolve`。`session/prop-control` は既定の出どころが binding にも
   * またがるので寄せていない）。
   *
   * @param schema 補いの出どころになる prop 定義
   * @param props 実際に設定されている props
   * @returns 未設定でデフォルトを持つ prop の、prop 名とデフォルト値の対の並び
   */
  collectDefaultsIfAbsent(
    schema: PropDefinitionRecord,
    props: Props,
  ): readonly PropAssignment[] {
    return Object.entries(schema).flatMap(
      ([name, definition]): readonly PropAssignment[] => {
        const isAbsentWithDefault =
          !(name in props) && definition.default !== undefined;
        return isAbsentWithDefault ? [{ name, value: definition.default }] : [];
      },
    );
  },

  /**
   * 実際に効いている props のうち、指したトークンを参照しているものの prop 名。
   * 未設定でデフォルトが効いている prop も数える（`typography` を書いていない Text も
   * `body` を引く）。
   *
   * スキーマに宣言の無い prop は含まない（値の意味が決まらない。
   * `unknown-prop` として `collectErrors` が報告する）。
   *
   * @param schema 参照しているかを照らす先の prop 定義
   * @param props 実際に設定されている props
   * @param ref 参照されているかを知りたいトークン
   * @returns そのトークンを指している prop 名の並び。並びは
   *   `collectEffectiveAssignments` に従う（明示設定 → デフォルト）。
   *   参照元の一覧は先頭から順に見せるので、並びは表示に出る
   */
  collectRefPropNames(
    schema: PropDefinitionRecord,
    props: Props,
    ref: TokenRef,
  ): readonly string[] {
    return collectEffectiveAssignments(schema, props).flatMap((assignment) => {
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
   * デフォルト解決後の props をスキーマに照らしてエラーを集める。
   * 最初の1件で止めず全件返す（不正なファイルのエラー一覧を出せるようにするため）。
   *
   * 未設定でデフォルトを持つ prop も照らすのは、その prop が実際に効いているため
   * （docs/04-tokens.md「スキーマデフォルトとの関係」: デフォルトが指すトークンを
   * 削除したら dangling 参照として検出される・特別扱いしない）。
   *
   * @param schema 照らす先の prop 定義
   * @param props 実際に設定されている props
   * @param tokens トークン参照の解決に使うトークン一式
   * @returns 1 ノード分のエラーの並び。並びは `collectEffectiveAssignments` に従う
   *   （明示設定 → デフォルト）。
   *   スキーマに宣言の無い prop は `unknown-prop` として報告する
   */
  collectErrors(
    schema: PropDefinitionRecord,
    props: Props,
    tokens: TokenSet,
  ): readonly PropValidationError[] {
    return collectEffectiveAssignments(schema, props).flatMap((assignment) => {
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
