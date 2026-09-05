import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NameStyleRule } from "../name-style-rule";

/**
 * 運んでいるノードを**見た目だけの存在**にする宣言（ずらして見せる・当たり判定から
 * 外す・他の artboard より前に出す）。テストが綴りを写さずに済むよう、組み立てを
 * ここから出す（`TokenReferrerOutline` を export しているのと同じ理由）。
 *
 * Why（`pointer-events:none`）: これが無いと、ポインタの下にあるのは運んでいるノード
 * 自身になり、`DropParent.innermost` は自分を飛ばして**元の親**しか答えない
 * （＝同じ親の中にある兄弟の Box へ入れられない）。親が中身を切り取る artboard の
 * ときだけは、外へ出た分が当たり判定に出ないので付け替えが効いてしまい、
 * **親の種類で挙動が変わる**。宣言で揃える。
 *
 * Why（`z-index`）: artboard の枠は座標平面（`ul`）に並ぶ `position:absolute` の
 * 兄弟で、どれも z-index を持たない＝**DOM の順に重なる**。前に出さないと、隣の
 * artboard へ運んだ運んでいるノードがその白い面の裏へ回る。
 *
 * @param offset ドキュメント上の px で表した移動量
 * @returns ずらす宣言・当たり判定から外す宣言・前に出す宣言
 */
export function repositionPreviewDeclarations(offset: Offset): string {
  return `transform:translate(${Px.create(offset.x)},${Px.create(offset.y)});pointer-events:none;z-index:1`;
}

/**
 * 運んでいるノードを包んでいるものが、中身を切り取らないようにする宣言。
 *
 * Why: artboard のルートは常に `overflow:hidden`（`DocumentHtml` が必ず出す）で、
 * 途中の Box も `overflow: clip` を持てる。運んでいる間ずらすのは見た目だけなので、
 * 解かないと親をまたぐ途中でノードが消える。
 *
 * Why（`!important`）: 切り取りはコンパイル結果の**インライン style** に出るので、
 * 差し込んだ規則では勝てない（実測: 付けないと `overflow` は `hidden` のまま）。
 * ずらす側が `transform` を選んで `!important` を避けられたのは、そちらが
 * インライン style に出ない語彙だから。同じ手はここでは使えない。
 */
export const CarriedNodeUnclipped = "overflow:visible!important";

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
 * 包んでいるものの切り取りも同時に解く。解く相手を artboard 1 枚に決め打たないのは、
 * 途中の Box も `overflow: clip` を持てるため（`CarriedNodeUnclipped`）。
 *
 * @returns ずらす規則と、包んでいるものの切り取りを解く規則。座標を動かすドラッグを
 *   していなければ何も出さない
 */
export function RepositionPreviewStyle({
  drag,
  designDocument,
}: Readonly<{ drag: NodeDrag; designDocument: DesignDocument }>) {
  const preview = NodeDrag.repositionPreview(drag);
  if (!preview.some) {
    return null;
  }
  const wrappingNames = DesignDocument.collectAncestorNames(
    designDocument,
    preview.value.name,
  );
  return (
    <>
      {wrappingNames.map((name) => (
        <NameStyleRule
          key={name}
          name={name}
          declarations={CarriedNodeUnclipped}
        />
      ))}
      <NameStyleRule
        name={preview.value.name}
        declarations={repositionPreviewDeclarations(preview.value.offset)}
      />
    </>
  );
}
