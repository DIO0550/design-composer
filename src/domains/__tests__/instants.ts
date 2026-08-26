import { Instant } from "@/domains/unit/instant";

/**
 * 外部変更を受け取った時刻。
 *
 * 起点そのものを見ない観点でも取り込みには時刻が要るので、同じ値をそれぞれに書かず
 * 共有する（rules/testing.md「同じヘルパーを 2 つ以上のテストファイルに書いたら
 * 共通化する」）。起点を見る観点は、この値との差が分かる別の時刻をテストの中で作る。
 *
 * `src/domains/` に置くのは値が `Instant`（ドメイン値）だから。カテゴリの中ではなく
 * カテゴリと並べて置くのは、消費側が `editor` と `document-sync` の 2 feature に
 * またがるため。特定のドメインだけが要る時刻は、そのモジュールの `__tests__/setup.ts` に置く
 * （`domains/unit/elapsed/__tests__/setup.ts` の `From` など）。
 */
export const ReceivedAt = Instant.create(0);
