import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { EditorState } from "../index";
import { DeepTitleNames, InstanceNames, stateWithDeepBranch } from "./setup";

test("クリックすると、押した位置がどれだけ深くても artboard 直下の子が選択状態になる", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    DeepTitleNames,
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "outer-panel")).toBe(true);
});

test("部品インスタンスの中身をクリックするとインスタンス自身が選択状態になる", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    InstanceNames,
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "home-login")).toBe(true);
});

test("artboard の中で何も指していなければ artboard が選択状態になる", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    ["home"],
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("今選んでいるものの内側をクリックしても選択は変わらない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "inner-panel");

  const state = EditorState.selectAt(
    selected,
    DeepTitleNames,
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "inner-panel")).toBe(true);
});

test("artboard を選んでいるときに中身をクリックすると artboard 直下の子が選択状態になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home");

  const state = EditorState.selectAt(
    selected,
    DeepTitleNames,
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "outer-panel")).toBe(true);
});

test("掘った状態で関係のない枝をクリックすると、その枝の artboard 直下の子が選択状態になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "inner-panel");

  const state = EditorState.selectAt(
    selected,
    ["sibling-panel", "home"],
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.isSelected(state, "sibling-panel")).toBe(true);
});

test("掘れるだけ掘る指定では、押した位置のいちばん内側が選択状態になる", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    DeepTitleNames,
    SelectionDigs.Deepest,
  );

  expect(EditorState.isSelected(state, "deep-title")).toBe(true);
});

test("掘れるだけ掘る指定でも、部品インスタンスの中身はインスタンス自身が選択状態になる", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    InstanceNames,
    SelectionDigs.Deepest,
  );

  expect(EditorState.isSelected(state, "home-login")).toBe(true);
});

test("どれも選択できない候補しか無ければ選択は外れる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "deep-title");

  const state = EditorState.selectAt(
    selected,
    ["unknown"],
    SelectionDigs.NoDeeper,
  );

  expect(EditorState.singleName(state).some).toBe(false);
});

test("候補が1つも無ければ選択は外れる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "deep-title");

  const state = EditorState.selectAt(selected, [], SelectionDigs.NoDeeper);

  expect(EditorState.singleName(state).some).toBe(false);
});

test("押した場所を変えても元の状態は変わらない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "deep-title");

  EditorState.selectAt(selected, ["home"], SelectionDigs.NoDeeper);

  expect(EditorState.isSelected(selected, "deep-title")).toBe(true);
});
