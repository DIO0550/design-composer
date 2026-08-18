import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { ComponentAsset } from "@/domains/component";
import { setupAssetGrab } from "@/features/editor/__tests__/asset-grab";
import { Option } from "@/utils/Option";
import { AssetsPanel } from "../index";

/*
 * 検索欄はプリミティブと部品の両方を絞る（UI 案 docs/Design Composer.html の
 * `Search assets` / #129）。絞り込みを担うのはこのパネルだけなので、
 * 絞り込みの振る舞いはここでまとめて見る。
 */

const Assets: readonly ComponentAsset[] = [
  { name: "primary-button", publicPropNames: ["label"], refCount: 4 },
  { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
];

async function search(word: string): Promise<void> {
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search assets" }),
    word,
  );
}

function setup() {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );
}

test("検索した語を名前に含む部品だけが残る", async () => {
  setup();

  await search("button");

  expect(screen.getByText("primary-button")).toBeDefined();
  expect(screen.queryByText("card")).toBeNull();
});

test("検索はプリミティブにも効く", async () => {
  setup();

  await search("box");

  expect(screen.getByText("Box")).toBeDefined();
  expect(screen.queryByText("Text")).toBeNull();
});

test("大文字小文字が違っていても絞り込める", async () => {
  setup();

  await search("BUTTON");

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("検索した語を消すと全件に戻る", async () => {
  setup();
  await search("box");

  await userEvent.clear(
    screen.getByRole("searchbox", { name: "Search assets" }),
  );

  expect(screen.getByText("Text")).toBeDefined();
  expect(screen.getByText("card")).toBeDefined();
});

test("どれにも一致しない語では一致するものが無い旨が出る", async () => {
  setup();

  await search("zzz");

  expect(screen.getByText("一致するものがありません")).toBeDefined();
});

/*
 * 「部品がありません」と言わせない。ドキュメントには部品があり、絞り込みで
 * 残らなかっただけなので、無いのは「一致するもの」であって部品ではない。
 */
test("どれにも一致しない語でも部品が無いとは言わない", async () => {
  setup();

  await search("zzz");

  expect(screen.queryByText("部品がありません")).toBeNull();
});

test("どれにも一致しない語では行が1つも出ない", async () => {
  setup();

  await search("zzz");

  expect(screen.queryAllByRole("listitem")).toEqual([]);
});

/*
 * どちらにも残らなかったときだけ、節ごと知らせに置き換える。空の節を残したうえで
 * 知らせも出すと、同じ「無い」を 3 箇所で言うことになる。
 */
test("どれにも一致しない語では節の見出しも出ない", async () => {
  setup();

  await search("zzz");

  expect(screen.queryByText("Primitives")).toBeNull();
  expect(screen.queryByText("Components")).toBeNull();
});

test("片方にだけ残ったときは残らなかった側の見出しは出たままになる", async () => {
  setup();

  await search("box");

  expect(screen.getByText("Primitives")).toBeDefined();
  expect(screen.getByText("Components")).toBeDefined();
});
