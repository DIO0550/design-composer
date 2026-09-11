import { render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { ContextMenu, ContextMenuTones } from "@/components/context-menu";
import { Option } from "@/utils/Option";

/** 押された行を綴りで積む器。どの行が呼ばれたかを 1 つの観点で見られる。 */
export type SelectedRows = string[];

/** 行に渡すもののうち、綴り以外。 */
type RowProps = Partial<Omit<ComponentProps<typeof ContextMenu.Item>, "label">>;

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
 * 行を 1 組にまとめる。組のあいだに区切りが入る。
 *
 * @param rows 並べる行
 * @returns メニューへ入れる 1 組
 */
export function group(...rows: readonly ReactElement[]): ReactElement {
  return (
    <ContextMenu.Group key={rows.map((entry) => entry.key).join()}>
      {rows}
    </ContextMenu.Group>
  );
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
    "children" in props ? props.children : group(row("Copy"));
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
