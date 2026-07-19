import { expect, test } from "vitest";
import { Component } from "../index";

test("リネームマップに含まれる内部ノード名の binding は新しい名前に置き換わる", () => {
  const publicProps = {
    label: { node: "primary-button-label", prop: "content" },
  };
  const result = Component.renameBindings(publicProps, {
    "primary-button-label": "primary-button-label-2",
  });
  expect(result).toEqual({
    label: { node: "primary-button-label-2", prop: "content" },
  });
});

test("リネームマップに含まれない内部ノード名の binding は変更されない", () => {
  const publicProps = {
    label: { node: "primary-button-label", prop: "content" },
  };
  const result = Component.renameBindings(publicProps, {
    "other-node": "other-node-2",
  });
  expect(result).toEqual(publicProps);
});

test("複数の binding を持つ publicProps はそれぞれ独立してリネームされる", () => {
  const publicProps = {
    label: { node: "button-label", prop: "content" },
    background: { node: "button-box", prop: "background" },
  };
  const result = Component.renameBindings(publicProps, {
    "button-label": "button-label-2",
  });
  expect(result).toEqual({
    label: { node: "button-label-2", prop: "content" },
    background: { node: "button-box", prop: "background" },
  });
});

test("空の publicProps をリネームすると空のまま返る", () => {
  expect(Component.renameBindings({}, { "button-label": "button-label-2" })).toEqual(
    {},
  );
});
