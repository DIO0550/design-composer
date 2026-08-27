import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ClockFake } from "@/libs/clock/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { OpenedDocumentEditor } from "./index";

const SamplePath = "/work/sample.dcmp";

/** Storybook には Tauri が無いので、自動保存と監視の相手はインメモリの代役にする。 */
const files = DocumentIpcFake.create({
  [SamplePath]: DocumentJson.serialize(EditorState.document(SampleEditorState)),
});

/** 時計も Storybook には無いので代役にする。進めないので経過時間は動かない。 */
const clock = ClockFake.create();

const meta = {
  title: "features/editor/OpenedDocumentEditor",
  component: OpenedDocumentEditor,
  parameters: { layout: "fullscreen" },
  args: {
    clock: clock.clock,
    ipc: files.ipc,
    opened: {
      path: SamplePath,
      document: EditorState.document(SampleEditorState),
    },
  },
} satisfies Meta<typeof OpenedDocumentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
 * ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。
 */
export const Default: Story = {
  name: "編集画面",
};

/**
 * ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
 * 失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。
 */
export const SyncFailed: Story = {
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SampleEditorState),
    },
  },
};

const Sample = EditorState.document(SampleEditorState);

/*
 * 使用中トークンを消したあとのドキュメント。`home-title` が指す typography の
 * `heading` だけを外し、`subheading` は残す。
 * Why not: `DesignDocument.removeToken` は通さない。ストーリーには `Result` の失敗を
 * 伝える先が無く、既定値へ落として握りつぶすことになるため（rules/coding.md）。
 */
const DocumentWithDanglingToken = DesignDocument.create({
  components: Sample.components,
  artboards: Sample.artboards,
  tokens: {
    ...Sample.tokens,
    typography: Object.fromEntries(
      Object.entries(Sample.tokens.typography).filter(
        ([name]) => name !== "heading",
      ),
    ),
  },
});

/**
 * アプリ内の編集で使用中トークンを消したあとの状態（#128）。
 *
 * このストーリーだけが、ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**
 * ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
 */
export const DocumentErrors: Story = {
  name: "編集で作った不正がある編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithDanglingToken),
    }).ipc,
    opened: { path: SamplePath, document: DocumentWithDanglingToken },
  },
};

/**
 * 凍結のストーリー専用の代役。`play` から壊しにいくので、他のストーリーとファイル表を
 * 共有しない（共有すると、先に描かれたストーリーまで壊れたファイルを掴む）。
 */
const brokenFiles = DocumentIpcFake.create({
  [SamplePath]: DocumentJson.serialize(EditorState.document(SampleEditorState)),
});

/**
 * 外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を
 * 一度に映す**（帯の色 / 左ペインの淡色と `凍結中` / スクリムとバッジ /
 * 右ペインの「選択は凍結中」）。
 *
 * 開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で
 * 開き直しても凍結にはならない（それは「開けないファイル」で、別の画面）。
 *
 * この `play` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら
 * 採用」なので、`play` が間に合わなければ**通常表示がベースラインに焼き付き、しかも
 * 失敗が誰にも見えない**。色・淡色・スクリムはここでしか映らないので、判定そのものは
 * happy-dom 側（`opened-document-editor.frozen.test.tsx`）で確かめている。
 */
export const FileInvalid: Story = {
  name: "ファイルが不正になった編集画面",
  args: {
    ipc: brokenFiles.ipc,
    opened: {
      path: SamplePath,
      document: EditorState.document(SampleEditorState),
    },
  },
  play: async () => {
    // 監視が張られる前に書き換えると通知が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(brokenFiles.isWatching(SamplePath)).toBe(true);
    });
    brokenFiles.changeExternally(SamplePath, "{ 壊れた");
    await waitFor(() => {
      expect(screen.getByText("最後に正常だった表示")).toBeDefined();
    });
  },
};
