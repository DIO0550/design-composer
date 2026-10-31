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
import { ArrayEx } from "@/utils/ArrayEx";
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

/**
 * 指し先を差し替えながら描き、各レンダーで返した線をすべて残す。測り直す前のレンダーに
 * 何を返したかは、最後の値だけを見ても分からない。
 *
 * @param initial 最初の指し先
 * @returns 指し先を差し替える手続きと、それまでに返した線の並び
 */
function renderRecordingDistances(initial: Pointing) {
  const returned: FacingDistances[] = [];
  const selection = selectionDistanceTree(["row"]);
  const { rerender } = renderHook<FacingDistances, { pointing: Pointing }>(
    ({ pointing }) => {
      const distances = useSelectionDistances(selection, Option.some(pointing));
      returned.push(distances);
      return distances;
    },
    { initialProps: { pointing: initial } },
  );
  return { rerender, returned };
}

/** `row` と兄弟 `chip` の横並びの線。 */
function rowBesideChip(): FacingDistances {
  return DrawnDistancePair.toDistances({
    kind: "beside",
    from: SelectionDistanceTreeBounds.row,
    to: SelectionDistanceTreeBounds.chip,
  });
}

test("測る組が別の組に変わった回は、測り直す前にも前の組の線を返さない", () => {
  drawRowAndAround();
  const { rerender, returned } = renderRecordingDistances(
    Pointing.create(["chip", "card", "home"], SelectionDigs.NoDeeper),
  );
  const changedAt = returned.length;

  rerender({ pointing: Pointing.Nothing });

  expect(returned.slice(changedAt)).not.toContainEqual(rowBesideChip());
});

test("測る組が無くなった回は、測り直す前にも前の組の線を返さない", () => {
  drawRowAndAround();
  const { rerender, returned } = renderRecordingDistances(
    Pointing.create(["chip", "card", "home"], SelectionDigs.NoDeeper),
  );
  const changedAt = returned.length;

  rerender({ pointing: Pointing.Outside });

  expect(returned.slice(changedAt)).not.toContainEqual(rowBesideChip());
});

test("測る組の片方だけが別の名前に変わった回は、測り直す前にも前の組の線を返さない", () => {
  // `row` から `card` の縁まで → `row` から `home` の縁まで
  drawRowAndAround();
  drawNamed("home", SelectionDistanceTreeBounds.home);
  const { rerender, returned } = renderRecordingDistances(Pointing.Nothing);
  const changedAt = returned.length;

  rerender({ pointing: Pointing.create(["home"], SelectionDigs.NoDeeper) });

  expect(returned.slice(changedAt)).not.toContainEqual(
    DrawnDistancePair.toDistances({
      kind: "within",
      inner: SelectionDistanceTreeBounds.row,
      outer: SelectionDistanceTreeBounds.card,
    }),
  );
});

test("測る組が変わっても測った矩形が前と同じなら、新しい組の線を返す", () => {
  // `card` と `home` を同じ矩形に描くので、組の名前だけが変わる
  drawRowAndAround();
  drawNamed("home", SelectionDistanceTreeBounds.card);
  const { rerender, returned } = renderRecordingDistances(Pointing.Nothing);

  rerender({ pointing: Pointing.create(["home"], SelectionDigs.NoDeeper) });

  expect(ArrayEx.last(returned)).toEqual(
    Option.some(
      DrawnDistancePair.toDistances({
        kind: "within",
        inner: SelectionDistanceTreeBounds.row,
        outer: SelectionDistanceTreeBounds.card,
      }),
    ),
  );
});
