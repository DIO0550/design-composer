import { expect, test } from "vitest";
import { AxisLength } from "@/domains/axis-length";
import { Node } from "@/domains/node";
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
    DesignDocument.resize(
      setupDocument(),
      "panel",
      AxisLength.create("width", 200),
    ),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "panel"));
  expect(Node.isPrimitive(node) && node.props).toEqual({
    widthMode: "fixed",
    width: 200,
  });
});

test("artboard の大きさを変えると artboard 自身の長さが変わる", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDocument(),
      "home",
      AxisLength.create("height", 480),
    ),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect(artboard.height).toBe(480);
});

test("artboard の大きさは props には書かれない", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDocument(),
      "home",
      AxisLength.create("height", 480),
    ),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect(artboard.props?.height).toBeUndefined();
});

test("ドキュメントに無い名前の大きさは変えられない", () => {
  const resized = DesignDocument.resize(
    setupDocument(),
    "missing",
    AxisLength.create("width", 200),
  );

  expect(resized).toEqual(
    Result.err({ kind: "node-not-found", name: "missing" }),
  );
});
