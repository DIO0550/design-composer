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
 * 名前で行の枠を引く。並べ替えは行を掴んで運ぶので、掴む相手を指すのに使う。
 *
 * `<li>` ではなくその中の枠を返すのは、掴む口が**その行だけ**を包む要素に
 * 張ってあるため。`<li>` は配下の並びまで包んでいるので、そちらに張ると
 * 子の行を押したときに親を掴んでしまう（pointerdown はバブルする）。
 *
 * @param list 器を描いた要素
 * @param name 引きたい行の名前
 * @returns その行の枠。見つからなければテストを落とす
 */
export function rowOf(list: HTMLElement, name: string): HTMLElement {
  const content = within(list).getByText(name);
  const row = content.parentElement;
  if (row === null) {
    throw new Error(`行が見つからない: ${name}`);
  }
  return row;
}

/**
 * その行が属する並びの器（`<ul>`）。離した通知はここが受ける。
 *
 * @param row 行の枠
 * @returns その行を包む `<ul>`。見つからなければテストを落とす
 */
export function groupOf(row: HTMLElement): HTMLElement {
  const group = row.closest("ul");
  if (group === null) {
    throw new Error("並びの器が見つからない");
  }
  return group;
}

/**
 * 画面に出ている順の、行の中身の字面。器が出すボタン（開閉）は読み上げ名を
 * 持つので、それを持たないボタン＝検査が渡した行の中身だけを拾う。
 *
 * `rowNames`（`src/components/__tests__/row-names.ts`）とは別物で、
 * あちらは `aria-current` を持つボタンの読み上げ名を読む。同じ DOM に対して
 * 違う答えを返すので、名前を分けてある。
 *
 * @param list 器を描いた要素
 * @returns 出ている順の行の中身の字面
 */
export function contentTexts(list: HTMLElement): readonly string[] {
  return within(list)
    .queryAllByRole("button")
    .filter((button) => !button.hasAttribute("aria-label"))
    .map((button) => button.textContent ?? "");
}
