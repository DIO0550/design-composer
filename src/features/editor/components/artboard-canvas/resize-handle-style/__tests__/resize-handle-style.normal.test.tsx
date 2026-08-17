import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { AxisLength } from "@/domains/axis-length";
import { ResizeHandleStyle } from "../index";

/*
 * リサイズハンドルの描き方（docs/06-ui.md「リサイズハンドル」）。
 * どの辺に出すか・どれだけの太さで出すかはここが決める。
 */

const WidthHandle = AxisLength.create("width", 200);
const HeightHandle = AxisLength.create("height", 100);

/** 差し込まれた規則の中身。 */
function ruleText(container: HTMLElement): string {
  return container.querySelector("style")?.textContent ?? "";
}

test("掴める軸が無ければ規則を差し込まない", () => {
  /*
   * 空の規則を出すと、擬似要素の基準にする `position:relative` だけが残る。
   * 選択しただけの要素の位置指定が変わると、中身の絶対位置指定がずれる。
   */
  const { container } = render(
    <ResizeHandleStyle name="home" handles={[]} scale={1} />,
  );

  expect(container.querySelector("style")).toBeNull();
});

test("幅のハンドルは右辺に出る", () => {
  const { container } = render(
    <ResizeHandleStyle name="home" handles={[WidthHandle]} scale={1} />,
  );

  expect(ruleText(container)).toContain(
    '::after{content:"";position:absolute;top:0;right:0;height:100%',
  );
});

test("高さのハンドルは下辺に出る", () => {
  const { container } = render(
    <ResizeHandleStyle name="home" handles={[HeightHandle]} scale={1} />,
  );

  expect(ruleText(container)).toContain(
    '::before{content:"";position:absolute;left:0;bottom:0;width:100%',
  );
});

test("両方の軸が掴めるときは辺ごとに別の擬似要素を使う", () => {
  // 1 要素が持てる擬似要素は 2 つなので、2 本が同じものを取り合うと片方が消える
  const { container } = render(
    <ResizeHandleStyle
      name="home"
      handles={[WidthHandle, HeightHandle]}
      scale={1}
    />,
  );

  const rule = ruleText(container);
  expect([rule.includes("::after{"), rule.includes("::before{")]).toEqual([
    true,
    true,
  ]);
});

test("倍率を上げると帯の太さは割り戻される", () => {
  /*
   * 掴める帯の当たり判定は client 座標（画面上の px）だが、中身は倍率をかけて
   * 描かれている。割り戻さないと、拡大するほど見た目の帯だけが太くなる。
   */
  const { container } = render(
    <ResizeHandleStyle name="home" handles={[WidthHandle]} scale={2} />,
  );

  expect(ruleText(container)).toContain("width:4px");
});

test("擬似要素を貼り付ける基準として、指した要素が位置指定済みになる", () => {
  // これが無いと帯が要素の辺ではなくページの隅へ貼り付く
  const { container } = render(
    <ResizeHandleStyle name="home" handles={[WidthHandle]} scale={1} />,
  );

  expect(ruleText(container)).toContain("{position:relative}");
});
