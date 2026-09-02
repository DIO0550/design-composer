import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { useNodeResize } from "../index";

/** 2 軸とも固定した `panel` を持つドキュメントと、選択の対。 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  const designDocument = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "panel",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "fixed",
              height: 100,
            },
            children: [],
          },
        ],
      },
    ],
  });
  return DocumentSelection.fromNames(designDocument, selectedNames);
}

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300 / 下辺 y=150。 */
const PanelBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

/**
 * フックを DOM へ繋いだだけの器。
 *
 * キャンバスは中身を文字列の HTML で流し込むので、フックは名前の属性で要素を引く。
 * ここでも同じ属性を持つ要素を 1 つ置き、掴めたか / click を飲み込んだかを読めるようにする
 * （ハンドルの見た目は components/artboard-canvas の責務なのでここでは扱わない）。
 */
function NodeResizeHarness({
  selection,
  onResize,
}: Readonly<{
  selection: DocumentSelection;
  onResize: (sizes: readonly AxisLength[]) => void;
}>) {
  const [grabbed, setGrabbed] = useState("押していない");
  const [clicked, setClicked] = useState("click は届いていない");
  const nodeResize = useNodeResize({
    selection,
    view: CanvasView.create(),
    onResize,
  });

  return (
    <div data-testid="surface" {...nodeResize.dragHandlers}>
      <button
        type="button"
        data-name="panel"
        data-testid="panel"
        onPointerDown={(event) =>
          setGrabbed(nodeResize.grabAt(event) ? "掴んだ" : "掴んでいない")
        }
        onClick={() =>
          setClicked(nodeResize.consumeClick() ? "飲み込んだ" : "選択に使う")
        }
      />
      <p data-testid="grabbed">{grabbed}</p>
      <p data-testid="clicked">{clicked}</p>
    </div>
  );
}

/**
 * 描かれた大きさをテスト用の値にした `panel`。
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、ブラウザが行う測定だけを
 * 差し替える（掴める範囲と長さの決まり方は実物の node-resize が答える）。
 */
function panel(): Element {
  const element = screen.getByTestId("panel");
  element.getBoundingClientRect = () =>
    new DOMRect(
      PanelBounds.left,
      PanelBounds.top,
      PanelBounds.width,
      PanelBounds.height,
    );
  return element;
}

function surface(): Element {
  return screen.getByTestId("surface");
}

function grabbed(): string {
  return screen.getByTestId("grabbed").textContent ?? "";
}

function clicked(): string {
  return screen.getByTestId("clicked").textContent ?? "";
}

test("選択中のノードの辺を押すとハンドルを掴む", () => {
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={vi.fn()}
    />,
  );

  pressPointer(panel(), { x: 298, y: 100 });

  expect(grabbed()).toBe("掴んだ");
});

test("辺から離れたところを押してもハンドルは掴まない", () => {
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={vi.fn()}
    />,
  );

  pressPointer(panel(), { x: 200, y: 100 });

  expect(grabbed()).toBe("掴んでいない");
});

test("何も選んでいなければ辺を押してもハンドルは掴まない", () => {
  render(<NodeResizeHarness selection={setupSelection()} onResize={vi.fn()} />);

  pressPointer(panel(), { x: 298, y: 100 });

  expect(grabbed()).toBe("掴んでいない");
});

test("掴んだままポインタを動かすと動かした分の大きさが通知される", () => {
  const onResize = vi.fn();
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={onResize}
    />,
  );

  pressPointer(panel(), { x: 298, y: 100 });
  movePointer(surface(), { x: 338, y: 100 });

  expect(onResize).toHaveBeenCalledWith([{ axis: "width", length: 240 }]);
});

test("掴んでいなければポインタを動かしても大きさは通知されない", () => {
  const onResize = vi.fn();
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={onResize}
    />,
  );

  movePointer(surface(), { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("離したあとにポインタを動かしても大きさは通知されない", () => {
  const onResize = vi.fn();
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={onResize}
    />,
  );

  pressPointer(panel(), { x: 298, y: 100 });
  releasePointer(surface(), { x: 298, y: 100 });
  movePointer(surface(), { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("ポインタがキャンバスの外へ出るとリサイズが取り消される", () => {
  const onResize = vi.fn();
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={onResize}
    />,
  );

  pressPointer(panel(), { x: 298, y: 100 });
  fireEvent.pointerLeave(surface());
  movePointer(surface(), { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("大きさを変えた直後の click は飲み込まれる", () => {
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={vi.fn()}
    />,
  );

  pressPointer(panel(), { x: 298, y: 100 });
  movePointer(surface(), { x: 338, y: 100 });
  releasePointer(surface(), { x: 338, y: 100 });
  fireEvent.click(panel());

  expect(clicked()).toBe("飲み込んだ");
});

test("リサイズしていないときの click はそのまま選択に使える", () => {
  render(
    <NodeResizeHarness
      selection={setupSelection(["panel"])}
      onResize={vi.fn()}
    />,
  );

  fireEvent.click(panel());

  expect(clicked()).toBe("選択に使う");
});
