import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { childNames, propsOf } from "./group-setup";

/**
 * `home` の下に絶対配置の `a`・`b`、付け替え先になる Box の `panel`（子が 1 つ）と `side`
 * （子が無い）、子を持てない `title`。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "a",
            type: "Box",
            props: { placement: "absolute", x: 10, y: 20 },
          },
          {
            name: "b",
            type: "Box",
            props: { placement: "absolute", x: 30, y: 40 },
          },
          {
            name: "panel",
            type: "Box",
            children: [{ name: "panel-head", type: "Text" }],
          },
          { name: "side", type: "Box", children: [] },
          { name: "title", type: "Text" },
        ],
      },
    ],
  });
}

function placedAt(parentName: string, x: number, y: number): RepositionEdit {
  return RepositionEdit.create(
    ChildPlacement.create(parentName, { mode: "absolute", x, y }),
  );
}

test("同じ親の中でまとめて置き直すと、全員にそれぞれの座標が書かれる", () => {
  const repositioned = Result.unwrap(
    DesignDocument.repositionAll(setupDocument(), [
      { name: "a", edit: placedAt("home", 15, 25) },
      { name: "b", edit: placedAt("home", 35, 45) },
    ]),
  );

  expect([propsOf(repositioned, "a"), propsOf(repositioned, "b")]).toEqual([
    expect.objectContaining({ x: 15, y: 25 }),
    expect.objectContaining({ x: 35, y: 45 }),
  ]);
});

test("別の親へまとめて置き直すと、渡した順のままその親の末尾に並ぶ", () => {
  const repositioned = Result.unwrap(
    DesignDocument.repositionAll(setupDocument(), [
      { name: "b", edit: placedAt("panel", 5, 5) },
      { name: "a", edit: placedAt("panel", 0, 0) },
    ]),
  );

  expect(childNames(repositioned, "panel")).toEqual(["panel-head", "b", "a"]);
});

test("向きを持つ編集のノードにだけ向きが書かれる", () => {
  const repositioned = Result.unwrap(
    DesignDocument.repositionAll(setupDocument(), [
      {
        name: "a",
        edit: RepositionEdit.rotatedTo(
          ChildPlacement.create("panel", { mode: "absolute", x: 0, y: 0 }),
          90,
        ),
      },
      { name: "b", edit: placedAt("panel", 5, 5) },
    ]),
  );

  expect([
    propsOf(repositioned, "a").rotation,
    propsOf(repositioned, "b").rotation,
  ]).toEqual([90, undefined]);
});

test("1 件でも受け入れられない置き直しがあれば、先頭が通る指定でも全体が失敗になる", () => {
  const result = DesignDocument.repositionAll(setupDocument(), [
    { name: "a", edit: placedAt("panel", 0, 0) },
    { name: "b", edit: placedAt("title", 0, 0) },
  ]);

  expect(result).toEqual(
    Result.err({ kind: "parent-not-found", name: "title" }),
  );
});

test("一員ごとに違う親を指すと、それぞれの親へ付け替わる", () => {
  const repositioned = Result.unwrap(
    DesignDocument.repositionAll(setupDocument(), [
      { name: "a", edit: placedAt("panel", 0, 0) },
      { name: "b", edit: placedAt("side", 0, 0) },
    ]),
  );

  expect([
    childNames(repositioned, "panel"),
    childNames(repositioned, "side"),
  ]).toEqual([["panel-head", "a"], ["b"]]);
});
