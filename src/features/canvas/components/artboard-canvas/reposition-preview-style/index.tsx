import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NameStyleRule } from "../name-style-rule";

/**
 * 運んでいるノードを**見た目だけの存在**にする宣言（ずらして見せることと、
 * 当たり判定から外すこと）。テストが綴りを写さずに済むよう、組み立てをここから出す
 * （`TokenReferrerOutline` を export しているのと同じ理由）。
 *
 * Why（`pointer-events:none`）: これが無いと、ポインタの下にあるのは運んでいるノード
 * 自身になり、`DropParent.innermost` は自分を飛ばして**元の親**しか答えない
 * （＝同じ親の中にある兄弟の Box へ入れられない）。親が中身を切り取る artboard の
 * ときだけは、外へ出た分が当たり判定に出ないので付け替えが効いてしまい、
 * **親の種類で挙動が変わる**。宣言で揃える。
 *
 * @param offset ドキュメント上の px で表した移動量
 * @returns ずらす宣言と、当たり判定から外す宣言
 */
export function repositionPreviewDeclarations(offset: Offset): string {
  return `transform:translate(${Px.create(offset.x)},${Px.create(offset.y)});pointer-events:none`;
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
 * ずらす量をドキュメントから逆算せず `NodeDrag` から受け取るのは、親を付け替えると
 * 書かれる座標の原点が変わる一方で、**画面上の位置は動かない**ため（`RepositionTarget`）。
 *
 * @returns ずらす規則。座標を動かすドラッグをしていなければ何も出さない
 */
export function RepositionPreviewStyle({ drag }: Readonly<{ drag: NodeDrag }>) {
  const preview = NodeDrag.repositionPreview(drag);
  if (!preview.some) {
    return null;
  }
  return (
    <NameStyleRule
      name={preview.value.name}
      declarations={repositionPreviewDeclarations(preview.value.offset)}
    />
  );
}
