import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/** JSON のデータモデルで表せる値。 */
export type JsonValue =
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | JsonObject;

/** JSON のオブジェクト。値はすべて JSON のデータモデルで表せる。 */
export type JsonObject = Readonly<{ [key: string]: JsonValue }>;

/** 読み込んだ直後のオブジェクト。値の型はまだ何も分かっていない。 */
export type JsonRecord = Readonly<Record<string, unknown>>;

/**
 * デコード中の値と、それがドキュメント内のどこにあるか。
 * 値と位置は常に対で意味を持つ(位置が分からない値はエラーを報告できない)。
 */
export type JsonCursor = Readonly<{
  value: unknown;
  path: string;
}>;

/**
 * 値がオブジェクトであることを確かめたあとのカーソル。
 * 「オブジェクトだと分かっている」ことが型に出るので、
 * フィールドを引くたびに型を確かめ直さずに済む。
 */
export type JsonRecordCursor = Readonly<{
  record: JsonRecord;
  path: string;
}>;

/** デコードが失敗する理由。呼び出し側が種類で分岐できるよう直和で列挙する。 */
export type JsonDecodeErrorKind =
  | "missing-field"
  | "invalid-type"
  | "unknown-field";

/** デコードの失敗 1 件。どこで何が起きたかを持つ。 */
export type JsonDecodeError = Readonly<{
  kind: JsonDecodeErrorKind;
  /** 値の位置(例: `artboards[0].children[1].name`)。 */
  path: string;
  message: string;
}>;

/**
 * デコードの結果。
 * 失敗は1件で打ち切らず、集めたエラーの一覧を持つ。
 */
export type JsonDecoded<T> = Result<T, readonly JsonDecodeError[]>;

/** カーソルの位置の値を `T` として読む手続き。 */
export type JsonDecoder<T> = (cursor: JsonCursor) => JsonDecoded<T>;

/**
 * エラーメッセージ用の型名。JSON の値として区別できる粒度で示す。
 *
 * @param value 型名を知りたい値
 * @returns `null` / `array` / `object` / `string` / `number` / `boolean` のいずれか
 */
function typeNameOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * その値がオブジェクトか（配列と `null` は含めない）。
 *
 * @param value 判定する値
 * @returns オブジェクトなら true
 */
function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * プロトタイプ由来のキーを拾わないよう、自身のキーだけで存在を判定する。
 *
 * @param record 調べる対象のオブジェクト
 * @param key 存在を知りたいフィールド名
 * @returns そのフィールドを自身が持っていれば true
 */
function hasField(record: JsonRecord, key: string): boolean {
  return Object.keys(record).includes(key);
}

/**
 * オブジェクトの 1 フィールドを、位置を継ぎ足したカーソルとして取り出す。
 *
 * @param cursor 取り出し元のオブジェクトを指しているカーソル
 * @param key 取り出すフィールド名
 * @returns そのフィールドの値と、`親のパス.key` を持つカーソル
 */
function fieldCursor(cursor: JsonRecordCursor, key: string): JsonCursor {
  return {
    value: cursor.record[key],
    path: cursor.path === "" ? key : `${cursor.path}.${key}`,
  };
}

/**
 * 中身を持たない配列・オブジェクトか。数値や文字列は対象にしない。
 *
 * @param value 判定する JSON の値
 * @returns 要素・フィールドが 0 個の配列 / オブジェクトなら true
 */
function isEmpty(value: JsonValue): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === "object" && Object.keys(value).length === 0;
}

/** JSON の値を位置つきで読み進めるためのカーソル操作。 */
export const Json = {
  /**
   * テキストから読み込んだ値を、位置つきのカーソルにする。
   *
   * @param value テキストから読み込んだ値
   * @param path その値の位置。省くとルート（空文字）で、子の位置は先頭に `.` を付けずに継ぐ
   * @returns `value` と `path` を持つカーソル
   */
  create(value: unknown, path = ""): JsonCursor {
    return { value, path };
  },

  /**
   * 失敗 1 件のデコード結果を作る。
   *
   * @param kind 失敗の種類
   * @param path 失敗した値の位置
   * @param message 人が読む説明
   * @returns その 1 件だけを並びに持つ `err`。失敗は並びで持つので、他の失敗と連結できる
   */
  error(
    kind: JsonDecodeErrorKind,
    path: string,
    message: string,
  ): JsonDecoded<never> {
    return Result.err([{ kind, path, message }]);
  },

  /**
   * デコード結果が持つ失敗。
   *
   * @param result 失敗を取り出す結果
   * @returns 失敗ならその一覧。成功なら空の並び
   */
  errorsOf(result: JsonDecoded<unknown>): readonly JsonDecodeError[] {
    return Result.isOk(result) ? [] : result.error;
  },

  /**
   * カーソルの位置の値を文字列として読む。
   *
   * @param cursor 読む値と、その位置
   * @returns 文字列ならその値。それ以外なら `cursor` の位置を持つ `invalid-type` の `err`
   */
  string(cursor: JsonCursor): JsonDecoded<string> {
    if (typeof cursor.value === "string") {
      return Result.ok(cursor.value);
    }
    return Json.error(
      "invalid-type",
      cursor.path,
      `expected string but got ${typeNameOf(cursor.value)}`,
    );
  },

  /**
   * カーソルの位置の値を数値として読む。
   *
   * @param cursor 読む値と、その位置
   * @returns 数値ならその値。それ以外なら `cursor` の位置を持つ `invalid-type` の `err`
   */
  number(cursor: JsonCursor): JsonDecoded<number> {
    if (typeof cursor.value === "number") {
      return Result.ok(cursor.value);
    }
    return Json.error(
      "invalid-type",
      cursor.path,
      `expected number but got ${typeNameOf(cursor.value)}`,
    );
  },

  /**
   * オブジェクトであることを確かめ、フィールドを引けるカーソルにする。
   *
   * @param cursor 読む値と、その位置
   * @returns 同じ位置を持つオブジェクトのカーソル。配列・`null`・それ以外の値なら
   *   `invalid-type` の `err`
   */
  record(cursor: JsonCursor): JsonDecoded<JsonRecordCursor> {
    if (isJsonRecord(cursor.value)) {
      return Result.ok({ record: cursor.value, path: cursor.path });
    }
    return Json.error(
      "invalid-type",
      cursor.path,
      `expected object but got ${typeNameOf(cursor.value)}`,
    );
  },

  /**
   * カーソルの位置の値を配列として読む。要素はまだ読まない。
   *
   * @param cursor 読む値と、その位置
   * @returns 配列ならその値。それ以外なら `cursor` の位置を持つ `invalid-type` の `err`
   */
  array(cursor: JsonCursor): JsonDecoded<readonly unknown[]> {
    if (Array.isArray(cursor.value)) {
      return Result.ok(cursor.value);
    }
    return Json.error(
      "invalid-type",
      cursor.path,
      `expected array but got ${typeNameOf(cursor.value)}`,
    );
  },

  /**
   * 必須のフィールドを読む。
   *
   * @param cursor フィールドを引くオブジェクト
   * @param key 読むフィールドの名前
   * @param decode フィールドの値を読む手続き
   * @returns `decode` の結果。フィールドがオブジェクト自身に無ければ `missing-field` の `err`
   */
  required<T>(
    cursor: JsonRecordCursor,
    key: string,
    decode: JsonDecoder<T>,
  ): JsonDecoded<T> {
    const field = fieldCursor(cursor, key);
    if (!hasField(cursor.record, key)) {
      return Json.error("missing-field", field.path, `"${key}" is required`);
    }
    return decode(field);
  },

  /**
   * 省略できるフィールドを読む。
   *
   * @param cursor フィールドを引くオブジェクト
   * @param key 読むフィールドの名前
   * @param decode フィールドの値を読む手続き
   * @returns フィールドがオブジェクト自身に無ければ `none` の `ok`。あれば `decode` が読めた値の
   *   `some` の `ok`、読めなければ `decode` の `err`
   */
  optional<T extends NonNullable<unknown>>(
    cursor: JsonRecordCursor,
    key: string,
    decode: JsonDecoder<T>,
  ): JsonDecoded<Option<T>> {
    if (!hasField(cursor.record, key)) {
      return Result.ok(Option.none);
    }
    return Result.map(decode(fieldCursor(cursor, key)), Option.some);
  },

  /**
   * 省略されたときに空として扱う、名前をキーとする辞書のフィールドを読む。
   *
   * @param cursor フィールドを引くオブジェクト
   * @param key 読むフィールドの名前
   * @param decodeValue 辞書の値 1 つを読む手続き
   * @returns フィールドがオブジェクト自身に無ければ空の辞書の `ok`。あれば `mapOf` の結果
   */
  optionalMap<T>(
    cursor: JsonRecordCursor,
    key: string,
    decodeValue: JsonDecoder<T>,
  ): JsonDecoded<Readonly<Record<string, T>>> {
    if (!hasField(cursor.record, key)) {
      return Result.ok({});
    }
    return Json.mapOf(fieldCursor(cursor, key), decodeValue);
  },

  /**
   * 名前をキーとする辞書をデコードする。
   *
   * @param cursor 読む値と、その位置
   * @param decodeValue 辞書の値 1 つを読む手続き
   * @returns すべての値を読めたらキーと読んだ値の辞書。オブジェクトでなければ
   *   `invalid-type` の `err`、値の失敗は 1 件で打ち切らずすべて集めた `err`
   */
  mapOf<T>(
    cursor: JsonCursor,
    decodeValue: JsonDecoder<T>,
  ): JsonDecoded<Readonly<Record<string, T>>> {
    return Result.flatMap(Json.record(cursor), (recordCursor) => {
      const entries = Object.keys(recordCursor.record).map((key) =>
        Result.map(
          decodeValue(fieldCursor(recordCursor, key)),
          (decoded) => [key, decoded] as const,
        ),
      );
      return Result.map(Json.collect(entries), (pairs) =>
        Object.fromEntries(pairs),
      );
    });
  },

  /**
   * 配列と、その要素をデコードする。
   *
   * @param cursor 読む値と、その位置
   * @param decodeItem 要素 1 つを読む手続き
   * @returns すべての要素を読めたら並び。配列でなければ `invalid-type` の `err`、要素の失敗は
   *   `path[i]` の位置を付けて 1 件で打ち切らずすべて集めた `err`
   */
  arrayOf<T>(
    cursor: JsonCursor,
    decodeItem: JsonDecoder<T>,
  ): JsonDecoded<readonly T[]> {
    return Result.flatMap(Json.array(cursor), (items) =>
      Json.collect(
        items.map((item, index) =>
          decodeItem({ value: item, path: `${cursor.path}[${index}]` }),
        ),
      ),
    );
  },

  /**
   * 知らないフィールドをエラーとして加える。
   * 黙って捨てると無警告のデータ消失になるため、読み手が気付ける形で報告する。
   *
   * @param result 同じオブジェクトの既知のフィールドを読んだ結果
   * @param cursor 読んだオブジェクト
   * @param knownFields 読むことになっているフィールドの名前
   * @returns 知らないフィールドが 1 つ以上あれば、`result` が成功でも失敗にし、`result` の
   *   エラーの後ろに `unknown-field` を足した `err`。無ければ `result` のまま
   */
  knownFields<T>(
    result: JsonDecoded<T>,
    cursor: JsonRecordCursor,
    knownFields: readonly string[],
  ): JsonDecoded<T> {
    const errors = Object.keys(cursor.record)
      .filter((key) => !knownFields.includes(key))
      .map(
        (key): JsonDecodeError => ({
          kind: "unknown-field",
          path: fieldCursor(cursor, key).path,
          message: `unknown field "${key}"`,
        }),
      );
    if (errors.length === 0) {
      return result;
    }
    return Result.err([...Json.errorsOf(result), ...errors]);
  },

  /**
   * デコード結果の並びを、並びのデコード結果にまとめる。
   *
   * @param results まとめる結果
   * @returns すべて成功なら値を同じ順に並べた `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   順に連ねた `err`
   */
  collect<T>(results: readonly JsonDecoded<T>[]): JsonDecoded<readonly T[]> {
    const errors = results.flatMap(Json.errorsOf);
    if (errors.length > 0) {
      return Result.err(errors);
    }
    return Result.ok(
      results.flatMap((result) => (Result.isOk(result) ? [result.value] : [])),
    );
  },

  /**
   * 複数のデコード結果をまとめる。
   * 最初のエラーで打ち切らず、すべてのエラーを集めてから失敗させる。
   *
   * 引数の数は「まとめる結果の数」そのものなので、
   * 引数を3つまでに抑える規約(`rules/coding.md`)の例外として個数ごとに用意する。
   * 各引数は型が異なるため1つの型にまとめられず、可変長にすると
   * タプル型を通すために `as` が必要になる(こちらも規約違反になる)。
   *
   * @param a `build` の 1 つ目の引数になる結果
   * @param b `build` の 2 つ目の引数になる結果
   * @param build すべて成功したときに値を組み立てる
   * @returns すべて成功なら `build` の戻り値の `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   引数の順に連ねた `err`
   */
  combine2<A, B, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    build: (a: A, b: B) => R,
  ): JsonDecoded<R> {
    const allDecoded = Result.isOk(a) && Result.isOk(b);
    if (allDecoded) {
      return Result.ok(build(a.value, b.value));
    }
    return Result.err([...Json.errorsOf(a), ...Json.errorsOf(b)]);
  },

  /**
   * 3 つのデコード結果をまとめる（打ち切らない理由と個数ごとに用意する理由は `combine2`）。
   *
   * @param a `build` の 1 つ目の引数になる結果
   * @param b `build` の 2 つ目の引数になる結果
   * @param c `build` の 3 つ目の引数になる結果
   * @param build すべて成功したときに値を組み立てる
   * @returns すべて成功なら `build` の戻り値の `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   引数の順に連ねた `err`
   */
  combine3<A, B, C, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    build: (a: A, b: B, c: C) => R,
  ): JsonDecoded<R> {
    const allDecoded = Result.isOk(a) && Result.isOk(b) && Result.isOk(c);
    if (allDecoded) {
      return Result.ok(build(a.value, b.value, c.value));
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
    ]);
  },

  /**
   * 4 つのデコード結果をまとめる（打ち切らない理由と個数ごとに用意する理由は `combine2`）。
   *
   * @param a `build` の 1 つ目の引数になる結果
   * @param b `build` の 2 つ目の引数になる結果
   * @param c `build` の 3 つ目の引数になる結果
   * @param d `build` の 4 つ目の引数になる結果
   * @param build すべて成功したときに値を組み立てる
   * @returns すべて成功なら `build` の戻り値の `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   引数の順に連ねた `err`
   */
  combine4<A, B, C, D, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    d: JsonDecoded<D>,
    build: (a: A, b: B, c: C, d: D) => R,
  ): JsonDecoded<R> {
    const allDecoded =
      Result.isOk(a) && Result.isOk(b) && Result.isOk(c) && Result.isOk(d);
    if (allDecoded) {
      return Result.ok(build(a.value, b.value, c.value, d.value));
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
      ...Json.errorsOf(d),
    ]);
  },

  /**
   * 5 つのデコード結果をまとめる（打ち切らない理由と個数ごとに用意する理由は `combine2`）。
   *
   * @param a `build` の 1 つ目の引数になる結果
   * @param b `build` の 2 つ目の引数になる結果
   * @param c `build` の 3 つ目の引数になる結果
   * @param d `build` の 4 つ目の引数になる結果
   * @param e `build` の 5 つ目の引数になる結果
   * @param build すべて成功したときに値を組み立てる
   * @returns すべて成功なら `build` の戻り値の `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   引数の順に連ねた `err`
   */
  combine5<A, B, C, D, E, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    d: JsonDecoded<D>,
    e: JsonDecoded<E>,
    build: (a: A, b: B, c: C, d: D, e: E) => R,
  ): JsonDecoded<R> {
    const allDecoded =
      Result.isOk(a) &&
      Result.isOk(b) &&
      Result.isOk(c) &&
      Result.isOk(d) &&
      Result.isOk(e);
    if (allDecoded) {
      return Result.ok(build(a.value, b.value, c.value, d.value, e.value));
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
      ...Json.errorsOf(d),
      ...Json.errorsOf(e),
    ]);
  },

  /**
   * 6 つのデコード結果をまとめる（打ち切らない理由と個数ごとに用意する理由は `combine2`）。
   *
   * @param a `build` の 1 つ目の引数になる結果
   * @param b `build` の 2 つ目の引数になる結果
   * @param c `build` の 3 つ目の引数になる結果
   * @param d `build` の 4 つ目の引数になる結果
   * @param e `build` の 5 つ目の引数になる結果
   * @param f `build` の 6 つ目の引数になる結果
   * @param build すべて成功したときに値を組み立てる
   * @returns すべて成功なら `build` の戻り値の `ok`。1 つでも失敗なら、失敗した結果のエラーを
   *   引数の順に連ねた `err`
   */
  combine6<A, B, C, D, E, F, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    d: JsonDecoded<D>,
    e: JsonDecoded<E>,
    f: JsonDecoded<F>,
    build: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
  ): JsonDecoded<R> {
    const allDecoded =
      Result.isOk(a) &&
      Result.isOk(b) &&
      Result.isOk(c) &&
      Result.isOk(d) &&
      Result.isOk(e) &&
      Result.isOk(f);
    if (allDecoded) {
      return Result.ok(
        build(a.value, b.value, c.value, d.value, e.value, f.value),
      );
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
      ...Json.errorsOf(d),
      ...Json.errorsOf(e),
      ...Json.errorsOf(f),
    ]);
  },

  /**
   * 名前をキーとする辞書を名前の昇順で書き出す。
   * キー順を値だけから決めることで、同じ値からは
   * 構築の経緯によらず常に同じ出力になる。
   *
   * @param record 書き出す辞書
   * @param serializeValue 辞書の値 1 つを JSON の値にする手続き
   * @returns キーを昇順に並べ、値を `serializeValue` で書き出したオブジェクト
   */
  sortedMap<T>(
    record: Readonly<Record<string, T>>,
    serializeValue: (value: T) => JsonValue,
  ): JsonObject {
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, serializeValue(record[key])]),
    );
  },

  /**
   * 値が未設定なら現れないフィールド。
   *
   * @param key フィールドの名前
   * @param value フィールドの値。`undefined` は未設定
   * @returns `{ [key]: value }`。未設定なら空のオブジェクト（スプレッドで結合すると何も足さない）
   */
  definedField(key: string, value: JsonValue | undefined): JsonObject {
    return value === undefined ? {} : { [key]: value };
  },

  /**
   * 値が未設定または空なら現れないフィールド。
   *
   * @param key フィールドの名前
   * @param value フィールドの値。`undefined` は未設定
   * @returns `{ [key]: value }`。未設定か、要素・フィールドが 0 個の配列・オブジェクトなら
   *   空のオブジェクト（空文字・`0`・`false` は空とみなさず出す）
   */
  nonEmptyField(key: string, value: JsonValue | undefined): JsonObject {
    if (value === undefined || isEmpty(value)) {
      return {};
    }
    return { [key]: value };
  },
} as const;
