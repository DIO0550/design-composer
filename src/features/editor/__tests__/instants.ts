import { Instant } from "@/domains/instant";

/**
 * 外部変更を受け取った時刻。
 *
 * 起点そのものを見ない観点でも `EditorState.applyReload` が時刻を要るので、
 * 同じ値をそれぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ以上の
 * テストファイルに書いたら共通化する」）。起点を見る観点は、この値との差が分かる
 * 別の時刻をテストの中で作る。
 */
export const RECEIVED_AT = Instant.create(0);
