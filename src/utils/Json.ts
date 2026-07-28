import { Result } from "@/utils/Result";

/** JSON のデータモデルで表せる値。 */
export type JsonValue =
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | JsonObject;

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

export type JsonDecodeErrorKind =
  | "missing-field"
  | "invalid-type"
  | "unknown-field";

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

export type JsonDecoder<T> = (cursor: JsonCursor) => JsonDecoded<T>;

/** エラーメッセージ用の型名。JSON の値として区別できる粒度で示す。 */
function typeNameOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** プロトタイプ由来のキーを拾わないよう、自身のキーだけで存在を判定する。 */
function hasField(record: JsonRecord, key: string): boolean {
  return Object.keys(record).includes(key);
}

function fieldCursor(cursor: JsonRecordCursor, key: string): JsonCursor {
  return {
    value: cursor.record[key],
    path: cursor.path === "" ? key : `${cursor.path}.${key}`,
  };
}

function isEmpty(value: JsonValue): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === "object" && Object.keys(value).length === 0;
}

export const Json = {
  /** テキストから読み込んだ値を、位置つきのカーソルにする。 */
  create(value: unknown, path = ""): JsonCursor {
    return { value, path };
  },

  error(
    kind: JsonDecodeErrorKind,
    path: string,
    message: string,
  ): JsonDecoded<never> {
    return Result.err([{ kind, path, message }]);
  },

  errorsOf(result: JsonDecoded<unknown>): readonly JsonDecodeError[] {
    return result.ok ? [] : result.error;
  },

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

  /** オブジェクトであることを確かめ、フィールドを引けるカーソルにする。 */
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

  optional<T>(
    cursor: JsonRecordCursor,
    key: string,
    decode: JsonDecoder<T>,
  ): JsonDecoded<T | undefined> {
    if (!hasField(cursor.record, key)) {
      return Result.ok(undefined);
    }
    return decode(fieldCursor(cursor, key));
  },

  /** 省略されたときに空として扱うフィールド。 */
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

  /** 名前をキーとする辞書をデコードする。 */
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

  collect<T>(results: readonly JsonDecoded<T>[]): JsonDecoded<readonly T[]> {
    const errors = results.flatMap(Json.errorsOf);
    if (errors.length > 0) {
      return Result.err(errors);
    }
    return Result.ok(
      results.flatMap((result) => (result.ok ? [result.value] : [])),
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
   */
  combine2<A, B, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    build: (a: A, b: B) => R,
  ): JsonDecoded<R> {
    if (a.ok && b.ok) {
      return Result.ok(build(a.value, b.value));
    }
    return Result.err([...Json.errorsOf(a), ...Json.errorsOf(b)]);
  },

  combine3<A, B, C, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    build: (a: A, b: B, c: C) => R,
  ): JsonDecoded<R> {
    if (a.ok && b.ok && c.ok) {
      return Result.ok(build(a.value, b.value, c.value));
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
    ]);
  },

  combine4<A, B, C, D, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    d: JsonDecoded<D>,
    build: (a: A, b: B, c: C, d: D) => R,
  ): JsonDecoded<R> {
    if (a.ok && b.ok && c.ok && d.ok) {
      return Result.ok(build(a.value, b.value, c.value, d.value));
    }
    return Result.err([
      ...Json.errorsOf(a),
      ...Json.errorsOf(b),
      ...Json.errorsOf(c),
      ...Json.errorsOf(d),
    ]);
  },

  combine5<A, B, C, D, E, R>(
    a: JsonDecoded<A>,
    b: JsonDecoded<B>,
    c: JsonDecoded<C>,
    d: JsonDecoded<D>,
    e: JsonDecoded<E>,
    build: (a: A, b: B, c: C, d: D, e: E) => R,
  ): JsonDecoded<R> {
    if (a.ok && b.ok && c.ok && d.ok && e.ok) {
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
   * 名前をキーとする辞書を名前の昇順で書き出す。
   * キー順を値だけから決めることで、同じ値からは
   * 構築の経緯によらず常に同じ出力になる。
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

  /** 値が未設定なら現れないフィールド。 */
  definedField(key: string, value: JsonValue | undefined): JsonObject {
    return value === undefined ? {} : { [key]: value };
  },

  /** 値が未設定または空なら現れないフィールド。 */
  nonEmptyField(key: string, value: JsonValue | undefined): JsonObject {
    if (value === undefined || isEmpty(value)) {
      return {};
    }
    return { [key]: value };
  },
} as const;
