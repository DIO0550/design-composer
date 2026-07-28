import { Artboard } from "@/domains/artboard";
import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
} from "@/domains/format-version";
import { Node, type Props, type RefNode } from "@/domains/node";
import type { PropValidationError } from "@/domains/primitive-schema";
import {
  BOX_SCHEMA,
  PrimitiveSchema,
  PropDefinition,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { ArrayEx } from "@/utils/ArrayEx";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type DesignDocument = Readonly<{
  formatVersion: FormatVersion;
  tokens: TokenSet;
  components: ComponentSet;
  artboards: readonly Artboard[];
}>;

/** ドキュメントが JSON 上で持つトップレベルフィールド(docs/01-file-format.md)。 */
const DOCUMENT_FIELDS = [
  "formatVersion",
  "tokens",
  "components",
  "artboards",
] as const;

export type DesignDocumentValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type"
  | "dangling-ref"
  | "circular-ref"
  | "undeclared-override"
  | "dangling-binding-node"
  | "dangling-binding-prop"
  | "missing-name"
  | "invalid-identifier"
  | "duplicate-name";

export type DesignDocumentValidationError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

/**
 * ツリー編集操作（挿入・削除・並べ替え・移動・部品化）が失敗する理由。
 * 呼び出し側が種類で分岐できるよう、メッセージ文字列ではなく直和で列挙する。
 */
export type DesignDocumentEditError =
  | Readonly<{ kind: "node-not-found"; name: string }>
  | Readonly<{ kind: "parent-not-found"; name: string }>
  | Readonly<{ kind: "artboard-not-found"; name: string }>
  | Readonly<{ kind: "children-not-allowed"; name: string }>
  | Readonly<{ kind: "move-into-descendant"; name: string; parentName: string }>
  | Readonly<{ kind: "ref-node-not-supported"; name: string }>
  | Readonly<{ kind: "duplicate-name"; name: string }>
  | Readonly<{ kind: "index-out-of-range"; index: number; length: number }>;

export const DesignDocumentEditError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   */
  message(error: DesignDocumentEditError): string {
    switch (error.kind) {
      case "node-not-found":
        return `node "${error.name}" not found`;
      case "parent-not-found":
        return `parent "${error.name}" not found`;
      case "artboard-not-found":
        return `artboard "${error.name}" not found`;
      case "children-not-allowed":
        return `node "${error.name}" cannot have children`;
      case "move-into-descendant":
        return `cannot move node "${error.name}" into itself or its own descendant`;
      case "ref-node-not-supported":
        return `cannot create a component from ref node "${error.name}"`;
      case "duplicate-name":
        return `name "${error.name}" is already used`;
      case "index-out-of-range":
        return `index ${error.index} is out of bounds for length ${error.length}`;
    }
  },
} as const;

function canNodeHaveChildren(node: Node): boolean {
  return Node.isPrimitive(node) && PrimitiveSchema.allowsChildren(node.type);
}

/** 範囲外の index を throw ではなく `index-out-of-range` として返す挿入。 */
function insertedAt<T>(
  items: readonly T[],
  index: number,
  item: T,
): Result<readonly T[], DesignDocumentEditError> {
  if (!ArrayEx.isInsertionIndexInRange(items, index)) {
    return Result.err({
      kind: "index-out-of-range",
      index,
      length: items.length,
    });
  }
  return Result.ok(ArrayEx.insertAt(items, index, item));
}

/** 範囲外の index を throw ではなく `index-out-of-range` として返す並べ替え。 */
function movedWithin<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): Result<readonly T[], DesignDocumentEditError> {
  const outOfRange = [fromIndex, toIndex].find(
    (index) => !ArrayEx.isIndexInRange(items, index),
  );
  if (outOfRange !== undefined) {
    return Result.err({
      kind: "index-out-of-range",
      index: outOfRange,
      length: items.length,
    });
  }
  return Result.ok(ArrayEx.moveWithin(items, fromIndex, toIndex));
}

/** 兄弟の並びの差し替え。失敗しない（対象が見つかったかどうかは呼び出し側が判断する）。 */
type SiblingsUpdate = (siblings: readonly Node[]) => readonly Node[];

/** 親の children の差し替え。範囲外 index などで失敗しうる。 */
type ChildrenUpdate = (
  children: readonly Node[],
) => Result<readonly Node[], DesignDocumentEditError>;

type NodesUpdate = Readonly<{ updated: readonly Node[]; found: boolean }>;

type ArtboardsUpdate = Readonly<{
  artboards: readonly Artboard[];
  found: boolean;
}>;

function updateChildrenOfNode(
  nodes: readonly Node[],
  parentName: string,
  update: ChildrenUpdate,
): Result<NodesUpdate, DesignDocumentEditError> {
  const parentIndex = nodes.findIndex((node) => node.name === parentName);
  if (parentIndex !== -1) {
    const parent = nodes[parentIndex];
    if (!canNodeHaveChildren(parent)) {
      return Result.err({ kind: "children-not-allowed", name: parentName });
    }
    return Result.map(update(Node.children(parent)), (children) => ({
      updated: ArrayEx.replaceAt(nodes, parentIndex, { ...parent, children }),
      found: true,
    }));
  }

  const hostIndex = nodes.findIndex(
    (node) => findNode(Node.children(node), parentName).some,
  );
  if (hostIndex === -1) {
    return Result.ok({ updated: nodes, found: false });
  }
  const host = nodes[hostIndex];
  return Result.map(
    updateChildrenOfNode(Node.children(host), parentName, update),
    (result) => ({
      updated: ArrayEx.replaceAt(nodes, hostIndex, {
        ...host,
        children: result.updated,
      }),
      found: true,
    }),
  );
}

function updateChildrenOfParent(
  artboards: readonly Artboard[],
  parentName: string,
  update: ChildrenUpdate,
): Result<ArtboardsUpdate, DesignDocumentEditError> {
  const artboardIndex = artboards.findIndex(
    (artboard) => artboard.name === parentName,
  );
  if (artboardIndex !== -1) {
    const artboard = artboards[artboardIndex];
    return Result.map(update(artboard.children), (children) => ({
      artboards: ArrayEx.replaceAt(artboards, artboardIndex, {
        ...artboard,
        children,
      }),
      found: true,
    }));
  }

  const hostIndex = artboards.findIndex(
    (artboard) => findNode(artboard.children, parentName).some,
  );
  if (hostIndex === -1) {
    return Result.ok({ artboards, found: false });
  }
  const host = artboards[hostIndex];
  return Result.map(
    updateChildrenOfNode(host.children, parentName, update),
    (result) => ({
      artboards: ArrayEx.replaceAt(artboards, hostIndex, {
        ...host,
        children: result.updated,
      }),
      found: true,
    }),
  );
}

function updateSiblingsOfNode(
  nodes: readonly Node[],
  name: string,
  update: SiblingsUpdate,
): { updated: readonly Node[]; found: boolean } {
  if (nodes.some((node) => node.name === name)) {
    return { updated: update(nodes), found: true };
  }
  let found = false;
  const updated = nodes.map((node) => {
    if (found) {
      return node;
    }
    const children = Node.children(node);
    if (children.length === 0) {
      return node;
    }
    const result = updateSiblingsOfNode(children, name, update);
    if (result.found) {
      found = true;
      return { ...node, children: result.updated };
    }
    return node;
  });
  return { updated, found };
}

function findNode(nodes: readonly Node[], name: string): Option<Node> {
  for (const node of nodes) {
    if (node.name === name) {
      return Option.some(node);
    }
    const found = findNode(Node.children(node), name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

function findNodeInArtboards(
  artboards: readonly Artboard[],
  name: string,
): Option<Node> {
  for (const artboard of artboards) {
    const found = findNode(artboard.children, name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

function updateSiblingsOfArtboards(
  artboards: readonly Artboard[],
  name: string,
  update: SiblingsUpdate,
): { artboards: readonly Artboard[]; found: boolean } {
  let found = false;
  const updated = artboards.map((artboard) => {
    if (found) {
      return artboard;
    }
    const result = updateSiblingsOfNode(artboard.children, name, update);
    if (result.found) {
      found = true;
      return { ...artboard, children: result.updated };
    }
    return artboard;
  });
  return { artboards: updated, found };
}

/**
 * 発生位置（nodeName / prop）を持たないエラー。
 * 位置は検出側ではなく、その位置を知っている呼び出し側で付与する。
 */
type UnlocatedError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  prop?: string;
  message: string;
}>;

/** エラーの発生位置。 */
type ErrorLocation = Readonly<{
  nodeName: string;
  prop?: string;
}>;

/** 位置を持たないエラーに発生位置を付与し、報告用のエラーに変換する。 */
function withLocation(
  location: ErrorLocation,
  errors: readonly UnlocatedError[],
): readonly DesignDocumentValidationError[] {
  return errors.map((error) => {
    const prop = error.prop ?? location.prop;
    return {
      kind: error.kind,
      nodeName: location.nodeName,
      ...(prop !== undefined ? { prop } : {}),
      message: error.message,
    };
  });
}

function collectTypedPropErrors(
  type: string,
  props: Props | undefined,
  tokens: TokenSet,
): readonly UnlocatedError[] {
  if (!PrimitiveSchema.isPrimitiveType(type)) {
    return [{ kind: "unknown-type", message: `unknown type "${type}"` }];
  }
  const schema = PrimitiveSchema.forType(type);
  return PropDefinitionRecord.collectErrors(schema.props, props ?? {}, tokens);
}

function collectNodeErrors(
  node: Node,
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return [];
  }
  const ownErrors = withLocation(
    { nodeName: node.name },
    collectTypedPropErrors(node.type, node.props, tokens),
  );
  const childErrors = Node.children(node).flatMap((child) =>
    collectNodeErrors(child, tokens),
  );
  return [...ownErrors, ...childErrors];
}

/** 参照検証が横断的に必要とする、ドキュメント全体の文脈。 */
type ReferenceContext = Readonly<{
  components: ComponentSet;
  tokens: TokenSet;
}>;

/**
 * binding が最終的に指すプリミティブ prop の定義を解決する。
 * binding 先が ref ノードの場合は参照先部品の publicProps を辿る（インターフェースの連鎖）。
 * 解決できない場合は binding 自体が不整合であり、binding 検証側で報告される。
 */
function resolvePropDefinition(
  context: ReferenceContext,
  componentName: string,
  binding: PublicPropBinding,
  visited: ReadonlySet<string>,
): Option<PropDefinition> {
  const component = ComponentSet.get(context.components, componentName);
  if (component === undefined) {
    return Option.none;
  }
  const found = Component.findNode(component, componentName, binding.node);
  if (!found.some) {
    return Option.none;
  }
  const target = found.value;
  if (Node.isPrimitive(target)) {
    if (!PrimitiveSchema.isPrimitiveType(target.type)) {
      return Option.none;
    }
    const schema: PrimitiveSchema = PrimitiveSchema.forType(target.type);
    return Option.fromNullable(schema.props[binding.prop]);
  }
  if (visited.has(target.ref)) {
    return Option.none;
  }
  const nested = ComponentSet.get(context.components, target.ref);
  if (nested === undefined) {
    return Option.none;
  }
  const nestedBinding = Component.binding(nested, binding.prop);
  if (!nestedBinding.some) {
    return Option.none;
  }
  return resolvePropDefinition(
    context,
    target.ref,
    nestedBinding.value,
    new Set(visited).add(target.ref),
  );
}

function collectOverrideErrors(
  context: ReferenceContext,
  refNode: RefNode,
  component: Component,
): readonly UnlocatedError[] {
  return Object.entries(refNode.overrides ?? {}).flatMap(
    ([propName, value]): readonly UnlocatedError[] => {
      const binding = Component.binding(component, propName);
      if (!binding.some) {
        return [
          {
            kind: "undeclared-override" as const,
            prop: propName,
            message: `component "${refNode.ref}" does not declare public prop "${propName}"`,
          },
        ];
      }
      const definition = resolvePropDefinition(
        context,
        refNode.ref,
        binding.value,
        new Set([refNode.ref]),
      );
      if (!definition.some) {
        return [];
      }
      return PropDefinition.collectErrors(
        definition.value,
        propName,
        value,
        context.tokens,
      );
    },
  );
}

function collectRefNodeErrors(
  context: ReferenceContext,
  refNode: RefNode,
): readonly UnlocatedError[] {
  const component = ComponentSet.get(context.components, refNode.ref);
  if (component === undefined) {
    return [
      {
        kind: "dangling-ref",
        message: `unknown component "${refNode.ref}"`,
      },
    ];
  }
  return collectOverrideErrors(context, refNode, component);
}

function collectNodeRefErrors(
  context: ReferenceContext,
  node: Node,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return withLocation(
      { nodeName: node.name },
      collectRefNodeErrors(context, node),
    );
  }
  return Node.children(node).flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
}

function collectBindingTargetErrors(
  context: ReferenceContext,
  binding: PublicPropBinding,
  target: Node,
): readonly UnlocatedError[] {
  if (Node.isRef(target)) {
    const nested = ComponentSet.get(context.components, target.ref);
    if (nested === undefined || Component.isPublicProp(nested, binding.prop)) {
      return [];
    }
    return [
      {
        kind: "dangling-binding-prop",
        message: `"${binding.prop}" is not a public prop of component "${target.ref}"`,
      },
    ];
  }
  if (!PrimitiveSchema.isPrimitiveType(target.type)) {
    return [];
  }
  const schema: PrimitiveSchema = PrimitiveSchema.forType(target.type);
  if (binding.prop in schema.props) {
    return [];
  }
  return [
    {
      kind: "dangling-binding-prop",
      message: `node "${binding.node}" has no prop "${binding.prop}"`,
    },
  ];
}

function collectBindingErrors(
  context: ReferenceContext,
  componentName: string,
  component: Component,
): readonly DesignDocumentValidationError[] {
  return Component.publicPropNames(component).flatMap((publicPropName) => {
    const binding = Component.binding(component, publicPropName);
    if (!binding.some) {
      return [];
    }
    const location: ErrorLocation = {
      nodeName: componentName,
      prop: publicPropName,
    };
    const found = Component.findNode(
      component,
      componentName,
      binding.value.node,
    );
    if (!found.some) {
      return withLocation(location, [
        {
          kind: "dangling-binding-node",
          message: `unknown node "${binding.value.node}"`,
        },
      ]);
    }
    return withLocation(
      location,
      collectBindingTargetErrors(context, binding.value, found.value),
    );
  });
}

function collectCircularRefErrors(
  components: ComponentSet,
): readonly DesignDocumentValidationError[] {
  return ComponentSet.circularNames(components).map((name) => ({
    kind: "circular-ref" as const,
    nodeName: name,
    message: `component "${name}" is part of a circular reference`,
  }));
}

function collectComponentErrors(
  context: ReferenceContext,
  name: string,
  component: Component,
): readonly DesignDocumentValidationError[] {
  const children = component.children ?? [];
  const propErrors = withLocation(
    { nodeName: name },
    collectTypedPropErrors(component.type, component.props, context.tokens),
  );
  const childErrors = children.flatMap((child) =>
    collectNodeErrors(child, context.tokens),
  );
  const bindingErrors = collectBindingErrors(context, name, component);
  const refErrors = children.flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
  return [...propErrors, ...childErrors, ...bindingErrors, ...refErrors];
}

function collectArtboardErrors(
  context: ReferenceContext,
  artboard: Artboard,
): readonly DesignDocumentValidationError[] {
  const propErrors = withLocation(
    { nodeName: artboard.name },
    PropDefinitionRecord.collectErrors(
      BOX_SCHEMA.props,
      artboard.props ?? {},
      context.tokens,
    ),
  );
  const childErrors = artboard.children.flatMap((child) =>
    collectNodeErrors(child, context.tokens),
  );
  const refErrors = artboard.children.flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
  return [...propErrors, ...childErrors, ...refErrors];
}

function toComponent(node: Node): Result<Component, DesignDocumentEditError> {
  if (!Node.isPrimitive(node)) {
    return Result.err({ kind: "ref-node-not-supported", name: node.name });
  }
  return Result.ok({
    type: node.type,
    ...(node.props !== undefined ? { props: node.props } : {}),
    ...(node.children !== undefined ? { children: node.children } : {}),
  });
}

/**
 * 識別子の規則: kebab-case（使用可能文字は `[a-z0-9-]`）。
 * 先頭・末尾のハイフンと連続ハイフンは許さない。
 * 将来のパス修飾のために予約された `/` `#` `.` はこのパターンで弾かれる。
 */
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * ドキュメント全体の単一名前空間に属する名前を集める。
 * 対象は components のキー・artboard 名・全ノードの `name`（部品内部を含む）。
 * トークン名は種別内で一意なだけなので、この名前空間には含めない。
 */
function collectAllNames(document: DesignDocument): readonly string[] {
  const componentNames = ComponentSet.names(document.components).flatMap(
    (name): readonly string[] => {
      const component = ComponentSet.get(document.components, name);
      return [name, ...(component?.children ?? []).flatMap(Node.collectNames)];
    },
  );
  const artboardNames = document.artboards.flatMap(
    (artboard): readonly string[] => [
      artboard.name,
      ...artboard.children.flatMap(Node.collectNames),
    ],
  );
  return [...componentNames, ...artboardNames];
}

/** 2回以上現れる名前を、最初に現れた順で1つずつ返す。 */
function duplicatedNames(names: readonly string[]): readonly string[] {
  return names.filter(
    (name, index) =>
      names.indexOf(name) === index && names.lastIndexOf(name) !== index,
  );
}

function collectDuplicateNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  return duplicatedNames(collectAllNames(document)).map(
    (name): DesignDocumentValidationError => ({
      kind: "duplicate-name",
      nodeName: name,
      message: `name "${name}" is not unique in the document`,
    }),
  );
}

/**
 * 名前1つを検証する。
 * 名前が欠落している場合は自身の名前で位置を示せないため、
 * その名前を含む入れ物（`ownerName`）と入れ物内での位置（`position`）を引数で受け取る。
 */
function collectNameErrors(
  name: string,
  ownerName: string,
  position: string,
): readonly DesignDocumentValidationError[] {
  if (!name) {
    return [
      {
        kind: "missing-name",
        nodeName: ownerName,
        message: `${position} of "${ownerName}" has no name`,
      },
    ];
  }
  if (!IDENTIFIER_PATTERN.test(name)) {
    return [
      {
        kind: "invalid-identifier",
        nodeName: name,
        message: `name "${name}" is not a valid identifier`,
      },
    ];
  }
  return [];
}

function collectNodeNameErrors(
  nodes: readonly Node[],
  ownerName: string,
): readonly DesignDocumentValidationError[] {
  return nodes.flatMap((node, index) => [
    ...collectNameErrors(node.name, ownerName, `child ${index}`),
    ...collectNodeNameErrors(Node.children(node), node.name || ownerName),
  ]);
}

function collectTokenNameErrors(
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  return TokenSet.kinds().flatMap((kind) =>
    TokenSet.names(tokens, kind).flatMap(
      (name): readonly DesignDocumentValidationError[] =>
        IDENTIFIER_PATTERN.test(name)
          ? []
          : [
              {
                kind: "invalid-identifier",
                nodeName: name,
                message: `token name "${name}" in ${kind} is not a valid identifier`,
              },
            ],
    ),
  );
}

function collectDocumentNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  const componentErrors = ComponentSet.names(document.components).flatMap(
    (name): readonly DesignDocumentValidationError[] => {
      const component = ComponentSet.get(document.components, name);
      return [
        ...collectNameErrors(name, "components", `key "${name}"`),
        ...collectNodeNameErrors(component?.children ?? [], name),
      ];
    },
  );
  const artboardErrors = document.artboards.flatMap(
    (artboard, index): readonly DesignDocumentValidationError[] => [
      ...collectNameErrors(artboard.name, "artboards", `artboard ${index}`),
      ...collectNodeNameErrors(artboard.children, artboard.name),
    ],
  );
  return [
    ...componentErrors,
    ...artboardErrors,
    ...collectDuplicateNameErrors(document),
    ...collectTokenNameErrors(document.tokens),
  ];
}

function nextAvailableName(
  baseName: string,
  usedNames: ReadonlySet<string>,
): string {
  if (!usedNames.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (usedNames.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

function generateRenameMap(
  names: readonly string[],
  usedNames: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const taken = new Set(usedNames);
  const renameMap: Record<string, string> = {};
  for (const name of names) {
    const newName = nextAvailableName(name, taken);
    renameMap[name] = newName;
    taken.add(newName);
  }
  return renameMap;
}

export const DesignDocument = {
  create(params: {
    formatVersion?: FormatVersion;
    tokens?: TokenSet;
    components?: ComponentSet;
    artboards?: readonly Artboard[];
  }): DesignDocument {
    return {
      formatVersion: params.formatVersion ?? FormatVersion.CURRENT,
      tokens: params.tokens ?? TokenSet.empty(),
      components: params.components ?? {},
      artboards: params.artboards ?? [],
    };
  },

  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },

  /**
   * JSON のデータモデルからドキュメントを組み立てる。
   * 検証するのは形（必須フィールド・型・未知フィールド）だけで、
   * スキーマ検証は `DesignDocument.collectErrors`、
   * formatVersion の互換性判定は `DesignDocument.compatibility` の担当。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocument> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine4(
          Json.required(record, "formatVersion", FormatVersion.fromJson),
          Json.required(record, "tokens", TokenSet.fromJson),
          Json.required(record, "components", ComponentSet.fromJson),
          Json.required(record, "artboards", (artboards) =>
            Json.arrayOf(artboards, Artboard.fromJson),
          ),
          (formatVersion, tokens, components, artboards) => ({
            formatVersion,
            tokens,
            components,
            artboards,
          }),
        ),
        record,
        DOCUMENT_FIELDS,
      ),
    );
  },

  /**
   * ドキュメントを JSON のデータモデルへ落とす。
   * 明示的に設定された値だけを書き、スキーマのデフォルト値は書かない
   * （ドキュメントはそもそも明示的な props しか保持しない）。
   */
  toJson(document: DesignDocument): JsonObject {
    return {
      formatVersion: FormatVersion.format(document.formatVersion),
      tokens: TokenSet.toJson(document.tokens),
      components: ComponentSet.toJson(document.components),
      artboards: document.artboards.map(Artboard.toJson),
    };
  },

  insertNode(
    document: DesignDocument,
    parentName: string,
    index: number,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.flatMap(
      updateChildrenOfParent(document.artboards, parentName, (children) =>
        insertedAt(children, index, node),
      ),
      (result) =>
        result.found
          ? Result.ok({ ...document, artboards: result.artboards })
          : Result.err({ kind: "parent-not-found", name: parentName }),
    );
  },

  removeNode(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const result = updateSiblingsOfArtboards(
      document.artboards,
      name,
      (siblings) => siblings.filter((sibling) => sibling.name !== name),
    );
    if (!result.found) {
      return Result.err({ kind: "node-not-found", name });
    }
    return Result.ok({ ...document, artboards: result.artboards });
  },

  findNode(document: DesignDocument, name: string): Option<Node> {
    return findNodeInArtboards(document.artboards, name);
  },

  replaceNode(
    document: DesignDocument,
    name: string,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const result = updateSiblingsOfArtboards(
      document.artboards,
      name,
      (siblings) =>
        siblings.map((sibling) => (sibling.name === name ? node : sibling)),
    );
    if (!result.found) {
      return Result.err({ kind: "node-not-found", name });
    }
    return Result.ok({ ...document, artboards: result.artboards });
  },

  reorderNode(
    document: DesignDocument,
    parentName: string,
    fromIndex: number,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.flatMap(
      updateChildrenOfParent(document.artboards, parentName, (children) =>
        movedWithin(children, fromIndex, toIndex),
      ),
      (result) =>
        result.found
          ? Result.ok({ ...document, artboards: result.artboards })
          : Result.err({ kind: "parent-not-found", name: parentName }),
    );
  },

  moveNode(
    document: DesignDocument,
    name: string,
    newParentName: string,
    index: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = findNodeInArtboards(document.artboards, name);
    if (!found.some) {
      return Result.err({ kind: "node-not-found", name });
    }
    const node = found.value;
    if (Node.collectNames(node).includes(newParentName)) {
      return Result.err({
        kind: "move-into-descendant",
        name,
        parentName: newParentName,
      });
    }
    return Result.flatMap(
      DesignDocument.removeNode(document, name),
      (without) =>
        DesignDocument.insertNode(without, newParentName, index, node),
    );
  },

  createComponent(
    document: DesignDocument,
    name: string,
    componentName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = findNodeInArtboards(document.artboards, name);
    if (!found.some) {
      return Result.err({ kind: "node-not-found", name });
    }
    if (DesignDocument.usedNames(document).has(componentName)) {
      return Result.err({ kind: "duplicate-name", name: componentName });
    }
    return Result.map(toComponent(found.value), (component) => {
      const refNode: RefNode = { name, ref: componentName };
      const result = updateSiblingsOfArtboards(
        document.artboards,
        name,
        (siblings) =>
          siblings.map((sibling) =>
            sibling.name === name ? refNode : sibling,
          ),
      );
      return {
        ...document,
        components: { ...document.components, [componentName]: component },
        artboards: result.artboards,
      };
    });
  },

  insertArtboard(
    document: DesignDocument,
    index: number,
    artboard: Artboard,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      insertedAt(document.artboards, index, artboard),
      (artboards) => ({ ...document, artboards }),
    );
  },

  removeArtboard(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const index = document.artboards.findIndex(
      (artboard) => artboard.name === name,
    );
    if (index === -1) {
      return Result.err({ kind: "artboard-not-found", name });
    }
    return Result.ok({
      ...document,
      artboards: [
        ...document.artboards.slice(0, index),
        ...document.artboards.slice(index + 1),
      ],
    });
  },

  reorderArtboard(
    document: DesignDocument,
    fromIndex: number,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      movedWithin(document.artboards, fromIndex, toIndex),
      (artboards) => ({ ...document, artboards }),
    );
  },

  usedNames(document: DesignDocument): ReadonlySet<string> {
    return new Set(collectAllNames(document));
  },

  isValidIdentifier(name: string): boolean {
    return IDENTIFIER_PATTERN.test(name);
  },

  uniqueName(baseName: string, usedNames: ReadonlySet<string>): string {
    return nextAvailableName(baseName, usedNames);
  },

  renameSubtree(
    nodes: readonly Node[],
    usedNames: ReadonlySet<string>,
  ): { nodes: readonly Node[]; renameMap: Readonly<Record<string, string>> } {
    const renameMap = generateRenameMap(
      nodes.flatMap(Node.collectNames),
      usedNames,
    );
    return {
      nodes: nodes.map((node) => Node.rename(node, renameMap)),
      renameMap,
    };
  },

  collectErrors(
    document: DesignDocument,
  ): readonly DesignDocumentValidationError[] {
    const context: ReferenceContext = {
      components: document.components,
      tokens: document.tokens,
    };

    const componentErrors = ComponentSet.names(document.components).flatMap(
      (name) => {
        const component = ComponentSet.get(document.components, name);
        if (component === undefined) {
          return [];
        }
        return collectComponentErrors(context, name, component);
      },
    );
    const artboardErrors = document.artboards.flatMap((artboard) =>
      collectArtboardErrors(context, artboard),
    );
    const circularErrors = collectCircularRefErrors(document.components);
    const nameErrors = collectDocumentNameErrors(document);

    return [
      ...componentErrors,
      ...artboardErrors,
      ...circularErrors,
      ...nameErrors,
    ];
  },
} as const;
