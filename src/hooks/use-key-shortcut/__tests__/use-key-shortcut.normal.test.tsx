import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
  useKeyShortcuts,
} from "../index";

/** 修飾キーを伴わない組み合わせ。テストごとに同じものを使う。 */
const PlainShortcut: KeyShortcut = {
  waitsFor: KeyTriggers.TypedCharacter,
  keys: ["Enter"],
  withCommandKey: false,
  withShiftKey: false,
};

/**
 * ショートカットを張っただけの器。文字を打ち込める場所と選択肢から選ぶ場所を
 * どちらも持たせて、フォーカスの位置で扱いが変わることを見られるようにする。
 */
function KeyShortcutHarness({
  shortcut = PlainShortcut,
  onPress,
}: Readonly<{ shortcut?: KeyShortcut; onPress: () => void }>) {
  useKeyShortcut(shortcut, onPress);

  return (
    <>
      <input aria-label="文言" defaultValue="あ" />
      <select aria-label="種別" defaultValue="a">
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
    </>
  );
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
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["c"],
        withCommandKey: true,
        withShiftKey: false,
      }}
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
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["c"],
        withCommandKey: true,
        withShiftKey: false,
      }}
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
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["c"],
        withCommandKey: true,
        withShiftKey: false,
      }}
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
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["z"],
        withCommandKey: true,
        withShiftKey: true,
      }}
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
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["z"],
        withCommandKey: true,
        withShiftKey: false,
      }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(pressed).toEqual([]);
});

test("入力欄に文字を打ち込んでいる間は、修飾キーを伴う割り当ても呼ばれない", async () => {
  // 選択欄と違い、入力欄ではどの割り当ても通さない（打ち込んでいる最中に走ると驚きになる）
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["z"],
        withCommandKey: true,
        withShiftKey: false,
      }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.click(screen.getByRole("textbox", { name: "文言" }));
  await user.keyboard("{Control>}z{/Control}");

  expect(pressed).toEqual([]);
});

/*
 * 選択欄の 2 件を素のキー（Enter）で書いているのは、happy-dom が `<select>` の
 * 矢印操作を再現しないため。動機は「矢印が選択欄の値を変える」ことだが、確かめられるのは
 * 「素のキーは通さない / 修飾キー付きは通す」という一般則までになる。
 */
test("選択欄にフォーカスがある間、修飾キーを伴わない割り当ては呼ばれない", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutHarness onPress={() => pressed.push("押された")} />);

  await user.click(screen.getByRole("combobox", { name: "種別" }));
  await user.keyboard("{Enter}");

  expect(pressed).toEqual([]);
});

test("選択欄にフォーカスがあっても、修飾キーを伴う割り当ては呼ばれる", async () => {
  // prop を選び直した直後に undo が効かなくなるのを避けるため、こちらは通す
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(
    <KeyShortcutHarness
      shortcut={{
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["z"],
        withCommandKey: true,
        withShiftKey: false,
      }}
      onPress={() => pressed.push("押された")}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "種別" }));
  await user.keyboard("{Control>}z{/Control}");

  expect(pressed).toEqual(["押された"]);
});

/**
 * 複数の割り当てを張っただけの器。
 * 押したキーで呼ぶ相手が変わることを見るために、2 件を別々の手続きへ繋ぐ。
 */
function KeyShortcutsHarness({
  onPress,
}: Readonly<{ onPress: (label: string) => void }>) {
  useKeyShortcuts([
    {
      shortcut: {
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["["],
        withCommandKey: true,
        withShiftKey: false,
      },
      onPress: () => onPress("前"),
    },
    {
      shortcut: {
        waitsFor: KeyTriggers.TypedCharacter,
        keys: ["]"],
        withCommandKey: true,
        withShiftKey: false,
      },
      onPress: () => onPress("後"),
    },
  ]);

  return <p>複数の割り当て</p>;
}

test("複数の割り当てを張ると、押した組み合わせに当たる側だけが呼ばれる", async () => {
  const user = userEvent.setup();
  const pressed: string[] = [];
  render(<KeyShortcutsHarness onPress={(label) => pressed.push(label)} />);

  await user.keyboard("{Control>}]{/Control}");

  expect(pressed).toEqual(["後"]);
});

test("当たった押下ではブラウザの既定動作を止める", () => {
  render(<KeyShortcutHarness onPress={() => undefined} />);

  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
});

test("当たらない押下では既定動作を止めない", () => {
  render(<KeyShortcutHarness onPress={() => undefined} />);

  const event = new KeyboardEvent("keydown", {
    key: "a",
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
});
