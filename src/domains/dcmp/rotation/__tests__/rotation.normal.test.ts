import { expect, test } from "vitest";
import { Props } from "@/domains/dcmp/node";
import { Rotation } from "../index";

test("向きを書いていないノードは回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({})).toBe(0);
});

test("角度を書いたノードはその角度として読まれる", () => {
  expect(Rotation.fromProps({ rotation: 30 })).toBe(30);
});

test("数値でない向きは回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({ rotation: "30" })).toBe(0);
});

test("有限でない角度は回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({ rotation: Number.POSITIVE_INFINITY })).toBe(0);
});

test("回っていない角度を書くと向きは未設定に戻る", () => {
  expect(Props.apply({ rotation: 30 }, Rotation.toPropEdit(0))).toEqual({});
});

test("0 以外の角度を書くとその角度になる", () => {
  expect(Props.apply({ rotation: 30 }, Rotation.toPropEdit(120))).toEqual({
    rotation: 120,
  });
});
