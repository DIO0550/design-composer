import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ComponentAsset } from "@/domains/dcmp/component";
import { setupAssetGrab } from "@/features/assets/__tests__/asset-grab";
import { Option } from "@/utils/Option";
import { AssetsPanel } from "../index";

/*
 * 打たれた語でプリミティブと部品の両方を絞る。このパネルの中で絞り込みを担うのはここ
 * だけなので、絞り込みの振る舞いはまとめてここで見る。
 *
 * 検索欄そのものは器（`LeftPanePanel`）が持つので、ここへは語だけが届く。打って絞られる
 * までの通しは `opened-document-editor` のテストが見る。
 */

const Assets: readonly ComponentAsset[] = [
  { name: "primary-button", publicPropNames: ["label"], refCount: 4 },
  { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
];

function setup(query: string) {
  render(
    <AssetsPanel
      query={query}
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );
}

test("打たれた語を名前に含む部品だけが残る", () => {
  setup("button");

  expect(screen.getByText("primary-button")).toBeDefined();
  expect(screen.queryByText("card")).toBeNull();
});

test("絞り込みはプリミティブにも効く", () => {
  setup("box");

  expect(screen.getByText("Box")).toBeDefined();
  expect(screen.queryByText("Text")).toBeNull();
});

test("大文字小文字が違っていても絞り込める", () => {
  setup("BUTTON");

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("語が空のときは全件が出る", () => {
  setup("");

  expect(screen.getByText("Text")).toBeDefined();
  expect(screen.getByText("card")).toBeDefined();
});

test("どれにも一致しない語では一致するものが無い旨が出る", () => {
  setup("zzz");

  expect(screen.getByText("一致するものがありません")).toBeDefined();
});

/*
 * 「部品がありません」と言わせない。ドキュメントには部品があり、絞り込みで
 * 残らなかっただけなので、無いのは「一致するもの」であって部品ではない。
 */
test("どれにも一致しない語でも部品が無いとは言わない", () => {
  setup("zzz");

  expect(screen.queryByText("部品がありません")).toBeNull();
});

test("どれにも一致しない語では行が1つも出ない", () => {
  setup("zzz");

  expect(screen.queryAllByRole("listitem")).toEqual([]);
});

/*
 * どちらにも残らなかったときだけ、節ごと知らせに置き換える。空の節を残したうえで
 * 知らせも出すと、同じ「無い」を 3 箇所で言うことになる。
 */
test("どれにも一致しない語では節の見出しも出ない", () => {
  setup("zzz");

  expect(screen.queryByText("Primitives")).toBeNull();
  expect(screen.queryByText("Components")).toBeNull();
});

test("片方にだけ残ったときは残らなかった側の見出しは出たままになる", () => {
  setup("box");

  expect(screen.getByText("Primitives")).toBeDefined();
  expect(screen.getByText("Components")).toBeDefined();
});
