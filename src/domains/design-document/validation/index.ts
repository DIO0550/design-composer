import type { Artboard } from "@/domains/artboard";
import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/component";
import { ComponentBinding } from "@/domains/component-binding";
import { NameSpace } from "@/domains/name-space";
import { Node, Props, type RefNode } from "@/domains/node";
import type { PropValidationError } from "@/domains/primitive-schema";
import {
  BoxSchema,
  PrimitiveSchema,
  PropDefinition,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import type { DesignDocumentV2 as DesignDocument } from "../v2";

/** ドキュメントが不正になる理由（docs/03-schema.md「バリデーション仕様」）。 */
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

/** 不正 1 件。どのノードのどの prop かと、診断用のメッセージを持つ。 */
export type DesignDocumentValidationError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

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

/**
 * 位置を持たないエラーに発生位置を付与し、報告用のエラーに変換する。
 *
 * @param location 付与する発生位置。`prop` はエラー自身が持つものを優先する
 * @param errors 位置を持たないエラーの並び
 * @returns 位置の付いた報告用のエラーの並び
 */
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

/**
 * 型に対応するスキーマで props を照らす。未知の型はその場でエラーにする。
 *
 * @param type ノードの型名
 * @param props 照らす対象の props（未設定なら空として扱う）
 * @param tokens トークン参照の解決に使うトークン一式
 * @returns 未知の型・宣言違反・値域違反のエラーの並び
 */
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

/**
 * ノードとその子孫の props をスキーマで照らす。部品インスタンスは対象外。
 *
 * @param node 起点のノード
 * @param tokens トークン参照の解決に使うトークン一式
 * @returns 自身と子孫の props のエラーの並び（部品インスタンスは空）
 */
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
export type ReferenceContext = Readonly<{
  components: ComponentSet;
  tokens: TokenSet;
}>;

/**
 * インスタンスの overrides が、参照先の公開 prop の宣言と値域に収まっているか。
 *
 * @param context 部品とトークンの一式
 * @param refNode overrides を持つインスタンスのノード
 * @param component 参照先の部品
 * @returns 未宣言の override・値域違反のエラーの並び
 */
function collectOverrideErrors(
  context: ReferenceContext,
  refNode: RefNode,
  component: Component,
): readonly UnlocatedError[] {
  return Props.toAssignments(refNode.overrides ?? {}).flatMap(
    (assignment): readonly UnlocatedError[] => {
      const binding = Component.binding(component, assignment.name);
      if (!binding.some) {
        return [
          {
            kind: "undeclared-override" as const,
            prop: assignment.name,
            message: `component "${refNode.ref}" does not declare public prop "${assignment.name}"`,
          },
        ];
      }
      const definition = ComponentBinding.resolvePropDefinition(
        context.components,
        ComponentBinding.create(refNode.ref, binding.value),
      );
      if (!definition.some) {
        return [];
      }
      return PropDefinition.collectErrors(
        definition.value,
        assignment,
        context.tokens,
      );
    },
  );
}

/**
 * インスタンスの参照先が存在するか、展開が自分自身へ戻らないか。
 *
 * @param context 部品とトークンの一式
 * @param refNode 検証するインスタンスのノード
 * @returns 参照先が無い場合の dangling-ref と、overrides のエラーの並び
 */
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

/**
 * ノードとその子孫に含まれる部品参照を、位置を付けて集める。
 *
 * @param context 部品とトークンの一式
 * @param node 起点のノード
 * @returns 自身と子孫のインスタンスについて、位置の付いたエラーの並び
 */
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

/**
 * binding が指す内部ノードと prop が実在し、値域に収まっているか。
 *
 * @param context 部品とトークンの一式
 * @param binding 検証する公開 prop の binding
 * @param target binding が指している内部ノード
 * @returns 指し先の prop が無い場合・値域違反のエラーの並び
 */
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

/**
 * 部品の publicProps が宣言している binding をすべて照らす。
 *
 * @param context 部品とトークンの一式
 * @param componentName エラーの位置に使う部品名
 * @param component 検証する部品
 * @returns 指し先のノードが無い場合を含む、位置の付いたエラーの並び
 */
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

/**
 * 部品どうしの参照が輪になっているものを報告する。
 *
 * @param components 検証する部品の一式
 * @returns 輪に含まれる部品ごとの circular-ref エラーの並び
 */
export function collectCircularRefErrors(
  components: ComponentSet,
): readonly DesignDocumentValidationError[] {
  return ComponentSet.circularNames(components).map((name) => ({
    kind: "circular-ref" as const,
    nodeName: name,
    message: `component "${name}" is part of a circular reference`,
  }));
}

/**
 * 部品1件の props・子ノード・binding・参照のエラーを集める。
 *
 * @param context 部品とトークンの一式
 * @param name エラーの位置に使う部品名
 * @param component 検証する部品
 * @returns 位置の付いたエラーの並び
 */
export function collectComponentErrors(
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

/**
 * artboard 1件の props・子ノード・参照のエラーを集める。
 *
 * @param context 部品とトークンの一式
 * @param artboard 検証する artboard
 * @returns 位置の付いたエラーの並び
 */
export function collectArtboardErrors(
  context: ReferenceContext,
  artboard: Artboard,
): readonly DesignDocumentValidationError[] {
  const propErrors = withLocation(
    { nodeName: artboard.name },
    PropDefinitionRecord.collectErrors(
      BoxSchema.props,
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

/**
 * 単一の名前空間の中で重複している名前（docs/02-data-model.md「名前の一意性」）。
 *
 * @param document 名前を集める対象のドキュメント
 * @returns 重複している名前ごとの duplicate-name エラーの並び
 */
function collectDuplicateNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  return NameSpace.duplicatedNames(
    NameSpace.create(
      NameSpace.collectNames(document.components, document.artboards),
    ),
  ).map(
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
 *
 * @param name 検証する名前
 * @param ownerName その名前を含む入れ物の名前
 * @param position 入れ物内での位置（`child 0` / `key "x"` など）
 * @returns 空なら missing-name、識別子の規則を満たさなければ invalid-identifier。
 *   問題なければ空
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
  if (!NameSpace.isValidIdentifier(name)) {
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

/**
 * ノードとその子孫の name が、欠落せず識別子の規則を満たしているか。
 *
 * @param nodes 検証するノードの並び
 * @param ownerName 名前が欠落しているときに位置として出す入れ物の名前
 * @returns 自身と子孫の名前のエラーの並び
 */
function collectNodeNameErrors(
  nodes: readonly Node[],
  ownerName: string,
): readonly DesignDocumentValidationError[] {
  return nodes.flatMap((node, index) => [
    ...collectNameErrors(node.name, ownerName, `child ${index}`),
    ...collectNodeNameErrors(Node.children(node), node.name || ownerName),
  ]);
}

/**
 * すべての種別のトークン名が識別子の規則を満たしているか。
 *
 * @param tokens 検証するトークン一式
 * @returns 規則を満たさない名前ごとの invalid-identifier エラーの並び
 */
function collectTokenNameErrors(
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  return TokenSet.kinds().flatMap((kind) =>
    TokenSet.names(tokens, kind).flatMap(
      (name): readonly DesignDocumentValidationError[] =>
        NameSpace.isValidIdentifier(name)
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

/**
 * ドキュメント全体の名前（部品・artboard・ノード・トークン）のエラーを集める。
 *
 * @param document 検証するドキュメント
 * @returns 欠落・識別子違反・重複を含む、名前のエラーの並び
 */
export function collectDocumentNameErrors(
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
