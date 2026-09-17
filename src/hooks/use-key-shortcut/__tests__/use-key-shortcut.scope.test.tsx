import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import {
  type KeyShortcut,
  KeyShortcutScopeProvider,
  KeyShortcutScopes,
  KeyTriggers,
  useKeyShortcut,
} from "../index";

/** 修飾キーを伴わない組み合わせ。テストごとに同じものを使う。 */
const PlainShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["Enter"],
  withCommandKey: false,
  withShiftKey: false,
};

/** ショートカットを張っただけの節。 */
function ShortcutNode({ onPress }: Readonly<{ onPress: () => void }>) {
  useKeyShortcut(PlainShortcut, onPress);
  return null;
}

test("止めている節ではショートカットが張られない", async () => {
  const onPress = vi.fn();
  render(
    <KeyShortcutScopeProvider scope={KeyShortcutScopes.Suspended}>
      <ShortcutNode onPress={onPress} />
    </KeyShortcutScopeProvider>,
  );

  await userEvent.keyboard("{Enter}");

  expect(onPress).not.toHaveBeenCalled();
});

test("張ると決めている節ではショートカットが張られる", async () => {
  const onPress = vi.fn();
  render(
    <KeyShortcutScopeProvider scope={KeyShortcutScopes.Listening}>
      <ShortcutNode onPress={onPress} />
    </KeyShortcutScopeProvider>,
  );

  await userEvent.keyboard("{Enter}");

  expect(onPress).toHaveBeenCalledTimes(1);
});

test("囲われていない節ではショートカットが張られる", async () => {
  const onPress = vi.fn();
  render(<ShortcutNode onPress={onPress} />);

  await userEvent.keyboard("{Enter}");

  expect(onPress).toHaveBeenCalledTimes(1);
});

test("止めている節と張っている節が並ぶと、張っている側だけが呼ばれる", async () => {
  const suspended = vi.fn();
  const listening = vi.fn();
  render(
    <>
      <KeyShortcutScopeProvider scope={KeyShortcutScopes.Suspended}>
        <ShortcutNode onPress={suspended} />
      </KeyShortcutScopeProvider>
      <KeyShortcutScopeProvider scope={KeyShortcutScopes.Listening}>
        <ShortcutNode onPress={listening} />
      </KeyShortcutScopeProvider>
    </>,
  );

  await userEvent.keyboard("{Enter}");

  expect(suspended).not.toHaveBeenCalled();
  expect(listening).toHaveBeenCalledTimes(1);
});
