import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Option } from "@/utils/Option";
import { ContextMenu, type ContextMenuRow, ContextMenuTones } from "../index";

/** 押された行を綴りで積む器。どの行が呼ばれたかを 1 つの観点で見られる。 */
export type SelectedRows = string[];

/**
 * 1 行を組み立てる。既定は「押せる・通常の色・割り当てなし」。
 *
 * @param label 行の綴り
 * @param props 確かめたい項目だけ。省いたものは既定で埋まる
 * @returns メニューへ渡す 1 行
 */
export function setupRow(
  label: string,
  props: Partial<Omit<ContextMenuRow, "label">> = {},
): ContextMenuRow {
  return {
    label,
    shortcut: Option.none,
    tone: ContextMenuTones.Normal,
    isEnabled: true,
    onSelect: () => {},
    ...props,
  };
}

/**
 * 押すと綴りを積む 1 行。
 *
 * @param label 行の綴り
 * @param selected 押された綴りを積む先
 * @param props 確かめたい項目だけ
 * @returns メニューへ渡す 1 行
 */
export function setupRecordedRow(
  label: string,
  selected: SelectedRows,
  props: Partial<Omit<ContextMenuRow, "label" | "onSelect">> = {},
): ContextMenuRow {
  return setupRow(label, { ...props, onSelect: () => selected.push(label) });
}

/**
 * メニューを描く。既定は窓の左上（折り返しの起きない位置）。
 *
 * @param props 確かめたい prop だけ。省いたものは既定で埋まる
 * @returns `render` の戻り値
 */
export function renderMenu(
  props: Partial<ComponentProps<typeof ContextMenu>> = {},
) {
  return render(
    <ContextMenu
      at={{ x: 0, y: 0 }}
      groups={[[setupRow("Copy")]]}
      onClose={() => {}}
      {...props}
    />,
  );
}

/** 器を起点に探す。行を直接引くと、器が読み上げ名を失っても気づけない。 */
export function menu() {
  return screen.getByRole("menu", { name: "コンテキストメニュー" });
}

/** 器に絞った検索の入口。 */
export function inMenu() {
  return within(menu());
}
