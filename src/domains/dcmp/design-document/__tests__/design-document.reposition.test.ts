import { expect, test } from "vitest";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/** 絶対配置のノードを 1 つ持つドキュメント。座標は既定と違う値から始める。 */
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
            children: [],
          },
        ],
      },
    ],
  });
}

/** 置き直したあとの `badge` の props。 */
function repositionedProps(
  x: number,
  y: number,
): Readonly<Record<string, unknown>> {
  const document = Result.unwrap(
    DesignDocument.reposition(setupDocument(), "badge", {
      mode: "absolute",
      x,
      y,
    }),
  );
  const node = Option.unwrap(DesignDocument.findNode(document, "badge"));
  return Node.isPrimitive(node) ? (node.props ?? {}) : {};
}

test("置き直すと横と縦の座標が両方とも書き換わる", () => {
  expect(repositionedProps(52, 19)).toMatchObject({ x: 52, y: 19 });
});

test("置き直しても配置のモードは絶対配置のまま", () => {
  expect(repositionedProps(52, 19).placement).toBe("absolute");
});

test("存在しないノードを置き直そうとすると node-not-found エラーになる", () => {
  expect(
    DesignDocument.reposition(setupDocument(), "居ない", {
      mode: "absolute",
      x: 52,
      y: 19,
    }),
  ).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "居ない" },
  });
});
