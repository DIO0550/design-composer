import { type PropAssignment, Props, type PropValue } from "@/domains/node";
import type { TokenKind } from "@/domains/token";
import { TokenSet } from "@/domains/token";

export const PRIMITIVE_TYPES = ["Box", "Text"] as const;

/** 組み込みで用意されているノードの型（docs/02「プリミティブ」）。 */
export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number];

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

/** 1つの primitive の仕様。子を持てるかと、受け付ける props を宣言する。 */
export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

/**
 * Box の仕様（docs/02「プリミティブ」の表）。
 * `as const satisfies` で書くのは、`PrimitiveSchema` への適合を検査しつつ
 * prop 名・`tokenKind`・デフォルト値をリテラル型のまま残すため
 * （後段の型レベルの導出がこの情報に依存している）。
 */
export const BOX_SCHEMA = {
  allowsChildren: true,
  props: {
    direction: {
      domain: "enum",
      values: ["row", "column"],
      default: "column",
      group: "layout",
    },
    gap: { domain: "token", tokenKind: "spacing", group: "layout" },
    paddingX: { domain: "token", tokenKind: "spacing", group: "layout" },
    paddingY: { domain: "token", tokenKind: "spacing", group: "layout" },
    align: {
      domain: "enum",
      values: ["start", "center", "end", "stretch"],
      default: "stretch",
      group: "layout",
    },
    justify: {
      domain: "enum",
      values: ["start", "center", "end", "space-between"],
      default: "start",
      group: "layout",
    },
    widthMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    width: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { prop: "widthMode", equals: "fixed" },
    },
    heightMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    height: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { prop: "heightMode", equals: "fixed" },
    },
    background: { domain: "token", tokenKind: "colors", group: "appearance" },
    radius: { domain: "token", tokenKind: "radius", group: "appearance" },
    shadow: { domain: "token", tokenKind: "shadows", group: "appearance" },
    overflow: {
      domain: "enum",
      values: ["visible", "clip"],
      default: "visible",
      group: "appearance",
    },
  },
} as const satisfies PrimitiveSchema;

/** Text の仕様（docs/02 の表）。子は持たず、文言と見た目だけを持つ。 */
export const TEXT_SCHEMA = {
  allowsChildren: false,
  props: {
    content: {
      domain: "literal",
      literalType: "string",
      default: "",
      group: "content",
    },
    typography: {
      domain: "token",
      tokenKind: "typography",
      default: "body",
      group: "appearance",
    },
    color: {
      domain: "token",
      tokenKind: "colors",
      default: "gray-900",
      group: "appearance",
    },
    align: {
      domain: "enum",
      values: ["left", "center", "right"],
      default: "left",
      group: "appearance",
    },
  },
} as const satisfies PrimitiveSchema;

/** primitive の型 → その仕様。型を取り違えた引き当てにならないよう対応で持つ。 */
export const PRIMITIVE_SCHEMAS = {
  Box: BOX_SCHEMA,
  Text: TEXT_SCHEMA,
} as const satisfies Readonly<Record<PrimitiveType, PrimitiveSchema>>;

/*
 * ここから下は「スキーマが宣言した事実」を型として取り出すための導出。
 * スキーマ（`BOX_SCHEMA` / `TEXT_SCHEMA`）を `as const satisfies` で書いているため
 * prop 名も `domain` も `tokenKind` もリテラル型として残っており、
 * 対応表を別に書き写さずに型レベルで走査できる。
 */

/**
 * ある primitive のスキーマが宣言している props。
 * `PropDefinitionRecord`（`Record<string, PropDefinition>`）へ広げると
 * prop 名も `tokenKind` もリテラル型が失われるため、スキーマの実体から直接引く。
 */
type SchemaPropsOf<T extends PrimitiveType> =
  (typeof PRIMITIVE_SCHEMAS)[T]["props"];

/**
 * ある primitive のうち `domain: "token"` と宣言された prop の名前。
 *
 * props の各キーを走査し、トークン参照でないものを `never` に潰してから
 * `[keyof ...]` で値側を union として取り出す（`never` は union から消える）。
 * 例: Box なら `"gap" | "paddingX" | "paddingY" | "background" | "radius" | "shadow"`。
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
const TOKEN_PROP_KINDS = Object.fromEntries(
  Object.values(PRIMITIVE_SCHEMAS).flatMap((schema: PrimitiveSchema) =>
    Object.entries(schema.props).flatMap(([name, definition]) =>
      PropDefinition.isToken(definition)
        ? [[name, definition.tokenKind] as const]
        : [],
    ),
  ),
) as TokenPropKinds;

export const PrimitiveSchema = {
  /**
   * その primitive のスキーマ。
   * 戻り値を `PrimitiveSchema` へ広げず型引数で受けるのは、
   * 呼び出し側が prop 名やデフォルト値をリテラル型のまま扱えるようにするため。
   */
  forType<T extends PrimitiveType>(type: T): (typeof PRIMITIVE_SCHEMAS)[T] {
    return PRIMITIVE_SCHEMAS[type];
  },

  /** その名前が primitive の型か（ファイル由来の未知の type を弾く境界）。 */
  isPrimitiveType(type: string): type is PrimitiveType {
    return (PRIMITIVE_TYPES as readonly string[]).includes(type);
  },

  /**
   * その type のノードが子を持てるか。
   * primitive でない type は子を持てない扱いにする（未知の type に子を挿せない）。
   */
  allowsChildren(type: string): boolean {
    return (
      PrimitiveSchema.isPrimitiveType(type) &&
      PRIMITIVE_SCHEMAS[type].allowsChildren
    );
  },

  /**
   * トークン参照 prop が引くトークン種別。
   * 出力側が「どの種別から引くか」を書き写さずに済むよう、スキーマの宣言を引かせる。
   */
  tokenKind<P extends TokenPropName>(prop: P): TokenPropKinds[P] {
    return TOKEN_PROP_KINDS[prop];
  },
} as const;
