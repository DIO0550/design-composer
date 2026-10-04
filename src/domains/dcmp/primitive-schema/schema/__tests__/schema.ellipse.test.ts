import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { BoxSchema, EllipseSchema, PrimitiveSchema } from "../index";

test("Ellipse の大きさは fill か fixed で指定し、hug を持たない", () => {
  expect([
    EllipseSchema.props.widthMode.values,
    EllipseSchema.props.heightMode.values,
  ]).toEqual([
    ["fill", "fixed"],
    ["fill", "fixed"],
  ]);
});

test("Ellipse は何も書かなければ幅・高さとも 100 の固定サイズになる", () => {
  const { widthMode, width, heightMode, height } = EllipseSchema.props;

  expect([
    widthMode.default,
    width.default,
    heightMode.default,
    height.default,
  ]).toEqual(["fixed", 100, "fixed", 100]);
});

test("Ellipse の塗りは何も書かなければ gray-300 を指す", () => {
  expect(EllipseSchema.props.background.default).toBe("gray-300");
});

test("Ellipse の塗りは Box と同じく colors と gradients のどちらも指せる", () => {
  expect(EllipseSchema.props.background.tokenKind).toEqual(
    BoxSchema.props.background.tokenKind,
  );
});

test("Ellipse は角丸・並べ方・余白・はみ出しの prop を持たない", () => {
  const names = [
    "radiusTopLeft",
    "layout",
    "wrap",
    "gap",
    "paddingTop",
    "align",
    "justify",
    "overflow",
  ];

  expect(
    names.filter((name) =>
      Option.isSome(PrimitiveSchema.propDefinition("Ellipse", name)),
    ),
  ).toEqual([]);
});

test("Ellipse の配置・回転・影・不透明度・表示・ロックは Box と同じ定義を持つ", () => {
  const names = [
    "placement",
    "x",
    "y",
    "constraintX",
    "constraintY",
    "rotation",
    "shadow",
    "opacity",
    "visibility",
    "locking",
  ];

  expect(
    names.map((name) => PrimitiveSchema.propDefinition("Ellipse", name)),
  ).toEqual(names.map((name) => PrimitiveSchema.propDefinition("Box", name)));
});
