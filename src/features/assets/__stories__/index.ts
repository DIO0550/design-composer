/**
 * 部品パレットのストーリー用の公開口。外の feature（`features/sidebar` の左ペイン）が、
 * 掴む口を持つ状態のパレットを描くのに使う。
 *
 * 本番の公開 API（`features/assets/index.ts`）とは別の口にするのは、サンプル値がアプリ
 * のバンドルに要らないため。出すのは外から要るものだけに絞る（`rules/architecture.md`「モ
 * ジュールの公開API」）。
 */
export {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
