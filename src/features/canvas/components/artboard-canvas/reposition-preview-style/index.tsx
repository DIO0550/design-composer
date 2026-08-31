import { DesignDocument } from "@/domains/dcmp/design-document";
import { Placement } from "@/domains/dcmp/placement";
import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NameStyleRule } from "../name-style-rule";

/**
 * 運んでいるノードをずらして見せる宣言。
 * テストが `translate(...)` の綴りを写さずに済むよう、組み立てをここから出す
 * （`TokenReferrerOutline` を export しているのと同じ理由）。
 *
 * @param offset ドキュメント上の px で表した移動量
 * @returns その分だけずらす 1 宣言
 */
export function repositionPreviewDeclarations(offset: Offset): string {
  return `transform:translate(${Px.create(offset.x)},${Px.create(offset.y)})`;
}

/**
 * 離したらどこへ置かれるかを、掴んだノード自身を動かして見せる（#381）。
 *
 * ドキュメントは書き換えない。ここで書き換えると `EditHistory` が合体しないため、
 * ポインタ移動の刻みだけ undo が積まれる（ドラッグ 1 回 = undo 1 回が壊れる）。
 * ドロップ線が「ドキュメントを変えずに落ちる先を見せている」のと同じ形。
 *
 * `left` / `top` ではなく `transform` を使うのは、コンパイル結果が座標を
 * **インライン style** に出しており、同じプロパティでは規則が勝てないため。
 * `transform` は `CssDeclaration` の `CssProperty` に無い＝ノードのインライン
 * style に出ない語彙なので、`!important` 無しで重ねられる。
 *
 * @returns ずらす規則。座標を動かすドラッグをしていなければ何も出さない
 */
export function RepositionPreviewStyle({
  document,
  drag,
}: Readonly<{ document: DesignDocument; drag: NodeDrag }>) {
  const target = NodeDrag.repositionTarget(drag);
  if (!target.some) {
    return null;
  }
  const current = DesignDocument.absolutePlacementOf(
    document,
    target.value.name,
  );
  if (!current.some) {
    return null;
  }
  const offset = Placement.delta(current.value, target.value.placement);
  return (
    <NameStyleRule
      name={target.value.name}
      declarations={repositionPreviewDeclarations(offset)}
    />
  );
}
