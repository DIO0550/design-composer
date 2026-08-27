import type { ValueOf } from "@/types/ValueOf";
import { CaseStyle } from "@/utils/CaseStyle";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { ColorToken } from "./color";
import { ShadowToken } from "./shadow";
import { TypographyToken } from "./typography";

export { ColorToken, Rgb } from "./color";
export {
  type BoxShadowValue,
  type ShadowField,
  ShadowFieldEdit,
  type ShadowNumberField,
  ShadowToken,
} from "./shadow";
export {
  type TypographyCssProperty,
  TypographyField,
  TypographyFieldEdit,
  TypographyFieldRef,
  TypographyToken,
} from "./typography";

/** 余白の大きさ。単位は px（docs/04-tokens.md「値の形式」）。 */
export type SpacingToken = number;
/** 角丸の半径。単位は px。 */
export type RadiusToken = number;

/** ドキュメントが持つトークン一式。種別ごとに名前で引ける。 */
export type TokenSet = Readonly<{
  colors: Readonly<Record<string, ColorToken>>;
  spacing: Readonly<Record<string, SpacingToken>>;
  radius: Readonly<Record<string, RadiusToken>>;
  shadows: Readonly<Record<string, ShadowToken>>;
  typography: Readonly<Record<string, TypographyToken>>;
}>;

/**
 * 種別を名前で指すための対応表。`TokenKind` はここから導出し、種別を二重管理しない。
 * union と対で export するのは規約(rules/coding.md「値の集合から union を導出する」)。
 *
 * `satisfies` が見るのは**キーの過不足と綴り**だけで、キーに割り当てた値がずれても
 * ここでは落ちない。**値の網羅**は `__tests__/token.type.test.ts` の型テスト
 * (`TokenKind` == `keyof TokenSet`)で担保する。
 *
 * 並びが要るときは `TokenSet.kinds()` を使う(このファイルの中も含む)。
 * `Object.values` をそこ 1 箇所に閉じ、並びを引く経路を 2 通りにしない。
 */
export const TokenKinds = {
  Colors: "colors",
  Spacing: "spacing",
  Radius: "radius",
  Shadows: "shadows",
  Typography: "typography",
} as const satisfies Readonly<
  Record<Capitalize<keyof TokenSet>, keyof TokenSet>
>;

/** トークンの種別。 */
export type TokenKind = ValueOf<typeof TokenKinds>;

/**
 * 種別ごとの値の形式(docs/04-tokens.md「値の形式」)。
 * `TokenSet` が持つ入れ物から引くことで、種別と値の対応を二重管理しない。
 */
type TokenValueOf = { [K in TokenKind]: TokenSet[K][string] };

/**
 * 値がそのまま数値になる種別(docs/04-tokens.md「値の形式」の spacing / radius)。
 * 種別を書き並べず値の形から導出するのは、種別と値の対応を二重管理しないため。
 */
export type NumericTokenKind = {
  [K in TokenKind]: TokenValueOf[K] extends number ? K : never;
}[TokenKind];

/**
 * トークンの値(docs/04-tokens.md「値の形式」)。
 * 種別で判別する直和にして「spacing に hex 文字列」のような
 * 種別と値の食い違いを表現できなくする。
 */
export type TokenValue = {
  [K in TokenKind]: Readonly<{ kind: K; value: TokenValueOf[K] }>;
}[TokenKind];

/** トークン1件。値に、種別の中で一意な名前が付いたもの。 */
export type Token = {
  [K in TokenKind]: Readonly<{ kind: K; name: string; value: TokenValueOf[K] }>;
}[TokenKind];

/**
 * トークン1件を指す。
 * 名前の一意性は種別の中でしか保証されない(docs/04-tokens.md「命名規則」)ので、
 * 種別と名前は常に対でしか意味を持たない。
 */
export type TokenRef = Readonly<{ kind: TokenKind; name: string }>;

/** トークンの追加・改名・変更・削除が失敗する理由。 */
export type TokenEditError =
  | Readonly<{ kind: "invalid-token-name"; ref: TokenRef }>
  | Readonly<{ kind: "duplicate-token-name"; ref: TokenRef }>
  | Readonly<{ kind: "token-not-found"; ref: TokenRef }>;

export const TokenEditError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   */
  message(error: TokenEditError): string {
    const { kind, name } = error.ref;
    switch (error.kind) {
      case "invalid-token-name":
        return `token name "${name}" in ${kind} is not a valid identifier`;
      case "duplicate-token-name":
        return `token name "${name}" is already used in ${kind}`;
      case "token-not-found":
        return `token "${name}" not found in ${kind}`;
    }
  },
} as const;

export const TokenValue = {
  /** 値に名前を付けてトークンにする。 */
  toToken(value: TokenValue, name: string): Token {
    return { ...value, name };
  },

  /**
   * 数値の種別（spacing / radius）の値を作る。
   *
   * どちらも px の長さなので負にはならない（docs/04-tokens.md「値の形式」）。
   * typography / shadows のように値域付きの型で閉じられないのは、この 2 種別では
   * 編集で渡る型が保存される値そのもの（`TokenValue`）だから。`value` を
   * ブランド型にしても `TokenSet` が持つ入れ物は `number` のままなので、
   * 型では弾けずこの入口の `Option` だけが境界になる。
   *
   * @param kind 書き込み先の種別
   * @param value 入力欄から数値として読めた値
   * @returns 有限で 0 以上のときだけ some
   */
  createNumeric(kind: NumericTokenKind, value: number): Option<TokenValue> {
    return NumberEx.isFiniteNonNegative(value)
      ? Option.some({ kind, value })
      : Option.none;
  },
} as const;

export const Token = {
  /** そのトークンを指す参照。 */
  ref(token: Token): TokenRef {
    return { kind: token.kind, name: token.name };
  },

  /**
   * 値を正規形へ倒す(docs/04-tokens.md「値の形式」)。
   * 保存形式の規則なので、入力 UI ではなく値を受け取る側で通す。
   *
   * 影も通すのは、影が中に生 hex を持つため(docs/04-tokens.md「shadows」)。
   * 色の種別だけを通すと、影の中の hex が大文字のまま保存される。
   */
  normalized(token: Token): Token {
    switch (token.kind) {
      case "colors":
        return { ...token, value: ColorToken.normalize(token.value) };
      case "shadows":
        return { ...token, value: ShadowToken.normalized(token.value) };
      case "spacing":
      case "radius":
      case "typography":
        return token;
    }
  },
} as const;

/**
 * 種別ごとに値の型が違うので、書き込み先の種別で分岐する。
 *
 * @param tokens 書き込み先のトークン一式
 * @param token 書き込むトークン（同名があれば上書きになる）
 * @returns そのトークンを含む新しいトークン一式
 */
function withToken(tokens: TokenSet, token: Token): TokenSet {
  switch (token.kind) {
    case "colors":
      return {
        ...tokens,
        colors: { ...tokens.colors, [token.name]: token.value },
      };
    case "spacing":
      return {
        ...tokens,
        spacing: { ...tokens.spacing, [token.name]: token.value },
      };
    case "radius":
      return {
        ...tokens,
        radius: { ...tokens.radius, [token.name]: token.value },
      };
    case "shadows":
      return {
        ...tokens,
        shadows: { ...tokens.shadows, [token.name]: token.value },
      };
    case "typography":
      return {
        ...tokens,
        typography: { ...tokens.typography, [token.name]: token.value },
      };
  }
}

/**
 * そのキーだけを取り除いた新しい入れ物。
 *
 * @param record 取り除く元の入れ物
 * @param name 取り除くキー
 * @returns そのキーを持たない新しい入れ物
 */
function withoutName<T>(
  record: Readonly<Record<string, T>>,
  name: string,
): Readonly<Record<string, T>> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== name),
  );
}

/**
 * 位置を保ったままキーを付け替える(改名で並びが動くと一覧の行が飛ぶ)。
 *
 * @param record 付け替える元の入れ物
 * @param from 付け替え前のキー
 * @param to 付け替え後のキー
 * @returns キーだけが入れ替わり、並びは元のままの新しい入れ物
 */
function withRenamedKey<T>(
  record: Readonly<Record<string, T>>,
  from: string,
  to: string,
): Readonly<Record<string, T>> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) =>
      key === from ? [to, value] : [key, value],
    ),
  );
}

/**
 * 指す 1 つを取り除いたトークン一式。種別ごとの入れ物へ振り分ける。
 *
 * @param tokens 取り除く元のトークン一式
 * @param ref 取り除くトークンの種別と名前
 * @returns そのトークンを持たない新しいトークン一式
 */
function withoutToken(tokens: TokenSet, ref: TokenRef): TokenSet {
  switch (ref.kind) {
    case "colors":
      return { ...tokens, colors: withoutName(tokens.colors, ref.name) };
    case "spacing":
      return { ...tokens, spacing: withoutName(tokens.spacing, ref.name) };
    case "radius":
      return { ...tokens, radius: withoutName(tokens.radius, ref.name) };
    case "shadows":
      return { ...tokens, shadows: withoutName(tokens.shadows, ref.name) };
    case "typography":
      return {
        ...tokens,
        typography: withoutName(tokens.typography, ref.name),
      };
  }
}

/**
 * 指す 1 つの名前を付け替えたトークン一式。並びは保たれる。
 *
 * @param tokens 付け替える元のトークン一式
 * @param ref 付け替えるトークンの種別と、付け替え前の名前
 * @param newName 付け替え後の名前
 * @returns 名前だけが入れ替わった新しいトークン一式
 */
function withRenamedToken(
  tokens: TokenSet,
  ref: TokenRef,
  newName: string,
): TokenSet {
  switch (ref.kind) {
    case "colors":
      return {
        ...tokens,
        colors: withRenamedKey(tokens.colors, ref.name, newName),
      };
    case "spacing":
      return {
        ...tokens,
        spacing: withRenamedKey(tokens.spacing, ref.name, newName),
      };
    case "radius":
      return {
        ...tokens,
        radius: withRenamedKey(tokens.radius, ref.name, newName),
      };
    case "shadows":
      return {
        ...tokens,
        shadows: withRenamedKey(tokens.shadows, ref.name, newName),
      };
    case "typography":
      return {
        ...tokens,
        typography: withRenamedKey(tokens.typography, ref.name, newName),
      };
  }
}

/**
 * 種別ごとに値の型が違うので、読み出し元の種別で分岐する。
 *
 * @param tokens 読み出し元のトークン一式
 * @param kind 読み出す種別
 * @returns その種別のトークンを、入れ物の並び順で並べたもの
 */
function tokensOfKind(tokens: TokenSet, kind: TokenKind): readonly Token[] {
  switch (kind) {
    case "colors":
      return Object.entries(tokens.colors).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
    case "spacing":
      return Object.entries(tokens.spacing).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
    case "radius":
      return Object.entries(tokens.radius).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
    case "shadows":
      return Object.entries(tokens.shadows).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
    case "typography":
      return Object.entries(tokens.typography).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
  }
}

/**
 * 書き込み先の名前が使えるかを確かめる。
 * 名前の規則は識別子と同じで、一意性は種別の中だけで見る
 * (docs/04-tokens.md「命名規則」)。
 *
 * @param tokens 一意性を見る対象のトークン一式
 * @param ref 書き込み先の種別と名前
 * @returns 使えるならその `ref`。ケバブケースでなければ `invalid-token-name`、
 *   同じ種別に同名があれば `duplicate-token-name`
 */
function checkWritableName(
  tokens: TokenSet,
  ref: TokenRef,
): Result<TokenRef, TokenEditError> {
  if (!CaseStyle.isKebabCase(ref.name)) {
    return Result.err({ kind: "invalid-token-name", ref });
  }
  if (TokenSet.has(tokens, ref.kind, ref.name)) {
    return Result.err({ kind: "duplicate-token-name", ref });
  }
  return Result.ok(ref);
}

/**
 * 種別ごとに値の書き出し方が違うので種別で分岐する。
 * 種別が増えたら、この分岐の漏れがコンパイルエラーになる。
 *
 * @param tokens 書き出し元のトークン一式
 * @param kind 書き出す種別
 * @returns その種別のトークンを名前順に並べた JSON オブジェクト
 */
function tokenKindToJson(tokens: TokenSet, kind: TokenKind): JsonObject {
  switch (kind) {
    case "colors":
      return Json.sortedMap(tokens.colors, ColorToken.toJson);
    case "spacing":
      return Json.sortedMap(tokens.spacing, (value) => value);
    case "radius":
      return Json.sortedMap(tokens.radius, (value) => value);
    case "shadows":
      return Json.sortedMap(tokens.shadows, ShadowToken.toJson);
    case "typography":
      return Json.sortedMap(tokens.typography, TypographyToken.toJson);
  }
}

/** トークン一式の生成・検索・編集（追加・改名・削除）と JSON 表現との相互変換。 */
export const TokenSet = {
  empty(): TokenSet {
    return { colors: {}, spacing: {}, radius: {}, shadows: {}, typography: {} };
  },

  has(tokens: TokenSet, kind: TokenKind, name: string): boolean {
    return name in tokens[kind];
  },

  kinds(): readonly TokenKind[] {
    return Object.values(TokenKinds);
  },

  names(tokens: TokenSet, kind: TokenKind): readonly string[] {
    return Object.keys(tokens[kind]);
  },

  /** その種別のトークンを、持っている定義順で返す。 */
  tokensOf(tokens: TokenSet, kind: TokenKind): readonly Token[] {
    return tokensOfKind(tokens, kind);
  },

  /**
   * 名前で色を引く。
   *
   * `find` と分けているのは、`find` の戻り値が種別ごとの直和（`Token`）で、
   * 色を取り出すには呼び出し側で種別を絞り直すことになるため。引く種別が
   * 決まっている呼び出しに、取られることのない分岐を書かせない。
   *
   * @param tokens 引き先のトークン一式
   * @param name 引きたい色の名前
   * @returns その名前の色。`colors` にその名前が無ければ `none`
   */
  findColor(tokens: TokenSet, name: string): Option<ColorToken> {
    return Option.fromNullable(tokens.colors[name]);
  },

  /**
   * 名前で数値のトークンを引く。
   *
   * `findColor` と同じ理由で `find` と分けている。引く種別が決まっている呼び出しに、
   * `Token` の直和を絞り直す分岐を書かせない。
   *
   * @param tokens 引き先のトークン一式
   * @param kind 引きたい種別
   * @param name 引きたいトークンの名前
   * @returns そのトークンの数値。その種別にその名前が無ければ `none`
   */
  findNumber(
    tokens: TokenSet,
    kind: NumericTokenKind,
    name: string,
  ): Option<number> {
    return Option.fromNullable(tokens[kind][name]);
  },

  /** 参照でトークンを引く。その種別にその名前が無ければ `none`。 */
  find(tokens: TokenSet, ref: TokenRef): Option<Token> {
    return Option.fromNullable(
      tokensOfKind(tokens, ref.kind).find((token) => token.name === ref.name),
    );
  },

  /**
   * トークンを追加する(docs/06-ui.md「編集操作の一覧」の tokens 編集)。
   * 生成した時点で名前の規則と種別内の一意性を満たしていることを成立させるため、
   * 検証は呼び出し側ではなくここで行う。
   */
  add(tokens: TokenSet, token: Token): Result<TokenSet, TokenEditError> {
    return Result.map(checkWritableName(tokens, Token.ref(token)), () =>
      withToken(tokens, Token.normalized(token)),
    );
  },

  /**
   * 既にあるトークンの値を差し替える。
   * 名前を変えないので新しい名前の検証は要らず、対象が無いことだけが失敗しうる。
   */
  replace(tokens: TokenSet, token: Token): Result<TokenSet, TokenEditError> {
    const ref = Token.ref(token);
    if (!TokenSet.find(tokens, ref).some) {
      return Result.err({ kind: "token-not-found", ref });
    }
    return Result.ok(withToken(tokens, Token.normalized(token)));
  },

  /**
   * トークンの名前を変える。値と並びの位置は保つ。
   *
   * 名前を変えると、その名前を指していた prop は宙に浮く。ここで参照を追随させないのは、
   * 参照の解決はドキュメント全体の検証が持つ関心事であり、宙に浮いた参照は
   * dangling 参照として通常のバリデーションエラーになるため(docs/04-tokens.md
   * 「スキーマデフォルトとの関係」が削除について定めているのと同じ扱い)。
   */
  rename(
    tokens: TokenSet,
    ref: TokenRef,
    newName: string,
  ): Result<TokenSet, TokenEditError> {
    if (!TokenSet.find(tokens, ref).some) {
      return Result.err({ kind: "token-not-found", ref });
    }
    if (newName === ref.name) {
      return Result.ok(tokens);
    }
    return Result.map(
      checkWritableName(tokens, { kind: ref.kind, name: newName }),
      () => withRenamedToken(tokens, ref, newName),
    );
  },

  /**
   * トークンを削除する。
   * 使用中かどうかは見ない。使用中トークンの削除を特別扱いせず、
   * 残った参照を dangling 参照として検証で拾うのが仕様(docs/04-tokens.md)。
   */
  remove(tokens: TokenSet, ref: TokenRef): Result<TokenSet, TokenEditError> {
    if (!TokenSet.find(tokens, ref).some) {
      return Result.err({ kind: "token-not-found", ref });
    }
    return Result.ok(withoutToken(tokens, ref));
  },

  /**
   * 種別ごとの値の形式は docs/04-tokens.md「値の形式」に従う。
   * 書かれていない種別は空として読む(トークンを1つも持たない種別は書かれないため)。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<TokenSet> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine5(
          Json.optionalMap(record, "colors", ColorToken.fromJson),
          Json.optionalMap(record, "spacing", Json.number),
          Json.optionalMap(record, "radius", Json.number),
          Json.optionalMap(record, "shadows", ShadowToken.fromJson),
          Json.optionalMap(record, "typography", TypographyToken.fromJson),
          (colors, spacing, radius, shadows, typography) => ({
            colors,
            spacing,
            radius,
            shadows,
            typography,
          }),
        ),
        record,
        TokenSet.kinds(),
      ),
    );
  },

  /** トークンを1つも持たない種別は書き出さない(空の種別を残さない)。 */
  toJson(tokens: TokenSet): JsonObject {
    return Object.fromEntries(
      TokenSet.kinds()
        .filter((kind) => Object.keys(tokens[kind]).length > 0)
        .map((kind) => [kind, tokenKindToJson(tokens, kind)]),
    );
  },
} as const;
