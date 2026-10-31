import { renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import {
  clearDrawn,
  drawNamed,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import {
  SelectionDistanceTreeBounds,
  selectionDistanceTree,
} from "@/features/editor/features/canvas/__tests__/selection-distance-tree";
import { DrawnDistancePair } from "@/features/editor/features/canvas/domains/distance-pair";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { Option } from "@/utils/Option";
import { useSelectionDistances } from "..";

/*
 * 選択しているだけのときの Alt / Option の距離を、描かれている矩形から引く。何と何を測るかは
 * `distance-pair` が見るので、ここが見るのは測り直しと参照の保ち方。木の形は
 * `selection-distance-tree` の doc。
 */

/* 測定の差し替え方と後片付けが要る理由は `canvas-measure` の doc を見る。 */
afterEach(clearDrawn);

/** `row` と、その親 `card`・兄弟 `chip` を描く。 */
function drawRowAndAround(): void {
  drawNamed("row", SelectionDistanceTreeBounds.row);
  drawNamed("card", SelectionDistanceTreeBounds.card);
  drawNamed("chip", SelectionDistanceTreeBounds.chip);
}

test("測り直した矩形が前と同じなら、同じ参照を返す", () => {
  drawRowAndAround();
  const selection = selectionDistanceTree(["row"]);
  const { result, rerender } = renderHook(() =>
    useSelectionDistances(selection, Option.some(Pointing.Nothing)),
  );
  const before = result.current;

  rerender();

  expect(result.current).toBe(before);
});

test("指し先が無ければ、DOM を測らずに何も引かない", () => {
  const measured: string[] = [];
  for (const name of ["row", "card"] as const) {
    const element = drawNamed(name, SelectionDistanceTreeBounds[name]);
    const bounds = SelectionDistanceTreeBounds[name];
    element.getBoundingClientRect = () => {
      measured.push(name);
      return new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
    };
  }
  const selection = selectionDistanceTree(["row"]);

  const { result } = renderHook(() =>
    useSelectionDistances(selection, Option.none),
  );

  expect(result.current).toEqual(FacingDistances.None);
  expect(measured).toEqual([]);
});

test("測る組が変わると、新しい組で測り直す", () => {
  drawRowAndAround();
  const selection = selectionDistanceTree(["row"]);
  const { result, rerender } = renderHook<
    FacingDistances,
    { pointing: Pointing }
  >(({ pointing }) => useSelectionDistances(selection, Option.some(pointing)), {
    initialProps: { pointing: Pointing.Nothing },
  });

  rerender({
    pointing: Pointing.create(["chip", "card", "home"], SelectionDigs.NoDeeper),
  });

  expect(result.current).toEqual(
    DrawnDistancePair.toDistances({
      kind: "beside",
      from: SelectionDistanceTreeBounds.row,
      to: SelectionDistanceTreeBounds.chip,
    }),
  );
});
