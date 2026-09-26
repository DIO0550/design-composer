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
import { RecordEx } from "@/utils/RecordEx";
import { Result } from "@/utils/Result";
import { ColorToken } from "./color";
import { GradientToken } from "./gradient";
import { ShadowToken } from "./shadow";
import { TypographyToken } from "./typography";

export { ColorToken, Rgb } from "./color";
export { GradientToken } from "./gradient";
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
  gradients: Readonly<Record<string, GradientToken>>;
}>;

/**
 * 種別を名前で指すための対応表。`TokenKind` はここから導出し、種別を二重管理しない。
 *
 * union と対で export するのは規約(rules/coding.md「値の集合から union を導出する」)。
 *
 * `satisfies` が見るのは**キーの過不足と綴り**だけで、値がずれてもここでは落ちない。並びが
 * 要るときは `TokenSet.kinds` を使い、`Object.values` をそこ 1 箇所に閉じる。
 */
export const TokenKinds = {
  Colors: "colors",
  Spacing: "spacing",
  Radius: "radius",
  Shadows: "shadows",
  Typography: "typography",
  Gradients: "gradients",
} as const satisfies Readonly<
  Record<Capitalize<keyof TokenSet>, keyof TokenSet>
>;

/** トークンの種別。 */
export type TokenKind = ValueOf<typeof TokenKinds>;

/**
 * 塗り用の 2 種別（docs/04-tokens.md「命名規則」の例外）。`background` がどちらも指せるの
 * で、この 2 種別の間では名前の一意性を種別をまたいで見る。
 */
export const PaintTokenKinds = [
  TokenKinds.Colors,
  TokenKinds.Gradients,
] as const;

/** 塗り用の 2 種別の並び。 */
export type PaintTokenKinds = typeof PaintTokenKinds;

/**
 * 種別ごとの値の形式(docs/04-tokens.md「値の形式」)。
 * `TokenSet` が持つ入れ物から引くことで、種別と値の対応を二重管理しない。
 */
type TokenValueOf = { [K in TokenKind]: TokenSet[K][string] };

/**
 * 値がそのまま数値になる種別(docs/04-tokens.md「値の形式」の spacing / radius)。
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

/** トークン1件。値に名前が付いたもの。名前が一意になる範囲は `TokenRef` が持つ。 */
export type Token = {
  [K in TokenKind]: Readonly<{ kind: K; name: string; value: TokenValueOf[K] }>;
}[TokenKind];

/**
 * トークン1件を指す。
 * 名前の一意性は種別の中でしか保証されない(docs/04-tokens.md「命名規則」。塗り用の 2 種別
 * だけは互いの間でも一意)ので、種別と名前は常に対でしか意味を持たない。
 */
export type TokenRef = Readonly<{ kind: TokenKind; name: string }>;

/** トークンの追加・改名・変更・削除が失敗する理由。 */
export type TokenEditError =
  | Readonly<{ kind: "invalid-token-name"; ref: TokenRef }>
  | Readonly<{ kind: "duplicate-token-name"; ref: TokenRef }>
  | Readonly<{
      kind: "conflicting-token-name";
      ref: TokenRef;
      conflictsWith: TokenKind;
    }>
  | Readonly<{ kind: "token-not-found"; ref: TokenRef }>;

export const TokenEditError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   *
   * @param error 失敗の理由
   * @returns 失敗の理由と、対象のトークンの種別・名前を入れた 1 文
   */
  message(error: TokenEditError): string {
    const { kind, name } = error.ref;
    switch (error.kind) {
      case "invalid-token-name":
        return `token name "${name}" in ${kind} is not a valid identifier`;
      case "duplicate-token-name":
        return `token name "${name}" is already used in ${kind}`;
      case "conflicting-token-name":
        return `token name "${name}" in ${kind} is already used in ${error.conflictsWith}`;
      case "token-not-found":
        return `token "${name}" not found in ${kind}`;
    }
  },
} as const;

export const TokenValue = {
  /**
   * 数値の種別（spacing / radius）の値を作る。
   *
   * どちらも px の長さなので負にはならない（docs/04-tokens.md「値の形式」）。
   *
   * `value` をブランド型にしても `TokenSet` が持つ入れ物は `number` のままなので、型では
   * 弾けずこの入口の `Option` だけが境界になる。
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
  /**
   * そのトークンを指す参照。
   *
   * @param token 指したいトークン
   * @returns そのトークンの種別と名前
   */
  ref(token: Token): TokenRef {
    return { kind: token.kind, name: token.name };
  },

  /**
   * 名前を保ったまま値を差し替えたトークン。
   *
   * @param token 差し替える元のトークン
   * @param value 新しい値
   * @returns `token` の名前と `value` を持つトークン。`value` の種別が `token` と違えば `none`
   */
  withValue(token: Token, value: TokenValue): Option<Token> {
    return value.kind === token.kind
      ? Option.some({ ...value, name: token.name })
      : Option.none;
  },

  /**
   * 値を正規形へ倒す(docs/04-tokens.md「値の形式」)。
   * 保存形式の規則なので、入力 UI ではなく値を受け取る側で通す。
   *
   * 影とグラデーションも通すのは、どちらも中に生 hex を持つため(docs/04-tokens.md
   * 「shadows」「gradients」)。色の種別だけを通すと、中の hex が大文字のまま保存される。
   *
   * @param token 倒す元のトークン
   * @returns 色・影・グラデーションは中の hex を `ColorToken.normalize` で倒したもの。
   *   spacing / radius / typography は `token` のまま
   */
  normalized(token: Token): Token {
    switch (token.kind) {
      case "colors":
        return { ...token, value: ColorToken.normalize(token.value) };
      case "shadows":
        return { ...token, value: ShadowToken.normalized(token.value) };
      case "gradients":
        return { ...token, value: GradientToken.normalized(token.value) };
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
    case "gradients":
      return {
        ...tokens,
        gradients: { ...tokens.gradients, [token.name]: token.value },
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
    case "gradients":
      return {
        ...tokens,
        gradients: withoutName(tokens.gradients, ref.name),
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
    case "gradients":
      return {
        ...tokens,
        gradients: withRenamedKey(tokens.gradients, ref.name, newName),
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
    case "gradients":
      return Object.entries(tokens.gradients).map(([name, value]) => ({
        kind,
        name,
        value,
      }));
  }
}

/**
 * 名前の一意性を種別をまたいで見る相手の種別（docs/04-tokens.md「命名規則」）。
 *
 * @param kind 相手を知りたい種別
 * @returns 塗り用の 2 種別ならもう片方。それ以外の種別では `none`
 */
function paintCounterpart(kind: TokenKind): Option<TokenKind> {
  const [colors, gradients] = PaintTokenKinds;
  if (kind === colors) {
    return Option.some(gradients);
  }
  if (kind === gradients) {
    return Option.some(colors);
  }
  return Option.none;
}

/**
 * 相手の種別がその名前を使っているか。
 *
 * @param tokens 名前を探すトークン一式
 * @param ref 名前と、相手を求める元の種別
 * @returns 相手の種別がその名前を持っていればその種別。相手が無い種別か、相手がその名前を
 *   持っていなければ `none`
 */
function findPaintConflict(tokens: TokenSet, ref: TokenRef): Option<TokenKind> {
  return Option.flatMap(paintCounterpart(ref.kind), (counterpart) =>
    TokenSet.has(tokens, counterpart, ref.name)
      ? Option.some(counterpart)
      : Option.none,
  );
}

/**
 * 書き込み先の名前が使えるかを確かめる。
 * 名前の規則は識別子と同じで、一意性は種別の中と、塗り用の 2 種別の間で見る
 * (docs/04-tokens.md「命名規則」)。
 *
 * @param tokens 一意性を見る対象のトークン一式
 * @param ref 書き込み先の種別と名前
 * @returns 使えるならその `ref`。ケバブケースでなければ `invalid-token-name`、
 *   同じ種別に同名があれば `duplicate-token-name`、塗りの相手の種別に同名があれば
 *   `conflicting-token-name`（複数に当たるならこの並びの先のもの）
 */
function checkWritableName(
  tokens: TokenSet,
  ref: TokenRef,
): Result<TokenRef, TokenEditError> {
  if (!TokenSet.isValidName(ref.name)) {
    return Result.err({ kind: "invalid-token-name", ref });
  }
  if (TokenSet.has(tokens, ref.kind, ref.name)) {
    return Result.err({ kind: "duplicate-token-name", ref });
  }
  const conflict = findPaintConflict(tokens, ref);
  if (Option.isSome(conflict)) {
    return Result.err({
      kind: "conflicting-token-name",
      ref,
      conflictsWith: conflict.value,
    });
  }
  return Result.ok(ref);
}

/**
 * その名前が、その種別へ足すときに既に使われているか。
 *
 * @param tokens 名前を探すトークン一式
 * @param ref 足す先の種別と名前
 * @returns 同じ種別か、塗りの相手の種別にその名前があれば `true`
 */
function isNameTaken(tokens: TokenSet, ref: TokenRef): boolean {
  return (
    TokenSet.has(tokens, ref.kind, ref.name) ||
    Option.isSome(findPaintConflict(tokens, ref))
  );
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
    case "gradients":
      return Json.sortedMap(tokens.gradients, GradientToken.toJson);
  }
}

/** トークン一式の生成・検索・編集（追加・改名・削除）と JSON 表現との相互変換。 */
export const TokenSet = {
  /**
   * トークンを 1 つも持たない一式。
   *
   * @returns すべての種別を空の入れ物で持つ一式
   */
  empty(): TokenSet {
    return {
      colors: {},
      spacing: {},
      radius: {},
      shadows: {},
      typography: {},
      gradients: {},
    };
  },

  /**
   * その種別にその名前のトークンがあるか。
   *
   * @param tokens 探す先のトークン一式
   * @param kind 探す種別
   * @param name 探す名前
   * @returns その種別の中にその名前があれば true。別の種別の同名は見ない
   */
  has(tokens: TokenSet, kind: TokenKind, name: string): boolean {
    return RecordEx.has(tokens[kind], name);
  },

  /**
   * トークンの種別の一覧。
   *
   * @returns `TokenKinds` に書いた順の種別
   */
  kinds(): readonly TokenKind[] {
    return Object.values(TokenKinds);
  },

  /**
   * その種別のトークンの名前の一覧。
   *
   * @param tokens 読み出し元のトークン一式
   * @param kind 読み出す種別
   * @returns その種別の名前を、その種別の辞書の `Object.keys` の列挙順で並べたもの
   */
  names(tokens: TokenSet, kind: TokenKind): readonly string[] {
    return Object.keys(tokens[kind]);
  },

  /**
   * その名前がトークン名の規則を満たすか（docs/04-tokens.md「命名規則」）。
   *
   * @param name 判定する名前
   * @returns `CaseStyle.isKebabCase` が認める綴りなら `true`
   */
  isValidName(name: string): boolean {
    return CaseStyle.isKebabCase(name);
  },

  /**
   * その種別へ足しても衝突しない名前。衝突する場合は連番を付ける。衝突は同じ種別の名前と、
   * 塗り用の 2 種別なら相手の種別の名前とで見る（`TokenSet.add` が弾く範囲と同じ）。
   *
   * 連番のコードは `DocumentNames.uniqueName` と共有しない。あちらはドキュメントの名前の
   * 採番（docs/06-ui.md「名前の変更」）で、トークン名の採番を同じ規則に従わせる仕様は無い。
   *
   * @param tokens 衝突を見るトークン一式
   * @param kind 名前を足す種別
   * @param baseName 付けたい名前。識別子の規則を満たすかは見ない
   * @returns 使われていなければ `baseName` そのまま、使われていれば `baseName-2` から順に
   *   空いている名前
   */
  uniqueName(tokens: TokenSet, kind: TokenKind, baseName: string): string {
    if (!isNameTaken(tokens, { kind, name: baseName })) {
      return baseName;
    }
    let suffix = 2;
    while (isNameTaken(tokens, { kind, name: `${baseName}-${suffix}` })) {
      suffix += 1;
    }
    return `${baseName}-${suffix}`;
  },

  /**
   * 塗り用の 2 種別のうち、その名前を持っている種別（docs/03「塗り」: どちらを指しているか
   * は、その名前を持っている種別で決まる）。
   *
   * @param tokens 名前を探すトークン一式
   * @param name 探す名前
   * @returns その名前を持つ種別。どちらにも無いときと、両方にあって決まらないとき
   *   （docs/04「命名規則」が禁じている状態）は `none`
   */
  findPaintKind(
    tokens: TokenSet,
    name: string,
  ): Option<PaintTokenKinds[number]> {
    const owners = PaintTokenKinds.filter((kind) =>
      TokenSet.has(tokens, kind, name),
    );
    const [owner] = owners;
    return owners.length === 1 ? Option.some(owner) : Option.none;
  },

  /**
   * 塗り用の 2 種別の両方にある名前（docs/04-tokens.md「命名規則」が禁じている状態）。
   * 参照されているかは見ない。
   *
   * @param tokens 名前を突き合わせるトークン一式
   * @returns 両方にある名前を colors の並びの順で並べたもの。片方にだけある名前は含まない
   */
  collectPaintNameConflicts(tokens: TokenSet): readonly string[] {
    const [colors] = PaintTokenKinds;
    return TokenSet.names(tokens, colors).filter((name) =>
      Option.isSome(findPaintConflict(tokens, { kind: colors, name })),
    );
  },

  /**
   * 値が正規形の hex でない色の名前（docs/04-tokens.md「colors」）。
   * 影・グラデーションの中の色は見ない（docs/03-schema.md「バリデーション仕様」）。
   *
   * @param tokens 色を確かめるトークン一式
   * @returns `ColorToken.isValid` を満たさない色の名前を colors の並びの順で並べたもの
   */
  collectInvalidColorNames(tokens: TokenSet): readonly string[] {
    return Object.entries(tokens.colors)
      .filter(([, color]) => !ColorToken.isValid(color))
      .map(([name]) => name);
  },

  /**
   * その種別のトークンを並べる。
   *
   * @param tokens 読み出し元のトークン一式
   * @param kind 読み出す種別
   * @returns その種別のトークンを `TokenSet.names` と同じ並びで並べたもの
   */
  tokensOf(tokens: TokenSet, kind: TokenKind): readonly Token[] {
    return tokensOfKind(tokens, kind);
  },

  /**
   * 名前で色を引く。
   *
   * 引く種別が決まっている呼び出しに、取られることのない分岐を書かせない。
   *
   * @param tokens 引き先のトークン一式
   * @param name 引きたい色の名前
   * @returns その名前の色。`colors` にその名前が無ければ `none`
   */
  findColor(tokens: TokenSet, name: string): Option<ColorToken> {
    return RecordEx.get(tokens.colors, name);
  },

  /**
   * 名前で数値のトークンを引く。
   *
   * 引く種別が決まっている呼び出しに、`Token` の直和を絞り直す分岐を書かせない。
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
    return RecordEx.get<number>(tokens[kind], name);
  },

  /**
   * 参照でトークンを引く。
   *
   * @param tokens 引き先のトークン一式
   * @param ref 引きたいトークンの種別と名前
   * @returns そのトークン。その種別にその名前が無ければ `none`（別の種別の同名は見ない）
   */
  find(tokens: TokenSet, ref: TokenRef): Option<Token> {
    return Option.fromNullable(
      tokensOfKind(tokens, ref.kind).find((token) => token.name === ref.name),
    );
  },

  /**
   * トークンを追加する(docs/06-ui.md「編集操作の一覧」の tokens 編集)。
   * 生成した時点で名前の規則と一意性を満たしていることを成立させるため、
   * 検証は呼び出し側ではなくここで行う。
   *
   * @param tokens 追加先のトークン一式
   * @param token 追加するトークン。値は検証せず、`Token.normalized` で正規形へ倒して
   *   から入れる
   * @returns そのトークンを加えた一式。名前がケバブケースでなければ `invalid-token-name`、
   *   同じ種別に同名があれば `duplicate-token-name`、塗りの相手の種別に同名があれば
   *   `conflicting-token-name`（複数に当たるならこの並びの先のもの）。
   *   どの `err` も `ref` は追加しようとしたトークンを指す
   */
  add(tokens: TokenSet, token: Token): Result<TokenSet, TokenEditError> {
    return Result.map(checkWritableName(tokens, Token.ref(token)), () =>
      withToken(tokens, Token.normalized(token)),
    );
  },

  /**
   * 既にあるトークンの値を差し替える。
   * 名前を変えないので新しい名前の検証は要らず、対象が無いことだけが失敗しうる。
   *
   * @param tokens 差し替え先のトークン一式
   * @param token 差し替え後のトークン。種別と名前で対象を指す。値は検証せず、
   *   `Token.normalized` で正規形へ倒してから入れる
   * @returns 並びの位置を保ったまま値だけが入れ替わった一式。その種別にその名前が
   *   無ければ `token-not-found`
   */
  replace(tokens: TokenSet, token: Token): Result<TokenSet, TokenEditError> {
    const ref = Token.ref(token);
    if (!Option.isSome(TokenSet.find(tokens, ref))) {
      return Result.err({ kind: "token-not-found", ref });
    }
    return Result.ok(withToken(tokens, Token.normalized(token)));
  },

  /**
   * トークンの名前を変える。値と並びの位置は保つ。
   *
   * 名前を変えると、その名前を指していた prop は宙に浮く。ここで参照を追随させないのは、
   * 参照の解決はドキュメント全体の検証が持つ関心事で、宙に浮いた参照は dangling 参照とし
   * て通常のバリデーションエラーになるため(docs/04-tokens.md「スキーマデフォルトとの関係」)。
   *
   * @param tokens 改名先のトークン一式
   * @param ref 改名するトークンの種別と、今の名前
   * @param newName 付け替え後の名前。一意性は `ref` と同じ種別の中と、塗りの相手の種別とで
   *   見る
   * @returns 名前だけが入れ替わった一式（`newName` が今の名前と同じなら `tokens` のまま）。
   *   並びの中の位置は `TokenSet.names` の並びに従う。
   *   `ref` の種別にその名前が無ければ `ref` を指す `token-not-found`（`newName` より先に
   *   見る）。`newName` がケバブケースでなければ `invalid-token-name`、同じ種別に使われて
   *   いれば `duplicate-token-name`、塗りの相手の種別に使われていれば
   *   `conflicting-token-name` で、どれも `ref` は `newName` の側を指す
   */
  rename(
    tokens: TokenSet,
    ref: TokenRef,
    newName: string,
  ): Result<TokenSet, TokenEditError> {
    if (!Option.isSome(TokenSet.find(tokens, ref))) {
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
   * トークンを削除する。使用中かどうかは見ない。
   *
   * 使用中トークンの削除を特別扱いせず、残った参照を dangling 参照として検証で拾うのが仕
   * 様(docs/04-tokens.md)。
   *
   * @param tokens 削除元のトークン一式
   * @param ref 削除するトークンの種別と名前
   * @returns そのトークンを持たない一式。その種別にその名前が無ければ `token-not-found`
   */
  remove(tokens: TokenSet, ref: TokenRef): Result<TokenSet, TokenEditError> {
    if (!Option.isSome(TokenSet.find(tokens, ref))) {
      return Result.err({ kind: "token-not-found", ref });
    }
    return Result.ok(withoutToken(tokens, ref));
  },

  /**
   * 種別ごとの値の形式は docs/04-tokens.md「値の形式」に従う。
   * 書かれていない種別は空として読む(トークンを1つも持たない種別は書かれないため)。
   *
   * @param cursor `tokens` の値と、その位置
   * @returns 読んだトークン一式。影・グラデーションの中も含め、色は読んだ時点で
   *   `ColorToken.normalize` で倒す。名前の規則・hex でない色・値の範囲（負の余白など）は
   *   見ない。オブジェクトでなければ `invalid-type`、知らない種別があれば `unknown-field`、
   *   種別ごとの値の失敗も 1 件で打ち切らずすべて集めた `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<TokenSet> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine6(
          Json.optionalMap(record, "colors", ColorToken.fromJson),
          Json.optionalMap(record, "spacing", Json.number),
          Json.optionalMap(record, "radius", Json.number),
          Json.optionalMap(record, "shadows", ShadowToken.fromJson),
          Json.optionalMap(record, "typography", TypographyToken.fromJson),
          Json.optionalMap(record, "gradients", GradientToken.fromJson),
          (colors, spacing, radius, shadows, typography, gradients) => ({
            colors,
            spacing,
            radius,
            shadows,
            typography,
            gradients,
          }),
        ),
        record,
        TokenSet.kinds(),
      ),
    );
  },

  /**
   * トークンを1つも持たない種別は書き出さない(空の種別を残さない)。
   *
   * @param tokens 書き出すトークン一式
   * @returns 種別を `TokenSet.kinds` の順に、各種別の中身を `Json.sortedMap` の並びで
   *   書き出した JSON オブジェクト
   */
  toJson(tokens: TokenSet): JsonObject {
    return Object.fromEntries(
      TokenSet.kinds()
        .filter((kind) => Object.keys(tokens[kind]).length > 0)
        .map((kind) => [kind, tokenKindToJson(tokens, kind)]),
    );
  },
} as const;
