import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { Node } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
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
          {
            name: "badge",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 60,
              heightMode: "fixed",
              height: 24,
              placement: "absolute",
              x: 40,
              y: 90,
            },
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
      ResizeEdit.create([AxisLength.create("width", 200)]),
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
      ResizeEdit.create([AxisLength.create("height", 480)]),
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
      ResizeEdit.create([AxisLength.create("height", 480)]),
    ),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect(artboard.props?.height).toBeUndefined();
});

test("ドキュメントに無い名前の大きさは変えられない", () => {
  const resized = DesignDocument.resize(
    setupDocument(),
    "missing",
    ResizeEdit.create([AxisLength.create("width", 200)]),
  );

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
    DesignDocument.resize(
      setupDocument(),
      "panel",
      ResizeEdit.create([
        AxisLength.create("width", 240),
        AxisLength.create("height", 125),
      ]),
    ),
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
    DesignDocument.resize(
      setupDocument(),
      "home",
      ResizeEdit.create([
        AxisLength.create("width", 400),
        AxisLength.create("height", 480),
      ]),
    ),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect([artboard.width, artboard.height]).toEqual([400, 480]);
});

test("artboard は大きさとキャンバス上の位置を 1 回のリサイズで書き換える", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDocument(),
      "home",
      ResizeEdit.placedAt([AxisLength.create("width", 300)], { x: 60, y: 0 }),
    ),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(resized, "home"));
  expect([artboard.width, artboard.canvasPosition]).toEqual([
    300,
    { x: 60, y: 0 },
  ]);
});

test("絶対配置のノードは大きさと親から見た座標を 1 回のリサイズで書き換える", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDocument(),
      "badge",
      ResizeEdit.placedAt([AxisLength.create("width", 30)], { x: 70, y: 90 }),
    ),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "badge"));
  expect(Node.isPrimitive(node) && node.props).toEqual({
    widthMode: "fixed",
    width: 30,
    heightMode: "fixed",
    height: 24,
    placement: "absolute",
    x: 70,
    y: 90,
  });
});

test("位置を書かないリサイズでは、座標を持つノードの座標も変わらない", () => {
  // 座標を持たないノードで見ると、何もしない実装でも自明に通る
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDocument(),
      "badge",
      ResizeEdit.create([AxisLength.create("width", 30)]),
    ),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "badge"));
  expect(Node.isPrimitive(node) && [node.props?.x, node.props?.y]).toEqual([
    40, 90,
  ]);
});

test("横だけが動くリサイズでは、縦の座標の prop を書き換えない", () => {
  /*
   * 動いていない軸まで書くと、丸めが手で書いた座標を変えてしまう。
   * 小数の `y` を持つノードで見ると、書き換えたかどうかが値に出る。
   */
  const document = DesignDocument.create({
    artboards: [
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
              width: 60,
              placement: "absolute",
              x: 40,
              y: 90.5,
            },
            children: [],
          },
        ],
      },
    ],
  });

  const resized = Result.unwrap(
    DesignDocument.resize(
      document,
      "badge",
      ResizeEdit.placedAt([AxisLength.create("width", 30)], {
        x: 70,
        y: 90.5,
      }),
    ),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "badge"));
  expect(Node.isPrimitive(node) && [node.props?.x, node.props?.y]).toEqual([
    70, 90.5,
  ]);
});

test("小数の座標を持つノードを動かすと、書かれる座標は整数になる", () => {
  /*
   * 掴んだ時点の座標が小数だと、そこから逆算した置き直し先も小数のまま届く。
   * `.dcmp` に書くのは整数なので、書き込む側で丸める。
   */
  const document = DesignDocument.create({
    artboards: [
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
              width: 60,
              placement: "absolute",
              x: 40.5,
              y: 90,
            },
            children: [],
          },
        ],
      },
    ],
  });

  const resized = Result.unwrap(
    DesignDocument.resize(
      document,
      "badge",
      ResizeEdit.placedAt([AxisLength.create("width", 50)], {
        x: 50.5,
        y: 90,
      }),
    ),
  );

  const node = Option.unwrap(DesignDocument.findNode(resized, "badge"));
  expect(Node.isPrimitive(node) && node.props?.x).toBe(51);
});
