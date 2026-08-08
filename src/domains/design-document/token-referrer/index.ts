import { Artboard } from "@/domains/artboard";
import type { Component } from "@/domains/component";
import { ComponentSet } from "@/domains/component";
import { Node, type PrimitiveNode, Props, type RefNode } from "@/domains/node";
import {
  PrimitiveSchema,
  type PrimitiveType,
  PropDefinition,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import type { TokenRef } from "@/domains/token";
import { Option } from "@/utils/Option";

/**
 * トークンを参照している箇所1件（UI 案 docs/Design Composer.html の `Used by` の行 / #127）。
 *
 * 名前と prop 名を対で持つのは、片方だけでは参照箇所が決まらないため
 * （名前だけではどの prop が指しているか分からず、prop 名だけではどこの prop か分からない）。
 *
 * 何の prop かを `target` で判別する直和にしているのは、行に出すアイコンが
 * 「artboard / プリミティブ / インスタンス / 部品定義」で変わるため。名前だけを持たせると
 * 表示側がドキュメントを引き直して artboard かノードかを場合分けすることになり、
 * 集める側が「参照元として集めたのに引けない」という起こり得ない不在を表示側に作る。
 *
 * `prop` を union で閉じていないのは、プリミティブ側は `TokenPropName` で閉じられるが、
 * インスタンスの上書きで使う公開 prop 名は部品ごとにユーザーが決めるもので、
 * 仕様（docs/01-file-format.md「publicProps」）が語彙を列挙していないため
 * （`rules/coding.md`「対で縛るコストが釣り合わない場合は無理に縛らない」）。
 */
export type TokenReferrer =
  | Readonly<{ target: "artboard"; name: string; prop: string }>
  | Readonly<{
      target: "primitive";
      name: string;
      type: PrimitiveType;
      prop: string;
    }>
  | Readonly<{ target: "instance"; name: string; prop: string }>
  | Readonly<{ target: "component"; name: string; prop: string }>;

export const TokenReferrer = {
  /**
   * `title.color` の形の表記（UI 案の `Used by` の行）。
   * 参照箇所を1つの文字列で指せる形なので、対の側が持つ。
   *
   * 同じ綴りを `document-error-list` の `locationLabel` も作っているが、あちらが受けるのは
   * エラーの発生位置（`DocumentErrorLocation`。prop を持たない位置や文字位置も含む直和）で、
   * 型も分岐も違うため共通化しない。
   */
  toText(referrer: TokenReferrer): string {
    return `${referrer.name}.${referrer.prop}`;
  },
} as const;

/** スキーマが宣言する props のうち、そのトークンを指しているものの prop 名。 */
function collectSchemaRefProps(
  type: PrimitiveType,
  props: Props | undefined,
  ref: TokenRef,
): readonly string[] {
  const schema: PrimitiveSchema = PrimitiveSchema.forType(type);
  return PropDefinitionRecord.collectRefPropNames(
    schema.props,
    props ?? {},
    ref,
  );
}

/**
 * インスタンスの上書きのうち、そのトークンを指しているものの公開 prop 名。
 *
 * 参照ノードが持つのは自分の props ではなく部品への上書きなので、その値が何の prop なのかは
 * 公開 prop の binding を辿って初めて決まる。辿るのは `ComponentSet.publicPropTarget` の担当。
 * 参照先の部品が無い・公開 prop に無い・連鎖が途切れているときは prop 定義が決まらないので
 * 数えない（それぞれ `dangling-ref` / `undeclared-override` / binding の不整合として
 * 検証側が報告する）。
 */
function collectRefNodeRefProps(
  components: ComponentSet,
  refNode: RefNode,
  ref: TokenRef,
): readonly string[] {
  return Props.toAssignments(refNode.overrides ?? {}).flatMap((assignment) => {
    const definition = Option.map(
      ComponentSet.publicPropTarget(components, {
        component: refNode.ref,
        prop: assignment.name,
      }),
      (target) => target.definition,
    );
    const isRefTo =
      definition.some &&
      PropDefinition.isRefTo(definition.value, assignment, ref);
    return isRefTo ? [assignment.name] : [];
  });
}

/**
 * プリミティブノード自身の参照元。行に出すアイコンが型で決まるので `type` も持たせる。
 *
 * 未知の type はスキーマを持たず、どの prop がトークンを指すのかが決まらないので空
 * （type 自体の不正は `unknown-type` として検証側が報告する）。
 */
function collectPrimitiveReferrers(
  node: PrimitiveNode,
  ref: TokenRef,
): readonly TokenReferrer[] {
  if (!PrimitiveSchema.isPrimitiveType(node.type)) {
    return [];
  }
  const type = node.type;
  return collectSchemaRefProps(type, node.props, ref).map((prop) => ({
    target: "primitive",
    name: node.name,
    type,
    prop,
  }));
}

/**
 * 部品定義自身（ルートノードを兼ねる）の参照元。
 * 未知の type を空にする理由は `collectPrimitiveReferrers` と同じ。
 */
function collectComponentRootReferrers(
  name: string,
  component: Component,
  ref: TokenRef,
): readonly TokenReferrer[] {
  if (!PrimitiveSchema.isPrimitiveType(component.type)) {
    return [];
  }
  return collectSchemaRefProps(component.type, component.props, ref).map(
    (prop) => ({ target: "component", name, prop }),
  );
}

/** ノード1つとその子孫の参照元。並びは自身 → 子（木の深さ優先）。 */
function collectNodeReferrers(
  components: ComponentSet,
  node: Node,
  ref: TokenRef,
): readonly TokenReferrer[] {
  const ownReferrers: readonly TokenReferrer[] = Node.isRef(node)
    ? collectRefNodeRefProps(components, node, ref).map((prop) => ({
        target: "instance",
        name: node.name,
        prop,
      }))
    : collectPrimitiveReferrers(node, ref);
  const childReferrers = Node.children(node).flatMap((child) =>
    collectNodeReferrers(components, child, ref),
  );
  return [...ownReferrers, ...childReferrers];
}

/**
 * artboard 1枚の中で、そのトークンを参照している箇所を集める。
 *
 * artboard 自身の props も対象。受け付ける prop の定義は `Artboard.propDefinitions()`
 * （Box スキーマからサイズ系を落として `overflow` の既定を差し替えたもの）が持つので、
 * Box スキーマを直に見ない。artboard が受け付ける prop の唯一の答えがそちらだから。
 *
 * 部品集合を受け取るのは、インスタンスの上書きの prop 定義を解決するために要るため。
 */
export function collectArtboardTokenReferrers(
  components: ComponentSet,
  artboard: Artboard,
  ref: TokenRef,
): readonly TokenReferrer[] {
  const ownReferrers: readonly TokenReferrer[] =
    PropDefinitionRecord.collectRefPropNames(
      Artboard.propDefinitions(),
      artboard.props ?? {},
      ref,
    ).map((prop) => ({ target: "artboard", name: artboard.name, prop }));
  const childReferrers = artboard.children.flatMap((child) =>
    collectNodeReferrers(components, child, ref),
  );
  return [...ownReferrers, ...childReferrers];
}

/**
 * 部品定義の中で、そのトークンを参照している箇所を集める。
 *
 * 部品定義の中の参照も数えるのは、初期部品セットの見た目の prop がすべてデフォルトテーマの
 * トークンを参照しており（docs/04-tokens.md「初期部品セット」）、外側だけを見ると
 * 新規ドキュメントのトークンがほとんど「どこからも使われていない」と読めてしまうため。
 * 部品の使用数を数える `ComponentSet.assets` が定義の中の参照を足しているのと同じ理由。
 *
 * 反復を内側に持つのは、名前で部品を引き直す形にすると「引けなかったとき」の分岐が
 * 生まれるが、辿る名前がすべて自分の持ち物なので引きが失敗しようがないため
 * （`ComponentSet.assets` が `Object.entries` の1本で組んでいるのと同じ理由）。
 */
export function collectComponentSetTokenReferrers(
  components: ComponentSet,
  ref: TokenRef,
): readonly TokenReferrer[] {
  return Object.entries(components).flatMap(([name, component]) => {
    const ownReferrers = collectComponentRootReferrers(name, component, ref);
    const childReferrers = (component.children ?? []).flatMap((child) =>
      collectNodeReferrers(components, child, ref),
    );
    return [...ownReferrers, ...childReferrers];
  });
}
