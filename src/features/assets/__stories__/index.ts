/**
 * 部品パレットのストーリー用の公開口。
 *
 * 外の feature（`features/sidebar` の左ペイン）が、掴む口を持つ状態のパレットを
 * 描くのに使う。出すのは外から要るものだけに絞る（`rules/architecture.md`
 * 「モジュールの公開API」）。
 *
 * Why: 本番の公開 API（`features/assets/index.ts`）とは別の口にする。サンプル値は
 * アプリのバンドルに要らないため。テスト用の口（`__tests__/index.ts`）を置いていない
 * のは、外から要るのがストーリー用のサンプル値だけだから。
 */
export {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
