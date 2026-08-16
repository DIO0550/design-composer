import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { type KeyShortcut, useKeyShortcut } from "../index";

/** 修飾キーを伴わない組み合わせ。テストごとに同じものを使う。 */
const PlainShortcut: KeyShortcut = {
  keys: ["Enter"],
  withCommandKey: false,
  withShiftKey: false,
};

/**
 * ショートカットを張っただけの器。文字を打ち込める場所も持たせて、
 * フォーカスの位置で扱いが変わることを見られるようにする。
 */
function KeyShortcutHarness({
  shortcut = PlainShortcut,
  onPress,
}: Readonly<{ shortcut?: KeyShortcut; onPress: () => void }>) {
  useKeyShortcut(shortcut, onPress);

  return <input aria-label="文言" defaultValue="あ" />;
}

test("割り当てたキーを押すと呼ばれる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutHarness onPress={() => pressed.push("押された")} />);

  await user.keyboard("{Enter}");

  expect(pressed).toEqual(["押された"]);
});

test("割り当てていないキーでは呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutHarness onPress={() => pressed.push("押された")} />);

  await user.keyboard("a");

  expect(pressed).toEqual([]);
});

test("入力欄に文字を打ち込んでいる間は呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutHarness onPress={() => pressed.push("押された")} />);

  await user.click(screen.getByRole("textbox", { name: "文言" }));
  await user.keyboard("{Enter}");

  expect(pressed).toEqual([]);
});

test("画面から外れるとキーは効かなくなる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  const view = render(
    <KeyShortcutHarness onPress={() => pressed.push("押された")} />,
  );

  view.unmount();
  await user.keyboard("{Enter}");

  expect(pressed).toEqual([]);
});

test("Ctrl と組み合わせた割り当ては Ctrl を押しながらで呼ばれる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{ keys: ["c"], withCommandKey: true, withShiftKey: false }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("{Control>}c{/Control}");

  expect(pressed).toEqual(["押された"]);
});

test("Command と組み合わせた割り当ては Command を押しながらで呼ばれる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{ keys: ["c"], withCommandKey: true, withShiftKey: false }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("{Meta>}c{/Meta}");

  expect(pressed).toEqual(["押された"]);
});

test("修飾キーと組み合わせた割り当ては修飾キーなしでは呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{ keys: ["c"], withCommandKey: true, withShiftKey: false }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("c");

  expect(pressed).toEqual([]);
});

test("修飾キーを伴わない割り当ては修飾キーを押しながらでは呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutHarness onPress={() => pressed.push("押された")} />);

  await user.keyboard("{Control>}{Enter}{/Control}");

  expect(pressed).toEqual([]);
});

test("Shift を伴う割り当ては Shift を押しながらで呼ばれる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{ keys: ["z"], withCommandKey: true, withShiftKey: true }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(pressed).toEqual(["押された"]);
});

test("Shift を伴わない割り当ては Shift を押しながらでは呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{ keys: ["z"], withCommandKey: true, withShiftKey: false }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(pressed).toEqual([]);
});
