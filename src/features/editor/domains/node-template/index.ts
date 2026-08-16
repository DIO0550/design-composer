import { DesignDocument } from "@/domains/design-document";
import type { Node, Props } from "@/domains/node";
import type { PrimitiveType } from "@/domains/primitive-schema";

/**
 * これから挿入するノードの指定（docs/06-ui.md「編集操作の一覧」の挿入）。
 *
 * プリミティブは `type`、部品インスタンスは `ref` と、ノードとして書き出す先が異なる。
 * 直和にすることで「両方持つ」「どちらも持たない」指定を表現できなくする。
 * 名前を持たないのは、一意な名前が挿入先のドキュメントを見ないと決まらないため
 * （採番は `toNode` が行う）。
 */
export type NodeTemplate =
  | Readonly<{ kind: "primitive"; type: PrimitiveType }>
  | Readonly<{ kind: "instance"; componentName: string }>;

/**
 * 挿入直後のプリミティブに入れる props。
 *
 * スキーマの既定値（Box は widthMode / heightMode が `hug`、Text は `content` が空文字）に
 * 委ねると、中身の無いノードは矩形が潰れてキャンバス上に現れない。掴めないノードは
 * 選択もダブルクリックによるインライン編集もできず、挿入した結果を確かめられないため、
 * 挿入時に限って初期値を与える（#39）。
 */
const InitialProps = {
  Box: { widthMode: "fixed", width: 120, heightMode: "fixed", height: 80 },
  Text: { content: "テキスト" },
} as const satisfies Readonly<Record<PrimitiveType, Props>>;

export const NodeTemplate = {
  /**
   * 採番の元になる名前。
   *
   * プリミティブは型名を小文字にしたもの（`Box` → `box`）。インスタンスは部品名そのもの。
   * どちらも名前空間の識別子の規則（kebab-case）を満たす形で、
   * 衝突したときの連番は `DesignDocument.uniqueName` が付ける（#12）。
   */
  baseName(template: NodeTemplate): string {
    return template.kind === "primitive"
      ? template.type.toLowerCase()
      : template.componentName;
  },

  /**
   * 指定を、そのドキュメントへ挿せるノードにする。
   * `usedNames` と衝突しない名前を採番するため、生成されたノードは
   * そのまま挿しても単一名前空間の一意性を壊さない。
   */
  toNode(template: NodeTemplate, usedNames: ReadonlySet<string>): Node {
    const name = DesignDocument.uniqueName(
      NodeTemplate.baseName(template),
      usedNames,
    );
    if (template.kind === "instance") {
      return { name, ref: template.componentName };
    }
    return { name, type: template.type, props: InitialProps[template.type] };
  },
} as const;
