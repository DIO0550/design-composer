/**
 * 部品パレットのストーリー用の公開口。外の feature（`features/sidebar` の左ペイン）が、掴む口を持つ状態の
 * パレットを描くのに使う。
 *
 * 本番の公開 API（`features/assets/index.ts`）とは別の口にするのは、サンプル値がアプリのバンドルに要らない
 * ため。出すのは外から要るものだけに絞る（`rules/architecture.md`「モジュールの公開API」）。
 */
export {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
