import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";
import { NodeDrag } from "@/features/editor/features/canvas/domains/node-drag";
import { Option } from "@/utils/Option";
import { NameStyleRule } from "../name-style-rule";

/**
 * ずらして見せるのに使う CSS プロパティ。
 *
 * `transform` の関数（`translate(...)`）ではなく**個別プロパティ**にするのは、ノードの回転が
 * コンパイル結果の**インライン** `transform` に出るため（docs/03「回転」）。同じ
 * `transform` を使うとインライン側が勝ち、回転したノードが運んでも動かなくなる（実測）。
 * 個別プロパティなら奪い合わず、合成順も `translate` が先なので移動量は親の座標系のまま
 * 効く（`transform` の側に書くと移動量が回転した座標系で効いて向きがずれる）。
 *
 * 下の `CarriedNodeUnclipped` と同じく `!important` で勝たせる形にはしない。勝たせると
 * 運んでいる間だけ回転ごと打ち消されて、掴んだノードの向きが変わって見える。
 */
export const RepositionPreviewProperty = "translate";

/**
 * 運んでいるノードを**見た目だけの存在**にする宣言（ずらして見せる・当たり判定から外す
 * ・他の artboard より前に出す）。テストが綴りを写さずに済むよう、組み立てをここから出
 * す。
 *
 * 親が中身を切り取る artboard のときだけは付け替えが効いてしまい、**親の種類で挙動が変わ
 * る**。
 *
 * 前に出さないと、隣の artboard へ運んだノードがその白い面の裏へ回る。
 *
 * @param offset ドキュメント上の px で表した移動量
 * @returns ずらす宣言・当たり判定から外す宣言・前に出す宣言
 */
export function repositionPreviewDeclarations(offset: Offset): string {
  return `${RepositionPreviewProperty}:${Px.create(offset.x)} ${Px.create(offset.y)};pointer-events:none;z-index:1`;
}

/**
 * 運んでいるノードを包んでいるものが、中身を切り取らないようにする宣言。
 *
 * artboard のルートは常に `overflow:hidden`（`DocumentHtml` が必ず出す）で、途中の Box
 * も `overflow: clip` を持てる。運んでいる間ずらすのは見た目だけなので、解かないと親を
 * またぐ途中でノードが消える。
 *
 * `!important` が要るのは、切り取りがコンパイル結果の**インライン style** に出るため（実測:
 * 付けないと `overflow` は `hidden` のまま）。
 */
export const CarriedNodeUnclipped = "overflow:visible!important";

/**
 * 離したらどこへ置かれるかを、掴んだノード自身を動かして見せる。
 *
 * ドキュメントは書き換えない。ここは編集を続きとして送らないので、書き換えるとポインタ
 * 移動の刻みだけ undo が積まれる（ドラッグ 1 回 = undo 1 回が壊れる）。
 *
 * @returns ずらす規則と、包んでいるものの切り取りを解く規則。座標を動かすドラッグ
 *   をしていなければ何も出さない
 */
export function RepositionPreviewStyle({
  drag,
  designDocument,
}: Readonly<{ drag: NodeDrag; designDocument: DesignDocument }>) {
  const preview = NodeDrag.repositionPreview(drag);
  if (!Option.isSome(preview)) {
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
