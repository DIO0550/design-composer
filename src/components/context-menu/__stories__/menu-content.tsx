import type { ComponentProps, ReactElement } from "react";
import { ContextMenu, ContextMenuTones } from "@/components/context-menu";
import { Option } from "@/utils/Option";

/*
 * メニューの中身を組み立てる。ストーリーとテストのどちらも同じ形で要るので、
 * `rules/architecture.md`「ストーリー専用の共有物は使う範囲がいちばん狭いフォルダの
 * `__stories__/` に置く」に従ってここへ置き、`__tests__/setup.tsx` が再輸出する
 * （`features/assets/__tests__/asset-grab.ts` と同じ形）。
 */

/** 行に渡すもののうち、綴り以外。 */
export type RowProps = Partial<
  Omit<ComponentProps<typeof ContextMenu.Item>, "label">
>;

/**
 * 1 行。既定は「押せる・通常の色・割り当てなし」。
 *
 * @param label 行の綴り
 * @param props 確かめたい項目だけ。省いたものは既定で埋まる
 * @returns メニューへ入れる 1 行
 */
export function row(label: string, props: RowProps = {}): ReactElement {
  return (
    <ContextMenu.Item
      key={label}
      label={label}
      shortcut={Option.none}
      tone={ContextMenuTones.Normal}
      isEnabled={true}
      onSelect={() => {}}
      {...props}
    />
  );
}

/**
 * 行を 1 組にまとめる。組のあいだに区切りが入る。
 *
 * @param rows 並べる行
 * @returns メニューへ入れる 1 組
 */
export function list(...rows: readonly ReactElement[]): ReactElement {
  return (
    <ContextMenu.List key={rows.map((entry) => entry.key).join()}>
      {rows}
    </ContextMenu.List>
  );
}
