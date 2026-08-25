import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  dragRow,
  enterPointer,
  pressPointer,
} from "@/components/__tests__/pointer-gesture";
import { DropLineTestId } from "@/components/drop-line";
import { groupOf, renderRowList, rowOf } from "./setup";

/**
 * 行を掴んで別の行の上まで運ぶ。
 *
 * @param list 器を描いた要素
 * @param movement 掴む行と運ぶ先の行の名前
 */
function dragRowNamed(
  list: HTMLElement,
  movement: Readonly<{ from: string; to: string }>,
): void {
  const from = rowOf(list, movement.from);
  dragRow({ from, to: rowOf(list, movement.to), group: groupOf(from) });
}

test("行を1つ前の兄弟の上へ運ぶと同じ親の中の位置として伝わる", () => {
  const { list, onReorder } = renderRowList();

  dragRowNamed(list, { from: "body", to: "title" });

  expect(onReorder).toHaveBeenCalledWith({ parentName: "root", index: 1 }, 0);
});

test("行を1つ後ろの兄弟の上へ運ぶと同じ親の中の位置として伝わる", () => {
  const { list, onReorder } = renderRowList();

  dragRowNamed(list, { from: "title", to: "body" });

  expect(onReorder).toHaveBeenCalledWith({ parentName: "root", index: 0 }, 1);
});

test("子の行の並べ替えはその親の中の位置として伝わる", () => {
  const { list, onReorder } = renderRowList();

  dragRowNamed(list, { from: "deep", to: "body-text" });

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});

test("掴んだ行の上で離しても移動は伝わらない", () => {
  const { list, onReorder } = renderRowList();

  dragRowNamed(list, { from: "title", to: "title" });

  expect(onReorder).not.toHaveBeenCalled();
});

/*
 * 別の親の子は別の `<ul>` に属していて、そちらの群は掴んでいない状態のまま。
 * ここが通らないと「同じ親の中の並べ替え」しか受けない `onReorder` へ、
 * 別の親の中の index が渡ってしまう（並びの外を指す移動が画面から作れる）。
 */
test("別の親の行の上で離しても移動は伝わらない", () => {
  const { list, onReorder } = renderRowList();

  const from = rowOf(list, "title");
  dragRow({
    from,
    to: rowOf(list, "body-text"),
    group: groupOf(from),
  });

  expect(onReorder).not.toHaveBeenCalled();
});

test("運んでいる間は落ちる先が示される", () => {
  const { list } = renderRowList();

  // 離す前の状態を見たいので、掴んで入るところまでで止める
  pressPointer(rowOf(list, "title"), { x: 0, y: 0 });
  enterPointer(rowOf(list, "body"));

  expect(screen.getAllByTestId(DropLineTestId)).toHaveLength(1);
});

test("掴んだだけで動かしていない間は落ちる先が出ない", () => {
  const { list } = renderRowList();

  pressPointer(rowOf(list, "title"), { x: 0, y: 0 });

  expect(screen.queryByTestId(DropLineTestId)).toBeNull();
});
