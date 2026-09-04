import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";
import { ScreenHeightShell } from "@/components/__stories__/screen-height-shell";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { RefNode } from "@/domains/dcmp/node";
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
  // 殻が無いと中身の高さまで伸び、下端のドックが撮影のビューポートの外へ出る（#322）。
  decorators: [
    (Story) => (
      <ScreenHeightShell>
        <Story />
      </ScreenHeightShell>
    ),
  ],
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
 * ドキュメント自身が不正な状態（#128）。アプリ内の編集で使用中トークンを消したあとも、
 * その内容が自動保存されたファイルを開き直した直後も、画面はこれになる（#158）。
 *
 * ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
 * （部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
 * 同じものは `CompileFailed` も映すが、あちらはキャンバスが描けない側の絵。
 */
export const DocumentErrors: Story = {
  name: "ドキュメント自身が不正な編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithDanglingToken),
    }).ipc,
    opened: { path: SamplePath, document: DocumentWithDanglingToken },
  },
};

/*
 * `home` の先頭へ絶対配置の Box を 1 つ足したドキュメント。
 * 名前を `home-badge` にするのは、キャンバス側のテストが絶対配置のノードを `badge` と
 * 呼んでいるため（上部バーの `SaveBadge` などとは別物）。
 *
 * 先頭に置いても隠れないのは、次の兄弟が Text（`position` を出さない）だから。
 * **フローの Box は `position: relative` を出す**ので、Box の兄弟と重ねると
 * DOM 順で後ろのほうが上に来て、掴めなくなる（happy-dom では落ちず、VRT も
 * 意図した差分と区別できない）。座標を動かすときはここを見る。
 */
const DocumentWithAbsoluteNode = DesignDocument.create({
  tokens: Sample.tokens,
  components: Sample.components,
  artboards: Sample.artboards.map((artboard) =>
    artboard.name === "home"
      ? {
          ...artboard,
          children: [
            {
              name: "home-badge",
              type: "Box",
              props: {
                placement: "absolute",
                x: 296,
                y: 16,
                widthMode: "fixed",
                width: 44,
                heightMode: "fixed",
                height: 24,
                background: "primary",
                radius: "md",
              },
              children: [],
            },
            ...artboard.children,
          ],
        }
      : artboard,
  ),
});

/**
 * 絶対配置のノードが最初から居る編集画面（#379 / #381）。
 *
 * `home-badge` を運ぶと親の中の座標が動き、`home-title` / `home-login` を運ぶと
 * ツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、
 * ここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。
 *
 * `Default` に足さずに別の story にしているのは、あちらのベースライン 1 本が
 * 「ふつうの編集画面」を指しているため。絶対配置を持ち込むとその意味が変わる。
 */
export const AbsoluteNode: Story = {
  name: "絶対配置のノードがある編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithAbsoluteNode),
    }).ipc,
    opened: { path: SamplePath, document: DocumentWithAbsoluteNode },
  },
};

/*
 * 居ない部品へ向け直した `home-login`。`RefNode` と注釈した定数にしてから差し込むのは、
 * `Node` が直和で、注釈なしの literal（`{ ...node, ref }` を含む）だと `type` と `ref` を
 * 両方持つノードが型を通ってしまうため（`Node.isRef` は `"ref" in node` で先に真になる）。
 */
const MissingComponentInstance: RefNode = {
  name: "home-login",
  ref: "居ない部品",
  overrides: { label: "ログイン" },
};

/*
 * 居ない部品を指すドキュメント。トークンの dangling と違い `DocumentHtml.compile` が
 * 失敗するので、キャンバスには artboard が 1 枚も出ない。
 * Why not: テスト側と揃えて `DesignDocument.replaceNode` は通さない。隣の
 * `DocumentWithDanglingToken` と同じ理由で、ストーリーには `Result` の失敗を伝える先が無い。
 */
const DocumentWithMissingComponent = DesignDocument.create({
  tokens: Sample.tokens,
  components: Sample.components,
  artboards: Sample.artboards.map((artboard) => ({
    ...artboard,
    children: artboard.children.map((node) =>
      node.name === MissingComponentInstance.name
        ? MissingComponentInstance
        : node,
    ),
  })),
});

/**
 * 不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
 * 開いた時点から不正でありうるようになったので到達する（#158）。
 *
 * 映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
 * 生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
 * 見えると判断ごと間違って読まれる。
 */
export const CompileFailed: Story = {
  name: "コンパイルできないドキュメントの編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithMissingComponent),
    }).ipc,
    opened: { path: SamplePath, document: DocumentWithMissingComponent },
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
 * 開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で開き直しても
 * 凍結にはならない（解釈できなければ開始画面、スキーマ検証だけなら `DocumentErrors` の絵）。
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
