import type { Artboard } from "@/domains/artboard";
import type {
  Component,
  ComponentSet,
  PublicPropBinding,
  PublicProps,
} from "@/domains/component";
import type { DesignDocument } from "@/domains/design-document";
import { FormatVersion } from "@/domains/format-version";
import { Node, type Props, type PropValue } from "@/domains/node";
import {
  type ShadowToken,
  type TokenKind,
  TokenSet,
  TypographyToken,
} from "@/domains/token";
import {
  JsonLexicalScanner,
  type JsonScanError,
} from "@/services/json-lexical-scanner";
import { Result } from "@/utils/Result";

/**
 * `syntax-error` / `duplicate-key` は字句スキャン（テキストの検証）由来、
 * それ以外は構造のデコード（形の検証）由来。
 * スキーマ検証（未知 type・未知 prop・dangling ref・識別子規則・名前一意性）は
 * `DesignDocument.collectErrors` の担当なのでここには現れない。
 */
export type DocumentJsonErrorKind =
  | JsonScanError["kind"]
  | "missing-field"
  | "invalid-type"
  | "unknown-field";

export type DocumentJsonError = Readonly<{
  kind: DocumentJsonErrorKind;
  message: string;
  /** ドキュメント内の位置（例: `artboards[0].children[1].name`）。構造のデコードで付く。 */
  path?: string;
  /** テキスト内の位置。字句スキャン由来のエラーで付く。 */
  position?: number;
}>;

type JsonObject = Readonly<Record<string, unknown>>;

/** デコードの結果。失敗は1件で打ち切らず、集めたエラーの一覧を持つ。 */
type Decoded<T> = Result<T, readonly DocumentJsonError[]>;

type Decoder<T> = (value: unknown, path: string) => Decoded<T>;

function failure(
  kind: DocumentJsonErrorKind,
  path: string,
  message: string,
): Decoded<never> {
  return Result.err([{ kind, path, message }]);
}

function errorsOf(result: Decoded<unknown>): readonly DocumentJsonError[] {
  return result.ok ? [] : result.error;
}

/**
 * 複数のデコード結果をまとめる。
 * 最初のエラーで打ち切らず、すべてのエラーを集めてから失敗させる
 * （不正入力はエラー一覧として報告する）。
 */
function combine2<A, B, R>(
  a: Decoded<A>,
  b: Decoded<B>,
  build: (a: A, b: B) => R,
): Decoded<R> {
  if (a.ok && b.ok) {
    return Result.ok(build(a.value, b.value));
  }
  return Result.err([...errorsOf(a), ...errorsOf(b)]);
}

function combine3<A, B, C, R>(
  a: Decoded<A>,
  b: Decoded<B>,
  c: Decoded<C>,
  build: (a: A, b: B, c: C) => R,
): Decoded<R> {
  if (a.ok && b.ok && c.ok) {
    return Result.ok(build(a.value, b.value, c.value));
  }
  return Result.err([...errorsOf(a), ...errorsOf(b), ...errorsOf(c)]);
}

function combine4<A, B, C, D, R>(
  a: Decoded<A>,
  b: Decoded<B>,
  c: Decoded<C>,
  d: Decoded<D>,
  build: (a: A, b: B, c: C, d: D) => R,
): Decoded<R> {
  if (a.ok && b.ok && c.ok && d.ok) {
    return Result.ok(build(a.value, b.value, c.value, d.value));
  }
  return Result.err([
    ...errorsOf(a),
    ...errorsOf(b),
    ...errorsOf(c),
    ...errorsOf(d),
  ]);
}

function combine5<A, B, C, D, E, R>(
  a: Decoded<A>,
  b: Decoded<B>,
  c: Decoded<C>,
  d: Decoded<D>,
  e: Decoded<E>,
  build: (a: A, b: B, c: C, d: D, e: E) => R,
): Decoded<R> {
  if (a.ok && b.ok && c.ok && d.ok && e.ok) {
    return Result.ok(build(a.value, b.value, c.value, d.value, e.value));
  }
  return Result.err([
    ...errorsOf(a),
    ...errorsOf(b),
    ...errorsOf(c),
    ...errorsOf(d),
    ...errorsOf(e),
  ]);
}

function collect<T>(results: readonly Decoded<T>[]): Decoded<readonly T[]> {
  const errors = results.flatMap(errorsOf);
  if (errors.length > 0) {
    return Result.err(errors);
  }
  return Result.ok(
    results.flatMap((result) => (result.ok ? [result.value] : [])),
  );
}

function childPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

function indexPath(path: string, index: number): string {
  return `${path}[${index}]`;
}

/** エラーメッセージ用の型名。JSON の値として区別できる粒度で示す。 */
function typeNameOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}

function decodeString(value: unknown, path: string): Decoded<string> {
  if (typeof value === "string") {
    return Result.ok(value);
  }
  return failure(
    "invalid-type",
    path,
    `expected string but got ${typeNameOf(value)}`,
  );
}

function decodeNumber(value: unknown, path: string): Decoded<number> {
  if (typeof value === "number") {
    return Result.ok(value);
  }
  return failure(
    "invalid-type",
    path,
    `expected number but got ${typeNameOf(value)}`,
  );
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeObject(value: unknown, path: string): Decoded<JsonObject> {
  if (isJsonObject(value)) {
    return Result.ok(value);
  }
  return failure(
    "invalid-type",
    path,
    `expected object but got ${typeNameOf(value)}`,
  );
}

function decodeArray(
  value: unknown,
  path: string,
): Decoded<readonly unknown[]> {
  if (Array.isArray(value)) {
    return Result.ok(value);
  }
  return failure(
    "invalid-type",
    path,
    `expected array but got ${typeNameOf(value)}`,
  );
}

/** プロトタイプ由来のキーを拾わないよう、自身のキーだけで存在を判定する。 */
function hasField(object: JsonObject, key: string): boolean {
  return Object.keys(object).includes(key);
}

function requiredField<T>(
  object: JsonObject,
  path: string,
  key: string,
  decode: Decoder<T>,
): Decoded<T> {
  const fieldPath = childPath(path, key);
  if (!hasField(object, key)) {
    return failure("missing-field", fieldPath, `"${key}" is required`);
  }
  return decode(object[key], fieldPath);
}

function optionalField<T>(
  object: JsonObject,
  path: string,
  key: string,
  decode: Decoder<T>,
): Decoded<T | undefined> {
  if (!hasField(object, key)) {
    return Result.ok(undefined);
  }
  return decode(object[key], childPath(path, key));
}

/**
 * 知らないフィールドはエラーにする。
 * 黙って捨てると無警告のデータ消失になるため（重複キーの字句スキャンと同じ方針）。
 */
function withKnownFields<T>(
  result: Decoded<T>,
  object: JsonObject,
  path: string,
  knownFields: readonly string[],
): Decoded<T> {
  const errors = Object.keys(object)
    .filter((key) => !knownFields.includes(key))
    .map(
      (key): DocumentJsonError => ({
        kind: "unknown-field",
        path: childPath(path, key),
        message: `unknown field "${key}"`,
      }),
    );
  if (errors.length === 0) {
    return result;
  }
  return Result.err([...errorsOf(result), ...errors]);
}

function decodeRecord<T>(
  value: unknown,
  path: string,
  decodeValue: Decoder<T>,
): Decoded<Readonly<Record<string, T>>> {
  return Result.flatMap(decodeObject(value, path), (object) => {
    const entries = Object.keys(object).map((key) =>
      Result.map(
        decodeValue(object[key], childPath(path, key)),
        (decoded) => [key, decoded] as const,
      ),
    );
    return Result.map(collect(entries), (pairs) => Object.fromEntries(pairs));
  });
}

function decodeFormatVersion(
  value: unknown,
  path: string,
): Decoded<FormatVersion> {
  return Result.flatMap(decodeString(value, path), (text) => {
    const parsed = FormatVersion.tryParse(text);
    if (!parsed.some) {
      return failure(
        "invalid-type",
        path,
        `expected "major.minor" but got "${text}"`,
      );
    }
    return Result.ok(parsed.value);
  });
}

function decodeColor(value: unknown, path: string): Decoded<string> {
  return Result.map(decodeString(value, path), TokenSet.normalizeColor);
}

const SHADOW_TOKEN_FIELDS = ["x", "y", "blur", "spread", "color"] as const;

function decodeShadowToken(value: unknown, path: string): Decoded<ShadowToken> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine5(
        requiredField(object, path, "x", decodeNumber),
        requiredField(object, path, "y", decodeNumber),
        requiredField(object, path, "blur", decodeNumber),
        optionalField(object, path, "spread", decodeNumber),
        requiredField(object, path, "color", decodeColor),
        (x, y, blur, spread, color) => ({
          x,
          y,
          blur,
          ...(spread !== undefined ? { spread } : {}),
          color,
        }),
      ),
      object,
      path,
      SHADOW_TOKEN_FIELDS,
    ),
  );
}

function decodeTypographyToken(
  value: unknown,
  path: string,
): Decoded<TypographyToken> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine4(
        requiredField(object, path, "fontSize", decodeNumber),
        requiredField(object, path, "lineHeight", decodeNumber),
        requiredField(object, path, "fontWeight", decodeNumber),
        optionalField(object, path, "fontFamily", decodeString),
        (fontSize, lineHeight, fontWeight, fontFamily) => ({
          fontSize,
          lineHeight,
          fontWeight,
          ...(fontFamily !== undefined ? { fontFamily } : {}),
        }),
      ),
      object,
      path,
      TypographyToken.fields(),
    ),
  );
}

/** 省略された種別は空として扱う（トークンを1つも持たない種別は書かれない）。 */
function optionalRecordField<T>(
  object: JsonObject,
  path: string,
  key: string,
  decodeValue: Decoder<T>,
): Decoded<Readonly<Record<string, T>>> {
  if (!hasField(object, key)) {
    return Result.ok({});
  }
  return decodeRecord(object[key], childPath(path, key), decodeValue);
}

/** 種別ごとの値の形式は docs/04-tokens.md「値の形式」に従う。 */
function decodeTokenSet(value: unknown, path: string): Decoded<TokenSet> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine5(
        optionalRecordField(object, path, "colors", decodeColor),
        optionalRecordField(object, path, "spacing", decodeNumber),
        optionalRecordField(object, path, "radius", decodeNumber),
        optionalRecordField(object, path, "shadows", decodeShadowToken),
        optionalRecordField(object, path, "typography", decodeTypographyToken),
        (colors, spacing, radius, shadows, typography) => ({
          colors,
          spacing,
          radius,
          shadows,
          typography,
        }),
      ),
      object,
      path,
      TokenSet.kinds(),
    ),
  );
}

function decodePropValue(value: unknown, path: string): Decoded<PropValue> {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return Result.ok(value);
  }
  return failure(
    "invalid-type",
    path,
    `expected string, number or boolean but got ${typeNameOf(value)}`,
  );
}

function decodeProps(value: unknown, path: string): Decoded<Props> {
  return decodeRecord(value, path, decodePropValue);
}

const PRIMITIVE_NODE_FIELDS = ["name", "type", "props", "children"] as const;
const REF_NODE_FIELDS = ["name", "ref", "overrides"] as const;

function decodePrimitiveNode(object: JsonObject, path: string): Decoded<Node> {
  return withKnownFields(
    combine4(
      requiredField(object, path, "name", decodeString),
      requiredField(object, path, "type", decodeString),
      optionalField(object, path, "props", decodeProps),
      optionalField(object, path, "children", decodeNodes),
      (name, type, props, children) => ({
        name,
        type,
        ...(props !== undefined ? { props } : {}),
        ...(children !== undefined ? { children } : {}),
      }),
    ),
    object,
    path,
    PRIMITIVE_NODE_FIELDS,
  );
}

function decodeRefNode(object: JsonObject, path: string): Decoded<Node> {
  return withKnownFields(
    combine3(
      requiredField(object, path, "name", decodeString),
      requiredField(object, path, "ref", decodeString),
      optionalField(object, path, "overrides", decodeProps),
      (name, ref, overrides) => ({
        name,
        ref,
        ...(overrides !== undefined ? { overrides } : {}),
      }),
    ),
    object,
    path,
    REF_NODE_FIELDS,
  );
}

/** ノードは `ref` を持てば参照ノード、`type` を持てばプリミティブノード（docs/01）。 */
function decodeNode(value: unknown, path: string): Decoded<Node> {
  return Result.flatMap(decodeObject(value, path), (object) => {
    if (hasField(object, "ref")) {
      return decodeRefNode(object, path);
    }
    if (hasField(object, "type")) {
      return decodePrimitiveNode(object, path);
    }
    return failure(
      "missing-field",
      path,
      'node must have either "type" or "ref"',
    );
  });
}

function decodeNodes(value: unknown, path: string): Decoded<readonly Node[]> {
  return Result.flatMap(decodeArray(value, path), (items) =>
    collect(
      items.map((item, index) => decodeNode(item, indexPath(path, index))),
    ),
  );
}

const BINDING_FIELDS = ["node", "prop"] as const;

function decodeBinding(
  value: unknown,
  path: string,
): Decoded<PublicPropBinding> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine2(
        requiredField(object, path, "node", decodeString),
        requiredField(object, path, "prop", decodeString),
        (node, prop) => ({ node, prop }),
      ),
      object,
      path,
      BINDING_FIELDS,
    ),
  );
}

function decodePublicProps(value: unknown, path: string): Decoded<PublicProps> {
  return decodeRecord(value, path, decodeBinding);
}

const COMPONENT_FIELDS = ["publicProps", "type", "props", "children"] as const;

/** 部品のルートは辞書キーが `name` を兼ねるため、値側は `name` を持たない（docs/01）。 */
function decodeComponent(value: unknown, path: string): Decoded<Component> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine4(
        optionalField(object, path, "publicProps", decodePublicProps),
        requiredField(object, path, "type", decodeString),
        optionalField(object, path, "props", decodeProps),
        optionalField(object, path, "children", decodeNodes),
        (publicProps, type, props, children) => ({
          type,
          ...(props !== undefined ? { props } : {}),
          ...(children !== undefined ? { children } : {}),
          ...(publicProps !== undefined ? { publicProps } : {}),
        }),
      ),
      object,
      path,
      COMPONENT_FIELDS,
    ),
  );
}

const ARTBOARD_FIELDS = [
  "name",
  "width",
  "height",
  "props",
  "children",
] as const;

function decodeArtboard(value: unknown, path: string): Decoded<Artboard> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine5(
        requiredField(object, path, "name", decodeString),
        requiredField(object, path, "width", decodeNumber),
        requiredField(object, path, "height", decodeNumber),
        optionalField(object, path, "props", decodeProps),
        requiredField(object, path, "children", decodeNodes),
        (name, width, height, props, children) => ({
          name,
          width,
          height,
          ...(props !== undefined ? { props } : {}),
          children,
        }),
      ),
      object,
      path,
      ARTBOARD_FIELDS,
    ),
  );
}

function decodeComponentSet(
  value: unknown,
  path: string,
): Decoded<ComponentSet> {
  return decodeRecord(value, path, decodeComponent);
}

function decodeArtboards(
  value: unknown,
  path: string,
): Decoded<readonly Artboard[]> {
  return Result.flatMap(decodeArray(value, path), (items) =>
    collect(
      items.map((item, index) => decodeArtboard(item, indexPath(path, index))),
    ),
  );
}

const DOCUMENT_FIELDS = [
  "formatVersion",
  "tokens",
  "components",
  "artboards",
] as const;

function decodeDocument(value: unknown, path: string): Decoded<DesignDocument> {
  return Result.flatMap(decodeObject(value, path), (object) =>
    withKnownFields(
      combine4(
        requiredField(object, path, "formatVersion", decodeFormatVersion),
        requiredField(object, path, "tokens", decodeTokenSet),
        requiredField(object, path, "components", decodeComponentSet),
        requiredField(object, path, "artboards", decodeArtboards),
        (formatVersion, tokens, components, artboards) => ({
          formatVersion,
          tokens,
          components,
          artboards,
        }),
      ),
      object,
      path,
      DOCUMENT_FIELDS,
    ),
  );
}

function toDocumentJsonError(error: JsonScanError): DocumentJsonError {
  return {
    kind: error.kind,
    message: error.message,
    position: error.position,
  };
}

type JsonValue =
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | Readonly<{ [key: string]: JsonValue }>;

type JsonObjectValue = Readonly<{ [key: string]: JsonValue }>;

/**
 * 名前がキーの辞書は名前の昇順で書く。
 * キー順を値だけから決めることで、同じ値のドキュメントからは
 * 構築の経緯によらず常に同じテキストが出る（Git diff の劣化防止）。
 */
function sortedRecord<T, U extends JsonValue>(
  record: Readonly<Record<string, T>>,
  serializeValue: (value: T) => U,
): JsonObjectValue {
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, serializeValue(record[key])]),
  );
}

/** 未設定・空の任意フィールドは書かない。 */
function propsField(key: string, props: Props | undefined): JsonObjectValue {
  if (props === undefined || Object.keys(props).length === 0) {
    return {};
  }
  return { [key]: sortedRecord(props, (value) => value) };
}

function childrenField(children: readonly Node[] | undefined): JsonObjectValue {
  if (children === undefined || children.length === 0) {
    return {};
  }
  return { children: children.map(serializeNode) };
}

function publicPropsField(
  publicProps: PublicProps | undefined,
): JsonObjectValue {
  if (publicProps === undefined || Object.keys(publicProps).length === 0) {
    return {};
  }
  return {
    publicProps: sortedRecord(publicProps, (binding) => ({
      node: binding.node,
      prop: binding.prop,
    })),
  };
}

function serializeNode(node: Node): JsonObjectValue {
  if (Node.isRef(node)) {
    return {
      name: node.name,
      ref: node.ref,
      ...propsField("overrides", node.overrides),
    };
  }
  return {
    name: node.name,
    type: node.type,
    ...propsField("props", node.props),
    ...childrenField(node.children),
  };
}

function serializeShadowToken(shadow: ShadowToken): JsonObjectValue {
  return {
    x: shadow.x,
    y: shadow.y,
    blur: shadow.blur,
    ...(shadow.spread !== undefined ? { spread: shadow.spread } : {}),
    color: TokenSet.normalizeColor(shadow.color),
  };
}

function serializeTypographyToken(token: TypographyToken): JsonObjectValue {
  return {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeight,
    ...(token.fontFamily !== undefined ? { fontFamily: token.fontFamily } : {}),
  };
}

function serializeTokenKind(
  tokens: TokenSet,
  kind: TokenKind,
): JsonObjectValue {
  switch (kind) {
    case "colors":
      return sortedRecord(tokens.colors, TokenSet.normalizeColor);
    case "spacing":
      return sortedRecord(tokens.spacing, (value) => value);
    case "radius":
      return sortedRecord(tokens.radius, (value) => value);
    case "shadows":
      return sortedRecord(tokens.shadows, serializeShadowToken);
    case "typography":
      return sortedRecord(tokens.typography, serializeTypographyToken);
  }
}

function serializeTokenSet(tokens: TokenSet): JsonObjectValue {
  return Object.fromEntries(
    TokenSet.kinds()
      .filter((kind) => Object.keys(tokens[kind]).length > 0)
      .map((kind) => [kind, serializeTokenKind(tokens, kind)]),
  );
}

function serializeComponent(component: Component): JsonObjectValue {
  return {
    ...publicPropsField(component.publicProps),
    type: component.type,
    ...propsField("props", component.props),
    ...childrenField(component.children),
  };
}

function serializeArtboard(artboard: Artboard): JsonObjectValue {
  return {
    name: artboard.name,
    width: artboard.width,
    height: artboard.height,
    ...propsField("props", artboard.props),
    children: artboard.children.map(serializeNode),
  };
}

function serializeComponentSet(components: ComponentSet): JsonObjectValue {
  return sortedRecord(components, serializeComponent);
}

function serializeDocument(document: DesignDocument): JsonObjectValue {
  return {
    formatVersion: FormatVersion.format(document.formatVersion),
    tokens: serializeTokenSet(document.tokens),
    components: serializeComponentSet(document.components),
    artboards: document.artboards.map(serializeArtboard),
  };
}

const INDENT_WIDTH = 2;

export const DocumentJson = {
  /**
   * JSON テキストをドキュメントへ読み込む。
   *
   * 検証するのは「テキストとして壊れていないか」（字句スキャン）と
   * 「形が合っているか」（構造のデコード）まで。
   * スキーマ検証は `DesignDocument.collectErrors`、
   * formatVersion の互換性判定は `DesignDocument.compatibility` の担当。
   */
  parse(text: string): Result<DesignDocument, readonly DocumentJsonError[]> {
    const scanErrors = JsonLexicalScanner.scan(text);
    if (scanErrors.length > 0) {
      return Result.err(scanErrors.map(toDocumentJsonError));
    }
    return Result.flatMap(parseJson(text), (value) =>
      decodeDocument(value, ""),
    );
  },

  /**
   * ドキュメントを JSON テキストへ書き出す。
   *
   * 書くのは明示的に設定された値だけで、スキーマのデフォルト値は書かない
   * （ドキュメントはそもそも明示的な props しか保持しない）。
   */
  serialize(document: DesignDocument): string {
    return `${JSON.stringify(serializeDocument(document), null, INDENT_WIDTH)}\n`;
  },
} as const;

/**
 * 字句スキャンを通っていれば `JSON.parse` は成功するが、
 * 「例外を散らさない」ために失敗も値として扱う。
 */
function parseJson(text: string): Decoded<unknown> {
  try {
    const value: unknown = JSON.parse(text);
    return Result.ok(value);
  } catch (error) {
    return Result.err([
      {
        kind: "syntax-error",
        message: error instanceof Error ? error.message : String(error),
        position: 0,
      },
    ]);
  }
}
