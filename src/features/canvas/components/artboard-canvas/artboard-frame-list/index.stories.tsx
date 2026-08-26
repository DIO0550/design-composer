import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import { sampleCanvasSelection } from "@/features/canvas/__stories__/sample-canvas-document";
import { DocumentHtml } from "@/services/document-html";
import { Option } from "@/utils/Option";
import { WithCanvasControls } from "../__stories__/canvas-controls";
import { ArtboardFrameList } from "./index";

/**
 * artboard の並びと、名前で引く強調の規則。
 *
 * `ArtboardCanvas` のストーリーは倍率・パンの器ごと撮るので、並びの間隔（`gap-8`）と
 * 折り返しが読み取りにくい。ここは変形の外で素の並びだけを映す。
 */
function ArtboardFrameListWithControls({
  selection,
}: Readonly<{
  selection: DocumentSelection;
}>) {
  const compiled = DocumentHtml.compile(selection.document);
  if (!compiled.ok) {
    // ストーリーの入力は固定なので、ここへは来ない（来たら組み立てが壊れている）
    return <p>コンパイルに失敗しました: {compiled.error.message}</p>;
  }
  return (
    <WithCanvasControls selection={selection}>
      {(controls) => (
        <ArtboardFrameList
          compiled={compiled.value}
          selection={selection}
          tokenSelection={TokenSelection.create(
            selection.document,
            Option.none,
          )}
          onSelect={() => {}}
          {...controls}
        />
      )}
    </WithCanvasControls>
  );
}

const meta = {
  title: "features/canvas/ArtboardCanvas/ArtboardFrameList",
  component: ArtboardFrameListWithControls,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-[32rem] w-full overflow-auto bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArtboardFrameListWithControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { selection: sampleCanvasSelection() },
};

/** 選択の枠（青の実線）。artboard 自身を選ぶと枠ごと囲まれる。 */
export const ArtboardSelected: Story = {
  name: "artboard を選択中",
  args: { selection: sampleCanvasSelection(["settings"]) },
};

/**
 * 配下のノードを選んだ状態。
 *
 * 枠は選んだノードに付き、見出しの青は**それを載せている artboard**に付く
 * （`aria-current` と同じ「今見ている 1 枚」の意味 / #184）。2 つが別のものを
 * 指していることは、この組み合わせでしか見えない。
 */
export const NodeSelected: Story = {
  name: "配下のノードを選択中",
  args: { selection: sampleCanvasSelection(["overflow-wide"]) },
};
