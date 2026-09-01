import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { ResizeHandleStyle } from "../index";

/*
 * リサイズハンドルの描き方（docs/06-ui.md「リサイズハンドル」）。
 * どこに・どんな四角を出すかはここが決める。
 *
 * happy-dom は背景を合成しないので、ここで見られるのは差し込まれた規則の綴りだけ。
 * 実際に四隅の四角として見えることは Storybook のスクリーンショットで確かめる。
 */

/** 差し込まれた規則の中身。 */
function ruleText(container: HTMLElement): string {
  return container.querySelector("style")?.textContent ?? "";
}

test("ハンドルは四隅に出る", () => {
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  const rule = ruleText(container);
  expect([
    rule.includes("0 0/10px"),
    rule.includes("100% 0/10px"),
    rule.includes("0 100%/10px"),
    rule.includes("100% 100%/10px"),
  ]).toEqual([true, true, true, true]);
});

test("ハンドルの枠の内側は枠より上に描かれる", () => {
  // 逆順にすると枠が内側を覆い、白抜きではなく塗り潰しの四角になる。
  // 先に内側の色があること自体を見るのは、無ければ `indexOf` が -1 を返して
  // 順序の比較だけでは通ってしまうため
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  const rule = ruleText(container);
  expect([
    rule.includes("#fff"),
    rule.indexOf("#fff") < rule.indexOf("#3b82f6"),
  ]).toEqual([true, true]);
});

test("ハンドルの内側は枠の太さぶん寄せて置かれる", () => {
  /*
   * 枠の太さは `padding` が作り、内側は content box を基準に置かれる。
   * どちらか一方が欠けると枠が閉じず、四角が L 字に見える。
   */
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  const rule = ruleText(container);
  expect([
    rule.includes("padding:1.5px"),
    rule.includes("no-repeat content-box"),
  ]).toEqual([true, true]);
});

test("ハンドルは要素の箱にぴったり重なる擬似要素として出る", () => {
  /*
   * 3 つが揃って初めて四隅に貼り付く。`content` が無いと擬似要素はボックスを
   * 作らず、`position:absolute` が無いと `inset` が効かず、`inset:0` が無いと
   * 大きさを持たない。要素の外へ出さないのは、artboard が既定で
   * `overflow:hidden` を持ち、外へ出した部分が切られるため。
   */
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  expect(ruleText(container)).toContain(
    '::after{content:"";position:absolute;inset:0',
  );
});

test("ハンドルはポインタを受け取らない", () => {
  // 要素全体を覆うので、受けてしまうと選択中の要素の中のノードを選べなくなる
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  expect(ruleText(container)).toContain("pointer-events:none");
});

test("倍率を上げるとハンドルの寸法は割り戻される", () => {
  /*
   * 当たり判定は client 座標（画面上の px）だが、中身は倍率をかけて描かれている。
   * 割り戻さないと、拡大するほどハンドルだけが大きくなる。
   */
  const { container } = render(<ResizeHandleStyle name="home" scale={2} />);

  const rule = ruleText(container);
  expect([
    rule.includes("padding:0.75px"),
    rule.includes("/5px 5px"),
    rule.includes("/3.5px 3.5px"),
  ]).toEqual([true, true, true]);
});

test("擬似要素を貼り付ける基準として、指した要素が位置指定済みになる", () => {
  // これが無いとハンドルが要素の隅ではなくページの隅へ貼り付く
  const { container } = render(<ResizeHandleStyle name="home" scale={1} />);

  expect(ruleText(container)).toContain("{position:relative}");
});
