import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { GradientStop, GradientToken } from "../index";

/** 角度 90 の直線グラデーション。色の変わり目だけを差し替えて使う。 */
function gradientOf(stops: readonly GradientStop[]): GradientToken {
  return { shape: "linear", angle: 90, stops };
}

/** 比率だけを並べたグラデーション。色は位置ごとに別の色にする。 */
function gradientOfRatios(ratios: readonly number[]): GradientToken {
  return gradientOf(
    ratios.map((ratio, index) => ({
      color: `#00000${index}`,
      ratio,
    })),
  );
}

function ratiosOf(gradient: Option<GradientToken>): readonly number[] {
  return Option.unwrap(gradient).stops.map((stop) => stop.ratio);
}

test("角度は値域で丸めずにそのまま持つ", () => {
  const gradient = gradientOfRatios([0, 1]);

  expect(
    [450, -30].map(
      (angle) => Option.unwrap(GradientToken.withAngle(gradient, angle)).angle,
    ),
  ).toEqual([450, -30]);
});

test("有限でない角度は受け付けない", () => {
  const gradient = gradientOfRatios([0, 1]);

  expect(
    [Number.NaN, Number.POSITIVE_INFINITY].map((angle) =>
      GradientToken.withAngle(gradient, angle),
    ),
  ).toEqual([Option.none, Option.none]);
});

test("比率を変えると比率の順に並び直る", () => {
  const gradient = gradientOf([
    { color: "#000000", ratio: 0 },
    { color: "#111111", ratio: 0.5 },
    { color: "#ffffff", ratio: 1 },
  ]);

  const edited = GradientToken.withStopRatioPercent(gradient, {
    stopIndex: 0,
    percent: 90,
  });

  expect(Option.unwrap(edited).stops).toEqual([
    { color: "#111111", ratio: 0.5 },
    { color: "#000000", ratio: 0.9 },
    { color: "#ffffff", ratio: 1 },
  ]);
});

test("比率が同じになった色の変わり目同士は元の並びを保つ", () => {
  const gradient = gradientOf([
    { color: "#ffffff", ratio: 0.3 },
    { color: "#000000", ratio: 0.5 },
    { color: "#888888", ratio: 1 },
  ]);

  const edited = GradientToken.withStopRatioPercent(gradient, {
    stopIndex: 2,
    percent: 30,
  });

  expect(Option.unwrap(edited).stops.map((stop) => stop.color)).toEqual([
    "#ffffff",
    "#888888",
    "#000000",
  ]);
});

test("0〜100 の外の比率は受け付けない", () => {
  const gradient = gradientOfRatios([0, 1]);

  expect(
    [150, -1].map((percent) =>
      GradientToken.withStopRatioPercent(gradient, { stopIndex: 0, percent }),
    ),
  ).toEqual([Option.none, Option.none]);
});

test("並びの外の色の変わり目の比率は変えられない", () => {
  const gradient = gradientOfRatios([0, 1]);

  expect(
    GradientToken.withStopRatioPercent(gradient, { stopIndex: 2, percent: 50 }),
  ).toEqual(Option.none);
});

test("比率は % の小数 4 桁に丸めて持つ", () => {
  const gradient = gradientOfRatios([0, 1]);

  const edited = GradientToken.withStopRatioPercent(gradient, {
    stopIndex: 0,
    percent: 12.345678,
  });

  expect(ratiosOf(edited)).toEqual([0.123457, 1]);
});

test("並んでいない色の変わり目に今と同じ比率を確定しても並びは変わらない", () => {
  const gradient = gradientOfRatios([0.8, 0.2]);

  const edited = GradientToken.withStopRatioPercent(gradient, {
    stopIndex: 0,
    percent: 80,
  });

  expect(ratiosOf(edited)).toEqual([0.8, 0.2]);
});

test("6 桁を超える比率の色の変わり目に欄の値のまま確定しても並びは変わらない", () => {
  const gradient = gradientOfRatios([0.12345678, 0.05]);
  const shown = GradientStop.ratioPercentOf(gradient.stops[0]);

  const edited = GradientToken.withStopRatioPercent(gradient, {
    stopIndex: 0,
    percent: shown,
  });

  expect(Option.unwrap(edited).stops.map((stop) => stop.color)).toEqual([
    "#000000",
    "#000001",
  ]);
});

test("色を変えても並びは変わらない", () => {
  const gradient = gradientOf([
    { color: "#000000", ratio: 0.8 },
    { color: "#ffffff", ratio: 0.2 },
  ]);

  const edited = GradientToken.withStopColor(gradient, {
    stopIndex: 1,
    nextColorOf: () => Option.some("#ff0000"),
  });

  expect(Option.unwrap(edited).stops).toEqual([
    { color: "#000000", ratio: 0.8 },
    { color: "#ff0000", ratio: 0.2 },
  ]);
});

test("並びの外の色の変わり目の色は変えられない", () => {
  const gradient = gradientOfRatios([0, 1]);

  expect(
    GradientToken.withStopColor(gradient, {
      stopIndex: 2,
      nextColorOf: () => Option.some("#ff0000"),
    }),
  ).toEqual(Option.none);
});

test("+ は隙間の中央に左側の色で足す", () => {
  const gradient = gradientOf([
    { color: "#000000", ratio: 0 },
    { color: "#ffffff", ratio: 1 },
  ]);

  expect(GradientToken.addStop(gradient).stops).toEqual([
    { color: "#000000", ratio: 0 },
    { color: "#000000", ratio: 0.5 },
    { color: "#ffffff", ratio: 1 },
  ]);
});

test("+ は同じ広さの隙間が並ぶと配列で左の隙間に足す", () => {
  expect(
    GradientToken.addStop(gradientOfRatios([0, 0.5, 1])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0, 0.25, 0.5, 1]);
});

test("+ は両端の空きを隙間に数えない", () => {
  expect(
    GradientToken.addStop(gradientOfRatios([0.4, 0.6])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0.4, 0.5, 0.6]);
});

test("+ は浮動小数の誤差で広さを取り違えない", () => {
  // 0.3 - 0.1 と 0.5 - 0.3 は丸めないと別の広さになる
  expect(
    GradientToken.addStop(gradientOfRatios([0.1, 0.3, 0.5])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0.1, 0.2, 0.3, 0.5]);
});

test("+ は並んでいない色の変わり目を並べ替えずに隣り合う 2 件の間へ足す", () => {
  expect(
    GradientToken.addStop(gradientOfRatios([0.8, 0.2])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0.8, 0.5, 0.2]);
});

test("+ は逆向きに並んだ 2 件の隙間も差の大きさで広さを測る", () => {
  expect(
    GradientToken.addStop(gradientOfRatios([0.9, 0.1, 0.2])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0.9, 0.5, 0.1, 0.2]);
});

test("+ で足す比率は小数 6 桁に丸める", () => {
  expect(
    GradientToken.addStop(gradientOfRatios([0, 0.333333])).stops.map(
      (stop) => stop.ratio,
    ),
  ).toEqual([0, 0.166667, 0.333333]);
});

test("+ は色の変わり目が無いと角度を保って既定の 2 件を入れる", () => {
  const gradient: GradientToken = { shape: "linear", angle: 45, stops: [] };

  expect(GradientToken.addStop(gradient)).toEqual({
    shape: "linear",
    angle: 45,
    stops: GradientToken.Initial.stops,
  });
});

test("+ は 1 件の比率が 0.5 未満なら同じ色を終点に足す", () => {
  const gradient = gradientOf([{ color: "#123456", ratio: 0.3 }]);

  expect(GradientToken.addStop(gradient).stops).toEqual([
    { color: "#123456", ratio: 0.3 },
    { color: "#123456", ratio: 1 },
  ]);
});

test("+ は 1 件の比率が 0.5 より大きいなら同じ色を始点に足す", () => {
  const gradient = gradientOf([{ color: "#123456", ratio: 0.7 }]);

  expect(GradientToken.addStop(gradient).stops).toEqual([
    { color: "#123456", ratio: 0 },
    { color: "#123456", ratio: 0.7 },
  ]);
});

test("+ は 1 件の比率がちょうど 0.5 なら同じ色を始点に足す", () => {
  const gradient = gradientOf([{ color: "#123456", ratio: 0.5 }]);

  expect(GradientToken.addStop(gradient).stops).toEqual([
    { color: "#123456", ratio: 0 },
    { color: "#123456", ratio: 0.5 },
  ]);
});

test("3 件の真ん中を除くと両端が残る", () => {
  expect(
    ratiosOf(GradientToken.removeStop(gradientOfRatios([0, 0.5, 1]), 1)),
  ).toEqual([0, 1]);
});

test("2 件しか無いと色の変わり目を除けない", () => {
  expect(GradientToken.removeStop(gradientOfRatios([0, 1]), 0)).toEqual(
    Option.none,
  );
});

test("並びの外の色の変わり目は除けない", () => {
  expect(GradientToken.removeStop(gradientOfRatios([0, 0.5, 1]), 3)).toEqual(
    Option.none,
  );
});

test("比率の % は小数 4 桁で読み、0〜1 の外も範囲へ収めない", () => {
  expect(
    [0.007, 1.5].map((ratio) =>
      GradientStop.ratioPercentOf({ color: "#000000", ratio }),
    ),
  ).toEqual([0.7, 150]);
});
