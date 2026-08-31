import { expect, test } from "vitest";
import { RepositionLimit } from "../index";

/** `360×240` の親に `44×24` のノードが入っているときの上限。縦横で違う値になる。 */
const InsideHome: RepositionLimit = { maxX: 316, maxY: 216 };

test("上限の内側にある座標はそのまま置かれる", () => {
  const placement = RepositionLimit.clamp(InsideHome, {
    mode: "absolute",
    x: 40,
    y: 24,
  });

  expect(placement).toEqual({ mode: "absolute", x: 40, y: 24 });
});

test("右下へはみ出した座標は、親の右下の端で止まる", () => {
  // 縦横で違う上限・違う超過量にして、軸を取り違える実装を落とす
  const placement = RepositionLimit.clamp(InsideHome, {
    mode: "absolute",
    x: 400,
    y: 300,
  });

  expect(placement).toEqual({ mode: "absolute", x: 316, y: 216 });
});

test("左上へはみ出した座標は、親の左上の端で止まる", () => {
  const placement = RepositionLimit.clamp(InsideHome, {
    mode: "absolute",
    x: -104,
    y: -44,
  });

  expect(placement).toEqual({ mode: "absolute", x: 0, y: 0 });
});

test("親より大きいノードは、その軸では親の左上へ揃う", () => {
  // 入力を正の値にしておくと、上限 0 を無視する実装（下限だけ切る）でも落ちる
  const placement = RepositionLimit.clamp(
    { maxX: 0, maxY: 216 },
    { mode: "absolute", x: 40, y: 24 },
  );

  expect(placement).toEqual({ mode: "absolute", x: 0, y: 24 });
});
