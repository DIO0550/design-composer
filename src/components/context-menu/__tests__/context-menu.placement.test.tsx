import { expect, test } from "vitest";
import { ContextMenu } from "@/components/context-menu";
import { list, menu, renderMenu, row } from "./setup";

/*
 * 出す位置を確かめる（docs/06-ui.md「コンテキストメニュー」の「出す位置」）。
 *
 * 窓は happy-dom の既定（1024 × 768）。**高さは children に並ぶ組と行の数から計算していて
 * DOM に出ない**ので、高さが効いていることは「下端で折り返したときにどれだけ上へ出るか」で
 * 見る。呼び出し側が実際に組む形（`map` で作った並び）でも効くことは
 * `opened-document-editor.context-menu.test.tsx` が通しで確かめる。
 */

/** 折り返しの起きない位置で出したときの左上。 */
test("ポインタの位置にメニューの左上が出る", () => {
  renderMenu({ at: { x: 240, y: 160 }, children: list(row("Copy")) });

  expect(menu().style.left).toBe("240px");
  expect(menu().style.top).toBe("160px");
});

test("右端を越える位置で出すと、メニューの右端がポインタに合う", () => {
  renderMenu({ at: { x: 1000, y: 160 }, children: list(row("Copy")) });

  // 1000 + 212 は窓の幅 1024 を越えるので、幅のぶん左へ折り返す
  expect(menu().style.left).toBe("788px");
});

test("下端を越える位置で出すと、メニューの下端がポインタに合う", () => {
  renderMenu({ at: { x: 240, y: 760 }, children: list(row("Copy")) });

  // 1 行だけのメニューは 6 + 26 + 6 = 38px
  expect(menu().style.top).toBe("722px");
});

test("下端で折り返すとき、行と区切りが多いメニューほど上に出る", () => {
  renderMenu({
    at: { x: 240, y: 760 },
    children: [list(row("Copy"), row("Paste")), list(row("Delete"))],
  });

  // 3 行 + 区切り 1 本で 6 + 26 × 3 + 9 + 6 = 99px
  expect(menu().style.top).toBe("661px");
});

/*
 * 組を `Fragment` で包んでも数えられることを見る。`args` へ渡すときや条件で出し分けるときに
 * `<>...</>` が挟まるのは自然な書き方だが、`Children.toArray` は `Fragment` を平らにしない
 * ので、器が中へ降りていないと**行は正しく出たまま高さだけが最小になる**。
 */
test("組を Fragment で包んでも、行の数は高さに効く", () => {
  renderMenu({
    at: { x: 240, y: 760 },
    children: (
      <>
        {list(row("Copy"), row("Paste"))}
        {list(row("Delete"))}
      </>
    ),
  });

  // 配列で渡したときと同じ 99px ぶん上へ出る
  expect(menu().style.top).toBe("661px");
});

test("行が 1 つも無いメニューは枠と余白のぶんだけ折り返す", () => {
  renderMenu({ at: { x: 240, y: 760 }, children: null });

  // 組が 0 でも区切りは引かれない（6 + 6 = 12px）
  expect(menu().style.top).toBe("748px");
});

test("組の中に行でないものを置いても、高さは行の数だけで決まる", () => {
  renderMenu({
    at: { x: 240, y: 760 },
    children: (
      <ContextMenu.List>
        <button type="button">行ではないもの</button>
        {row("Copy")}
      </ContextMenu.List>
    ),
  });

  // 並ぶのは 1 行だけなので 38px（行でないものを数えると 64px ぶん上に出てしまう）
  expect(menu().style.top).toBe("722px");
});
