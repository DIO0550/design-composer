/**
 * デザイントークンを見て編集する一式（docs/06-ui.md「編集操作の一覧」の tokens 編集 /
 * UI 案 docs/Design Composer.html の Tokens 画面）。
 *
 * 一覧（`TokenList`）・編集欄（`TokenEditor`）・その中の参照元（`TokenUsedBy`）・
 * キャンバスの破線が何を指しているかの帯（`TokenDashedNodes`）が属する。どれも
 * **表示中のドキュメントと選ばれているトークンの対**（`TokenSelection`）だけで描け、
 * 編集画面の状態（`EditorState`）は受け取らない。
 *
 * 書き込み（選択・追加・値・改名・削除）は受け取ったコールバックへ渡すだけで、
 * ここには置かない。トークンの書き換えは編集履歴（undo / redo）と自動保存に載る
 * 1 つの経路（`EditorState` → reducer）に閉じており、その入口は `features/editor` に
 * あるため。
 *
 * Why not: 追加の指定（`TokenTemplate`）はここに持たない。渡すのは押した見出しの種別
 * （`TokenKind`）までで、指定を組むのは書き込み経路の入口（`useTokenActions`）が行う。
 * ここが指定を組むと、`EditorState.addToken` と同じ型を 2 つの feature が共有することになる。
 *
 * Why not: 右ペインの殻（`EditorLayout.RightPane`）はここから呼ばない。殻は 3 ペインの
 * 組み立ての一部で `features/editor` に属するため。帯と本文（`PaneHeading` / `PaneBody`）は
 * 横断層にあるのでストーリーからは呼べるが、実画面でどのペインへ着せるかは編集画面が決める。
 * `TokenEditor` が返すのは帯の中身と本文だけ。
 */
export { TokenDashedNodes } from "@/features/tokens/components/token-dashed-nodes";
export { TokenEditor } from "@/features/tokens/components/token-editor";
export { TokenList } from "@/features/tokens/components/token-list";
