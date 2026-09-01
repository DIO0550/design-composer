import type { Meta, StoryObj } from "@storybook/react-vite";
import { AxisLength } from "@/domains/dcmp/axis-length";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { ResizeHandleOverlay } from "./index";

/** 選択されている体の箱。器とハンドルの両方が同じ数値を使うので 1 つに置く。 */
const SelectedBounds: CanvasBounds = {
  left: 40,
  top: 40,
  width: 220,
  height: 120,
};

/**
 * 選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * 選択されている体の箱と同じ矩形を props で渡し、ハンドルがその辺をまたいで
 * 置かれることを見る。箱に `overflow-hidden` を付けているのは artboard に揃えるため。
 * オーバーレイは箱の外側にあるので、はみ出した半分が切られない。
 *
 * **このストーリーは新設で、視覚差分のベースラインを持たない。**
 * ずれていても赤くならないので、辺をまたいでいるかは絵を見て確かめる。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/ResizeHandleOverlay",
  component: ResizeHandleOverlay,
  parameters: { layout: "fullscreen" },
  args: { bounds: SelectedBounds, isGrabbing: false, onGrab: () => {} },
  decorators: [
    (Story) => (
      <div className="relative h-56 bg-gray-100">
        <div
          className="absolute overflow-hidden bg-white shadow-sm outline-2 outline-blue-500"
          style={{
            left: `${SelectedBounds.left}px`,
            top: `${SelectedBounds.top}px`,
            width: `${SelectedBounds.width}px`,
            height: `${SelectedBounds.height}px`,
          }}
        />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResizeHandleOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 2 軸とも固定の要素。右辺中央と下辺中央が掴め、そこだけカーソルが変わる。 */
export const BothAxes: Story = {
  name: "2 軸とも掴める",
  args: {
    handles: [
      AxisLength.create("width", 220),
      AxisLength.create("height", 120),
    ],
  },
};

/** 幅だけが固定の要素。8 個とも描くが、掴めるのは右辺中央だけ。 */
export const WidthOnly: Story = {
  name: "幅だけ掴める",
  args: { handles: [AxisLength.create("width", 220)] },
};
