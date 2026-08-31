import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { drag, pressPointer } from "@/features/canvas/__tests__/canvas-gesture";
import { renderCanvas, selectionFromArtboards } from "./setup";

/**
 * 幅 200 の artboard を 3 枚並べた、未選択の対。
 *
 * 3 枚並べるのは、掴む相手を**先頭以外**にできるようにするため。先頭は既定の位置が
 * 原点なので、掴んだ時点の位置を無視する実装でも同じ答えになる。
 *
 * @returns 3 枚の artboard を持つドキュメントと、未選択の対
 */
function setupSelection() {
  return selectionFromArtboards([
    { name: "first", width: 200, height: 140, children: [] },
    { name: "second", width: 200, height: 140, children: [] },
    { name: "third", width: 200, height: 140, children: [] },
  ]);
}

/**
 * artboard を動かす掴み口（見出し）。
 *
 * @param name 掴む artboard の名前
 * @returns その artboard の見出し
 */
function handleOf(name: string): HTMLElement {
  const label = screen.getByText(name);
  const handle = label.closest("span[class*='cursor-grab']");
  if (handle === null) {
    // 見出しは必ず掴み口の中にある（来たら掴み口の組み立てが壊れている）
    throw new Error(`${name} の掴み口が見つからない`);
  }
  return handle as HTMLElement;
}

test("見出しを掴んで動かすと、離した位置の座標で置き直しが届く", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  // 2 枚目の既定の位置は x=232（200 + 32）。そこから動かす
  drag(handleOf("second"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 292,
    y: 40,
  });
});

test("先頭以外を掴んでも原点へ飛ばない", () => {
  /*
   * 掴んだ時点の位置を無視して原点から測る実装だと `{x:60,y:40}` になる。
   * 既定の位置が原点でない 2 枚目で見ることで、その壊し方を落とせる。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  drag(handleOf("second"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });

  expect(onRepositionArtboard).not.toHaveBeenCalledWith("second", {
    x: 60,
    y: 40,
  });
});

test("閾値までの動きでは置き直しが届かない", () => {
  // 3px は閾値（4px）未満なので、押して離しただけのクリックとして扱う
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  drag(handleOf("second"), { from: { x: 0, y: 0 }, to: { x: 3, y: 0 } });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
});

test("artboard の中身を掴んでも artboard の置き直しは届かない", () => {
  // 中身のドラッグはツリー内の移動 / 座標移動で、artboard は動かない
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  const frame = screen.getByRole("button", { name: "second" });
  pressPointer(frame, { x: 0, y: 0 });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
});
