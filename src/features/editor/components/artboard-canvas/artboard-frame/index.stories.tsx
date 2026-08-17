import type { Meta, StoryObj } from "@storybook/react-vite";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentHtml } from "@/services/document-html";
import { WithCanvasControls } from "../__stories__/canvas-controls";
import { ArtboardFrame } from "./index";

/**
 * artboard 1 枚。見出しと、コンパイル結果を流し込んだ枠。
 *
 * `ArtboardCanvas` のストーリーは 3 枚を縮めて並べるので、1 枚ぶんの枠線・影・
 * 選択時の 2px の青枠を等倍で読み取れない。ここは 1 枚だけを素の倍率で映す。
 */
function ArtboardFrameWithControls({
  state,
  artboardName,
  isSelected,
  isCurrent,
}: Readonly<{
  state: EditorState;
  artboardName: string;
  isSelected: boolean;
  isCurrent: boolean;
}>) {
  const compiled = DocumentHtml.compile(EditorState.document(state));
  const artboard = compiled.ok
    ? compiled.value.artboards.find(
        (candidate) => candidate.element.name === artboardName,
      )
    : undefined;
  if (compiled.ok === false || artboard === undefined) {
    // ストーリーの入力は固定なので、ここへは来ない（来たら組み立てが壊れている）
    return <p>{artboardName} を組み立てられませんでした</p>;
  }
  return (
    <WithCanvasControls state={state}>
      {(controls) => (
        <ul style={compiled.value.variables} className="p-8">
          <ArtboardFrame
            artboard={artboard}
            isSelected={isSelected}
            isCurrent={isCurrent}
            onSelect={() => {}}
            {...controls}
          />
        </ul>
      )}
    </WithCanvasControls>
  );
}

const meta = {
  title: "features/editor/ArtboardCanvas/ArtboardFrame",
  component: ArtboardFrameWithControls,
  parameters: { layout: "fullscreen" },
  args: { state: SampleEditorState, artboardName: "home" },
  decorators: [
    (Story) => (
      <div className="h-96 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArtboardFrameWithControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { isSelected: false, isCurrent: false },
};

/** 選んでいる artboard。枠が 2px の青になる（`aria-current` も立つ）。 */
export const Selected: Story = {
  name: "選択中",
  args: { isSelected: true, isCurrent: true },
};

/**
 * 選んではいないが、今ツリーが映している 1 枚。
 *
 * 見出しだけが青くなり、枠は灰色のまま。**選択と「今見ている 1 枚」が別物である**
 * ことは、この組み合わせでしか見えない（#184）。
 */
export const CurrentOnly: Story = {
  name: "今見ている 1 枚（選択は配下のノード）",
  args: { isSelected: false, isCurrent: true },
};
