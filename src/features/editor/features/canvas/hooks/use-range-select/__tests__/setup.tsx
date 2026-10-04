import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { drawNamed } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { useRangeSelect } from "../index";

/** `home` の直下に Box の `card`（中に Text の `label`）と Text の `title` が並ぶドキュメント。 */
const HomeDocument = DesignDocument.create({
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        {
          name: "card",
          type: "Box",
          children: [{ name: "label", type: "Text" }],
        },
        { name: "title", type: "Text" },
      ],
    },
  ],
});

/**
 * 3 つのノードが描かれている位置を決める。`label` は `card` の内側、`title` は `card` の右。
 * 範囲が `card` だけを覆うなら x=100〜180、`title` まで覆うなら x=380 を越える。
 */
export function drawHomeChildren(): void {
  drawNamed("card", { left: 100, top: 100, width: 80, height: 40 });
  drawNamed("label", { left: 110, top: 110, width: 20, height: 10 });
  drawNamed("title", { left: 300, top: 100, width: 80, height: 40 });
}

/**
 * フックを DOM へ繋いだだけの器。
 *
 * 土台の中に artboard の枠の代わりのボタンを 1 つ置き、`click` がそこまで届いたかと、
 * 引いている範囲（`<left>,<top>,<width>,<height>`）を読めるようにする。枠の中には、掴むと `pointerdown` を土台まで上げない
 * ノード（中身を掴んだ枠と同じ）を 1 つ置く（枠の見た目と範囲の枠の描画は
 * features/editor/features/canvas/components/artboard-canvas の責務なのでここでは扱わない）。
 */
function RangeSelectHarness({
  onSelect,
}: Readonly<{ onSelect: (names: readonly string[]) => void }>) {
  const [clicked, setClicked] = useState("click は届いていない");
  const { bounds, dragHandlers } = useRangeSelect({
    designDocument: HomeDocument,
    onSelect,
  });

  return (
    <div data-testid="canvas-surface" {...dragHandlers}>
      <button
        type="button"
        data-testid="artboard-frame"
        onClick={() => setClicked("届いた")}
      >
        <span
          data-testid="node"
          onPointerDown={(event) => event.stopPropagation()}
        />
      </button>
      <output data-testid="range-bounds">
        {Option.isSome(bounds)
          ? `${bounds.value.left},${bounds.value.top},${bounds.value.width},${bounds.value.height}`
          : "引いていない"}
      </output>
      <p data-testid="clicked">{clicked}</p>
    </div>
  );
}

/**
 * 器を描く。
 *
 * @returns 選び直す相手を受け取った `onSelect`
 */
export function renderHarness() {
  const onSelect = vi.fn();
  render(<RangeSelectHarness onSelect={onSelect} />);
  return { onSelect };
}

/** artboard の枠の代わりに置いたボタン。押すと範囲選択の起点になり、`click` を受ける。 */
export function artboardFrame(): HTMLElement {
  return screen.getByTestId("artboard-frame");
}

/** 枠の中のノード。押しても `pointerdown` が土台まで上がらない。 */
export function frameNode(): HTMLElement {
  return screen.getByTestId("node");
}
