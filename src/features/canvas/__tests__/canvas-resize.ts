import {
  NodeResize,
  type ResizeGrip,
  type ResizeHandleAnchor,
} from "@/features/canvas/domains/node-resize";
import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";

/*
 * リサイズハンドルの箇所をテストから引く口。
 *
 * 並びの何番目かをテストへ写さないのは、箇所と掴めるものの対応を決めているのが
 * `HandleAnchors` の側だから（写すと片方だけ変えられる）。ドメイン側の口にせず
 * ここに置くのは、production からの呼び出しが 1 つも無いため。
 */

/**
 * その種類を掴める箇所かどうか。
 *
 * @param anchor 見ている箇所
 * @param kind 掴める種類
 * @returns その種類を掴めるなら `true`
 */
function grips(anchor: ResizeHandleAnchor, kind: ResizeGrip["kind"]): boolean {
  return anchor.grip.some && anchor.grip.value === kind;
}

/**
 * その種類を掴める箇所。
 *
 * @param kind 掴める種類（`width` / `height` / `both`）
 * @returns その種類を掴める箇所。並びに無ければ `none`
 */
export function resizeAnchorFor(
  kind: ResizeGrip["kind"],
): Option<ResizeHandleAnchor> {
  return ArrayEx.first(
    NodeResize.HandleAnchors.filter((anchor) => grips(anchor, kind)),
  );
}

/**
 * その種類を掴める箇所が、左上から時計回りの並びの何番目か。
 *
 * 出ているハンドルの並びと同じ順序なので、そのまま添字として使える。
 *
 * @param kind 掴める種類
 * @returns 並びの中の位置。並びに無ければ `-1`
 */
export function resizeAnchorIndexFor(kind: ResizeGrip["kind"]): number {
  return NodeResize.HandleAnchors.findIndex((anchor) => grips(anchor, kind));
}
