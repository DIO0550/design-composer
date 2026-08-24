import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithComponentDefinitions } from "./setup";

test("表示中のドキュメントに在るノードを指すと、そのノードが選ばれる", () => {
  // 別のノードを選択済みから始める（選択なしだと「何もしない」実装でも通る）
  const selected = EditorState.select(
    stateWithComponentDefinitions(),
    "home-lead",
  );

  const revealed = EditorState.reveal(selected, "home-title");

  expect(EditorState.isSelected(Option.unwrap(revealed), "home-title")).toBe(
    true,
  );
});

test("表示中のドキュメントに無いノードを指しても、選択は変わらない", () => {
  const selected = EditorState.select(
    stateWithComponentDefinitions(),
    "home-lead",
  );

  const revealed = EditorState.reveal(selected, "home-signup");

  expect(revealed.some).toBe(false);
});

test("部品定義の中のノードは飛び先にならない", () => {
  const selected = EditorState.select(
    stateWithComponentDefinitions(),
    "home-lead",
  );

  const revealed = EditorState.reveal(selected, "primary-button-label");

  expect(revealed.some).toBe(false);
});
