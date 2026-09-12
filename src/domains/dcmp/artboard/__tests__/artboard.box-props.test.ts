import { expect, test } from "vitest";
import { Artboard } from "../index";

test("artboard のサイズは幅と高さの固定値になる", () => {
  const props = Artboard.boxProps(
    Artboard.create({ name: "login-screen", width: 375, height: 812 }),
  );

  expect(props).toMatchObject({
    widthMode: "fixed",
    width: 375,
    heightMode: "fixed",
    height: 812,
  });
});

test("props でサイズのモードを指定しても artboard の幅と高さが優先される", () => {
  const props = Artboard.boxProps(
    Artboard.create({
      name: "login-screen",
      width: 375,
      height: 812,
      props: { widthMode: "hug", heightMode: "fill", width: 999 },
    }),
  );

  expect(props).toMatchObject({
    widthMode: "fixed",
    width: 375,
    heightMode: "fixed",
    height: 812,
  });
});

test("props で絶対配置を指定しても artboard の配置は flow のまま", () => {
  const props = Artboard.boxProps(
    Artboard.create({
      name: "login-screen",
      width: 375,
      height: 812,
      props: { placement: "absolute", x: 40, y: 24 },
    }),
  );

  expect(props.placement).toBe("flow");
});

test("はみ出しは既定で clip になる", () => {
  const props = Artboard.boxProps(
    Artboard.create({ name: "login-screen", width: 375, height: 812 }),
  );

  expect(props.overflow).toBe("clip");
});

test("artboard が overflow を明示すると既定の clip より優先される", () => {
  const props = Artboard.boxProps(
    Artboard.create({
      name: "login-screen",
      width: 375,
      height: 812,
      props: { overflow: "visible" },
    }),
  );

  expect(props.overflow).toBe("visible");
});

test("artboard の props は Box の props としてそのまま扱われる", () => {
  const props = Artboard.boxProps(
    Artboard.create({
      name: "login-screen",
      width: 375,
      height: 812,
      props: { layout: "row", gap: "md", background: "primary" },
    }),
  );

  expect(props).toMatchObject({
    layout: "row",
    gap: "md",
    background: "primary",
  });
});

test("指定のない props は Box スキーマのデフォルトで補われる", () => {
  const props = Artboard.boxProps(
    Artboard.create({ name: "login-screen", width: 375, height: 812 }),
  );

  expect(props).toMatchObject({
    layout: "column",
    align: "stretch",
    justify: "start",
  });
});

test("props で非表示を指定しても artboard は表示のまま", () => {
  const props = Artboard.boxProps(
    Artboard.create({
      name: "login-screen",
      width: 375,
      height: 812,
      props: { visibility: "hidden" },
    }),
  );

  expect(props.visibility).toBe("visible");
});
