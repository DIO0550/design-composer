import { render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { ContextMenu } from "@/components/context-menu";
import {
  list,
  type RowProps,
  row,
} from "@/components/context-menu/__stories__/menu-content";

/*
 * `row` / `list` は `__stories__/menu-content.tsx` にも要るため、そちらに置いてここでは
 * 再輸出だけ行う。同じ形（メニューの中身の組み立て方）が 2 箇所に現れないようにするため
 * （`rules/coding.md`「同じ処理が 2 箇所に現れたら共通化する」）。
 * `recordedRow` は押された綴りを積むテスト固有の用途なので、こちらだけに置く。
 */
export { list, row } from "@/components/context-menu/__stories__/menu-content";

/** 押された行を綴りで積む器。どの行が呼ばれたかを 1 つの観点で見られる。 */
export type SelectedRows = string[];

/**
 * 押すと綴りを積む 1 行。
 *
 * @param label 行の綴り
 * @param selected 押された綴りを積む先
 * @param props 確かめたい項目だけ
 * @returns メニューへ入れる 1 行
 */
export function recordedRow(
  label: string,
  selected: SelectedRows,
  props: Omit<RowProps, "onSelect"> = {},
): ReactElement {
  return row(label, { ...props, onSelect: () => selected.push(label) });
}

/**
 * メニューを描く。既定は窓の左上（折り返しの起きない位置）に 1 行のメニュー。
 *
 * @param props 確かめたい prop だけ。`children` を省くと 1 行のメニューになる
 * @returns `render` の戻り値
 */
export function renderMenu(
  props: Partial<ComponentProps<typeof ContextMenu>> = {},
) {
  // `??` にはしない（`children: null` で「行が 1 つも無いメニュー」を渡せなくなる）
  const content: ReactNode =
    "children" in props ? props.children : list(row("Copy"));
  return render(
    <ContextMenu
      at={props.at ?? { x: 0, y: 0 }}
      onClose={props.onClose ?? (() => {})}
    >
      {content}
    </ContextMenu>,
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
