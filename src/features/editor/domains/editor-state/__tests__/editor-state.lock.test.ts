import { expect, test } from "vitest";
import { nestedLockPanel } from "@/domains/__tests__/nested-locks";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { PropEdit } from "@/domains/dcmp/node";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "@/domains/session/under-pointer";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames, InstanceNames, stateWithDeepBranch } from "./setup";

/*
 * ロックしたノードがキャンバスの選択・直接操作の対象から外れ、ツリーからは選べること
 * （docs/03「ロック」/ docs/06-ui.md「選択」「キャンバス直接操作」）。
 */

/**
 * `home` の直下に、ロックした絶対配置の Text `badge`、ロックしていない `free`、ロックした
 * Box の `sealed`（中に絶対配置の `inside`）が並ぶ状態。`card` の中にはロックした `row`
 * （中に `label`）がある。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "badge",
              type: "Text",
              props: { placement: "absolute", x: 40, y: 24, locking: "locked" },
            },
            { name: "free", type: "Text" },
            {
              name: "sealed",
              type: "Box",
              props: { layout: "free", locking: "locked" },
              children: [
                {
                  name: "inside",
                  type: "Text",
                  props: { placement: "absolute", x: 8, y: 8 },
                },
              ],
            },
            {
              name: "card",
              type: "Box",
              children: [
                {
                  name: "row",
                  type: "Box",
                  props: { locking: "locked" },
                  children: [{ name: "label", type: "Text" }],
                },
              ],
            },
          ],
        },
      ],
    }),
  );
}

test("ロックした artboard 直下の子をクリックすると artboard が選ばれる", () => {
  const state = EditorState.selectAt(
    setupState(),
    UnderPointer.create(["badge", "home"], SelectionDigs.NoDeeper),
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("home"));
});

test("ツリーで選んだロック中のノードをキャンバスで押すと、押した位置の artboard 直下の子が選ばれる", () => {
  const selected = EditorState.select(setupState(), "row");

  const state = EditorState.selectAt(
    selected,
    UnderPointer.create(
      ["label", "row", "card", "home"],
      SelectionDigs.NoDeeper,
    ),
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("card"));
});

test("範囲に入ったロック中のノードは選ばれず、隣のノードだけが選ばれる", () => {
  const state = EditorState.selectInRange(setupState(), ["badge", "free"]);

  expect(EditorState.singleName(state)).toEqual(Option.some("free"));
});

test("ロックしたノードもツリーから名前で選べる", () => {
  const state = EditorState.select(setupState(), "badge");

  expect(EditorState.singleName(state)).toEqual(Option.some("badge"));
});

test("ツリーで選んだロック中の絶対配置のノードは矢印キーで動かない", () => {
  const selected = EditorState.select(setupState(), "badge");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("ロックした Box の中の絶対配置の子をツリーで選んでも、矢印キーで動かない", () => {
  const selected = EditorState.select(setupState(), "inside");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("ロックを外したノードはキャンバスのクリックで選べるようになる", () => {
  const unlocked = Option.unwrap(
    EditorState.applyPropEdit(
      EditorState.select(setupState(), "badge"),
      PropEdit.set(["locking"], "unlocked"),
      EditContinuities.Separate,
    ),
  );

  const state = EditorState.selectAt(
    EditorState.clearSelection(unlocked),
    UnderPointer.create(["badge", "home"], SelectionDigs.NoDeeper),
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("badge"));
});

test("ロックした Box の中でグループ解除すると、外した子が選ばれる", () => {
  const state = EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "sealed",
              type: "Box",
              props: { locking: "locked" },
              children: [
                {
                  name: "group",
                  type: "Box",
                  children: [{ name: "grouped", type: "Text" }],
                },
              ],
            },
          ],
        },
      ],
    }),
  );

  const ungrouped = Option.unwrap(
    EditorState.ungroupSelected(EditorState.select(state, "group")),
  );

  expect(EditorState.singleName(ungrouped)).toEqual(Option.some("grouped"));
});

/**
 * `stateWithDeepBranch` の部品インスタンス `home-login` を選び、インスタンス自身の値で
 * ロックした状態。
 *
 * @returns ロックしたインスタンスを選んでいるエディタの状態
 */
function stateWithLockedInstance(): EditorState {
  return Option.unwrap(
    EditorState.applyRefOwnPropEdit(
      EditorState.select(stateWithDeepBranch(), "home-login"),
      PropEdit.set(["locking"], "locked"),
      EditContinuities.Separate,
    ),
  );
}

test("ロックしたインスタンスの中身をクリックすると artboard が選ばれる", () => {
  const state = EditorState.selectAt(
    EditorState.clearSelection(stateWithLockedInstance()),
    UnderPointer.create(InstanceNames, SelectionDigs.NoDeeper),
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("home"));
});

test("範囲に入ったロック中のインスタンスは選ばれず、隣のノードだけが選ばれる", () => {
  const state = EditorState.selectInRange(
    EditorState.clearSelection(stateWithLockedInstance()),
    ["home-login", "sibling-panel"],
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("sibling-panel"));
});

test("ロックしたインスタンスもツリーから名前で選べる", () => {
  const state = EditorState.select(
    EditorState.clearSelection(stateWithLockedInstance()),
    "home-login",
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("home-login"));
});

test("ロックを外したインスタンスはキャンバスのクリックで選べるようになる", () => {
  const unlocked = Option.unwrap(
    EditorState.applyRefOwnPropEdit(
      stateWithLockedInstance(),
      PropEdit.set(["locking"], "unlocked"),
      EditContinuities.Separate,
    ),
  );

  const state = EditorState.selectAt(
    EditorState.clearSelection(unlocked),
    UnderPointer.create(InstanceNames, SelectionDigs.NoDeeper),
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("home-login"));
});

test("プリミティブを選んでいるときはインスタンス自身の値を書き換えられない", () => {
  const edited = EditorState.applyRefOwnPropEdit(
    EditorState.select(stateWithDeepBranch(), "sibling-panel"),
    PropEdit.set(["locking"], "locked"),
    EditContinuities.Separate,
  );

  expect(edited).toEqual(Option.none);
});

test("インスタンスのロックは Undo 1 回で書く前へ戻る", () => {
  const undone = Option.unwrap(EditorState.undo(stateWithLockedInstance()));

  expect(
    DesignDocument.isLocked(EditorState.document(undone), "home-login"),
  ).toBe(false);
});

/**
 * `home` の直下に、コピー元の Text `source`、`nestedLockPanel` の `panel`、子を 1 つ持つ
 * `open`、ロックした Text の `locked-title` が並ぶ状態。クリップボードには `source` が
 * 入っている。
 */
function setupNestedLockState(): EditorState {
  const state = EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "source", type: "Text" },
            nestedLockPanel(),
            {
              name: "open",
              type: "Box",
              children: [{ name: "open-title", type: "Text" }],
            },
            {
              name: "locked-title",
              type: "Text",
              props: { locking: "locked" },
            },
          ],
        },
      ],
    }),
  );
  return Option.unwrap(
    EditorState.copySelected(EditorState.select(state, "source")),
  );
}

test("ロックした Box を選んで貼ると、その Box の直後に並ぶ", () => {
  const pasted = Option.unwrap(
    EditorState.pasteCopied(
      EditorState.select(setupNestedLockState(), "sealed"),
    ),
  );

  expect(childNames(pasted, "panel")).toEqual(["sealed", "source-2", "after"]);
});

test("祖先がロックしている Box を選んで貼ると、最も外側のロックの直後に並ぶ", () => {
  const pasted = Option.unwrap(
    EditorState.pasteCopied(
      EditorState.select(setupNestedLockState(), "nested"),
    ),
  );

  expect(childNames(pasted, "panel")).toEqual(["sealed", "source-2", "after"]);
});

test("ロックしていない Box を選んで貼ると、その Box の子の末尾に並ぶ", () => {
  const pasted = Option.unwrap(
    EditorState.pasteCopied(EditorState.select(setupNestedLockState(), "open")),
  );

  expect(childNames(pasted, "open")).toEqual(["open-title", "source-2"]);
});

test("ロックした Text を選んでいるときは貼れない", () => {
  expect(
    EditorState.pasteCopied(
      EditorState.select(setupNestedLockState(), "locked-title"),
    ),
  ).toEqual(Option.none);
});

test("ロックした Box を選んで Box を挿すと、その Box の直後に並ぶ", () => {
  const inserted = Option.unwrap(
    EditorState.insertNode(
      EditorState.select(setupNestedLockState(), "sealed"),
      { kind: "primitive", type: "Box" },
    ),
  );

  expect(childNames(inserted, "panel")).toEqual(["sealed", "box", "after"]);
});

test("ロックした Box を選んだまま 2 回貼ると、後に貼ったものが前に並ぶ", () => {
  const selected = EditorState.select(setupNestedLockState(), "sealed");
  const once = Option.unwrap(EditorState.pasteCopied(selected));

  const twice = Option.unwrap(EditorState.pasteCopied(once));

  expect(childNames(twice, "panel")).toEqual([
    "sealed",
    "source-3",
    "source-2",
    "after",
  ]);
});

test("ロックした Box の中の子を複製すると、複製はその Box の中の直後に並ぶ", () => {
  const duplicated = Option.unwrap(
    EditorState.duplicateSelected(
      EditorState.select(setupNestedLockState(), "inner"),
    ),
  );

  expect(childNames(duplicated, "sealed")).toEqual(["inner", "inner-2"]);
});
