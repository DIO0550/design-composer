import type { PointerEvent as ReactPointerEvent } from "react";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import type { Option } from "@/utils/Option";

/**
 * パレット（`Assets`）の行を掴む口。
 *
 * 「今どれを掴んでいるか」と「掴み始めを受ける手」は片方だけでは行を描けない
 * （掴まれている行を強調するには前者が、掴み始めるには後者が要る）ため 1 つの型にまとめる。
 * レール・パネル・2 つの一覧を通って行まで届くので、通り道の props が 2 本に割れない
 * ようにする意味もある。
 *
 * Why not: Provider にはしない。通り道が 3 階層あって条件には当たるが、運ぶのはこの 1 つ
 * だけで、撤去した挿入の口（`isInsertEnabled` / `onInsert`）と同じ道筋。Provider にすると
 * ドラッグがどこから来るのかが読めなくなる（rules/components.md）。
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
