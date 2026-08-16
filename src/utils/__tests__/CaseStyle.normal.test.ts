import { expect, test } from "vitest";
import { CaseStyle } from "../CaseStyle";

test("camelCase は語の切れ目で分かれ、先頭が大文字の Capital Case になる", () => {
  expect(CaseStyle.toCapitalCase("widthMode")).toBe("Width Mode");
});

test("大文字1文字の語も独立した語として分かれる", () => {
  expect(CaseStyle.toCapitalCase("positionX")).toBe("Position X");
});

test("語が3つ以上でもすべての切れ目で分かれる", () => {
  expect(CaseStyle.toCapitalCase("veryLongPropName")).toBe(
    "Very Long Prop Name",
  );
});

test("切れ目の無い識別子は先頭が大文字になるだけ", () => {
  expect(CaseStyle.toCapitalCase("content")).toBe("Content");
});

test("空文字は空文字のまま", () => {
  expect(CaseStyle.toCapitalCase("")).toBe("");
});
