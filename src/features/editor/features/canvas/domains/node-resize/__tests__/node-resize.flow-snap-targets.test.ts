import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Props } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { NodeResize, type ResizeHandleAnchor } from "../index";
import { gripAt, heldSnapTargetNames } from "./setup";

/*
 * フロー配置のノードの揃え先（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 親が交差軸の始点を動かさないときだけ、その軸の 1 軸を掴んだときに吸い付く。
 */

/** 両軸とも長さを決めた Box の props。 */
const BothFixed: Props = {
  widthMode: "fixed",
  width: 120,
  heightMode: "fixed",
  height: 40,
};

/** 幅が固定の縦並びの親。 */
const FixedColumn: Props = { layout: "column", widthMode: "fixed", width: 300 };

/** 高さが固定の横並びの親。 */
const FixedRow: Props = { layout: "row", heightMode: "fixed", height: 100 };

/**
 * artboard `home` の中の親 `list` に、孫を持つ `first`・選ぶ `target`・後ろの `after`・
 * 絶対配置の `pin` が並ぶドキュメントで、`target` を選んだもの。
 *
 * @param props `list` の props（`parent`）と `target` の props（`target`。省くと両軸 fixed）
 * @returns ドキュメントと選択の対
 */
function setupSelection(
  props: Readonly<{ parent: Props; target?: Props }>,
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 400,
          children: [
            {
              name: "list",
              type: "Box",
              props: props.parent,
              children: [
                {
                  name: "first",
                  type: "Box",
                  props: BothFixed,
                  children: [
                    {
                      name: "first-label",
                      type: "Text",
                      props: { content: "札" },
                    },
                  ],
                },
                {
                  name: "target",
                  type: "Box",
                  props: props.target ?? BothFixed,
                  children: [],
                },
                { name: "after", type: "Box", props: BothFixed, children: [] },
                {
                  name: "pin",
                  type: "Text",
                  props: { content: "印", placement: "absolute", x: 10, y: 10 },
                },
              ],
            },
          ],
        },
      ],
    }),
    ["target"],
  );
}

/**
 * 選んだものをその箇所で掴んだときの揃え先の名前。
 *
 * @param selection ドキュメントと選択の対
 * @param anchor 押した箇所
 * @returns 揃え先の名前
 */
function snapTargetNamesAt(
  selection: DocumentSelection,
  anchor: ResizeHandleAnchor,
): readonly string[] {
  const resizable = NodeResize.resizable(selection);
  return heldSnapTargetNames(resizable, gripAt(resizable, anchor));
}

test("幅が固定の縦並びの親で右辺を掴むと、揃え先は親と自分以外の直下の子になる", () => {
  // 後ろの兄弟と絶対配置の兄弟を含み、孫の `first-label` は含めない
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedColumn }), {
      x: 1,
      y: 0.5,
    }),
  ).toEqual(["list", "first", "after", "pin"]);
});

test("artboard の直下で右辺を掴むと、揃え先は artboard と自分以外の直下の子になる", () => {
  const selection = DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 400,
          children: [
            { name: "target", type: "Box", props: BothFixed, children: [] },
            { name: "after", type: "Box", props: BothFixed, children: [] },
          ],
        },
      ],
    }),
    ["target"],
  );

  expect(snapTargetNamesAt(selection, { x: 1, y: 0.5 })).toEqual([
    "home",
    "after",
  ]);
});

test("両軸とも固定のノードの右上の角は幅だけを掴むので、揃え先がある", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedColumn }), { x: 1, y: 0 }),
  ).toEqual(["list", "first", "after", "pin"]);
});

test("高さが固定でないノードの右下の角は幅だけを掴むので、揃え先がある", () => {
  const selection = setupSelection({
    parent: FixedColumn,
    target: { widthMode: "fixed", width: 120, heightMode: "hug" },
  });

  expect(snapTargetNamesAt(selection, { x: 1, y: 1 })).toEqual([
    "list",
    "first",
    "after",
    "pin",
  ]);
});

test("高さが固定の横並びの親で下辺を掴むと、揃え先がある", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedRow }), { x: 0.5, y: 1 }),
  ).toEqual(["list", "first", "after", "pin"]);
});

test("高さが固定の横並びの親で左下の角を掴むと、高さだけを掴むので揃え先がある", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedRow }), { x: 0, y: 1 }),
  ).toEqual(["list", "first", "after", "pin"]);
});

test("縦並びの親で下辺を掴むと、揃え先は無い", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedColumn }), {
      x: 0.5,
      y: 1,
    }),
  ).toEqual([]);
});

test("縦並びの親で右下の角を掴むと、揃え先は無い", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedColumn }), { x: 1, y: 1 }),
  ).toEqual([]);
});

test("縦並びの親で左下の角を掴むと、主軸の高さだけを掴むので揃え先は無い", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedColumn }), { x: 0, y: 1 }),
  ).toEqual([]);
});

test("横並びの親で右辺を掴むと、揃え先は無い", () => {
  expect(
    snapTargetNamesAt(setupSelection({ parent: FixedRow }), { x: 1, y: 0.5 }),
  ).toEqual([]);
});

test("揃えが center の親では、右辺を掴んでも揃え先は無い", () => {
  const selection = setupSelection({
    parent: { ...FixedColumn, align: "center" },
  });

  expect(snapTargetNamesAt(selection, { x: 1, y: 0.5 })).toEqual([]);
});

test("幅が fixed なのに長さを書いていない親では、右辺を掴んでも揃え先は無い", () => {
  const selection = setupSelection({
    parent: { layout: "column", widthMode: "fixed" },
  });

  expect(snapTargetNamesAt(selection, { x: 1, y: 0.5 })).toEqual([]);
});

test("回った Box の中にいるノードは、右辺を掴んでも揃え先は無い", () => {
  const selection = setupSelection({
    parent: { ...FixedColumn, rotation: 30 },
  });

  expect(snapTargetNamesAt(selection, { x: 1, y: 0.5 })).toEqual([]);
});

test("自分が回っているノードは、右辺を掴んでも揃え先は無い", () => {
  const selection = setupSelection({
    parent: FixedColumn,
    target: { ...BothFixed, rotation: 30 },
  });

  expect(snapTargetNamesAt(selection, { x: 1, y: 0.5 })).toEqual([]);
});
