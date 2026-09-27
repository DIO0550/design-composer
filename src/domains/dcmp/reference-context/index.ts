import { Component, ComponentSet } from "@/domains/dcmp/component";
import { ComponentBinding } from "@/domains/dcmp/component-binding";
import { Props, type RefNode } from "@/domains/dcmp/node";
import {
  PropDefinition,
  type PropValidationError,
} from "@/domains/dcmp/primitive-schema";
import type { TokenSet } from "@/domains/dcmp/token";
import { Option } from "@/utils/Option";

/**
 * インスタンスの上書きを照らす先。部品一式とトークン一式。
 *
 * 上書きの値が妥当かは、公開 prop の宣言（部品一式から解く）とトークンの有無（トークン一式
 * で引く）の両方が揃わないと決まらないため 1 つの型にまとめる。部品一式だけで答えが出る
 * 検査（binding）はここに入れない。
 */
export type ReferenceContext = Readonly<{
  components: ComponentSet;
  tokens: TokenSet;
}>;

/** インスタンス（参照ノード）が参照先の部品と噛み合わない理由。 */
export type InstanceViolation =
  /** 参照先の部品が一式に無い。 */
  | Readonly<{ kind: "missing-component" }>
  /** 参照先の部品が公開していない prop を上書きしている。 */
  | Readonly<{ kind: "undeclared-override"; prop: string }>
  /** 上書きの値が、公開 prop の繋ぎ先の宣言に適合しない。 */
  | Readonly<{ kind: "invalid-override"; error: PropValidationError }>;

/**
 * 上書き 1 件を、参照先の部品の公開 prop の宣言で照らす。
 *
 * @param context 部品とトークンの一式
 * @param refNode 上書きを持つインスタンス
 * @param component `refNode` の参照先の部品
 * @returns 上書きの並び順の違反。宣言が解けない公開 prop（binding の不整合）の上書きは
 *   照らさない（binding の側が報告する）
 */
function collectOverrideViolations(
  context: ReferenceContext,
  refNode: RefNode,
  component: Component,
): readonly InstanceViolation[] {
  return Props.toAssignments(refNode.overrides ?? {}).flatMap(
    (assignment): readonly InstanceViolation[] => {
      const binding = Component.binding(component, assignment.name);
      if (!Option.isSome(binding)) {
        return [{ kind: "undeclared-override", prop: assignment.name }];
      }
      const definition = ComponentBinding.resolvePropDefinition(
        context.components,
        ComponentBinding.create(refNode.ref, binding.value),
      );
      if (!Option.isSome(definition)) {
        return [];
      }
      return PropDefinition.collectErrors(
        definition.value,
        assignment,
        context.tokens,
      ).map((error) => ({ kind: "invalid-override", error }));
    },
  );
}

export const ReferenceContext = {
  /**
   * 部品一式とトークン一式を組にする。
   *
   * @param components 参照先の部品一式
   * @param tokens 上書きの値のトークン参照を引く先
   * @returns 2 つの組
   */
  create(components: ComponentSet, tokens: TokenSet): ReferenceContext {
    return { components, tokens };
  },

  /**
   * インスタンスが参照先の部品と噛み合っているか。
   *
   * @param context 部品とトークンの一式
   * @param refNode 照らすインスタンス
   * @returns 参照先の部品が無ければ `missing-component` 1 件だけ（上書きは照らさない）。
   *   あれば上書きの並び順に、未宣言の上書きと値が宣言に適合しない上書きを並べたもの。
   *   噛み合っていれば空
   */
  collectInstanceViolations(
    context: ReferenceContext,
    refNode: RefNode,
  ): readonly InstanceViolation[] {
    const component = ComponentSet.get(context.components, refNode.ref);
    if (!Option.isSome(component)) {
      return [{ kind: "missing-component" }];
    }
    return collectOverrideViolations(context, refNode, component.value);
  },
} as const;
