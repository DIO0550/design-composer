import { expect, test } from "vitest";
import { ButtonKinds, type ButtonProps, ButtonSizes } from "../index";

test("アイコンは、名前を与えないと型エラーになる", () => {
  // @ts-expect-error 中身の記号・数値は操作を言い表さないので aria-label が要る
  const props: ButtonProps = { kind: ButtonKinds.Icon, children: "+" };

  expect(props.kind).toBe(ButtonKinds.Icon);
});

test("アイコンには大きさを渡せない", () => {
  // @ts-expect-error アイコンの大きさは 26px に決まっている
  const props: ButtonProps = {
    kind: ButtonKinds.Icon,
    "aria-label": "追加",
    size: ButtonSizes.Regular,
    children: "+",
  };

  expect(props.kind).toBe(ButtonKinds.Icon);
});

test("行内のアイコンは、名前を与えないと型エラーになる", () => {
  // @ts-expect-error 中身の記号・数値は操作を言い表さないので aria-label が要る
  const props: ButtonProps = { kind: ButtonKinds.InlineIcon, children: "+" };

  expect(props.kind).toBe(ButtonKinds.InlineIcon);
});

test("行内のアイコンには大きさを渡せない", () => {
  // @ts-expect-error 行内のアイコンは置いた行の字の大きさを継ぎ、高さを持たない
  const props: ButtonProps = {
    kind: ButtonKinds.InlineIcon,
    "aria-label": "追加",
    size: ButtonSizes.Regular,
    children: "+",
  };

  expect(props.kind).toBe(ButtonKinds.InlineIcon);
});

test("テキストには大きさを渡せない", () => {
  // @ts-expect-error テキストは行内に置き、高さを持たない
  const props: ButtonProps = {
    kind: ButtonKinds.Text,
    size: ButtonSizes.Regular,
    children: "reveal in tree",
  };

  expect(props.kind).toBe(ButtonKinds.Text);
});

test("テキストは、名前を与えなくても型が通る", () => {
  const props: ButtonProps = {
    kind: ButtonKinds.Text,
    children: "reveal in tree",
  };

  expect(props.kind).toBe(ButtonKinds.Text);
});

test("箱型は、大きさを渡さないと型エラーになる", () => {
  // @ts-expect-error 箱型は大きさが要る
  const props: ButtonProps = { kind: ButtonKinds.Primary, children: "保存" };

  expect(props.kind).toBe(ButtonKinds.Primary);
});

test("語彙に無い種類の文字列は渡せない", () => {
  const props: ButtonProps = {
    // @ts-expect-error 種類は ButtonKinds の値に閉じている
    kind: "Link",
    size: ButtonSizes.Regular,
    children: "保存",
  };

  expect(props.kind).toBe("Link");
});
