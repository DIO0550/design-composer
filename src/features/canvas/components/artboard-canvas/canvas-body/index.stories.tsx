import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  EmptyCanvasDocument,
  SampleCanvasDocument,
  sampleCanvasSelection,
} from "@/features/canvas/__stories__/sample-canvas-document";
import { type CompiledDocument, DocumentHtml } from "@/services/document-html";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { WithCanvasControls } from "../__stories__/canvas-controls";
import { CanvasBody } from "./index";

/**
 * キャンバスに出す中身の 3 通り（並び / artboard が 0 枚 / コンパイル失敗）。
 *
 * **コンパイル失敗の姿はここにしかストーリーが無い。** `ArtboardCanvas` から作るには
 * コンパイルを壊す必要があり、編集画面の経路では作れない状態のため。
 */
function CanvasBodyWithControls({
  selection,
  compiled,
}: Readonly<{
  selection: DocumentSelection;
  compiled: Result<CompiledDocument, Error>;
}>) {
  return (
    <WithCanvasControls selection={selection}>
      {(controls) => (
        <CanvasBody
          compiled={compiled}
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
  title: "features/canvas/ArtboardCanvas/CanvasBody",
  component: CanvasBodyWithControls,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-96 w-full overflow-hidden bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CanvasBodyWithControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Artboards: Story = {
  name: "artboard が並ぶ",
  args: {
    selection: sampleCanvasSelection(),
    compiled: DocumentHtml.compile(SampleCanvasDocument),
  },
};

/** 空表示へ倒さず知らせを出す（artboard が無いのかコンパイルが壊れたのか区別するため）。 */
export const NoArtboards: Story = {
  name: "artboard が 0 枚",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    compiled: DocumentHtml.compile(EmptyCanvasDocument),
  },
};

/** コンパイルの失敗はそのまま見せる（握り潰すと原因が画面から消える）。 */
export const CompileFailure: Story = {
  name: "コンパイルに失敗",
  args: {
    selection: sampleCanvasSelection(),
    compiled: Result.err(new Error("参照している部品 card が見つかりません")),
  },
};
