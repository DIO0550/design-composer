import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/*
 * `grabbingComponent` は `__stories__/asset-grab.ts` にも要るため、そちらに置いて
 * ここでは再輸出だけ行う。同じ形（`AssetGrab` の組み立て方）が 2 箇所に現れないよう
 * にするため（`rules/coding.md`「同じ処理が 2 箇所に現れたら共通化する」）。
 * `setupAssetGrab` はテスト固有のオーバーライド用途で、ストーリー側は要らないので
 * こちらだけに置く。
 */
export { grabbingComponent } from "@/features/assets/__stories__/asset-grab";

/**
 * パレットの行へ渡す掴む口を、既定に上書きを足して組み立てる。
 *
 * 既定は「何も掴んでいない・掴んでも何も起きない」で、確かめたいものだけを渡す。
 *
 * @param overrides 差し替えたい口だけ
 * @returns 掴む口
 */
export function setupAssetGrab(overrides: Partial<AssetGrab> = {}): AssetGrab {
  return { dragged: Option.none, onGrab: () => {}, ...overrides };
}
