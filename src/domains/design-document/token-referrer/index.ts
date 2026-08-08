import { Artboard } from "@/domains/artboard";
import { Component, ComponentSet } from "@/domains/component";
import { ComponentBinding } from "@/domains/component-binding";
import {
  Node,
  type PrimitiveNode,
  type PropAssignment,
  Props,
  type RefNode,
} from "@/domains/node";
import {
  PrimitiveSchema,
  type PrimitiveType,
  PropDefinition,
  type PropDefinitionRecord,
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

/**
 * その prop 設定がそのトークンを指しているか。
 *
 * 種別まで見るのは、トークン名の一意性が種別の中だけで保証されるため
 * （docs/04-tokens.md「命名規則」）。`colors` と `spacing` に同名があってもよく、
 * 名前だけで一致を見ると別の種別の同名トークンを参照元に数えてしまう。
 */
function referencesToken(
  definition: PropDefinition,
  assignment: PropAssignment,
  ref: TokenRef,
): boolean {
  const isSameKind =
    PropDefinition.isToken(definition) && definition.tokenKind === ref.kind;
  return isSameKind && assignment.value === ref.name;
}

/**
 * 設定されている props のうち、そのトークンを指しているものの prop 名。
 *
 * 見るのは設定されている props だけで、スキーマのデフォルトで解決される値は数えない。
 * 行が指すのは編集できる prop であり、デフォルトで解決される値には
 * `<名前>.<prop名>` として指せる実体が無いため。今の dangling 検証
 * （`PropDefinitionRecord.collectErrors`）も設定済み props しか見ないので答えが揃う。
 *
 * 宣言に無い prop は定義が引けないので数えない（`unknown-prop` として検証側が報告する）。
 */
function collectReferringProps(
  schema: PropDefinitionRecord,
  props: Props | undefined,
  ref: TokenRef,
): readonly string[] {
  return Props.toAssignments(props ?? {}).flatMap((assignment) => {
    const definition = schema[assignment.name];
    if (definition === undefined) {
      return [];
    }
    return referencesToken(definition, assignment, ref)
      ? [assignment.name]
      : [];
  });
}

/**
 * 上書き1件が最終的に指す prop 定義。
 *
 * 参照ノードが持つのは自分の props ではなく部品への上書きなので、その値が何の prop なのかは
 * 部品の publicProps を辿って初めて決まる（`validation` の上書き検証と同じ道）。
 * 参照先の部品が無い・公開 prop に無い・連鎖が途切れているときは定義が決まらないので `none`
 * （それぞれ `dangling-ref` / `undeclared-override` / binding の不整合として検証側が報告する）。
 */
function overridePropDefinition(
  components: ComponentSet,
  refNode: RefNode,
  propName: string,
): Option<PropDefinition> {
  const component = ComponentSet.get(components, refNode.ref);
  if (component === undefined) {
    return Option.none;
  }
  return Option.flatMap(Component.binding(component, propName), (binding) =>
    ComponentBinding.resolvePropDefinition(
      components,
      ComponentBinding.create(refNode.ref, binding),
    ),
  );
}

/** インスタンスの上書きのうち、そのトークンを指しているものの公開 prop 名。 */
function collectReferringOverrides(
  components: ComponentSet,
  refNode: RefNode,
  ref: TokenRef,
): readonly string[] {
  return Props.toAssignments(refNode.overrides ?? {}).flatMap((assignment) => {
    const definition = overridePropDefinition(
      components,
      refNode,
      assignment.name,
    );
    const references =
      definition.some && referencesToken(definition.value, assignment, ref);
    return references ? [assignment.name] : [];
  });
}

/** スキーマが宣言する props のうち、そのトークンを指しているものの prop 名。 */
function collectReferringSchemaProps(
  type: PrimitiveType,
  props: Props | undefined,
  ref: TokenRef,
): readonly string[] {
  const schema: PrimitiveSchema = PrimitiveSchema.forType(type);
  return collectReferringProps(schema.props, props, ref);
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
  return collectReferringSchemaProps(type, node.props, ref).map((prop) => ({
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
  return collectReferringSchemaProps(component.type, component.props, ref).map(
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
    ? collectReferringOverrides(components, node, ref).map((prop) => ({
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
  const ownReferrers: readonly TokenReferrer[] = collectReferringProps(
    Artboard.propDefinitions(),
    artboard.props,
    ref,
  ).map((prop) => ({ target: "artboard", name: artboard.name, prop }));
  const childReferrers = artboard.children.flatMap((child) =>
    collectNodeReferrers(components, child, ref),
  );
  return [...ownReferrers, ...childReferrers];
}

/**
 * 部品定義1件の中で、そのトークンを参照している箇所を集める。
 *
 * 部品定義の中の参照も数えるのは、初期部品セットの見た目の prop がすべてデフォルトテーマの
 * トークンを参照しており（docs/04-tokens.md「初期部品セット」）、外側だけを見ると
 * 新規ドキュメントのトークンがほとんど「どこからも使われていない」と読めてしまうため。
 * 部品の使用数を数える `ComponentSet.assets` が定義の中の参照を足しているのと同じ理由。
 *
 * 名前で部品を引くのは、定義そのものを引数で受け取ると引数が4つになるため。
 * 定義が無い名前は空を返す（`collectErrors` が同じ形で分岐しているのに揃える）。
 */
export function collectComponentTokenReferrers(
  components: ComponentSet,
  name: string,
  ref: TokenRef,
): readonly TokenReferrer[] {
  const component: Component | undefined = ComponentSet.get(components, name);
  if (component === undefined) {
    return [];
  }
  const ownReferrers = collectComponentRootReferrers(name, component, ref);
  const childReferrers = (component.children ?? []).flatMap((child) =>
    collectNodeReferrers(components, child, ref),
  );
  return [...ownReferrers, ...childReferrers];
}
