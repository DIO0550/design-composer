/**
 * デザイントークンを見て編集する一式（docs/06-ui.md「編集操作の一覧」の tokens 編集 /
 * UI 案 docs/Design Composer.html の Tokens 画面）。一覧・編集欄・その中の参照元・キャ
 * ンバスの破線が何を指しているかの帯が属する。
 *
 * どれも**表示中のドキュメントと選ばれているトークンの対**（`TokenSelection`）だけで 描
 * け、編集画面の状態（`EditorState`）は受け取らない。
 *
 * **書き込み（選択・追加・値・改名・削除）はここに置かない。** トークンの書き換えは
 * undo / redo と自動保存に載る 1 つの経路（`EditorState` → reducer）に閉じており、その
 * 入口が `features/editor` にあるため。
 *
 * 追加の指定（`TokenTemplate`）を持たないのも同じ理由で、渡すのは押した見出しの種別（`TokenKind`）
 * まで。ここが指定を組むと、`EditorState.addToken` と同じ型を 2 つの feature が共有する
 * ことになる。
 *
 * 右ペインの殻（`EditorLayout.RightPane`）をここから呼ばないのは、殻が 3 ペインの組み立
 * ての一部で `features/editor` に属するため。`TokenEditor` が返すのは帯の中身と本文だけ。
 */
export { TokenDashedNodes } from "@/features/tokens/components/token-dashed-nodes";
export { TokenEditor } from "@/features/tokens/components/token-editor";
export { TokenList } from "@/features/tokens/components/token-list";
