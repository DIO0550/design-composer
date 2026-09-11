import { expect, test } from "vitest";
import { menu, renderMenu, setupRow } from "./setup";

/*
 * 出す位置を確かめる（docs/06-ui.md「コンテキストメニュー」の「出す位置」）。
 *
 * 窓は happy-dom の既定（1024 × 768）。**高さは行数から計算していて DOM に出ない**ので、
 * 高さが効いていることは「下端で折り返したときにどれだけ上へ出るか」で見る。
 */

/** 折り返しの起きない位置で出したときの左上。 */
test("ポインタの位置にメニューの左上が出る", () => {
  renderMenu({ at: { x: 240, y: 160 }, groups: [[setupRow("Copy")]] });

  expect(menu().style.left).toBe("240px");
  expect(menu().style.top).toBe("160px");
});

test("右端を越える位置で出すと、メニューの右端がポインタに合う", () => {
  renderMenu({ at: { x: 1000, y: 160 }, groups: [[setupRow("Copy")]] });

  // 1000 + 212 は窓の幅 1024 を越えるので、幅のぶん左へ折り返す
  expect(menu().style.left).toBe("788px");
});

test("下端を越える位置で出すと、メニューの下端がポインタに合う", () => {
  renderMenu({ at: { x: 240, y: 760 }, groups: [[setupRow("Copy")]] });

  // 1 行だけのメニューは 6 + 26 + 6 = 38px
  expect(menu().style.top).toBe("722px");
});

test("下端で折り返すとき、行と区切りが多いメニューほど上に出る", () => {
  renderMenu({
    at: { x: 240, y: 760 },
    groups: [[setupRow("Copy"), setupRow("Paste")], [setupRow("Delete")]],
  });

  // 3 行 + 区切り 1 本で 6 + 26 × 3 + 9 + 6 = 99px
  expect(menu().style.top).toBe("661px");
});
