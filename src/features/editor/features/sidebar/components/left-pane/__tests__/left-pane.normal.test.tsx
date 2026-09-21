import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { LeftPaneView } from "@/features/editor/features/sidebar/components/left-pane-rail";
import { LeftPaneViews } from "@/features/editor/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/editor/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";
import { LeftPane } from "../index";

/**
 * 行き先ごとに綴りを変えた中身。**どの行き先を引いたか**が出た文字から分かるようにして、
 * 引き違えても別の行き先の中身で通らないようにする。
 */
function views(): Readonly<Record<LeftPaneView, LeftPaneViewContent>> {
  return {
    [LeftPaneViews.Layers]: {
      kind: "searchable",
      searchLabel: "Search layers",
      footer: Option.none,
      render: (query) => <p>レイヤーの中身 query={query}</p>,
    },
    [LeftPaneViews.Assets]: {
      kind: "searchable",
      searchLabel: "Search assets",
      footer: Option.some(<p>部品化のフッター</p>),
      render: (query) => <p>パレットの中身 query={query}</p>,
    },
    [LeftPaneViews.Tokens]: {
      kind: "plain",
      footer: Option.none,
      render: () => <p>トークンの中身</p>,
    },
  };
}

function setup(view: LeftPaneView, isFrozen = false) {
  return render(
    <LeftPane
      view={view}
      onSelectView={() => {}}
      views={views()}
      isFrozen={isFrozen}
    />,
  );
}

test("今の行き先に差し込まれた中身がパネルに出る", () => {
  setup(LeftPaneViews.Assets);

  expect(screen.getByText(/パレットの中身/)).toBeTruthy();
});

test("今の行き先ではない中身はパネルに出ない", () => {
  setup(LeftPaneViews.Assets);

  // 対照を置く。何も描かない実装でも通る assert にしない
  expect(screen.getByText(/パレットの中身/)).toBeTruthy();
  expect(screen.queryByText(/レイヤーの中身/)).toBeNull();
});

test("検索欄の案内文は行き先ごとのものになる", () => {
  setup(LeftPaneViews.Assets);

  expect(screen.getByRole("searchbox", { name: "Search assets" })).toBeTruthy();
});

test("パネルの見出しは今いる行き先の名前になる", () => {
  setup(LeftPaneViews.Tokens);

  expect(screen.getByRole("heading").textContent).toBe("Tokens");
});

test("検索欄に打った語が今の行き先の中身へ渡る", async () => {
  const user = userEvent.setup();
  setup(LeftPaneViews.Layers);

  await user.type(
    screen.getByRole("searchbox", { name: "Search layers" }),
    "home",
  );

  expect(screen.getByText("レイヤーの中身 query=home")).toBeTruthy();
});

test("検索欄を持たない行き先では検索欄が出ない", () => {
  setup(LeftPaneViews.Tokens);

  // 中身そのものは出ていることを先に確かめ、欄だけが無いことを見る
  expect(screen.getByText("トークンの中身")).toBeTruthy();
  expect(screen.queryByRole("searchbox")).toBeNull();
});

test("フッターを持つ行き先ではパネルの下端に差し込まれたものが出る", () => {
  setup(LeftPaneViews.Assets);

  expect(screen.getByText("部品化のフッター")).toBeTruthy();
});

test("フッターを持たない行き先では何も出ない", () => {
  setup(LeftPaneViews.Layers);

  expect(screen.getByText(/レイヤーの中身/)).toBeTruthy();
  expect(screen.queryByText("部品化のフッター")).toBeNull();
});

test("行き先を変えると前の行き先で打った検索語が残らない", async () => {
  const user = userEvent.setup();
  const { rerender } = setup(LeftPaneViews.Layers);
  await user.type(
    screen.getByRole("searchbox", { name: "Search layers" }),
    "home",
  );

  rerender(
    <LeftPane
      view={LeftPaneViews.Assets}
      onSelectView={() => {}}
      views={views()}
      isFrozen={false}
    />,
  );

  expect(screen.getByText("パレットの中身 query=")).toBeTruthy();
});

test("ファイルが不正なとき見出しに凍結中が出る", () => {
  setup(LeftPaneViews.Layers, true);

  expect(screen.getByText("凍結中")).toBeTruthy();
});

test("ファイルが不正でないとき凍結中は出ない", () => {
  setup(LeftPaneViews.Layers);

  expect(screen.getByRole("heading").textContent).toBe("Layers");
  expect(screen.queryByText("凍結中")).toBeNull();
});
