import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/**
 * 絶対配置の `badge`（子を 1 つ持つ）と、付け替え先になる `panel`（子が 2 つ）、
 * 子を持てない `title` が `home` に並ぶドキュメント。座標は既定と違う値から始める。
 *
 * `panel` に子を 2 つ置くのは、末尾へ入ることを先頭と区別するため。
 * `badge` に子を持たせるのは、自分の子孫を親に指す経路を確かめるため。
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
            name: "badge",
            type: "Box",
            props: { placement: "absolute", x: 40, y: 24 },
            children: [{ name: "badge-dot", type: "Box", children: [] }],
          },
          {
            name: "panel",
            type: "Box",
            props: {},
            children: [
              {
                name: "panel-head",
                type: "Text",
                props: { content: "見出し" },
              },
              { name: "panel-body", type: "Text", props: { content: "本文" } },
            ],
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
        ],
      },
    ],
  });
}

/** 指した親の中の座標へ置き直したドキュメント。 */
function reposition(
  parentName: string,
  placement: Parameters<typeof ChildPlacement.create>[1],
): DesignDocument {
  return Result.unwrap(
    DesignDocument.reposition(
      setupDocument(),
      "badge",
      ChildPlacement.create(parentName, placement),
    ),
  );
}

/** そのドキュメントでの `badge` の props。 */
function badgePropsOf(
  document: DesignDocument,
): Readonly<Record<string, unknown>> {
  const node = Option.unwrap(DesignDocument.findNode(document, "badge"));
  return Node.isPrimitive(node) ? (node.props ?? {}) : {};
}

/** そのドキュメントでの、名前で指した親の子の名前の並び。 */
function childNamesOf(
  document: DesignDocument,
  parentName: string,
): readonly string[] {
  return Option.unwrap(DesignDocument.findChildren(document, parentName)).map(
    (child) => child.name,
  );
}

test("置き直すと横と縦の座標が両方とも書き換わる", () => {
  const repositioned = reposition("home", { mode: "absolute", x: 52, y: 19 });

  expect(badgePropsOf(repositioned)).toMatchObject({ x: 52, y: 19 });
});

test("置き直しても配置のモードは絶対配置のまま", () => {
  const repositioned = reposition("home", { mode: "absolute", x: 52, y: 19 });

  expect(badgePropsOf(repositioned).placement).toBe("absolute");
});

test("同じ親を指した置き直しでは、ツリーの並びが変わらない", () => {
  // 末尾へ移す実装にすると `badge` が最後へ回るので、同じ親では移さないことを見る
  const repositioned = reposition("home", { mode: "absolute", x: 52, y: 19 });

  expect(childNamesOf(repositioned, "home")).toEqual([
    "badge",
    "panel",
    "title",
  ]);
});

test("別の親を指して置き直すと、その親の子になる", () => {
  const repositioned = reposition("panel", { mode: "absolute", x: 52, y: 19 });

  expect(childNamesOf(repositioned, "panel")).toContain("badge");
});

test("別の親を指して置き直すと、その親の末尾の子になる", () => {
  const repositioned = reposition("panel", { mode: "absolute", x: 52, y: 19 });

  expect(childNamesOf(repositioned, "panel")).toEqual([
    "panel-head",
    "panel-body",
    "badge",
  ]);
});

test("別の親を指して置き直すと、元の親からは居なくなる", () => {
  const repositioned = reposition("panel", { mode: "absolute", x: 52, y: 19 });

  expect(childNamesOf(repositioned, "home")).toEqual(["panel", "title"]);
});

test("別の親を指して置き直すと、その親から見た座標が書かれる", () => {
  const repositioned = reposition("panel", { mode: "absolute", x: 52, y: 19 });

  expect(badgePropsOf(repositioned)).toMatchObject({ x: 52, y: 19 });
});

test("別の親を指して置き直しても配置のモードは絶対配置のまま", () => {
  const repositioned = reposition("panel", { mode: "absolute", x: 52, y: 19 });

  expect(badgePropsOf(repositioned).placement).toBe("absolute");
});

test("子を持てない相手を親に指すと parent-not-found エラーになる", () => {
  // Text は子を持てないので、そこへ入れると木が壊れる
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "badge",
      ChildPlacement.create("title", { mode: "absolute", x: 52, y: 19 }),
    ),
  ).toEqual({
    ok: false,
    error: { kind: "parent-not-found", name: "title" },
  });
});

test("自分の子孫を親に指すと move-into-descendant エラーになる", () => {
  // 入れると木が閉じてしまう（`moveNode` が同じ理由で拒む経路）
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "badge",
      ChildPlacement.create("badge-dot", { mode: "absolute", x: 52, y: 19 }),
    ),
  ).toEqual({
    ok: false,
    error: {
      kind: "move-into-descendant",
      name: "badge",
      parentName: "badge-dot",
    },
  });
});

test("artboard の名前を置き直そうとすると node-not-found エラーになる", () => {
  // artboard は親 Box を持たないので、親からの座標を持たない
  // （キャンバス上の位置は artboard 自身の `canvasPosition`）
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "home",
      ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
    ),
  ).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "home" },
  });
});

test("存在しないノードを置き直そうとすると node-not-found エラーになる", () => {
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "居ない",
      ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
    ),
  ).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "居ない" },
  });
});
