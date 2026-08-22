import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { DraggedNode } from "../index";

/** `home` の下に、子を持つ `body` と、その子の `card` が並ぶドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "body",
            type: "Box",
            children: [{ name: "card", type: "Box", children: [] }],
          },
        ],
      },
    ],
  });
}

test("木にあるノードを運んでいるときは、自分と子孫の名前を占めている", () => {
  const occupied = DraggedNode.collectNames(
    { kind: "existing", name: "body" },
    setupDocument(),
  );

  expect(Option.unwrap(occupied)).toEqual(["body", "card"]);
});

test("パレットの雛形を運んでいるときは何も占めていない", () => {
  // まだ木に無いので、どの親へでも落とせる
  const occupied = DraggedNode.collectNames(
    { kind: "new", template: { kind: "primitive", type: "Box" } },
    setupDocument(),
  );

  expect(Option.unwrap(occupied)).toEqual([]);
});

test("木に無い名前のノードを運んでいるときは占めている名前が決まらない", () => {
  const occupied = DraggedNode.collectNames(
    { kind: "existing", name: "居ないノード" },
    setupDocument(),
  );

  expect(occupied.some).toBe(false);
});

test("パレットの雛形を運んでいるときは、その雛形を答える", () => {
  const template = DraggedNode.template({
    kind: "new",
    template: { kind: "instance", componentName: "card" },
  });

  expect(Option.unwrap(template)).toEqual({
    kind: "instance",
    componentName: "card",
  });
});

test("木にあるノードを運んでいるときは雛形を答えない", () => {
  // 掴んだ行の強調とツールバーの点灯は、パレットから運んでいるときだけの表示
  const template = DraggedNode.template({ kind: "existing", name: "body" });

  expect(template.some).toBe(false);
});
