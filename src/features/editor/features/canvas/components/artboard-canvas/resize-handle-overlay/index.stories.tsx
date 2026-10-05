import type { Meta, StoryObj } from "@storybook/react-vite";
import { AxisLength } from "@/domains/dcmp/axis-length";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import type { ResizableSelection } from "@/features/editor/features/canvas/domains/node-resize";
import { Option } from "@/utils/Option";
import { ResizeHandleOverlay } from "./index";

/** 既定で選択されている体の箱（回る前）。器はストーリーの `bounds` から描く。 */
const SelectedBounds: CanvasBounds = {
  left: 40,
  top: 40,
  width: 220,
  height: 120,
};

/**
 * 選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * 選択されている体の箱と同じ矩形を props で渡し、ハンドルがその辺をまたいで置かれることを
 * 見る。オーバーレイは箱の外側にあるので、はみ出した半分が切られない。
 *
 * **このストーリーは新設で、視覚差分のベースラインを持たない。**
 * ずれていても赤くならないので、辺をまたいでいるかは絵を見て確かめる。
 */
const meta = {
  title: "features/editor/features/canvas/ArtboardCanvas/ResizeHandleOverlay",
  component: ResizeHandleOverlay,
  parameters: { layout: "fullscreen" },
  args: {
    bounds: { unrotated: SelectedBounds, rotation: 0 },
    isGrabbing: false,
    onGrab: () => {},
  },
  decorators: [
    (Story, context) => (
      <div className="relative h-56 bg-gray-100">
        <div
          className="absolute overflow-hidden bg-white shadow-sm outline-2 outline-blue-500"
          style={{
            left: `${context.args.bounds.unrotated.left}px`,
            top: `${context.args.bounds.unrotated.top}px`,
            width: `${context.args.bounds.unrotated.width}px`,
            height: `${context.args.bounds.unrotated.height}px`,
            transform: `rotate(${context.args.bounds.rotation}deg)`,
          }}
        />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResizeHandleOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 2 軸とも固定で位置も持つ要素。 */
const BothAxesResizable: ResizableSelection = {
  lengths: [AxisLength.create("width", 220), AxisLength.create("height", 120)],
  origin: Option.some({ x: 0, y: 0 }),
  snapTargetNames: [],
  rotation: { own: 0, total: 0 },
};

/** 2 軸とも固定で位置も持つ要素。8 箇所すべてが掴め、箇所ごとにカーソルが変わる。 */
export const BothAxes: Story = {
  name: "2 軸とも掴める",
  args: { resizable: BothAxesResizable },
};

/**
 * 30 度回した要素。ハンドルは回った角・辺の中点に出て、四角も同じ角度だけ回る
 * （docs/06-ui.md「リサイズハンドル」）。
 *
 * 回すと外接矩形が広がるので、器（高さ 224px）からはみ出さない小さい箱にしてある。
 */
export const Rotated: Story = {
  name: "回った要素",
  args: {
    bounds: {
      unrotated: { left: 50, top: 70, width: 160, height: 80 },
      rotation: 30,
    },
    resizable: { ...BothAxesResizable, rotation: { own: 30, total: 30 } },
  },
};

/** 幅だけが固定の要素。8 個とも描くが、掴めるのは幅を変えられる 6 箇所だけ。 */
export const WidthOnly: Story = {
  name: "幅だけ掴める",
  args: {
    resizable: {
      lengths: [AxisLength.create("width", 220)],
      origin: Option.some({ x: 0, y: 0 }),
      snapTargetNames: [],
      rotation: { own: 0, total: 0 },
    },
  },
};
