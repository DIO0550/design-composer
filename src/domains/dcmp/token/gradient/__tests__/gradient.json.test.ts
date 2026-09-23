import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { GradientToken } from "../index";

test("形・角度・色の変わり目がそのまま読み込まれる", () => {
  const gradient = Result.unwrap(
    GradientToken.fromJson(
      Json.create(
        {
          shape: "linear",
          angle: 45,
          stops: [
            { color: "#3b82f6", ratio: 0 },
            { color: "#1d4ed8", ratio: 1 },
          ],
        },
        "gradients.brand",
      ),
    ),
  );

  expect(gradient).toEqual({
    shape: "linear",
    angle: 45,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  });
});

test("色の変わり目は書かれた順のまま読み込まれる", () => {
  /* 比率の昇順に並べ替えていたら、ここで 0.25 が先頭へ来て落ちる。 */
  const gradient = Result.unwrap(
    GradientToken.fromJson(
      Json.create(
        {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "#1d4ed8", ratio: 0.75 },
            { color: "#3b82f6", ratio: 0.25 },
          ],
        },
        "gradients.brand",
      ),
    ),
  );

  expect(gradient.stops.map((stop) => stop.ratio)).toEqual([0.75, 0.25]);
});

test("色の変わり目の色は読み込んだ時点で小文字の hex に正規化される", () => {
  const gradient = Result.unwrap(
    GradientToken.fromJson(
      Json.create(
        {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "#3B82F6", ratio: 0 },
            { color: "#1D4ED8", ratio: 1 },
          ],
        },
        "gradients.brand",
      ),
    ),
  );

  expect(gradient.stops.map((stop) => stop.color)).toEqual([
    "#3b82f6",
    "#1d4ed8",
  ]);
});

test("形・角度・色の変わり目の並びが JSON になる", () => {
  const written = GradientToken.toJson({
    shape: "linear",
    angle: 45,
    stops: [
      { color: "#1d4ed8", ratio: 0.75 },
      { color: "#3b82f6", ratio: 0.25 },
    ],
  });

  expect(written).toEqual({
    shape: "linear",
    angle: 45,
    stops: [
      { color: "#1d4ed8", ratio: 0.75 },
      { color: "#3b82f6", ratio: 0.25 },
    ],
  });
});
