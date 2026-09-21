import type { AssetGrab } from "@/features/editor/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/*
 * 掴む口の組み立て。ストーリーとテストのどちらも同じ形で要るので、
 * `rules/architecture.md`「ストーリー専用の共有物は使う範囲がいちばん狭いフォルダの
 * `__stories__/` に置く」に従ってここへ置き、`__tests__/asset-grab.ts` が再輸出する
 * （`components/context-menu/__stories__/menu-content.tsx` と同じ形）。
 */

/** その部品を掴んで運んでいる状態。 */
export function grabbingComponent(componentName: string): AssetGrab {
  return {
    dragged: Option.some({ kind: "instance", componentName }),
    onGrab: () => {},
  };
}

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
