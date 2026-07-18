import { expect, test } from "vitest";
import { Node } from "../index";

test("type を持つノードは primitive ノードとして判定される", () => {
  const node = { name: "box-1", type: "Box" };
  expect(Node.isPrimitive(node)).toBe(true);
});

test("type を持つノードは ref ノードとして判定されない", () => {
  const node = { name: "box-1", type: "Box" };
  expect(Node.isRef(node)).toBe(false);
});

test("ref を持つノードは ref ノードとして判定される", () => {
  const node = { name: "save-button", ref: "primary-button" };
  expect(Node.isRef(node)).toBe(true);
});

test("ref を持つノードは primitive ノードとして判定されない", () => {
  const node = { name: "save-button", ref: "primary-button" };
  expect(Node.isPrimitive(node)).toBe(false);
});

test("primitive ノードの children を取得すると設定した子要素が返る", () => {
  const child = { name: "label", type: "Text" };
  const node = { name: "box-1", type: "Box", children: [child] };
  expect(Node.children(node)).toEqual([child]);
});

test("children 未設定の primitive ノードの children を取得すると空配列になる", () => {
  const node = { name: "box-1", type: "Box" };
  expect(Node.children(node)).toEqual([]);
});

test("ref ノードの children を取得すると空配列になる", () => {
  const node = { name: "save-button", ref: "primary-button" };
  expect(Node.children(node)).toEqual([]);
});
