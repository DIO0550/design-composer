import { Result } from "@/utils/Result";

/** JSON のデータモデルで表せる値。 */
export type JsonValue =
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | JsonObject;

export type JsonObject = Readonly<{ [key: string]: JsonValue }>;

/** デコードの入力。値の型はまだ何も分かっていない。 */
export type JsonRecord = Readonly<Record<string, unknown>>;

export type JsonDecodeErrorKind =
  | "missing-field"
  | "invalid-type"
  | "unknown-field";

export type JsonDecodeError = Readonly<{
  kind: JsonDecodeErrorKind;
  /** 値の位置（例: `artboards[0].children[1].name`）。 */
  path: string;
  message: string;
}>;

/**
 * デコードの結果。
 * 失敗は1件で打ち切らず、集めたエラーの一覧を持つ。
 */
export type JsonDecoded<T> = Result<T, readonly JsonDecodeError[]>;

export type JsonDecoder<T> = (value: unknown, path: string) => JsonDecoded<T>;

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

function isEmpty(value: JsonValue): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === "object" && Object.keys(value).length === 0;
}

export const Json = {
  childPath(path: string, key: string): string {
    return path === "" ? key : `${path}.${key}`;
  },

  indexPath(path: string, index: number): string {
    return `${path}[${index}]`;
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

  string(value: unknown, path: string): JsonDecoded<string> {
    if (typeof value === "string") {
      return Result.ok(value);
    }
    return Json.error(
      "invalid-type",
      path,
      `expected string but got ${typeNameOf(value)}`,
    );
  },

  number(value: unknown, path: string): JsonDecoded<number> {
    if (typeof value === "number") {
      return Result.ok(value);
    }
    return Json.error(
      "invalid-type",
      path,
      `expected number but got ${typeNameOf(value)}`,
    );
  },

  record(value: unknown, path: string): JsonDecoded<JsonRecord> {
    if (isJsonRecord(value)) {
      return Result.ok(value);
    }
    return Json.error(
      "invalid-type",
      path,
      `expected object but got ${typeNameOf(value)}`,
    );
  },

  array(value: unknown, path: string): JsonDecoded<readonly unknown[]> {
    if (Array.isArray(value)) {
      return Result.ok(value);
    }
    return Json.error(
      "invalid-type",
      path,
      `expected array but got ${typeNameOf(value)}`,
    );
  },

  required<T>(
    record: JsonRecord,
    path: string,
    key: string,
    decode: JsonDecoder<T>,
  ): JsonDecoded<T> {
    const fieldPath = Json.childPath(path, key);
    if (!hasField(record, key)) {
      return Json.error("missing-field", fieldPath, `"${key}" is required`);
    }
    return decode(record[key], fieldPath);
  },

  optional<T>(
    record: JsonRecord,
    path: string,
    key: string,
    decode: JsonDecoder<T>,
  ): JsonDecoded<T | undefined> {
    if (!hasField(record, key)) {
      return Result.ok(undefined);
    }
    return decode(record[key], Json.childPath(path, key));
  },

  /** 省略されたときに空として扱うフィールド。 */
  optionalMap<T>(
    record: JsonRecord,
    path: string,
    key: string,
    decodeValue: JsonDecoder<T>,
  ): JsonDecoded<Readonly<Record<string, T>>> {
    if (!hasField(record, key)) {
      return Result.ok({});
    }
    return Json.mapOf(record[key], Json.childPath(path, key), decodeValue);
  },

  /** 名前をキーとする辞書をデコードする。 */
  mapOf<T>(
    value: unknown,
    path: string,
    decodeValue: JsonDecoder<T>,
  ): JsonDecoded<Readonly<Record<string, T>>> {
    return Result.flatMap(Json.record(value, path), (record) => {
      const entries = Object.keys(record).map((key) =>
        Result.map(
          decodeValue(record[key], Json.childPath(path, key)),
          (decoded) => [key, decoded] as const,
        ),
      );
      return Result.map(Json.collect(entries), (pairs) =>
        Object.fromEntries(pairs),
      );
    });
  },

  arrayOf<T>(
    value: unknown,
    path: string,
    decodeItem: JsonDecoder<T>,
  ): JsonDecoded<readonly T[]> {
    return Result.flatMap(Json.array(value, path), (items) =>
      Json.collect(
        items.map((item, index) =>
          decodeItem(item, Json.indexPath(path, index)),
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
    record: JsonRecord,
    path: string,
    knownFields: readonly string[],
  ): JsonDecoded<T> {
    const errors = Object.keys(record)
      .filter((key) => !knownFields.includes(key))
      .map(
        (key): JsonDecodeError => ({
          kind: "unknown-field",
          path: Json.childPath(path, key),
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
