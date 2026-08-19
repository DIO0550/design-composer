import { Instant } from "@/domains/instant";

/**
 * 外部変更を受け取った時刻。
 *
 * 起点そのものを見ない観点でも取り込みの時刻を要るので、同じ値をそれぞれに書かず
 * 共有する（rules/testing.md「同じヘルパーを 2 つ以上のテストファイルに書いたら
 * 共通化する」）。起点を見る観点は、この値との差が分かる別の時刻をテストの中で作る。
 *
 * `src/domains/` の直下に置くのは、消費側が `editor` と `document-sync` の 2 feature に
 * またがるため。特定のドメインだけが要る時刻は、そのモジュールの `__tests__/setup.ts`
 * に置く（`domains/elapsed/__tests__/setup.ts` の `From` など）。
 */
export const ReceivedAt = Instant.create(0);
