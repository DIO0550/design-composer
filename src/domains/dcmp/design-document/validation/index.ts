import { Artboard } from "@/domains/dcmp/artboard";
import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/dcmp/component";
import {
  type BindingViolation,
  ComponentBinding,
} from "@/domains/dcmp/component-binding";
import {
  DocumentNames,
  type NamePosition,
  type NameViolation,
} from "@/domains/dcmp/document-names";
import { Layout } from "@/domains/dcmp/layout";
import { Node, type Props, type RefNode } from "@/domains/dcmp/node";
import type { PropValidationError } from "@/domains/dcmp/primitive-schema";
import {
  BoxSchema,
  PrimitiveSchema,
  PropDefinitionRecord,
} from "@/domains/dcmp/primitive-schema";
import {
  type InstanceViolation,
  ReferenceContext,
} from "@/domains/dcmp/reference-context";
import { Size } from "@/domains/dcmp/size";
import { type TokenColorPosition, TokenSet } from "@/domains/dcmp/token";
import { Json } from "@/utils/Json";
import { Option } from "@/utils/Option";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

/** ノード（名前を持つ部品・artboard と子ノード）を指す不正の理由。 */
type NodeValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type"
  | "dangling-ref"
  | "circular-ref"
  | "undeclared-override"
  | "invalid-public-prop-name"
  | "dangling-binding-node"
  | "dangling-binding-prop"
  | "missing-name"
  | "invalid-identifier"
  | "duplicate-name"
  | "fill-in-free-parent";

/** トークンを指す不正の理由。 */
type TokenValidationErrorKind =
  | "invalid-identifier"
  | "conflicting-token-name"
  | "invalid-color";

/** ドキュメントが不正になる理由（docs/03-schema.md「バリデーション仕様」）。 */
export type DesignDocumentValidationErrorKind =
  | NodeValidationErrorKind
  | TokenValidationErrorKind;

/** ノードを指す不正 1 件。どのノードのどの prop かと、診断用のメッセージを持つ。 */
type NodeValidationError = Readonly<{
  kind: NodeValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

/**
 * トークンを指す不正 1 件。どのトークンの（あれば）トークンの中のどこかと、診断用のメッセージを
 * 持つ。
 */
type TokenValidationError = Readonly<{
  kind: TokenValidationErrorKind;
  tokenName: string;
  prop?: string;
  message: string;
}>;

/** トークンでのエラーの発生位置。`prop` はトークンの中の位置（影の `color` 等）。 */
type TokenErrorLocation = Readonly<{ tokenName: string; prop?: string }>;

/**
 * 名前の無いルート（部品定義・artboard）を指す不正 1 件。どのルートかをドキュメント内のパスで
 * 持ち、診断用のメッセージを持つ。
 */
type UnnamedRootValidationError = Readonly<{
  kind: "missing-name";
  documentPath: string;
  message: string;
}>;

/** 部品定義を収めるトップレベルフィールド。型で版のフィールド名に結び、綴りを二重に持たない。 */
const ComponentsField = "components" satisfies keyof DesignDocument;

/** artboard を収めるトップレベルフィールド。 */
const ArtboardsField = "artboards" satisfies keyof DesignDocument;

/**
 * 不正 1 件。ノードを指すもの・トークンを指すもの・名前の無いルートを指すものがある。
 *
 * トークン名やルートを収めるフィールドの名前（`components` / `artboards`）をノード名の位置に
 * 入れない。ノードとは別の名前空間なので、入れると同名のノードを指しているのと区別できなくなる。
 */
export type DesignDocumentValidationError =
  | NodeValidationError
  | TokenValidationError
  | UnnamedRootValidationError;

/**
 * 発生位置（nodeName / prop）を持たない、ノードを指すエラー。
 * 位置は検出側ではなく、その位置を知っている呼び出し側で付与する。
 */
type UnlocatedError = Readonly<{
  kind: NodeValidationErrorKind;
  prop?: string;
  message: string;
}>;

/** ノードでのエラーの発生位置。 */
type NodeErrorLocation = Readonly<{
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
  location: NodeErrorLocation,
  errors: readonly UnlocatedError[],
): readonly NodeValidationError[] {
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
  const schema = PrimitiveSchema.forTypeName(type);
  if (!Option.isSome(schema)) {
    return [{ kind: "unknown-type", message: `unknown type "${type}"` }];
  }
  return PropDefinitionRecord.collectErrors(
    schema.value.props,
    props ?? {},
    tokens,
  );
}

/**
 * 子を並べない親の下の `fill` を、軸ごとのエラーにする（判定は `Layout` が持つ）。
 *
 * 親を引数で要求するので、親が決まらない位置（部品のルート）はそもそも呼ばれない。
 *
 * @param parentLayout その props を持つノードの親の配置モード
 * @param props 検査するノードの props
 * @returns 軸ごとのエラーの並び。親が子を並べるときは空
 */
function collectFillErrors(
  parentLayout: Layout,
  props: Props,
): readonly UnlocatedError[] {
  return Layout.collectFillAxesInFreeParent(parentLayout, props).map((axis) => {
    const modeProp = Size.modeProp(axis);
    return {
      kind: "fill-in-free-parent" as const,
      prop: modeProp,
      message: `prop "${modeProp}" cannot be "fill" inside a parent that does not arrange its children`,
    };
  });
}

/**
 * ノードとその子孫のプリミティブの props をスキーマで照らす（走査は `Node` が持つ）。
 *
 * 部品インスタンスの中身は対象外で、検証が見るのは**定義時点の props** だけ（中身は部品の
 * 定義として照らされる）。
 *
 * @param node 起点のノード
 * @param tokens トークン参照の解決に使うトークン一式
 * @param parentProps このノードを収めている親の props
 * @returns 自身と子孫のプリミティブの props のエラーの並び（部品インスタンスは空）
 */
function collectNodeErrors(
  node: Node,
  tokens: TokenSet,
  parentProps: Props,
): readonly NodeValidationError[] {
  return Node.collectNestedPrimitives(node, parentProps).flatMap((nested) =>
    withLocation({ nodeName: nested.node.name }, [
      ...collectTypedPropErrors(nested.node.type, nested.node.props, tokens),
      ...collectFillErrors(
        Layout.fromProps(nested.parentProps),
        nested.node.props ?? {},
      ),
    ]),
  );
}

/**
 * インスタンスの違反 1 件を、位置を持たないエラーにする。
 *
 * @param refNode 違反を持つインスタンス
 * @param violation `ReferenceContext.collectInstanceViolations` が返した違反
 * @returns 参照先が無ければ dangling-ref、未宣言の上書きなら undeclared-override、値が宣言に
 *   適合しなければその prop の検証エラー
 */
function toInstanceError(
  refNode: RefNode,
  violation: InstanceViolation,
): UnlocatedError {
  switch (violation.kind) {
    case "missing-component":
      return {
        kind: "dangling-ref",
        message: `unknown component "${refNode.ref}"`,
      };
    case "undeclared-override":
      return {
        kind: "undeclared-override",
        prop: violation.prop,
        message: `component "${refNode.ref}" does not declare public prop "${violation.prop}"`,
      };
    case "invalid-override":
      return violation.error;
  }
}

/**
 * ノードとその子孫に含まれる部品参照を、位置を付けて集める（走査は `Node` が持つ）。
 *
 * @param context 部品とトークンの一式
 * @param node 起点のノード
 * @returns 自身と子孫のインスタンスについて、位置の付いたエラーの並び
 */
function collectNodeRefErrors(
  context: ReferenceContext,
  node: Node,
): readonly NodeValidationError[] {
  return Node.collectRefNodes(node).flatMap((refNode) =>
    withLocation(
      { nodeName: refNode.name },
      ReferenceContext.collectInstanceViolations(context, refNode).map(
        (violation) => toInstanceError(refNode, violation),
      ),
    ),
  );
}

/**
 * binding の違反 1 件を、位置を持たないエラーにする。
 *
 * @param binding 違反を持つ公開 prop の binding
 * @param violation `ComponentBinding.violation` が返した違反
 * @returns 指し先のノードが無ければ dangling-binding-node、指し先の prop が無ければ
 *   dangling-binding-prop
 */
function toBindingError(
  binding: PublicPropBinding,
  violation: BindingViolation,
): UnlocatedError {
  switch (violation.kind) {
    case "missing-node":
      return {
        kind: "dangling-binding-node",
        message: `unknown node "${binding.node}"`,
      };
    case "missing-public-prop":
      return {
        kind: "dangling-binding-prop",
        message: `"${binding.prop}" is not a public prop of component "${violation.ref}"`,
      };
    case "missing-prop":
      return {
        kind: "dangling-binding-prop",
        message: `node "${binding.node}" has no prop "${binding.prop}"`,
      };
  }
}

/**
 * 部品の publicProps が宣言している binding をすべて照らす（判定は `ComponentBinding` が持つ）。
 *
 * @param components 部品一式
 * @param componentName エラーの位置に使う部品名
 * @param component 検証する部品
 * @returns 公開 prop ごとの、位置の付いたエラーの並び
 */
function collectBindingErrors(
  components: ComponentSet,
  componentName: string,
  component: Component,
): readonly NodeValidationError[] {
  return Component.publicPropNames(component).flatMap((publicPropName) => {
    const binding = Component.binding(component, publicPropName);
    if (!Option.isSome(binding)) {
      return [];
    }
    const violation = ComponentBinding.violation(
      components,
      ComponentBinding.create(componentName, binding.value),
    );
    if (!Option.isSome(violation)) {
      return [];
    }
    return withLocation({ nodeName: componentName, prop: publicPropName }, [
      toBindingError(binding.value, violation.value),
    ]);
  });
}

/**
 * 部品の publicProps の宣言名のうち、宣言名の規則を満たさないもの（判定は `Component` が持つ）。
 *
 * @param componentName エラーの位置に使う部品名
 * @param component 検証する部品
 * @returns 規則を満たさない宣言名ごとの invalid-public-prop-name エラーの並び
 */
function collectPublicPropNameErrors(
  componentName: string,
  component: Component,
): readonly NodeValidationError[] {
  return Component.collectInvalidPublicPropNames(component).flatMap(
    (publicPropName) =>
      withLocation({ nodeName: componentName, prop: publicPropName }, [
        {
          kind: "invalid-public-prop-name",
          message: `public prop name "${publicPropName}" is not a valid public prop name`,
        },
      ]),
  );
}

/**
 * 部品どうしの参照が輪になっているものを報告する。
 *
 * @param components 検証する部品の一式
 * @returns 輪に含まれる部品ごとの circular-ref エラーの並び
 */
export function collectCircularRefErrors(
  components: ComponentSet,
): readonly NodeValidationError[] {
  return ComponentSet.circularNames(components).map((name) => ({
    kind: "circular-ref" as const,
    nodeName: name,
    message: `component "${name}" is part of a circular reference`,
  }));
}

/**
 * 部品1件の props・子ノード・公開 prop の宣言名・binding・参照のエラーを集める。
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
): readonly NodeValidationError[] {
  const children = component.children ?? [];
  const propErrors = withLocation(
    { nodeName: name },
    collectTypedPropErrors(component.type, component.props, context.tokens),
  );
  const childErrors = children.flatMap((child) =>
    collectNodeErrors(child, context.tokens, component.props ?? {}),
  );
  const publicPropNameErrors = collectPublicPropNameErrors(name, component);
  const bindingErrors = collectBindingErrors(
    context.components,
    name,
    component,
  );
  const refErrors = children.flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
  return [
    ...propErrors,
    ...childErrors,
    ...publicPropNameErrors,
    ...bindingErrors,
    ...refErrors,
  ];
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
): readonly NodeValidationError[] {
  // 照らす先が `Artboard.propDefinitions()` ではなく Box スキーマなので、デフォルト解決も
  // Box の既定（`overflow: visible`）で行う。Box の既定はすべて enum で artboard の
  // 上書き（`clip`）も値域内なので今は差が出ないが、artboard 固有の既定がトークンを
  // 指した時点で食い違う（`Artboard.propDefinitions()` を使うと `widthMode` などが
  // unknown-prop になるため、寄せるなら別の変更として行う）
  const propErrors = withLocation(
    { nodeName: artboard.name },
    PropDefinitionRecord.collectErrors(
      BoxSchema.props,
      artboard.props ?? {},
      context.tokens,
    ),
  );
  const childErrors = artboard.children.flatMap((child) =>
    collectNodeErrors(
      child,
      context.tokens,
      // artboard 固有の既定を被せた props から読む。`Artboard.propDefinitions()` が
      // `layout` の既定を差し替えたときに、描画とここで違う親を見ないようにするため
      Artboard.boxProps(artboard),
    ),
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
): readonly NodeValidationError[] {
  return DocumentNames.duplicatedNames(
    DocumentNames.create(
      DocumentNames.collectNames(document.components, document.artboards),
    ),
  ).map(
    (name): NodeValidationError => ({
      kind: "duplicate-name",
      nodeName: name,
      message: `name "${name}" is not unique in the document`,
    }),
  );
}

/**
 * 名前が欠落した位置を、報告用のエラーにする。
 *
 * @param position 名前が欠落した位置
 * @returns 部品のキー・artboard の欠落はそのルートをドキュメント内のパス（`components` /
 *   `artboards[<添字>]`）で指す missing-name、子ノードの欠落は名前を持つ最も近い祖先のノードを
 *   指す missing-name
 *
 * キーが空の部品は、デコード失敗の綴り（`components.`）ではなく `components` で指す。末尾の
 * `.` は綴りが欠けて見えるため。
 */
function toMissingNameError(
  position: NamePosition,
): NodeValidationError | UnnamedRootValidationError {
  switch (position.kind) {
    case "component-key":
      return {
        kind: "missing-name",
        documentPath: ComponentsField,
        message: `key "" of "${ComponentsField}" has no name`,
      };
    case "artboard":
      return {
        kind: "missing-name",
        documentPath: Json.elementPath(ArtboardsField, position.index),
        message: `artboard ${position.index} of "${ArtboardsField}" has no name`,
      };
    case "child":
      return {
        kind: "missing-name",
        nodeName: position.ownerName,
        message: `child ${position.index} of "${position.ownerName}" has no name`,
      };
  }
}

/**
 * 名前空間に属する名前の違反 1 件を、報告用のエラーにする。
 *
 * @param violation `DocumentNames.collectNameViolations` が返した違反
 * @returns 欠落なら `toMissingNameError` の missing-name、識別子違反ならその名前を位置にした
 *   invalid-identifier
 */
function toNameError(
  violation: NameViolation,
): NodeValidationError | UnnamedRootValidationError {
  switch (violation.kind) {
    case "missing":
      return toMissingNameError(violation.position);
    case "invalid-identifier":
      return {
        kind: "invalid-identifier",
        nodeName: violation.name,
        message: `name "${violation.name}" is not a valid identifier`,
      };
  }
}

/**
 * 名前がトークン名の規則を満たさないトークン（docs/04-tokens.md「命名規則」）。
 *
 * @param tokens 検証するトークン一式
 * @returns `TokenSet.collectInvalidNameRefs` が返すトークンごとの invalid-identifier エラーの並び
 */
function collectTokenNameErrors(
  tokens: TokenSet,
): readonly TokenValidationError[] {
  return TokenSet.collectInvalidNameRefs(tokens).map(
    (ref): TokenValidationError => ({
      kind: "invalid-identifier",
      tokenName: ref.name,
      message: `token name "${ref.name}" in ${ref.kind} is not a valid identifier`,
    }),
  );
}

/**
 * 塗り用の 2 種別（colors と gradients）の両方にある名前（docs/04-tokens.md「命名規則」）。
 * `background` がその名前を指しているかは見ない。
 *
 * @param tokens 検証するトークン一式
 * @returns 両方にある名前ごとの conflicting-token-name エラーの並び
 */
function collectPaintNameConflictErrors(
  tokens: TokenSet,
): readonly TokenValidationError[] {
  return TokenSet.collectPaintNameConflicts(tokens).map(
    (name): TokenValidationError => ({
      kind: "conflicting-token-name",
      tokenName: name,
      message: `token name "${name}" is used in both colors and gradients`,
    }),
  );
}

/**
 * 不正な色の場所を、エラーの位置とメッセージの主語にする。
 *
 * @param position `TokenSet.collectInvalidColorPositions` が返した場所
 * @returns 位置にはトークン名を入れる。影は `color`、グラデーションは `stops[<添字>].color`
 *   を prop に持ち、colors トークンは prop を持たない
 */
function toColorErrorLocation(
  position: TokenColorPosition,
): Readonly<{ location: TokenErrorLocation; subject: string }> {
  switch (position.kind) {
    case "colors":
      return {
        location: { tokenName: position.name },
        subject: `color token "${position.name}"`,
      };
    case "shadows":
      return {
        location: { tokenName: position.name, prop: "color" },
        subject: `the color of shadow token "${position.name}"`,
      };
    case "gradients":
      return {
        location: {
          tokenName: position.name,
          prop: `stops[${position.stopIndex}].color`,
        },
        subject: `the stop ${position.stopIndex} color of gradient token "${position.name}"`,
      };
  }
}

/**
 * 色が正規形の hex でないトークン（docs/04-tokens.md「colors」）。
 *
 * @param tokens 検証するトークン一式
 * @returns `TokenSet.collectInvalidColorPositions` が返す場所ごとの invalid-color エラーの並び
 */
export function collectInvalidColorErrors(
  tokens: TokenSet,
): readonly TokenValidationError[] {
  return TokenSet.collectInvalidColorPositions(tokens).map(
    (position): TokenValidationError => {
      const { location, subject } = toColorErrorLocation(position);
      return {
        kind: "invalid-color",
        ...location,
        message: `${subject} is not a hex color in normal form (#rrggbb / #rrggbbaa)`,
      };
    },
  );
}

/**
 * ドキュメント全体の名前（部品・artboard・ノード・トークン）のエラーを集める。
 *
 * @param document 検証するドキュメント
 * @returns 欠落・識別子違反・重複・塗り用の 2 種別での名前の衝突を含む、名前のエラーの並び
 */
export function collectDocumentNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  const nameErrors = DocumentNames.collectNameViolations(
    document.components,
    document.artboards,
  ).map(toNameError);
  return [
    ...nameErrors,
    ...collectDuplicateNameErrors(document),
    ...collectTokenNameErrors(document.tokens),
    ...collectPaintNameConflictErrors(document.tokens),
  ];
}
