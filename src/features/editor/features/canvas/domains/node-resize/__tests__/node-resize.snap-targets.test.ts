import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { NodeResize } from "../index";

/**
 * 座標を持たない `intro` / `home` / `about` と、座標を持つ `settings` が並ぶドキュメント。
 * `home` には絶対配置の `badge` / `marker` と、孫の `label` を持つフロー配置の `panel` がいる。
 *
 * @param selectedNames 選ぶものの名前
 * @returns ドキュメントと選択の対
 */
function setupSelection(selectedNames: readonly string[]): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        { name: "intro", width: 200, height: 140, children: [] },
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "badge",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 40,
                heightMode: "fixed",
                height: 20,
                placement: "absolute",
                x: 10,
                y: 10,
              },
              children: [],
            },
            {
              name: "panel",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 120,
                heightMode: "fixed",
                height: 80,
              },
              children: [
                { name: "label", type: "Text", props: { content: "札" } },
              ],
            },
            {
              name: "marker",
              type: "Text",
              props: { content: "印", placement: "absolute", x: 80, y: 90 },
            },
          ],
        },
        {
          name: "settings",
          width: 200,
          height: 140,
          canvasPosition: { x: 900, y: 0 },
          children: [],
        },
        { name: "about", width: 200, height: 140, children: [] },
      ],
    }),
    selectedNames,
  );
}

test("絶対配置のノードを選んでいると、揃え先は今の親と自分以外の直下の子になる", () => {
  // 孫の `label` は含めない
  expect(
    NodeResize.resizable(setupSelection(["badge"])).snapTargetNames,
  ).toEqual(["home", "panel", "marker"]);
});

test("フロー配置のノードを選んでいると、揃え先は無い", () => {
  expect(
    NodeResize.resizable(setupSelection(["panel"])).snapTargetNames,
  ).toEqual([]);
});

test("artboard を選んでいると、揃え先は幅を変えても動かない他の artboard になる", () => {
  // 後ろにある座標を持たない `about` は、`home` の幅につられて動くので外れる
  expect(
    NodeResize.resizable(setupSelection(["home"])).snapTargetNames,
  ).toEqual(["intro", "settings"]);
});

test("何も選んでいないと、揃え先は無い", () => {
  expect(NodeResize.resizable(setupSelection([])).snapTargetNames).toEqual([]);
});

test("2 つ以上選んでいると、揃え先は無い", () => {
  expect(
    NodeResize.resizable(setupSelection(["badge", "marker"])).snapTargetNames,
  ).toEqual([]);
});
