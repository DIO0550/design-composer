import { expect, test } from "vitest";
import { ButtonKinds, type ButtonProps, ButtonSizes } from "../index";

test("アイコンは、名前を与えないと型エラーになる", () => {
  // @ts-expect-error アイコンには綴りが無いので aria-label が要る
  const props: ButtonProps = { kind: ButtonKinds.Icon, children: "+" };

  expect(props.kind).toBe(ButtonKinds.Icon);
});

test("アイコンには大きさを渡せない", () => {
  // @ts-expect-error アイコンの大きさは 30px に決まっている
  const props: ButtonProps = {
    kind: ButtonKinds.Icon,
    "aria-label": "追加",
    size: ButtonSizes.Regular,
    children: "+",
  };

  expect(props.kind).toBe(ButtonKinds.Icon);
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
