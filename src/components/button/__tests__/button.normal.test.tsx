import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Button, ButtonKinds, ButtonSizes } from "../index";

test("押すと、渡した手続きが 1 回呼ばれる", () => {
  const clicks: string[] = [];
  render(
    <Button
      kind={ButtonKinds.Primary}
      size={ButtonSizes.Regular}
      onClick={() => clicks.push("clicked")}
    >
      保存
    </Button>,
  );

  fireEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(clicks).toHaveLength(1);
});

test("押させたくないときは、押せない状態で出る", () => {
  render(
    <Button kind={ButtonKinds.Primary} size={ButtonSizes.Regular} disabled>
      保存
    </Button>,
  );

  expect(
    screen.getByRole("button", { name: "保存" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("押させたくないときは、押しても手続きが呼ばれない", () => {
  const clicks: string[] = [];
  render(
    <Button
      kind={ButtonKinds.Primary}
      size={ButtonSizes.Regular}
      disabled
      onClick={() => clicks.push("clicked")}
    >
      保存
    </Button>,
  );

  fireEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(clicks).toHaveLength(0);
});

test("フォームの中に置いても、押してフォームを送信しない", () => {
  const submits: string[] = [];
  render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submits.push("submitted");
      }}
    >
      <Button kind={ButtonKinds.Secondary} size={ButtonSizes.Regular}>
        保存
      </Button>
    </form>,
  );

  fireEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(submits).toHaveLength(0);
});

test("中身の綴りがボタンの名前になる", () => {
  render(
    <Button kind={ButtonKinds.Danger} size={ButtonSizes.Regular}>
      Delete token
    </Button>,
  );

  expect(screen.getByRole("button", { name: "Delete token" })).toBeDefined();
});

test("名前を与えると、中身ではなくその名前で読まれる", () => {
  render(
    <Button
      kind={ButtonKinds.Primary}
      size={ButtonSizes.Small}
      aria-label="card を表示"
    >
      Reveal
    </Button>,
  );

  expect(screen.getByRole("button", { name: "card を表示" })).toBeDefined();
});

test("アイコンのボタンは、与えた名前で読まれる", () => {
  render(
    <Button kind={ButtonKinds.Icon} aria-label="追加">
      +
    </Button>,
  );

  expect(screen.getByRole("button", { name: "追加" })).toBeDefined();
});

test("行内のアイコンのボタンは、中身の綴りではなく与えた名前で読まれる", () => {
  render(
    <Button kind={ButtonKinds.InlineIcon} aria-label="等倍に戻す">
      55%
    </Button>,
  );

  expect(screen.getByRole("button", { name: "等倍に戻す" })).toBeDefined();
});

test("テキストのボタンは、名前を与えなければ中身の綴りで読まれる", () => {
  render(<Button kind={ButtonKinds.Text}>reveal in tree</Button>);

  expect(screen.getByRole("button", { name: "reveal in tree" })).toBeDefined();
});

test("テキストのボタンは、名前を与えるとその名前で読まれる", () => {
  render(
    <Button kind={ButtonKinds.Text} aria-label="card をツリーで表示">
      reveal in tree
    </Button>,
  );

  expect(
    screen.getByRole("button", { name: "card をツリーで表示" }),
  ).toBeDefined();
});

test("押せない理由を添えると、ボタンの title に出る", () => {
  render(
    <Button
      kind={ButtonKinds.Emphasis}
      size={ButtonSizes.Regular}
      disabled
      title="選んでから押せます"
    >
      Create component
    </Button>,
  );

  expect(
    screen
      .getByRole("button", { name: "Create component" })
      .getAttribute("title"),
  ).toBe("選んでから押せます");
});

test("押せない理由を添えなければ、title は出ない", () => {
  render(
    <Button kind={ButtonKinds.Emphasis} size={ButtonSizes.Regular}>
      Create component
    </Button>,
  );

  expect(
    screen
      .getByRole("button", { name: "Create component" })
      .hasAttribute("title"),
  ).toBe(false);
});
