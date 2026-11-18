import { expect, test } from "vitest";
import {
  gradientDocumentOf,
  ThreeStops,
  TwoStops,
} from "@/features/editor/features/tokens/__tests__/gradient-documents";
import { Option } from "@/utils/Option";
import { TokenControl, TokenSection } from "../index";
import { gradientOf, gradientSelectionOf, hexControlOf } from "./setup";

test("グラデーションの行の見本は階調で、値は角度と stop の件数で出る", () => {
  const document = gradientDocumentOf({ stops: ThreeStops });

  const section = Option.unwrap(
    Option.fromNullable(
      TokenSection.forDocument(document).find(
        (candidate) => candidate.kind === "gradients",
      ),
    ),
  );
  const [row] = section.rows;

  expect(row.preview).toEqual({
    kind: "gradient",
    value: "linear-gradient(90deg, #000000 0%, #888888 50%, #ffffff 100%)",
  });
  expect(row.valueText).toBe("90° · 3 stops");
});

test("グラデーションを選ぶと角度の欄と stop の件数ぶんの行が出る", () => {
  const gradient = gradientOf(
    gradientSelectionOf({ angle: 45, stops: ThreeStops }),
  );

  expect(gradient.angle.label).toBe("角度");
  expect(gradient.angle.input).toEqual({ kind: "degree", value: 45 });
  expect(gradient.stops.map((row) => row.name)).toEqual([
    "stop-1",
    "stop-2",
    "stop-3",
  ]);
});

test("stop の行は比率の欄と、見本・hex・不透明度の箱を持つ", () => {
  const [row] = gradientOf(gradientSelectionOf({ stops: TwoStops })).stops;
  const color = hexControlOf(row.color);

  expect(row.ratio.label).toBe("stop 1 の比率");
  expect([color.picker.label, color.caption.label, color.alpha.label]).toEqual([
    "stop 1 の色",
    "stop 1 の hex",
    "stop 1 の不透明度",
  ]);
});

test("グラデーションを選ぶと見出しの見本は階調になる", () => {
  const control = Option.unwrap(
    TokenControl.forSelection(gradientSelectionOf({ stops: TwoStops })),
  );

  expect(control.titlePaint).toEqual(
    Option.some({
      kind: "gradient",
      value: "linear-gradient(90deg, #000000 0%, #ffffff 100%)",
    }),
  );
});

test("範囲外の比率は欄にそのまま出し、つまみはバーの端に寄せる", () => {
  const gradient = gradientOf(
    gradientSelectionOf({
      stops: [
        { color: "#000000", ratio: 0 },
        { color: "#ffffff", ratio: 1.5 },
      ],
    }),
  );

  expect(gradient.stops[1].ratio.input).toEqual({
    kind: "percent",
    value: 150,
  });
  expect(gradient.knobs.map((knob) => knob.percent)).toEqual([0, 100]);
});

test("バーは角度に依らず左から右へ塗る", () => {
  const gradient = gradientOf(
    gradientSelectionOf({ angle: 180, stops: TwoStops }),
  );

  expect(gradient.barImage).toBe(
    "linear-gradient(90deg, #000000 0%, #ffffff 100%)",
  );
  expect(gradient.previewImage).toBe(
    "linear-gradient(180deg, #000000 0%, #ffffff 100%)",
  );
});

test("stop が 2 件なら どの行も − で消せない", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: TwoStops }));

  expect(gradient.stops.map((row) => row.afterRemove)).toEqual([
    Option.none,
    Option.none,
  ]);
});

test("stop が 3 件なら − でその行の stop を除いた値になる", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: ThreeStops }));

  expect(gradient.stops[1].afterRemove).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [ThreeStops[0], ThreeStops[2]],
      },
    }),
  );
  expect(gradient.stops[1].removeButtonLabel).toBe("stop 2 を削除");
});

test("比率の欄に 0〜100 の外を打っても値を変えない", () => {
  const field = gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[0]
    .ratio;

  expect(TokenControl.valueFrom(field.target, "150")).toEqual(Option.none);
});

test("比率の欄に打った値で stop が比率の順に並び直る", () => {
  const field = gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[0]
    .ratio;

  expect(TokenControl.valueFrom(field.target, "90")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#888888", ratio: 0.5 },
          { color: "#000000", ratio: 0.9 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("stop の不透明度はその stop の色だけに効く", () => {
  const field = hexControlOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[1].color,
  );

  expect(TokenControl.valueFromAlpha(field.target, "50")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#000000", ratio: 0 },
          { color: "#88888880", ratio: 0.5 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("stop の色をピッカーで選び直しても元の不透明度は残る", () => {
  const field = hexControlOf(
    gradientOf(
      gradientSelectionOf({
        stops: [
          { color: "#00000080", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      }),
    ).stops[0].color,
  );

  expect(TokenControl.valueFrom(field.target, "#ff0000")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#ff000080", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("stop の hex に `#` 無しで打った 6 桁でその stop の色だけが変わり、不透明度は残る", () => {
  const field = hexControlOf(
    gradientOf(
      gradientSelectionOf({
        stops: [
          { color: "#00000080", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      }),
    ).stops[0].color,
  );

  expect(TokenControl.valueFromHex(field.target, "FF0000")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#ff000080", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("stop の hex に 6 桁・3 桁として読めない値を打っても値を変えない", () => {
  const field = hexControlOf(
    gradientOf(gradientSelectionOf({ stops: TwoStops })).stops[0].color,
  );

  expect(TokenControl.valueFromHex(field.target, "#ff00")).toEqual(Option.none);
});

test("hex として読めない色の stop は `stop n の色` のテキスト欄 1 本になり、不透明度の欄が無い", () => {
  const gradient = gradientOf(
    gradientSelectionOf({
      stops: [
        { color: "RED", ratio: 0 },
        { color: "#ffffff", ratio: 1 },
      ],
    }),
  );

  expect(gradient.stops[0].color).toEqual({
    kind: "text",
    target: {
      kind: "gradientsStopColor",
      gradient: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "RED", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
      stopIndex: 0,
    },
    caption: { name: "stop-1-color", label: "stop 1 の色" },
    value: "RED",
  });
});

test("角度の欄に数値として読めない文字列を打っても値を変えない", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: TwoStops }));

  expect(TokenControl.valueFrom(gradient.angle.target, "abc")).toEqual(
    Option.none,
  );
});

test("角度の欄に打った値はそのまま角度になる", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: TwoStops }));

  expect(TokenControl.valueFrom(gradient.angle.target, "450")).toEqual(
    Option.some({
      kind: "gradients",
      value: { shape: "linear", angle: 450, stops: TwoStops },
    }),
  );
});

test("stop の + は最も広い隙間の中央に stop を足した値になる", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: TwoStops }));

  expect(gradient.afterAdd).toEqual({
    kind: "gradients",
    value: {
      shape: "linear",
      angle: 90,
      stops: [
        { color: "#000000", ratio: 0 },
        { color: "#000000", ratio: 0.5 },
        { color: "#ffffff", ratio: 1 },
      ],
    },
  });
});

test("2 件目の stop の色をピッカーで選ぶとその stop の色だけが変わる", () => {
  const field = hexControlOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[1].color,
  );

  expect(TokenControl.valueFrom(field.target, "#ff0000")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#000000", ratio: 0 },
          { color: "#ff0000", ratio: 0.5 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("2 件目の stop の hex に `#` 無しで打った 6 桁でその stop の色だけが変わる", () => {
  const field = hexControlOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[1].color,
  );

  expect(TokenControl.valueFromHex(field.target, "00FF00")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#000000", ratio: 0 },
          { color: "#00ff00", ratio: 0.5 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});

test("2 件目の stop の比率の欄に打った値はその stop の比率になる", () => {
  const field = gradientOf(gradientSelectionOf({ stops: ThreeStops })).stops[1]
    .ratio;

  expect(TokenControl.valueFrom(field.target, "25")).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#000000", ratio: 0 },
          { color: "#888888", ratio: 0.25 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    }),
  );
});
