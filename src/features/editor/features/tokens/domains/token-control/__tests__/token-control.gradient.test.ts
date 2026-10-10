import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import {
  type GradientControl,
  TokenControl,
  type TokenControlField,
  TokenSection,
} from "../index";
import { gradientDocumentOf, gradientOf, gradientSelectionOf } from "./setup";

const ThreeStops = [
  { color: "#000000", ratio: 0 },
  { color: "#888888", ratio: 0.5 },
  { color: "#ffffff", ratio: 1 },
] as const;

const TwoStops = [
  { color: "#000000", ratio: 0 },
  { color: "#ffffff", ratio: 1 },
] as const;

/** 見出しで stop の欄を引く。 */
function stopFieldOf(
  gradient: GradientControl,
  label: string,
): TokenControlField {
  return Option.unwrap(
    Option.fromNullable(
      gradient.stops
        .flatMap((row) => row.fields)
        .find((field) => field.label === label),
    ),
  );
}

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

  expect(stopFieldOf(gradient, "stop 2 の比率").input).toEqual({
    kind: "percent",
    value: 150,
  });
  expect(gradient.knobs.map((knob) => knob.percent)).toEqual([0, 100]);
});

test("バーは角度に依らず左から右へ塗る", () => {
  const gradient = gradientOf(
    gradientSelectionOf({ angle: 180, stops: TwoStops }),
  );

  expect(gradient.bar).toBe("linear-gradient(90deg, #000000 0%, #ffffff 100%)");
  expect(gradient.preview).toBe(
    "linear-gradient(180deg, #000000 0%, #ffffff 100%)",
  );
});

test("stop が 2 件なら どの行も − で消せない", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: TwoStops }));

  expect(gradient.stops.map((row) => row.remove)).toEqual([
    Option.none,
    Option.none,
  ]);
});

test("stop が 3 件なら − でその行の stop を除いた値になる", () => {
  const gradient = gradientOf(gradientSelectionOf({ stops: ThreeStops }));

  expect(gradient.stops[1].remove).toEqual(
    Option.some({
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [ThreeStops[0], ThreeStops[2]],
      },
    }),
  );
  expect(gradient.stops[1].removeLabel).toBe("stop 2 を削除");
});

test("比率の欄に 0〜100 の外を打っても値を変えない", () => {
  const field = stopFieldOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })),
    "stop 1 の比率",
  );

  expect(TokenControl.valueFrom(field.target, "150")).toEqual(Option.none);
});

test("比率の欄に打った値で stop が比率の順に並び直る", () => {
  const field = stopFieldOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })),
    "stop 1 の比率",
  );

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
  const field = stopFieldOf(
    gradientOf(gradientSelectionOf({ stops: ThreeStops })),
    "stop 2 の不透明度",
  );

  expect(TokenControl.valueFrom(field.target, "50")).toEqual(
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
  const field = stopFieldOf(
    gradientOf(
      gradientSelectionOf({
        stops: [
          { color: "#00000080", ratio: 0 },
          { color: "#ffffff", ratio: 1 },
        ],
      }),
    ),
    "stop 1 の色",
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

test("hex として読めない色の stop は色のテキスト欄 1 本になり、不透明度の欄が無い", () => {
  const gradient = gradientOf(
    gradientSelectionOf({
      stops: [
        { color: "RED", ratio: 0 },
        { color: "#ffffff", ratio: 1 },
      ],
    }),
  );

  expect(
    gradient.stops[0].fields.map((field) => [field.label, field.input.kind]),
  ).toEqual([
    ["stop 1 の比率", "percent"],
    ["stop 1 の色", "text"],
  ]);
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

  expect(gradient.add).toEqual({
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
