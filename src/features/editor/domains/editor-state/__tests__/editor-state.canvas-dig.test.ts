import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { EditorState } from "../index";
import { DeepTitleNames, InstanceNames, stateWithDeepBranch } from "./setup";

test("1 階層だけ掘ると、今の選択の 1 つ内側が選択状態になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "outer-panel");

  const state = EditorState.selectAt(
    selected,
    DeepTitleNames,
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "inner-panel")).toBe(true);
});

test("1 階層だけ掘ることを重ねると、1 階層ずつ内側へ進む", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "outer-panel");

  const dug = EditorState.selectAt(
    selected,
    DeepTitleNames,
    SelectionDigs.OneDeeper,
  );
  const state = EditorState.selectAt(
    dug,
    DeepTitleNames,
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "deep-title")).toBe(true);
});

test("掘った先が部品インスタンスなら、その中身ではなくインスタンスが選択状態になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home");

  const state = EditorState.selectAt(
    selected,
    InstanceNames,
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "home-login")).toBe(true);
});

test("これ以上内側が無ければ、1 階層だけ掘っても選択は変わらない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "deep-title");

  const state = EditorState.selectAt(
    selected,
    DeepTitleNames,
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "deep-title")).toBe(true);
});

test("関係のない枝で 1 階層だけ掘ると、その枝の artboard 直下の子が選択状態になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "inner-panel");

  const state = EditorState.selectAt(
    selected,
    ["sibling-panel", "home"],
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "sibling-panel")).toBe(true);
});

test("何も選んでいなければ、1 階層だけ掘っても artboard 直下の子までしか選ばれない", () => {
  const state = EditorState.selectAt(
    stateWithDeepBranch(),
    DeepTitleNames,
    SelectionDigs.OneDeeper,
  );

  expect(EditorState.isSelected(state, "outer-panel")).toBe(true);
});
