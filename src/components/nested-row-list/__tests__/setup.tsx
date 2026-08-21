import { render, within } from "@testing-library/react";
import { vi } from "vitest";
import { type NestedRow, NestedRowList } from "../index";

/**
 * 器に渡す 1 行。中身には名前を出すボタンだけを置く
 * （器が出すボタンと違い読み上げ名を持たないので、それで見分けられる）。
 *
 * @param name 行を指す名前
 * @param onSelect 中身が押されたときに名前を伝える先
 * @param children ぶら下がる子の行
 * @returns 器へ渡せる 1 行
 */
function row(
  name: string,
  onSelect: (name: string) => void,
  children: readonly NestedRow[] = [],
): NestedRow {
  return {
    name,
    isSelected: false,
    content: (
      <button type="button" onClick={() => onSelect(name)}>
        {name}
      </button>
    ),
    children,
  };
}

/**
 * 検査に使う行の木。先頭と末尾に子を持たない行、子と孫を持つ枝、その兄弟の枝、
 * 子が 1 つだけの枝を 1 本に収めてある。
 *
 * ```
 * title / body(body-text, deep(deep-text)) / aside(aside-only) / footer
 * ```
 *
 * @param onSelect 行の中身が押されたときに名前を伝える先
 * @returns 最上段の行の並び
 */
function sampleRows(onSelect: (name: string) => void): readonly NestedRow[] {
  return [
    row("title", onSelect),
    row("body", onSelect, [
      row("body-text", onSelect),
      row("deep", onSelect, [row("deep-text", onSelect)]),
    ]),
    row("aside", onSelect, [row("aside-only", onSelect)]),
    row("footer", onSelect),
  ];
}

/** 器を描いたあとに読みたいもの。 */
export type RenderedRowList = Readonly<{
  list: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
  onReorder: ReturnType<typeof vi.fn>;
}>;

/**
 * 検査に使う行の木を器に渡して描く。
 *
 * @returns 描いた器と、行の中身・並べ替えの通知先
 */
export function renderRowList(): RenderedRowList {
  const onSelect = vi.fn();
  const onReorder = vi.fn();
  const { container } = render(
    <NestedRowList
      rows={sampleRows(onSelect)}
      parentName="root"
      onReorder={onReorder}
    />,
  );
  return { list: container, onSelect, onReorder };
}

/**
 * 画面に出ている順の行の名前。器が出すボタン（開閉・並べ替え）は読み上げ名を
 * 持つので、それを持たないボタン＝検査が渡した行の中身だけを拾う。
 *
 * @param list 器を描いた要素
 * @returns 出ている順の行の名前
 */
export function rowNames(list: HTMLElement): readonly string[] {
  return within(list)
    .queryAllByRole("button")
    .filter((button) => !button.hasAttribute("aria-label"))
    .map((button) => button.textContent ?? "");
}
