import { expect, test } from "vitest";
import { KeyName, KeyNames } from "../KeyName";

test("待ち受けている綴りが押されたら、その並びに入っていると答える", () => {
  expect(
    KeyName.isOneOf([KeyNames.Escape, KeyNames.Enter], { key: "Enter" }),
  ).toBe(true);
});

test("待ち受けていない綴りが押されたら、その並びに入っていないと答える", () => {
  expect(
    KeyName.isOneOf([KeyNames.Escape, KeyNames.Enter], { key: "ArrowDown" }),
  ).toBe(false);
});

test("空の並びでは、どの綴りも入っていないと答える", () => {
  expect(KeyName.isOneOf([], { key: "Enter" })).toBe(false);
});

test("space は綴りが空白 1 文字で届く", () => {
  expect(KeyName.isOneOf([KeyNames.Space], { key: " " })).toBe(true);
});
