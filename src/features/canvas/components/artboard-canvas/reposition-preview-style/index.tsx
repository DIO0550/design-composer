import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NameStyleRule } from "../name-style-rule";

/**
 * 運んでいるノードを**見た目だけの存在**にする宣言（ずらして見せる・当たり判定から外す・他の artboard より前に出す）。テストが綴りを写さずに済むよう、
 * 組み立てをここから出す。
 *
 * `pointer-events:none` が要るのは、これが無いとポインタの下にあるのが運んでいるノード自身になり、`DropParent.innermost` が元の親しか答えないため（＝同じ
 * 親の中にある兄弟の Box へ入れられない）。親が中身を切り取る artboard のときだけは付け替えが効いてしまい、**親の種類で挙動が変わる**。
 *
 * `z-index` が要るのは、artboard の枠が z-index を持たない兄弟で**DOM の順に重なる**ため。前に出さないと、隣の artboard へ運んだノードがその白い面の裏へ回る。
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
 * artboard のルートは常に `overflow:hidden`（`DocumentHtml` が必ず出す）で、途中の Box も `overflow: clip` を持てる。運んでいる間ずらすのは見た目だけなので、
 * 解かないと親をまたぐ途中でノードが消える。
 *
 * `!important` が要るのは、切り取りがコンパイル結果の**インライン style** に出るため（実測: 付けないと `overflow` は `hidden` のまま）。ずらす側が
 * `transform` で `!important` を避けられたのは、そちらがインライン style に出ない語彙だから。
 */
export const CarriedNodeUnclipped = "overflow:visible!important";

/**
 * 離したらどこへ置かれるかを、掴んだノード自身を動かして見せる（#381）。
 *
 * ドキュメントは書き換えない。書き換えると `EditHistory` が合体せず、ポインタ移動の刻みだけ undo が積まれる（ドラッグ 1 回 = undo 1 回が壊れる）。
 *
 * `left` / `top` ではなく `transform` を使うのは、コンパイル結果が座標を**インライン style** に出しており、同じプロパティでは規則が勝てないため
 * （`transform` はノードのインライン style に出ない語彙なので、`!important` 無しで重ねられる）。
 *
 * ずらす量をドキュメントから逆算せず `NodeDrag` から受け取るのは、親を付け替えると書かれる座標の原点が変わる一方で、**画面上の位置は動かない**ため
 * （`RepositionTarget`）。包んでいるものの切り取りも同時に解く（解く相手を artboard 1 枚に決め打たないのは、途中の Box も `overflow: clip` を持てるため）。
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
