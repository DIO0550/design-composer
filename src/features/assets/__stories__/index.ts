/**
 * 部品パレットのストーリー用の公開口。外の feature（`features/sidebar` の左ペイン）が、
 * 掴む口を持つ状態のパレットを描くのに使う。
 *
 * 出すのは外から要るものだけに絞る（`rules/architecture.md`「モジュールの公開API」）。
 */
export {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
