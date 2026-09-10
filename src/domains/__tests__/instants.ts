import { Instant } from "@/domains/unit/instant";

/**
 * 外部変更を受け取った時刻。起点そのものを見ない観点でも取り込みには時刻が要るので、同じ値を
 * それぞれに書かず共有する。
 *
 * カテゴリの中ではなくカテゴリと並べて置くのは、消費側が `editor` と `document-sync` の 2 feature に
 * またがるため。特定のドメインだけが要る時刻は、そのモジュールの `__tests__/setup.ts` に置く。
 */
export const ReceivedAt = Instant.create(0);
