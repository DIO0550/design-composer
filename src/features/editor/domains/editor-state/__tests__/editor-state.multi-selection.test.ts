import { expect, test } from "vitest";
import type { AxisLength } from "@/domains/axis-length";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 複数選択の間、単一を前提とする編集が成立しないこと（docs/06-ui.md「選択」）。
 *
 * どのテストも、同じドキュメントで**単一選択なら `some` になる**ことを対照に置く。
 * 対照が無いと、常に `none` を返す実装でも通ってしまう
 * （`rules/testing.md`「その assert は落ちうるか」）。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-login", ref: "primary-button" },
            { name: "home-signup", ref: "primary-button" },
            /*
             * 部品化と挿入の対照。インスタンスはどちらも元々できない
             * （`createComponent` / `insertPosition` の doc）ので、
             * 「複数だからできない」ことを見るには別のものを単一で選ぶ必要がある。
             */
            { name: "home-panel", type: "Box" },
          ],
        },
      ],
    }),
  );
}

/** 同じ部品を指す 2 つのインスタンスを選んだ状態。 */
function setupMultiSelected(): EditorState {
  return Option.unwrap(
    EditorState.selectAllInstances(
      EditorState.select(setupState(), "home-login"),
    ),
  );
}

/** 1 つだけ選んだ状態（同じドキュメントの対照）。 */
function setupSingleSelected(): EditorState {
  return EditorState.select(setupState(), "home-login");
}

const Width: AxisLength = { axis: "width", length: 120 };

test("複数選んでいる間は削除できない", () => {
  expect(EditorState.removeNode(setupSingleSelected()).some).toBe(true);
  expect(EditorState.removeNode(setupMultiSelected()).some).toBe(false);
});

test("複数選んでいる間はコピーできない", () => {
  expect(EditorState.copyNode(setupSingleSelected()).some).toBe(true);
  expect(EditorState.copyNode(setupMultiSelected()).some).toBe(false);
});

test("複数選んでいる間はインスタンスを解除できない", () => {
  expect(EditorState.detachInstance(setupSingleSelected()).some).toBe(true);
  expect(EditorState.detachInstance(setupMultiSelected()).some).toBe(false);
});

test("複数選んでいる間は部品化できない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(EditorState.createComponent(single, "created-panel").some).toBe(true);
  expect(
    EditorState.createComponent(setupMultiSelected(), "created-panel").some,
  ).toBe(false);
});

test("複数選んでいる間は prop を編集できない", () => {
  const edit = { name: "label", value: Option.some("送信") } as const;

  expect(EditorState.applyPropEdit(setupSingleSelected(), edit).some).toBe(
    true,
  );
  expect(EditorState.applyPropEdit(setupMultiSelected(), edit).some).toBe(
    false,
  );
});

test("複数選んでいる間はリサイズできない", () => {
  expect(EditorState.resize(setupSingleSelected(), Width).some).toBe(true);
  expect(EditorState.resize(setupMultiSelected(), Width).some).toBe(false);
});

test("複数選んでいる間は挿入位置が決まらない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(EditorState.insertPosition(single).some).toBe(true);
  expect(EditorState.insertPosition(setupMultiSelected()).some).toBe(false);
});

test("複数選んでいる間は右ペインが 1 つの正体を答えない", () => {
  expect(EditorState.singleSelection(setupSingleSelected()).some).toBe(true);
  expect(EditorState.singleSelection(setupMultiSelected()).some).toBe(false);
});

test("複数選んでいると選択数がその件数になる", () => {
  expect(EditorState.selectionCount(setupMultiSelected())).toBe(2);
});

test("複数選んでいる間も、選んだものはすべて選択中として扱われる", () => {
  const multi = setupMultiSelected();

  expect(EditorState.isSelected(multi, "home-login")).toBe(true);
  expect(EditorState.isSelected(multi, "home-signup")).toBe(true);
});

test("複数選んだあとに1つを選び直すと単一選択に戻る", () => {
  const reselected = EditorState.select(setupMultiSelected(), "home-signup");

  expect(EditorState.singleName(reselected)).toEqual(
    Option.some("home-signup"),
  );
});

test("複数選んだあとに選択を解除すると何も選ばれていない状態になる", () => {
  const cleared = EditorState.clearSelection(setupMultiSelected());

  expect(EditorState.selectionCount(cleared)).toBe(0);
});

/**
 * 複数選んだあと、選択のうち 1 つがドキュメントから消えた状態。
 *
 * 消す経路が redo なのは、削除そのものが単一選択でしか行えないため。
 * 「片方を消す → 元に戻す → まとめて選ぶ → やり直す」で、選択が 2 件のまま
 * 現在地だけが 1 件欠けた状態へ動く。
 */
function setupMultiSelectedThenLost(): EditorState {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(setupState(), "home-signup")),
  );
  const restored = Option.unwrap(EditorState.undo(removed));
  const multi = Option.unwrap(
    EditorState.selectAllInstances(EditorState.select(restored, "home-login")),
  );
  return Option.unwrap(EditorState.redo(multi));
}

test("複数選んだうちの1つがドキュメントから消えると、残った1つだけの選択に戻る", () => {
  expect(EditorState.singleName(setupMultiSelectedThenLost())).toEqual(
    Option.some("home-login"),
  );
});

test("ドキュメントから消えた名前は複数選択から外れる", () => {
  expect(EditorState.selectedNames(setupMultiSelectedThenLost())).not.toContain(
    "home-signup",
  );
});
