import { expect, test } from "vitest";
import type { AxisLength } from "@/domains/axis-length";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { PropEdit } from "@/domains/node";
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
            // 部品化と挿入の単一側の対照（インスタンスはどちらも元々できない）
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

/*
 * 部品化と挿入位置の 2 件は、複数選択のゲートを外しても答えが変わらない。
 * まとめて選べるのはインスタンスだけで、インスタンスはもともと部品化も
 * 追加位置も持てないため（`createComponent` / `insertPosition` の doc）。
 * Box を含む複数選択は `selectAllInstances` からは作れないので、この 2 件は
 * 「複数だから不可」ではなく「今の画面でこの操作が成立しない」ことの記録として置く。
 * ゲートそのものを守っているのは、上の削除・コピー・解除・prop 編集・リサイズの 5 件。
 */
test("複数選んでいる間は部品化できない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(EditorState.createComponent(single, "created-panel").some).toBe(true);
  expect(
    EditorState.createComponent(setupMultiSelected(), "created-panel").some,
  ).toBe(false);
});

test("複数選んでいる間は prop を編集できない", () => {
  const edit = PropEdit.set(["label"], "送信");

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

test("複数選んでいると選択数がその件数になる", () => {
  expect(EditorState.selectedNames(setupMultiSelected()).length).toBe(2);
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

  expect(EditorState.selectedNames(cleared)).toEqual([]);
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

/**
 * 選んだ 2 つのうち片方だけがインスタンスでなくなった状態。
 *
 * `redo` は複数選択中でも通る（`singleName` を経由しない）ので、選択を 2 件に保った
 * まま現在地だけが動く。これで「参照先が混ざった複数選択」が実際に作れる。
 */
function setupMultiSelectedWithMixedSource(): EditorState {
  const detached = Option.unwrap(
    EditorState.detachInstance(EditorState.select(setupState(), "home-signup")),
  );
  const restored = Option.unwrap(EditorState.undo(detached));
  const multi = Option.unwrap(
    EditorState.selectAllInstances(EditorState.select(restored, "home-login")),
  );
  return Option.unwrap(EditorState.redo(multi));
}

test("選んだものの参照先が混ざると出どころの部品は決まらない", () => {
  const mixed = setupMultiSelectedWithMixedSource();

  // 対照。混ざっていない複数選択では出どころが決まる
  expect(EditorState.sourceName(setupMultiSelected())).toEqual(
    Option.some("primary-button"),
  );
  expect(EditorState.sourceName(mixed).some).toBe(false);
});

test("参照先が混ざった複数選択からはまとめて選び直せない", () => {
  expect(
    EditorState.selectAllInstances(setupMultiSelectedWithMixedSource()).some,
  ).toBe(false);
});
