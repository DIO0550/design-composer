import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { NameStyleRule, nameSelector } from "../index";

/*
 * 名前で引く規則の差し込み。キャンバスの中身は React の管理外なので class を足せず、
 * 出力に残っているノード名の属性を選択子にする。
 */

/** 差し込まれた規則の中身。 */
function ruleText(container: HTMLElement): string {
  return container.querySelector("style")?.textContent ?? "";
}

test("指した名前の要素だけに当たる規則が差し込まれる", () => {
  const { container } = render(
    <NameStyleRule
      name="home-title"
      declarations="outline:2px solid #3b82f6"
    />,
  );

  expect(ruleText(container)).toBe(
    `[${ElementNameAttribute}="home-title"]{outline:2px solid #3b82f6}`,
  );
});

test("引用符を含む名前でも選択子が途中で閉じない", () => {
  /*
   * ノード名はユーザーが付けるので `"` を含みうる。逃がさないと選択子が
   * `[data-name="a"]"]` の形で壊れ、規則が誰にも当たらなくなる。
   */
  const { container } = render(
    <NameStyleRule name={'a"b'} declarations="outline:2px solid #3b82f6" />,
  );

  expect(ruleText(container)).toBe(
    `[${ElementNameAttribute}="a\\"b"]{outline:2px solid #3b82f6}`,
  );
});

test("選択子は名前の属性で引く形になる", () => {
  // リサイズハンドルの擬似要素もこの選択子へ後置きするので、形が共有されている
  expect(nameSelector("home")).toBe(`[${ElementNameAttribute}="home"]`);
});
