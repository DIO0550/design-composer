import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { LayersPanel } from "../index";

/**
 * 検索語が `Artboards` の一覧とツリーの両方へ効くことを見る（docs/06-ui.md「絞り込み」）。
 *
 * `login` の中にだけ `login-form` を置き、`settings` は名前でしか当たらないようにして、
 * 「配下で当たる」と「自分の名前で当たる」を見分けられるようにする。
 */
function setupSelection(...names: readonly string[]): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "login",
          width: 375,
          height: 812,
          children: [{ name: "login-form", type: "Box" }],
        },
        {
          name: "settings",
          width: 375,
          height: 812,
          children: [{ name: "theme-row", type: "Box" }],
        },
      ],
    }),
    names,
  );
}

function renderPanel(
  query: string,
  selection: DocumentSelection = setupSelection(),
): void {
  render(
    <LayersPanel
      query={query}
      selection={selection}
      renaming={Option.none}
      artboard={{ add: vi.fn(), reorder: vi.fn() }}
      node={{
        select: vi.fn(),
        reorder: vi.fn(),
        createComponent: vi.fn(),
      }}
      rename={spyRenameActions()}
    />,
  );
}

/** `Artboards` の一覧に出ている行の名前。 */
function artboardRowNames(): readonly string[] {
  return rowNames(screen.getByRole("region", { name: "artboard 一覧" }));
}

test("検索語に一致しない artboard の行は消える", () => {
  // 今見ている 1 枚（選択が無ければ先頭）は残るので、消える側をそれ以外に置く
  renderPanel("login-form");

  expect(artboardRowNames()).toEqual(["login"]);
});

test("別の artboard の中に一致があれば、その artboard の行は残る", () => {
  renderPanel("login-form", setupSelection("settings"));

  expect(artboardRowNames()).toContain("login");
});

test("今見ている artboard は一致が無くても一覧に残る", () => {
  renderPanel("login-form", setupSelection("settings"));

  expect(artboardRowNames()).toEqual(["login", "settings"]);
});

test("どこにも一致が無いと一致するものが無い旨が出る", () => {
  renderPanel("zzz");

  expect(screen.getByText("一致するものがありません")).toBeDefined();
});

test("どこにも一致が無いとツリーごと出なくなる", () => {
  renderPanel("zzz");

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

test("どこにも一致が無くても artboard を追加するボタンは残る", () => {
  renderPanel("zzz");

  expect(screen.getByRole("button", { name: "artboard を追加" })).toBeDefined();
});

test("検索語が空のときは全部の artboard が出る", () => {
  renderPanel("");

  expect(artboardRowNames()).toEqual(["login", "settings"]);
});

test("artboard が 1 枚も無いときは、検索語を打っても artboard が無い旨のまま", () => {
  render(
    <LayersPanel
      query="zzz"
      selection={DocumentSelection.fromNames(
        DesignDocument.create({ artboards: [] }),
        [],
      )}
      renaming={Option.none}
      artboard={{ add: vi.fn(), reorder: vi.fn() }}
      node={{
        select: vi.fn(),
        reorder: vi.fn(),
        createComponent: vi.fn(),
      }}
      rename={spyRenameActions()}
    />,
  );

  expect(screen.getByText("artboard がありません")).toBeDefined();
});

test("絞り込みで落ちた行が選ばれていても、選択は残る", () => {
  renderPanel("theme", setupSelection("login-form"));

  // 選択の強調は消えた行には出ないので、今見ている 1 枚が選択の載っている側のままかで見る
  const list = screen.getByRole("region", { name: "artboard 一覧" });
  expect(
    within(list)
      .getByRole("button", { name: "login" })
      .getAttribute("aria-current"),
  ).toBe("true");
});
