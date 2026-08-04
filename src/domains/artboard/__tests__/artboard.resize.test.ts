import { expect, test } from "vitest";
import { AxisLength } from "@/domains/axis-length";
import { Artboard } from "../index";

function setupArtboard(): Artboard {
  return Artboard.create({ name: "home", width: 360, height: 240 });
}

test("幅を変えると artboard の幅がその長さになる", () => {
  const resized = Artboard.resize(
    setupArtboard(),
    AxisLength.create("width", 480),
  );

  expect(resized.width).toBe(480);
});

test("幅を変えても高さは変わらない", () => {
  const resized = Artboard.resize(
    setupArtboard(),
    AxisLength.create("width", 480),
  );

  expect(resized.height).toBe(240);
});

test("高さを変えると artboard の高さがその長さになる", () => {
  const resized = Artboard.resize(
    setupArtboard(),
    AxisLength.create("height", 640),
  );

  expect(resized.height).toBe(640);
});

test("大きさを変えても Box として解決したときのサイズは fixed のまま", () => {
  const resized = Artboard.resize(
    setupArtboard(),
    AxisLength.create("width", 480),
  );

  expect(Artboard.boxProps(resized)).toMatchObject({
    widthMode: "fixed",
    width: 480,
  });
});
