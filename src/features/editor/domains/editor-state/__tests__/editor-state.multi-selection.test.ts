import { expect, test } from "vitest";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { PropEdit } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { ReorderSteps } from "@/features/editor/domains/reorder-step";
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
            // 座標の移動の単一側の対照（座標を持つのは絶対配置のノードだけ）
            {
              name: "home-badge",
              type: "Box",
              props: { placement: "absolute", x: 8, y: 8 },
            },
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

/** Box と部品インスタンスをまとめて選んだ状態（キャンバスの範囲選択で作れる並び）。 */
function setupMultiSelectedWithBox(): EditorState {
  return EditorState.selectNodes(setupState(), ["home-panel", "home-login"]);
}

/** 1 つだけ選んだ状態（同じドキュメントの対照）。 */
function setupSingleSelected(): EditorState {
  return EditorState.select(setupState(), "home-login");
}

const Width: AxisLength = { axis: "width", length: 120 };

test("複数選んでいる間は削除できない", () => {
  expect(Option.isSome(EditorState.removeSelected(setupSingleSelected()))).toBe(
    true,
  );
  expect(Option.isSome(EditorState.removeSelected(setupMultiSelected()))).toBe(
    false,
  );
});

test("複数選んでいる間はコピーできない", () => {
  expect(Option.isSome(EditorState.copyNode(setupSingleSelected()))).toBe(true);
  expect(Option.isSome(EditorState.copyNode(setupMultiSelected()))).toBe(false);
});

test("複数選んでいる間はインスタンスを解除できない", () => {
  expect(Option.isSome(EditorState.detachInstance(setupSingleSelected()))).toBe(
    true,
  );
  expect(Option.isSome(EditorState.detachInstance(setupMultiSelected()))).toBe(
    false,
  );
});

test("複数選んでいる間は部品化できない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(
    Option.isSome(EditorState.createComponent(single, "created-panel")),
  ).toBe(true);
  expect(
    Option.isSome(
      EditorState.createComponent(setupMultiSelectedWithBox(), "created-panel"),
    ),
  ).toBe(false);
});

test("複数選んでいる間は prop を編集できない", () => {
  const edit = PropEdit.set(["label"], "送信");

  expect(
    Option.isSome(
      EditorState.applyPropEdit(
        setupSingleSelected(),
        edit,
        EditContinuities.Separate,
      ),
    ),
  ).toBe(true);
  expect(
    Option.isSome(
      EditorState.applyPropEdit(
        setupMultiSelected(),
        edit,
        EditContinuities.Separate,
      ),
    ),
  ).toBe(false);
});

test("複数選んでいる間は並べ替えられない", () => {
  expect(
    Option.isSome(
      EditorState.reorderSelectedNode(
        setupSingleSelected(),
        ReorderSteps.TowardFront,
      ),
    ),
  ).toBe(true);
  expect(
    Option.isSome(
      EditorState.reorderSelectedNode(
        setupMultiSelected(),
        ReorderSteps.TowardFront,
      ),
    ),
  ).toBe(false);
});

test("複数選んでいる間は座標を動かせない", () => {
  const single = EditorState.select(setupState(), "home-badge");
  const multi = EditorState.selectNodes(setupState(), [
    "home-badge",
    "home-login",
  ]);
  const delta = { x: 1, y: 0 };

  expect(
    Option.isSome(EditorState.repositionSelectedNodeBy(single, delta)),
  ).toBe(true);
  expect(
    Option.isSome(EditorState.repositionSelectedNodeBy(multi, delta)),
  ).toBe(false);
});

test("複数選んでいる間はリサイズできない", () => {
  expect(
    Option.isSome(
      EditorState.resize(
        setupSingleSelected(),
        ResizeEdit.create([Width]),
        EditContinuities.Separate,
      ),
    ),
  ).toBe(true);
  expect(
    Option.isSome(
      EditorState.resize(
        setupMultiSelected(),
        ResizeEdit.create([Width]),
        EditContinuities.Separate,
      ),
    ),
  ).toBe(false);
});

test("複数選んでいる間は挿入位置が決まらない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(Option.isSome(EditorState.insertPosition(single))).toBe(true);
  expect(
    Option.isSome(EditorState.insertPosition(setupMultiSelectedWithBox())),
  ).toBe(false);
});

test("複数選んでいる間は Box で包めない", () => {
  expect(Option.isSome(EditorState.groupSelected(setupSingleSelected()))).toBe(
    true,
  );
  expect(Option.isSome(EditorState.groupSelected(setupMultiSelected()))).toBe(
    false,
  );
});

test("複数選んでいる間は Box を外せない", () => {
  const single = EditorState.select(setupState(), "home-panel");

  expect(Option.isSome(EditorState.ungroupSelected(single))).toBe(true);
  expect(
    Option.isSome(EditorState.ungroupSelected(setupMultiSelectedWithBox())),
  ).toBe(false);
});

test("複数選んでいると選択数がその件数になる", () => {
  expect(
    DocumentSelection.names(EditorState.documentSelection(setupMultiSelected()))
      .length,
  ).toBe(2);
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

  expect(
    DocumentSelection.names(EditorState.documentSelection(cleared)),
  ).toEqual([]);
});

/**
 * 複数選んだあと、選択のうち 1 つがドキュメントから消えた状態。
 *
 * 「片方を消す → 元に戻す → まとめて選ぶ → やり直す」で、選択が 2 件のまま現在地だけが 1
 * 件欠けた状態へ動く。
 */
function setupMultiSelectedThenLost(): EditorState {
  const removed = Option.unwrap(
    EditorState.removeSelected(EditorState.select(setupState(), "home-signup")),
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
  expect(
    DocumentSelection.names(
      EditorState.documentSelection(setupMultiSelectedThenLost()),
    ),
  ).not.toContain("home-signup");
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
  expect(Option.isSome(EditorState.sourceName(mixed))).toBe(false);
});

test("参照先が混ざった複数選択からはまとめて選び直せない", () => {
  expect(
    Option.isSome(
      EditorState.selectAllInstances(setupMultiSelectedWithMixedSource()),
    ),
  ).toBe(false);
});
