import { screen } from "@testing-library/react";

/**
 * 器が `transform` に出している、フックの view から作った変形。
 *
 * @returns 画面に出ている変形の文字列
 */
export function transform(): string {
  return screen.getByTestId("transform").textContent ?? "";
}
