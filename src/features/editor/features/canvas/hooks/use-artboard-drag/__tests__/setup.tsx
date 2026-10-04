import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import { canvasContent } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { useArtboardDrag } from "../index";

/** `home` と、その右隣に置いた `settings` の 2 枚を持つドキュメント。 */
const TwoArtboards = DesignDocument.create({
  artboards: [
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 360, height: 240, children: [] },
  ],
});

/** `settings` を掴んだ時点でキャンバス上に描かれていた位置。原点から外して、足し込みが見えるようにする。 */
export const SettingsGrabbedAt = { x: 400, y: 0 };

/**
 * フックを DOM へ繋いだだけの器。
 *
 * 見出しの代わりに `settings` を掴むボタンを 1 つ置き、運び先（`<名前> <x>,<y>`）を読めるようにする（見出しと
 * 運んでいる間の見た目は features/editor/features/canvas/components/artboard-canvas の
 * 責務なのでここでは扱わない）。
 */
function ArtboardDragHarness({
  view,
  onReposition,
}: Readonly<{
  view: CanvasView;
  onReposition: (name: string, canvasPosition: Offset) => void;
}>) {
  const { grab, dragHandlers, preview } = useArtboardDrag({
    document: TwoArtboards,
    view,
    onReposition,
  });

  return (
    <div data-testid="canvas-content" {...dragHandlers}>
      <button
        type="button"
        data-testid="settings-handle"
        onPointerDown={(event) => grab("settings", SettingsGrabbedAt, event)}
      />
      <output data-testid="preview">
        {Option.isSome(preview)
          ? `${preview.value.name} ${preview.value.canvasPosition.x},${preview.value.canvasPosition.y}`
          : "運んでいない"}
      </output>
    </div>
  );
}

/**
 * 器を描く。
 *
 * @param view 倍率を引く表示の状態。省略すると等倍
 * @returns 置き直しを受け取った `onReposition`
 */
export function renderHarness(view: CanvasView = CanvasView.create()) {
  const onReposition = vi.fn();
  render(<ArtboardDragHarness view={view} onReposition={onReposition} />);
  return { onReposition };
}

/** `settings` を掴むボタン。 */
export function settingsHandle(): HTMLElement {
  return screen.getByTestId("settings-handle");
}

/** `settings` を (500, 100) で掴み、(30, -12) 運んだ位置で離す。 */
export function dragSettings(): void {
  pressPointer(settingsHandle(), { x: 500, y: 100 });
  movePointer(canvasContent(), { x: 530, y: 88 });
  releasePointer(canvasContent(), { x: 530, y: 88 });
}
