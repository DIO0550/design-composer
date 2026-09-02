import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "panel",
            type: "Box",
            props: { widthMode: "fixed", width: 120 },
            children: [],
          },
        ],
      },
    ],
  });
}

test("ノードの大きさを変えると その軸の prop に長さが入る", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(setupDocument(), "panel", [
      AxisLength.create("width", 200),
    ]),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "panel"));
  expect(Node.isPrimitive(node) && node.props).toEqual({
    widthMode: "fixed",
    width: 200,
  });
});

test("artboard の大きさを変えると artboard 自身の長さが変わる", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(setupDocument(), "home", [
      AxisLength.create("height", 480),
    ]),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect(artboard.height).toBe(480);
});

test("artboard の大きさは props には書かれない", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(setupDocument(), "home", [
      AxisLength.create("height", 480),
    ]),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect(artboard.props?.height).toBeUndefined();
});

test("ドキュメントに無い名前の大きさは変えられない", () => {
  const resized = DesignDocument.resize(setupDocument(), "missing", [
    AxisLength.create("width", 200),
  ]);

  expect(resized).toEqual(
    Result.err({ kind: "node-not-found", name: "missing" }),
  );
});

test("幅と高さをまとめて渡すと、ノードの両方の prop が書き換わる", () => {
  /*
   * 角のハンドルは 2 軸を同時に変える。畳み込みが直前の結果を捨てて元の
   * ドキュメントから作り直すと、片方の軸しか残らない。
   */
  const resized = Result.unwrap(
    DesignDocument.resize(setupDocument(), "panel", [
      AxisLength.create("width", 240),
      AxisLength.create("height", 125),
    ]),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "panel"));
  expect(Node.isPrimitive(node) && node.props).toEqual({
    widthMode: "fixed",
    width: 240,
    height: 125,
  });
});

test("幅と高さをまとめて渡すと、artboard の両方の長さが変わる", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(setupDocument(), "home", [
      AxisLength.create("width", 400),
      AxisLength.create("height", 480),
    ]),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect([artboard.width, artboard.height]).toEqual([400, 480]);
});
