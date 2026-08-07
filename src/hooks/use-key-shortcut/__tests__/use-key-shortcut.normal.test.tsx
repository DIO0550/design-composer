import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useKeyShortcut } from "../index";

/** ショートカットに割り当てるキー。テストごとに同じ並びを使う。 */
const KEYS: readonly string[] = ["Enter"];

/**
 * ショートカットを張っただけの器。文字を打ち込める場所も持たせて、
 * フォーカスの位置で扱いが変わることを見られるようにする。
 */
function KeyShortcutHarness({ onPress }: Readonly<{ onPress: () => void }>) {
  useKeyShortcut(KEYS, onPress);

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
