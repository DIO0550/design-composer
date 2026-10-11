import { expect, test } from "vitest";
import { Size } from "../index";

test("hug の幅で最小が最大より大きいとき、幅が逆転として返る", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: 500,
      maxWidth: 100,
      heightMode: "hug",
    }),
  ).toEqual(["width"]);
});

test("fill の高さで最小が最大より大きいとき、高さが逆転として返る", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      heightMode: "fill",
      minHeight: 500,
      maxHeight: 100,
    }),
  ).toEqual(["height"]);
});

test("両軸とも逆転していると幅・高さの順で返る", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: 500,
      maxWidth: 100,
      heightMode: "fill",
      minHeight: 500,
      maxHeight: 100,
    }),
  ).toEqual(["width", "height"]);
});

test("最小と最大が等しいときは逆転にならない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: 100,
      maxWidth: 100,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

test("大きい最小だけを書いても逆転にならない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: 500,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

test("小さい最大だけを書いても逆転にならない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      maxWidth: 10,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

test("数値でない最小は書かれていないものとして扱い、逆転にならない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: "500",
      maxWidth: 100,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

test("fixed の軸に書いた逆転は返らない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "fixed",
      width: 120,
      minWidth: 500,
      maxWidth: 100,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

test("別の軸どうしの最小と最大は比べない", () => {
  expect(
    Size.collectInvertedLimitAxes({
      widthMode: "hug",
      minWidth: 500,
      heightMode: "hug",
      maxHeight: 100,
    }),
  ).toEqual([]);
});
