import {
  NodeResize,
  type ResizeHandleAnchor,
} from "@/features/canvas/domains/node-resize";
import { Option } from "@/utils/Option";

/*
 * リサイズハンドルの箇所をテストから引く口。
 *
 * 並びの何番目かをテストへ写さないのは、箇所の並びを決めているのが `HandleAnchors` の
 * 側だから（写すと片方だけ変えられる）。ドメイン側の口にせずここに置くのは、
 * production からの呼び出しが 1 つも無いため。
 */

/**
 * 同じ箇所を指しているか。
 *
 * @param anchor 見ている箇所
 * @param other 探している箇所
 * @returns 縦横どちらの比率も等しければ `true`
 */
function isSameAnchor(
  anchor: ResizeHandleAnchor,
  other: ResizeHandleAnchor,
): boolean {
  return anchor.x === other.x && anchor.y === other.y;
}

/**
 * その箇所が `HandleAnchors` にあるか確かめて返す。
 *
 * @param anchor 探している箇所
 * @returns その箇所。並びに無ければ `none`
 */
export function resizeAnchorAt(
  anchor: ResizeHandleAnchor,
): Option<ResizeHandleAnchor> {
  return Option.fromNullable(
    NodeResize.HandleAnchors.find((each) => isSameAnchor(each, anchor)),
  );
}

/**
 * その箇所が、左上から時計回りの並びの何番目か。
 *
 * 出ているハンドルの並びと同じ順序なので、そのまま添字として使える。
 *
 * @param anchor 探している箇所
 * @returns 並びの中の位置。並びに無ければ `-1`
 */
export function resizeAnchorIndexAt(anchor: ResizeHandleAnchor): number {
  return NodeResize.HandleAnchors.findIndex((each) =>
    isSameAnchor(each, anchor),
  );
}
