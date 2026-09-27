import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  dragRow,
  enterPointer,
  leavePointer,
  pressPointer,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";
import { rowOf } from "@/components/__tests__/row-drag";
import { DropLineTestId, ListOrientations } from "@/components/drop-line";
import type { IndexMove } from "@/types/IndexMove";
import { TabBar } from "../index";

/** 並べる 3 枚の名前。前後どちらへも運べるよう、真ん中を持つ数にする。 */
const Names = ["/work/login.dcmp", "/work/settings.dcmp", "/work/profile.dcmp"];

/**
 * 3 枚並べた帯を描く。
 *
 * @returns 伝わった移動を記録する並び
 */
function renderThreeTabs(): Readonly<{ moves: IndexMove[] }> {
  const moves: IndexMove[] = [];

  render(
    <TabBar label="開いているもの" onReorder={(move) => moves.push(move)}>
      {Names.map((name, index) => (
        <TabBar.Tab
          key={name}
          name={name}
          index={index}
          isCurrent={index === 1}
          onSelect={() => {}}
          onClose={() => {}}
        >
          {name}
        </TabBar.Tab>
      ))}
    </TabBar>,
  );

  return { moves };
}

/**
 * そのタブの 1 枚ぶんの枠（掴む口）。
 *
 * @param name タブが指すもの。このテストでは出す字にも同じものを使う
 * @returns 字の部分を包んでいる枠
 */
function tabOf(name: string): HTMLElement {
  return rowOf(screen.getByRole("list"), name);
}

test("タブを掴んで後ろのタブの上で離すと、その位置への移動が伝わる", () => {
  const { moves } = renderThreeTabs();

  dragRow({ from: tabOf(Names[0]), to: tabOf(Names[2]) });

  expect(moves).toStrictEqual([{ fromIndex: 0, toIndex: 2 }]);
});

test("タブを掴んで前のタブの上で離すと、その位置への移動が伝わる", () => {
  const { moves } = renderThreeTabs();

  dragRow({ from: tabOf(Names[2]), to: tabOf(Names[1]) });

  expect(moves).toStrictEqual([{ fromIndex: 2, toIndex: 1 }]);
});

test("掴んだタブの上で離しても移動は伝わらない", () => {
  const { moves } = renderThreeTabs();

  dragRow({ from: tabOf(Names[0]), to: tabOf(Names[0]) });

  expect(moves).toStrictEqual([]);
});

/*
 * 別のタブで離したときに閉じない（click が共通の祖先の `<ul>` へ行く）ことは、`fireEvent` が
 * click を撃たないのでここでは確かめられない。実ブラウザで確かめる。
 */
test("閉じるボタンを掴んで運んでも、タブの移動として伝わる", () => {
  const { moves } = renderThreeTabs();

  dragRow({
    from: screen.getByRole("button", { name: `${Names[0]} を閉じる` }),
    to: tabOf(Names[1]),
  });

  expect(moves).toStrictEqual([{ fromIndex: 0, toIndex: 1 }]);
});

test("後ろのタブへ運んでいる間は、そのタブの後ろ側に横並びの落ちる先の線が出る", () => {
  renderThreeTabs();

  pressPointer(tabOf(Names[0]), { x: 0, y: 0 });
  enterPointer(tabOf(Names[2]));

  const line = screen.getByTestId(DropLineTestId);
  expect(tabOf(Names[2]).contains(line)).toBe(true);
  expect(line.getAttribute("data-side")).toBe("after");
  expect(line.getAttribute("data-orientation")).toBe(
    ListOrientations.Horizontal,
  );
});

test("前のタブへ運んでいる間は、そのタブの前側に落ちる先の線が出る", () => {
  renderThreeTabs();

  pressPointer(tabOf(Names[2]), { x: 0, y: 0 });
  enterPointer(tabOf(Names[0]));

  const line = screen.getByTestId(DropLineTestId);
  expect(tabOf(Names[0]).contains(line)).toBe(true);
  expect(line.getAttribute("data-side")).toBe("before");
});

test("掴んだまま帯の外へ出ると取り消され、落ちる先の線が消える", () => {
  const { moves } = renderThreeTabs();

  pressPointer(tabOf(Names[0]), { x: 0, y: 0 });
  enterPointer(tabOf(Names[2]));
  leavePointer(screen.getByRole("list"));
  const lineAfterLeave = screen.queryByTestId(DropLineTestId);
  releasePointer(tabOf(Names[2]), { x: 0, y: 0 });

  expect(lineAfterLeave).toBeNull();
  expect(moves).toStrictEqual([]);
});
