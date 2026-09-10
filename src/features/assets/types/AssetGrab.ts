import type { PointerEvent as ReactPointerEvent } from "react";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { Option } from "@/utils/Option";

/**
 * パレット（`Assets`）の行を掴む口。
 *
 * 「今どれを掴んでいるか」と「掴み始めを受ける手」は片方だけでは行を描けない（掴まれている行を強調するには前者が、
 * 掴み始めるには後者が要る）ため 1 つの型にまとめる。レール・パネル・2 つの一覧を通って行まで届くので、通り道の props が
 * 2 本に割れないようにする意味もある。
 *
 * Provider にしないのは、通り道が 3 階層あって条件には当たるものの、運ぶのがこの 1 つだけで、Provider にするとドラッグが
 * どこから来るのかが読めなくなるため。
 */
export type AssetGrab = Readonly<{
  /** 今パレットから掴んで運んでいる指定。運んでいなければ不在。 */
  dragged: Option<NodeTemplate>;
  /** 行を押したときに呼ぶ。掴む位置を測るのにイベントごと渡す。 */
  onGrab: (
    template: NodeTemplate,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
}>;
