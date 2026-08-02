import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import { ComponentList } from "@/features/editor/components/component-list";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { PropertyPanel } from "@/features/editor/components/property-panel";

/**
 * 起動時のドキュメント。ファイルを開く導線（Tauri の load_document と
 * libs/document-json）を繋ぐまでの仮の初期状態（#31）。
 * 3 ペインが同じ状態を共有していること、キャンバスがコンパイル結果を
 * 描いていること（#32）を画面で確認できる中身にしている。
 */
const INITIAL_DOCUMENT = DesignDocument.create({
  tokens: DocumentTemplate.DEFAULT.tokens,
  components: DocumentTemplate.DEFAULT.components,
  artboards: [
    Artboard.create({
      name: "home",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingX: "lg",
        paddingY: "lg",
        background: "white",
      },
      children: [
        {
          name: "home-title",
          type: "Text",
          props: { content: "ホーム", typography: "heading" },
        },
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    }),
    Artboard.create({
      name: "settings",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingX: "lg",
        paddingY: "lg",
        background: "gray-100",
      },
      children: [
        {
          name: "settings-card",
          ref: "card",
          overrides: { title: "設定", body: "通知とテーマを変更できます" },
        },
      ],
    }),
  ],
});

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペインは props だけで描ける
 * （個別に単体描画・テストできる）。
 */
function EditorPanes() {
  const { state, dispatch } = useEditor();
  const selectNode = (name: string) => dispatch({ type: "select", name });

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
        <DocumentTree state={state} onSelect={selectNode} />
        <ComponentList components={state.document.components} />
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas state={state} onSelect={selectNode} />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
        <PropertyPanel
          state={state}
          onClearSelection={() => dispatch({ type: "clear_selection" })}
        />
      </EditorLayout.RightPane>
    </EditorLayout>
  );
}

/** エディタ画面。状態の器（Provider）と 3 ペインの組み立てだけを持つ。 */
export function EditorScreen() {
  return (
    <EditorProvider initialDocument={INITIAL_DOCUMENT}>
      <EditorPanes />
    </EditorProvider>
  );
}
