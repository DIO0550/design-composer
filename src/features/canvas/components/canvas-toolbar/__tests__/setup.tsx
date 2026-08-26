import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Option } from "@/utils/Option";
import { CanvasToolbar } from "../index";

/**
 * ツールバーを描く。
 *
 * 既定は「挿せる位置があり、何も運んでいない」状態。**押せるかどうかと運んでいる
 * ものは観点ごとに違う**（`.edge` は押せない側、`.placing` は運んでいる側）ので、
 * 見たい prop だけを渡して残りは既定に任せる。
 *
 * @param props 確かめたい prop だけ。省いたものは既定で埋まる
 * @returns `render` の戻り値
 */
export function renderToolbar(
  props: Partial<ComponentProps<typeof CanvasToolbar>> = {},
) {
  return render(
    <CanvasToolbar
      isInsertEnabled
      dragged={Option.none}
      onAddArtboard={() => {}}
      onInsert={() => {}}
      {...props}
    />,
  );
}

/**
 * 器を起点に探す。ボタンを直接引くと、器が読み上げ名を失っても気づけない。
 *
 * @returns キャンバスのツールバーに絞った検索の入口
 */
export function toolbar() {
  return within(screen.getByRole("region", { name: "キャンバスのツールバー" }));
}
