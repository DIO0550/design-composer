import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Node, Props } from "@/domains/dcmp/node";
import type { PrimitiveType } from "@/domains/dcmp/primitive-schema";

/**
 * これから挿入するノードの指定（docs/06-ui.md「編集操作の一覧」の挿入）。
 *
 * プリミティブは `type`、部品インスタンスは `ref` と、ノードとして書き出す先が異なる。
 * 直和にすることで「両方持つ」「どちらも持たない」指定を表現できなくする。
 * 名前を持たないのは、一意な名前が挿入先のドキュメントを見ないと決まらないため
 * （採番は `toNode` が行う）。
 *
 * カテゴリは `session`。import は `dcmp` だけなので機械では決まらないが、これは
 * ファイルに書かれる値ではなく**編集操作の指定**（何を挿すかという編集中の意図）で、
 * `.dcmp` に現れない（`rules/architecture.md`「domains のカテゴリ」）。
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
   * 同じものを指す指定か。
   *
   * パレットの行が「今掴まれているのは自分か」を答えるのに使う。行は自分の指定を
   * 組み立てられるので、掴まれている指定と突き合わせれば行ごとの判定が要らない。
   *
   * @param template 突き合わせる指定
   * @param other 突き合わせ先の指定
   * @returns 種別も指す先も同じなら `true`
   */
  isSame(template: NodeTemplate, other: NodeTemplate): boolean {
    if (template.kind === "primitive") {
      return other.kind === "primitive" && other.type === template.type;
    }
    return (
      other.kind === "instance" &&
      other.componentName === template.componentName
    );
  },

  /**
   * 部品のインスタンスを指す指定か。
   *
   * @param template 見たい指定
   * @returns インスタンスなら `true`。プリミティブなら `false`
   */
  isInstance(template: NodeTemplate): boolean {
    return template.kind === "instance";
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
