import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { TokenRef } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/token-selection";
import { Option } from "@/utils/Option";
import { TokenList } from "../index";

const Noop = () => {};

/** 5 種別すべてに 1 件ずつ持つドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6" },
      spacing: { lg: 24 },
      radius: { md: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      typography: {
        body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      },
    },
  });
}

/** そのトークンを選んでいる状態。 */
function selectionOf(ref: TokenRef): TokenSelection {
  return TokenSelection.create(setupDocument(), Option.some(ref));
}

function renderList(
  selection: TokenSelection = TokenSelection.create(
    setupDocument(),
    Option.none,
  ),
) {
  render(
    <TokenList selection={selection} onSelectToken={Noop} onAddToken={Noop} />,
  );
}

test("5種別すべての見出しが件数付きで並ぶ", () => {
  renderList();

  for (const kind of ["colors", "spacing", "radius", "shadows", "typography"]) {
    expect(
      screen.getByRole("button", { name: new RegExp(`^${kind} 1$`) }),
    ).toBeDefined();
  }
});

test("開いた直後は最初の種別だけが開いている", () => {
  renderList();

  expect(screen.getByText("primary")).toBeDefined();
  expect(screen.queryByText("lg")).toBeNull();
});

test("見出しを押すとその種別の中身が開く", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^spacing 1$/ }));

  expect(screen.getByText("24px")).toBeDefined();
});

test("色の行には hex が出る", () => {
  renderList();

  expect(screen.getByText("#3b82f6")).toBeDefined();
});

test("開いている種別には追加ボタンが出る", () => {
  renderList();

  expect(
    screen.getByRole("button", { name: "colors にトークンを追加" }),
  ).toBeDefined();
});

test("複合オブジェクトの種別にも追加ボタンが出る", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^shadows 1$/ }));

  expect(
    screen.getByRole("button", { name: "shadows にトークンを追加" }),
  ).toBeDefined();
});

test("畳んでいる種別には追加ボタンを出さない", () => {
  renderList();

  expect(
    screen.queryByRole("button", { name: "spacing にトークンを追加" }),
  ).toBeNull();
});

test("複合オブジェクトの種別の行も押して選べる", async () => {
  const user = userEvent.setup();
  const selected: TokenRef[] = [];
  render(
    <TokenList
      selection={TokenSelection.create(setupDocument(), Option.none)}
      onSelectToken={(ref) => selected.push(ref)}
      onAddToken={Noop}
    />,
  );

  await user.click(screen.getByRole("button", { name: /^typography 1$/ }));
  await user.click(screen.getByRole("button", { name: /body/ }));

  expect(selected).toEqual([{ kind: "typography", name: "body" }]);
});

test("影の行の見本にはその影が当たる", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^shadows 1$/ }));

  const preview = screen
    .getByRole("button", { name: /sm/ })
    .querySelector<HTMLElement>("[style*='box-shadow']");
  expect(preview?.style.boxShadow).toBe("0px 1px 3px 0px #0000001a");
});

test("選択中のトークンの行が選択済みとして示される", () => {
  renderList(selectionOf({ kind: "colors", name: "primary" }));

  expect(
    screen
      .getByRole("button", { name: /primary/ })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("同じ名前でも種別が違えば選択済みにならない", async () => {
  const user = userEvent.setup();
  renderList(selectionOf({ kind: "shadows", name: "sm" }));

  await user.click(screen.getByRole("button", { name: /^radius 1$/ }));

  expect(
    screen.getByRole("button", { name: /md/ }).getAttribute("aria-current"),
  ).toBe("false");
});
