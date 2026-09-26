import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Placement } from "../index";

test("絶対配置なのに横の座標が数値でないときは置き場所が決まらない", () => {
  expect(
    Placement.fromProps({ placement: "absolute", x: "40", y: 24 }),
  ).toEqual(Option.none);
});

test("絶対配置なのに縦の座標が数値でないときは置き場所が決まらない", () => {
  expect(
    Placement.fromProps({ placement: "absolute", x: 40, y: "24" }),
  ).toEqual(Option.none);
});

test("知らないモードのときは置き場所が決まらない", () => {
  expect(Placement.fromProps({ placement: "sticky", x: 40, y: 24 })).toEqual(
    Option.none,
  );
});

test("置き場所が決まらない配置は、絶対配置として取り出せない", () => {
  expect(
    Placement.absoluteFromProps({ placement: "absolute", x: "40", y: 24 }),
  ).toEqual(Option.none);
});

test("負の座標でも絶対配置になり、親の外へはみ出して置ける", () => {
  expect(
    Placement.declarations(
      Option.unwrap(
        Placement.absoluteFromProps({ placement: "absolute", x: -10, y: -20 }),
      ),
    ),
  ).toEqual([
    { property: "position", value: "absolute" },
    { property: "left", value: "-10px" },
    { property: "top", value: "-20px" },
  ]);
});
