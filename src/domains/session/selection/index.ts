import type { Artboard } from "@/domains/dcmp/artboard";
import { Node } from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PrimitiveType,
} from "@/domains/dcmp/primitive-schema";
import { Option } from "@/utils/Option";

/**
 * 選択の対象になりうるものの種別（UI 案 docs/Design Composer.html が型アイコンで
 * 描き分けている 3 つ）。部品は定義そのものではなく、その**インスタンス**を指す
 * （選択できるのはキャンバスに描かれるものだけ / `EditorState` と同じ線引き）。
 */
export type SelectionKind = "artboard" | PrimitiveType | "component";

/**
 * 今選ばれているものの正体。
 *
 * 表示側はこの対を受け取れば 1 度の判定で描ける。
 *
 * 種別が `none` になるのはスキーマに無い `type` のノード。不正なドキュメントでも描画は
 * 残る（docs/03-schema.md「不正ファイル時の挙動」）ので、種別が分からないことをそのまま
 * 出すために既定の種別へ寄せない。
 */
export type Selection = Readonly<{
  name: string;
  kind: Option<SelectionKind>;
}>;

export const Selection = {
  /** artboard は種別が名前から決まるので、常に `artboard`。 */
  fromArtboard(artboard: Artboard): Selection {
    return { name: artboard.name, kind: Option.some("artboard") };
  },

  /**
   * ノードの種別。参照ノードは指しているものが部品なので `component`、
   * プリミティブはスキーマが知っている `type` のときだけその種別になる。
   */
  fromNode(node: Node): Selection {
    if (Node.isRef(node)) {
      return { name: node.name, kind: Option.some("component") };
    }
    return {
      name: node.name,
      kind: PrimitiveSchema.isPrimitiveType(node.type)
        ? Option.some(node.type)
        : Option.none,
    };
  },
} as const;
