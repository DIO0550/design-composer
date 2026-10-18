import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { Node, PropEdit, type PropValue } from "@/domains/dcmp/node";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/**
 * 絶対配置の `badge`（子を 1 つ持つ）と、付け替え先になる `panel`（子が 2 つ）、
 * 子を持てない `title` が `home` に並ぶドキュメント。座標は既定と違う値から始める。
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
      RepositionEdit.create(ChildPlacement.create(parentName, placement)),
    ),
  );
}

/** `setupDocument` の `badge` に `rotation` を書いたドキュメント。 */
function setupRotatedBadgeDocument(rotation: PropValue): DesignDocument {
  return Result.unwrap(
    DesignDocument.applyPropEdit(
      setupDocument(),
      "badge",
      PropEdit.set(["rotation"], rotation),
    ),
  );
}

/** `rotation` を書いた `badge` を、その編集で置き直したあとの `badge` の props。 */
function repositionRotatedBadge(
  rotation: PropValue,
  edit: RepositionEdit,
): Readonly<Record<string, unknown>> {
  return badgePropsOf(
    Result.unwrap(
      DesignDocument.reposition(
        setupRotatedBadgeDocument(rotation),
        "badge",
        edit,
      ),
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
      RepositionEdit.create(
        ChildPlacement.create("title", { mode: "absolute", x: 52, y: 19 }),
      ),
    ),
  ).toEqual(Result.err({ kind: "parent-not-found", name: "title" }));
});

test("自分の子孫を親に指すと move-into-descendant エラーになる", () => {
  // 入れると木が閉じてしまう（`moveNode` が同じ理由で拒む経路）
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "badge",
      RepositionEdit.create(
        ChildPlacement.create("badge-dot", { mode: "absolute", x: 52, y: 19 }),
      ),
    ),
  ).toEqual(
    Result.err({
      kind: "move-into-descendant",
      name: "badge",
      parentName: "badge-dot",
    }),
  );
});

test("artboard の名前を置き直そうとすると node-not-found エラーになる", () => {
  // artboard は親 Box を持たないので、親からの座標を持たない
  // （キャンバス上の位置は artboard 自身の `canvasPosition`）
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "home",
      RepositionEdit.create(
        ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
      ),
    ),
  ).toEqual(Result.err({ kind: "node-not-found", name: "home" }));
});

test("存在しないノードを置き直そうとすると node-not-found エラーになる", () => {
  expect(
    DesignDocument.reposition(
      setupDocument(),
      "居ない",
      RepositionEdit.create(
        ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
      ),
    ),
  ).toEqual(Result.err({ kind: "node-not-found", name: "居ない" }));
});

test("別の親へ向きを指して置き直すと、その向きが書かれる", () => {
  const props = repositionRotatedBadge(
    30,
    RepositionEdit.rotatedTo(
      ChildPlacement.create("panel", { mode: "absolute", x: 52, y: 19 }),
      120,
    ),
  );

  expect(props.rotation).toBe(120);
});

test("別の親へ回っていない向きを指して置き直すと、向きは未設定に戻る", () => {
  const props = repositionRotatedBadge(
    45,
    RepositionEdit.rotatedTo(
      ChildPlacement.create("panel", { mode: "absolute", x: 52, y: 19 }),
      0,
    ),
  );

  expect("rotation" in props).toBe(false);
});

test("別の親へ 1 回りの向きを指して置き直すと、1 回りのまま書かれる", () => {
  const props = repositionRotatedBadge(
    30,
    RepositionEdit.rotatedTo(
      ChildPlacement.create("panel", { mode: "absolute", x: 52, y: 19 }),
      360,
    ),
  );

  expect(props.rotation).toBe(360);
});

test("別の親へ向きを指さずに置き直すと、数値でない向きもそのまま残る", () => {
  const props = repositionRotatedBadge(
    "abc",
    RepositionEdit.create(
      ChildPlacement.create("panel", { mode: "absolute", x: 52, y: 19 }),
    ),
  );

  expect(props.rotation).toBe("abc");
});

test("同じ親の中で向きを指して置き直しても、その向きが書かれる", () => {
  const props = repositionRotatedBadge(
    30,
    RepositionEdit.rotatedTo(
      ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
      120,
    ),
  );

  expect(props.rotation).toBe(120);
});

test("同じ親の中で向きを指さずに置き直すと、向きは元のまま", () => {
  const props = repositionRotatedBadge(
    30,
    RepositionEdit.create(
      ChildPlacement.create("home", { mode: "absolute", x: 52, y: 19 }),
    ),
  );

  expect(props.rotation).toBe(30);
});
