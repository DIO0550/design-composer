import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { NodeTemplate } from "@/domains/session/node-template";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { drawnAt } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { NodeDrag } from "@/features/editor/features/canvas/domains/node-drag";
import { ElementEx } from "@/utils/ElementEx";
import { Option } from "@/utils/Option";
import { useNodeDrag } from "../index";

/**
 * `home` の直下に縦並びの Box の `card`（中に Text の `label`）・フローの Text の `title`・
 * 絶対配置の Text の `badge` が並び、隣に空の `settings` がある、何も選んでいない対。
 */
function setupSelection(): DocumentSelection {
  const designDocument = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            props: { layout: "column" },
            children: [{ name: "label", type: "Text" }],
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
          {
            name: "badge",
            type: "Text",
            props: { content: "3", placement: "absolute", x: 40, y: 24 },
          },
        ],
      },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
  });
  return DocumentSelection.fromNames(designDocument, []);
}

/** パレットの行から掴む雛形。 */
export const BoxTemplate: NodeTemplate = { kind: "primitive", type: "Box" };

/**
 * 名前の属性を持つ要素の props。キャンバスはコンパイル結果を名前の属性付きで流し込むので、
 * フックはこの属性で要素を引き、押された位置から外へ辿る。
 */
function named(name: string) {
  return { [ElementNameAttribute]: name };
}

/**
 * フックを DOM へ繋いだだけの器。
 *
 * ドキュメントと同じ入れ子で名前の属性を持つ要素を置き、artboard の枠と同じく押された位置
 * から外へ辿った名前で掴む（枠はボタンなので、中身もボタンの中に置ける `span` にする）。掴めたか・`click` が選択まで届いたか・運んでいる雛形・掴んだ
 * ノードのずらし量を読めるようにする（枠・ドロップ線・ガイド線の見た目は
 * features/editor/features/canvas/components/artboard-canvas の責務なのでここでは扱わない）。
 */
function NodeDragHarness({
  view,
  callbacks,
}: Readonly<{
  view: CanvasView;
  callbacks: Pick<
    Parameters<typeof useNodeDrag>[0],
    "onMove" | "onInsertAt" | "onReposition"
  >;
}>) {
  const [grabbed, setGrabbed] = useState("押していない");
  const [clicked, setClicked] = useState("click は届いていない");
  const nodeDrag = useNodeDrag({
    selection: setupSelection(),
    view,
    ...callbacks,
  });
  const preview = NodeDrag.repositionPreview(nodeDrag.drag);

  return (
    <div data-testid="canvas-content" {...nodeDrag.dragHandlers}>
      <button
        type="button"
        {...named("home")}
        onPointerDown={(event) =>
          setGrabbed(
            nodeDrag.grabNode(
              event,
              ElementEx.attributeValuesToRoot(
                event.target,
                ElementNameAttribute,
              ),
              SelectionDigs.NoDeeper,
            )
              ? "掴んだ"
              : "掴んでいない",
          )
        }
        onClick={() => setClicked("選択に使う")}
      >
        <span {...named("card")}>
          <span {...named("label")} />
        </span>
        <span {...named("title")} />
        <span {...named("badge")} />
      </button>
      <div {...named("settings")} />
      <button
        type="button"
        data-testid="palette-box"
        onPointerDown={(event) => nodeDrag.grabTemplate(BoxTemplate, event)}
      />
      <p data-testid="grabbed">{grabbed}</p>
      <p data-testid="clicked">{clicked}</p>
      <p data-testid="carried-template">
        {Option.isSome(nodeDrag.carriedTemplate)
          ? NodeTemplate.baseName(nodeDrag.carriedTemplate.value)
          : "運んでいない"}
      </p>
      <p data-testid="reposition-preview">
        {Option.isSome(preview)
          ? `${preview.value.name} ${preview.value.offset.x},${preview.value.offset.y}`
          : "ずらしていない"}
      </p>
    </div>
  );
}

/**
 * 器を描く。
 *
 * @param view 倍率を引く表示の状態。省略すると等倍
 * @returns 落としたときに呼ばれる 3 つの受け口
 */
export function renderHarness(view: CanvasView = CanvasView.create()) {
  const callbacks = {
    onMove: vi.fn(),
    onInsertAt: vi.fn(),
    onReposition: vi.fn(),
  };
  render(<NodeDragHarness view={view} callbacks={callbacks} />);
  return callbacks;
}

/**
 * `card` の中に `label` が上寄りに 1 つ並ぶ配置にする。`label` の中点は y=140 で、
 * それより下で離せば `card` の 2 番目（index 1）へ挿さる。
 */
export function drawCardColumn(): void {
  drawnAt("card", { left: 0, top: 120, width: 200, height: 100 });
  drawnAt("label", { left: 10, top: 130, width: 100, height: 20 });
}

/** パレットの行の代わりに置いた、Box の雛形を掴むボタン。 */
export function paletteBox(): HTMLElement {
  return screen.getByTestId("palette-box");
}
