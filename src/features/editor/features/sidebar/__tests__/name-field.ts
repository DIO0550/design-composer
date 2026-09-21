import { screen } from "@testing-library/react";

/**
 * 開いている名前の入力欄（`RowNameField`）。読み上げ名の綴りを消費側へ散らさないため、
 * 引く手順をここに 1 つ置く。
 *
 * @returns その入力欄。出ていなければテストを落とす
 */
export function nameField(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>("textbox", { name: "名前を編集" });
}

/**
 * 名前の入力欄が出ているか。
 *
 * @returns 出ていなければ `true`
 */
export function hasNoNameField(): boolean {
  return screen.queryByRole("textbox", { name: "名前を編集" }) === null;
}
