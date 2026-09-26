import {
  type PropAssignment,
  Props,
  type PropValue,
} from "@/domains/dcmp/node";
import type {
  PaintTokenKinds,
  TokenKind,
  TokenRef,
} from "@/domains/dcmp/token";
import { TokenSet } from "@/domains/dcmp/token";
import type { Corner } from "@/domains/unit/corner";
import type { Side } from "@/domains/unit/side";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";
import { RecordEx } from "@/utils/RecordEx";

/**
 * その prop が編集可能になる条件。「別の prop が特定の値のときだけ意味を持つ」prop を表
 * す（`width` は `widthMode` が `fixed` のときだけ効く、など）。
 */
export type EnabledWhen =
  | Readonly<{ kind: "equals"; prop: string; equals: PropValue }>
  | Readonly<{ kind: "notEquals"; prop: string; notEquals: PropValue }>;

/**
 * 4 つの longhand をまとめて指す名前（docs/03「Box」の prop 表の綴り。UI 案
 * docs/Design Composer.html の行ラベルも同じ）。CSS の shorthand 名とは揃っていない
 * （radius が出すのは `border-radius`）。
 *
 * 何で 4 つに割れるかは名前ごとに違う（padding は 4 辺、radius は 4 隅）。その対応は下の
 * `PropShorthand` が型で持つ。
 */
export const ShorthandNames = {
  Padding: "padding",
  Radius: "radius",
} as const;

/** shorthand の名前。 */
export type ShorthandName = ValueOf<typeof ShorthandNames>;

/**
 * その prop が、どの shorthand のどの位置にあたるか。
 *
 * 宣言するのは prop 自身の性質（`paddingTop` は padding の上辺の longhand である）で、
 * パネルがそれを畳んで見せているかどうかは持たない
 * （docs/03「畳み方は表示の都合なので持たない」）。
 *
 * 名前ごとに位置の語彙を分けているので、padding に隅を、radius に辺を宣言できない。
 * 素の `string` にすると 4 つのうち 1 つだけ綴りを間違えても型では落ちず、行が 2 つに割れて
 * 画面に出るまで気づけない。
 */
export type PropShorthand =
  | Readonly<{ name: typeof ShorthandNames.Padding; side: Side }>
  | Readonly<{ name: typeof ShorthandNames.Radius; corner: Corner }>;

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
 * トークン参照 prop が指せる種別の並び（docs/03「prop 定義のフィールド」）。2 つ持てるのは
 * 塗り用の 2 種別だけ（docs/03「塗り」）。
 *
 * 任意長の並びにしない。`[spacing, colors]` のような組を宣言できると、名前がどちらの種別を
 * 指すかを一意にする規則（docs/04「命名規則」）が塗りの組にしか無いので決まらなくなる。
 */
export type TokenKindList = readonly [TokenKind] | PaintTokenKinds;

/**
 * トークンを名前で参照する prop。どの種別のトークンから引けるかを `tokenKind` が持ち、この
 * 宣言が種別の唯一の情報源で検証も CSS 出力もここを見る。
 */
export type TokenPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "token";
    tokenKind: TokenKindList;
  }>;

/**
 * 生の数値をそのまま持つ prop。取りうる値が範囲で決まっているものは `range` で宣言する
 * （宣言しなければ範囲では弾かれない）。
 */
type NumberLiteralPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "literal";
    literalType: "number";
    range?: Range;
  }>;

/** 生の文字列をそのまま持つ prop。 */
type StringLiteralPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "literal";
    literalType: "string";
  }>;

/**
 * 生の値をそのまま持つ prop。受け付ける型を `literalType` が持つ。
 *
 * 数値と文字列で持てるフィールドが違うため直和で表す（文字列の prop に値域を宣言できる
 * 状態を作らない）。
 */
export type LiteralPropDefinition =
  | NumberLiteralPropDefinition
  | StringLiteralPropDefinition;

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
  | "range-violation"
  | "dangling-token";

/** 適合しない prop 1件分の報告。どの prop かは `prop` が持つ。 */
export type PropValidationError = Readonly<{
  kind: PropValidationErrorKind;
  prop: string;
  message: string;
}>;

/**
 * 型が定義と食い違う生リテラルの報告。
 *
 * @param name 報告する prop 名
 * @param literalType その prop が受け付ける型
 * @returns 型の食い違い 1 件
 */
function literalTypeMismatch(
  name: string,
  literalType: LiteralPropDefinition["literalType"],
): PropValidationError {
  return {
    kind: "literal-type-mismatch",
    prop: name,
    message: `prop "${name}" must be of type ${literalType}`,
  };
}

/**
 * 範囲を宣言した prop に、その外の値を設定しているときの報告。
 *
 * @param name 報告する prop 名
 * @param value その prop に設定されている数値
 * @param range その prop が取りうる範囲。宣言していない prop では `undefined`
 * @returns 範囲から外れているときだけ 1 件。範囲を宣言していない prop では空
 */
function collectRangeErrors(
  name: string,
  value: number,
  range: Range | undefined,
): readonly PropValidationError[] {
  if (range === undefined) {
    return [];
  }
  if (Range.contains(range, value)) {
    return [];
  }
  return [
    {
      kind: "range-violation",
      prop: name,
      message: `prop "${name}" must be between ${range.min} and ${range.max}`,
    },
  ];
}

/**
 * 1 件の生リテラルの prop 設定が定義に適合しないときのエラーを集める。
 *
 * @param definition 照らす先の prop 定義
 * @param assignment 照らす prop 設定
 * @returns 型が違えば型の食い違い、宣言した範囲を外れていれば範囲違反。適合していれば空
 */
function collectLiteralErrors(
  definition: LiteralPropDefinition,
  assignment: PropAssignment,
): readonly PropValidationError[] {
  const { name, value } = assignment;
  if (definition.literalType === "string") {
    return typeof value === "string"
      ? []
      : [literalTypeMismatch(name, definition.literalType)];
  }
  if (typeof value !== "number") {
    return [literalTypeMismatch(name, definition.literalType)];
  }
  return collectRangeErrors(name, value, definition.range);
}

/**
 * そのトークン参照 prop が指せる種別。
 *
 * `TokenKindList` は長さの違う組の和なので、そのままでは `includes` / `some` に種別を渡せ
 * ない。並びとして読むときはここを通す。
 *
 * @param definition 見るトークン参照 prop の定義
 * @returns `tokenKind` に宣言した種別の並び
 */
function referableKinds(definition: TokenPropDefinition): readonly TokenKind[] {
  return definition.tokenKind;
}

export const PropDefinition = {
  /**
   * 値を列挙から選ぶ prop か。
   *
   * @param definition 見る prop 定義
   * @returns `values` に列挙した選択肢から選ぶ prop なら `true`
   */
  isEnum(definition: PropDefinition): definition is EnumPropDefinition {
    return definition.domain === "enum";
  },

  /**
   * 値をトークン名で指す prop か。
   *
   * @param definition 見る prop 定義
   * @returns `tokenKind` のいずれかの種別のトークンを名前で指す prop なら `true`
   */
  isToken(definition: PropDefinition): definition is TokenPropDefinition {
    return definition.domain === "token";
  },

  /**
   * 値を生のリテラル（数値・文字列）で持つ prop か。
   *
   * @param definition 見る prop 定義
   * @returns 値をトークンにも選択肢にも照らさずそのまま持つ prop なら `true`
   */
  isLiteral(definition: PropDefinition): definition is LiteralPropDefinition {
    return definition.domain === "literal";
  },

  /**
   * その prop 設定が、指したトークンを参照しているか。
   *
   * 種別まで見るのは、トークン名の一意性が種別の中でしか保証されないため
   * （docs/04-tokens.md「命名規則」）。`colors` と `spacing` に同名があってもよく、
   * 名前だけで一致を見ると別の種別の同名トークンを参照しているものまで拾う。
   *
   * トークンが実在するかは見ない（`collectErrors` の担当）。この判定が答えるのは
   * 「この設定はその参照を指しているか」だけなので、宙に浮いた参照にも同じ答えを返す。
   * 塗り用の 2 種別に同名があるドキュメントでは、その名前を指す `background` は両方の
   * トークンを指していると答える。どちらを消しても残る参照を、参照元の一覧から隠さないため。
   *
   * @param definition `assignment` の prop の定義
   * @param assignment 見る prop 設定
   * @param ref 指しているかを知りたいトークン
   * @returns 定義がトークン参照 prop で、指せる種別に `ref` の種別が含まれ、値が `ref` の
   *   名前と一致すれば `true`。値が数値・真偽値なら、名前と同じ綴りでも `false`
   */
  isRefTo(
    definition: PropDefinition,
    assignment: PropAssignment,
    ref: TokenRef,
  ): boolean {
    return (
      PropDefinition.isToken(definition) &&
      referableKinds(definition).includes(ref.kind) &&
      assignment.value === ref.name
    );
  },

  /**
   * その prop が今の props の下で編集可能か（`enabledWhen` の条件を満たすか）。
   * 条件を持たない prop は常に編集可能。
   *
   * @param definition 見る prop の定義
   * @param props 条件が参照する prop を引く先の props
   * @returns 条件が無いか、条件を満たせば `true`。条件の prop が `props` に無いときは
   *   値が無いものとして比べる（`equals` なら `false`、`notEquals` なら `true`）
   */
  isEnabled(
    definition: PropDefinition,
    props: Readonly<Record<string, PropValue>>,
  ): boolean {
    const condition = definition.enabledWhen;
    if (!condition) {
      return true;
    }
    const actual = props[condition.prop];
    switch (condition.kind) {
      case "equals":
        return actual === condition.equals;
      case "notEquals":
        return actual !== condition.notEquals;
    }
  },

  /**
   * 1 件の prop 設定がこの定義に適合しないときのエラーを集める。適合していれば空配列。
   *
   * @param definition 照らす先の prop 定義。`assignment` の prop のもの
   * @param assignment 照らす prop 設定
   * @param tokens token の prop が指す名前を引く先のトークン一式
   * @returns 適合しない理由の並び（多くて 1 件）。`enum-violation` は値が文字列でないか
   *   `values` に無いとき。`literal-type-mismatch` / `range-violation` は literal の型が
   *   違うときと、数値が宣言した範囲の外にあるとき。`dangling-token` は値が文字列でない
   *   か、その名前のトークンが `tokenKind` のどの種別にも無いとき（判定は `TokenSet.has`）
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
      return collectLiteralErrors(definition, assignment);
    }

    const kinds = referableKinds(definition);
    const isResolved =
      typeof value === "string" &&
      kinds.some((kind) => TokenSet.has(tokens, kind, value));
    if (isResolved) {
      return [];
    }
    return [
      {
        kind: "dangling-token",
        prop: name,
        message: `prop "${name}" references unknown ${kinds.join(" or ")} token "${String(value)}"`,
      },
    ];
  },
} as const;

export const PropDefinitionRecord = {
  /**
   * スキーマが宣言している prop の名前。
   *
   * @param schema 名前を取り出す prop 定義
   * @returns prop 名の並び。並びはスキーマの宣言順
   */
  propNames(schema: PropDefinitionRecord): readonly string[] {
    return Object.keys(schema);
  },

  /**
   * 設定されていない prop に効くデフォルト。並びはスキーマの宣言順。
   *
   * 「未設定ならどの値が効くか」はスキーマ自身の性質なので、解決を要する側がそれぞれ走査
   * を持たずここを呼ぶ（`collectEffectiveAssignments` と `ResolvedProps.resolve`。
   * `session/prop-control` は既定の出どころが binding にもまたがるので寄せていない）。
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
   * その props の下で実際に効いている prop 設定の並び。明示設定に、未設定の prop のデフ
   * ォルトを足したもの。
   *
   * この並びが `collectRefPropNames` と `collectErrors` の共通の走査対象で、片方だけがデフォ
   * ルトを見る状態に戻ると、参照 0 件のトークンを消して dangling が出る食い違いが表に出る。
   *
   * `session/prop-control` の `effectiveProps` とも範囲が違う（binding 由来の既定も含む）。
   *
   * @param schema 効いている値の出どころになる prop 定義
   * @param props 実際に設定されている props
   * @returns 明示設定（props の並び順）を先に、デフォルトで補われた prop （ス
   *   キーマの宣言順）を後に並べた prop 設定の並び
   */
  collectEffectiveAssignments(
    schema: PropDefinitionRecord,
    props: Props,
  ): readonly PropAssignment[] {
    const assigned = Props.toAssignments(props);
    const defaulted = PropDefinitionRecord.collectDefaultsIfAbsent(
      schema,
      props,
    );
    return [...assigned, ...defaulted];
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
    return PropDefinitionRecord.collectEffectiveAssignments(
      schema,
      props,
    ).flatMap((assignment) => {
      const definition = RecordEx.get(schema, assignment.name);
      if (!Option.isSome(definition)) {
        return [];
      }
      return PropDefinition.isRefTo(definition.value, assignment, ref)
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
    return PropDefinitionRecord.collectEffectiveAssignments(
      schema,
      props,
    ).flatMap((assignment) => {
      const definition = RecordEx.get(schema, assignment.name);
      if (!Option.isSome(definition)) {
        return [
          {
            kind: "unknown-prop" as const,
            prop: assignment.name,
            message: `unknown prop "${assignment.name}"`,
          },
        ];
      }
      return PropDefinition.collectErrors(definition.value, assignment, tokens);
    });
  },
} as const;
