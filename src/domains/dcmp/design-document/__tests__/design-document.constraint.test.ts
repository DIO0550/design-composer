import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { Node, PropEdit } from "@/domains/dcmp/node";
import { Axes } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/**
 * 幅 200・高さ 100 の artboard に、右辺へ付いた子・中央に付いた子・左辺へ付いた子が
 * この順で並ぶドキュメント。
 *
 * 既定が `min`（動かない）なので、**動く子と動かない子を同じ入力の中に置く**。
 * 対照が無いと、追従の規則を丸ごと壊しても既定側の答えで通ってしまう。
 * 動く子を 2 件並べてあるのは、**先頭の子だけを追従させる実装**でも 1 件だけなら
 * 通ってしまうため（実際にそう壊して全テストが緑のまま通った）。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "right-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 150,
              y: 10,
              constraintX: "max",
              widthMode: "fixed",
              width: 40,
            },
            children: [],
          },
          {
            name: "center-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 80,
              y: 10,
              constraintX: "center",
            },
            children: [],
          },
          {
            name: "left-badge",
            type: "Box",
            props: { placement: "absolute", x: 10, y: 10 },
            children: [],
          },
        ],
      },
    ],
  });
}

/** 名前で指したノードの prop を引く（追従の結果を 1 つの仕様ずつ見るため）。 */
function propOf(
  document: DesignDocument,
  name: string,
  prop: string,
): Option<number | string | boolean> {
  const node = DesignDocument.findNode(document, name);
  if (!node.some || !Node.isPrimitive(node.value)) {
    return Option.none;
  }
  return Option.fromNullable(node.value.props?.[prop]);
}

function widen(document: DesignDocument, name: string): DesignDocument {
  return Result.unwrap(
    DesignDocument.resize(document, name, [AxisLength.create(Axes.Width, 300)]),
  );
}

test("artboard の幅を広げると max の子が右辺に追従する", () => {
  const widened = widen(setupDocument(), "home");

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(250);
});

test("並びの 2 件目以降の子も追従する", () => {
  const widened = widen(setupDocument(), "home");

  expect(Option.unwrap(propOf(widened, "center-badge", "x"))).toBe(130);
});

test("artboard の幅を広げても min の子は動かない", () => {
  const widened = widen(setupDocument(), "home");

  expect(Option.unwrap(propOf(widened, "left-badge", "x"))).toBe(10);
});

test("artboard の高さだけを変えると横の追従は起きない", () => {
  const taller = Result.unwrap(
    DesignDocument.resize(setupDocument(), "home", [
      AxisLength.create(Axes.Height, 200),
    ]),
  );

  expect(Option.unwrap(propOf(taller, "right-badge", "x"))).toBe(150);
});

test("2 軸を同時に変えると縦横の両方で追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "corner-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 150,
              y: 80,
              constraintX: "max",
              constraintY: "max",
            },
            children: [],
          },
        ],
      },
    ],
  });

  const resized = Result.unwrap(
    DesignDocument.resize(document, "home", [
      AxisLength.create(Axes.Width, 300),
      AxisLength.create(Axes.Height, 150),
    ]),
  );

  expect([
    Option.unwrap(propOf(resized, "corner-badge", "x")),
    Option.unwrap(propOf(resized, "corner-badge", "y")),
  ]).toEqual([250, 130]);
});

test("stretch の子は親が広がった分だけ長くなる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "bar",
            type: "Box",
            props: {
              placement: "absolute",
              x: 10,
              y: 10,
              constraintX: "stretch",
              widthMode: "fixed",
              width: 180,
            },
            children: [],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "bar", "width"))).toBe(280);
});

test("長さを変えない追従では、子の長さが書き換わらない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "right-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 150,
              y: 10,
              constraintX: "max",
              widthMode: "fixed",
              width: 40.5,
            },
            children: [],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "right-badge", "width"))).toBe(40.5);
});

test("長さを持たない子は scale でも位置だけが追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "hugging",
            type: "Box",
            props: {
              placement: "absolute",
              x: 40,
              y: 10,
              constraintX: "scale",
            },
            children: [],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect([
    Option.unwrap(propOf(widened, "hugging", "x")),
    propOf(widened, "hugging", "width").some,
  ]).toEqual([60, false]);
});

test("Box の width prop を書き換えたときも子が追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 400,
        height: 200,
        children: [
          {
            name: "panel",
            type: "Box",
            props: { widthMode: "fixed", width: 200 },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = Result.unwrap(
    DesignDocument.applyPropEdit(
      document,
      "panel",
      PropEdit.set(["width"], 300),
    ),
  );

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(250);
});

test("Box をリサイズしても子は 1 回だけ追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 400,
        height: 200,
        children: [
          {
            name: "panel",
            type: "Box",
            props: { widthMode: "fixed", width: 200 },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "panel");

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(250);
});

test("stretch で長さが変わった子の中の孫も追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "panel",
            type: "Box",
            props: {
              placement: "absolute",
              x: 0,
              y: 0,
              constraintX: "stretch",
              widthMode: "fixed",
              width: 200,
            },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(250);
});

test("scale で長さが変わった子の中の孫も追従する", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "panel",
            type: "Box",
            props: {
              placement: "absolute",
              x: 0,
              y: 0,
              constraintX: "scale",
              widthMode: "fixed",
              width: 200,
            },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(250);
});

test("長さが変わらない子の中の孫は追従しない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "panel",
            type: "Box",
            props: {
              placement: "absolute",
              x: 0,
              y: 0,
              constraintX: "max",
              widthMode: "fixed",
              width: 200,
            },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(150);
});

test("長さが決まらない親をリサイズしても子は追従しない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 400,
        height: 200,
        children: [
          {
            name: "panel",
            type: "Box",
            props: { widthMode: "hug" },
            children: [
              {
                name: "right-badge",
                type: "Box",
                props: {
                  placement: "absolute",
                  x: 150,
                  y: 10,
                  constraintX: "max",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const widened = Result.unwrap(
    DesignDocument.applyPropEdit(
      document,
      "panel",
      PropEdit.set(["width"], 300),
    ),
  );

  expect(Option.unwrap(propOf(widened, "right-badge", "x"))).toBe(150);
});

test("フローの子は親を広げても座標を持たない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          { name: "title", type: "Text", props: { content: "ホーム" } },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(propOf(widened, "title", "x").some).toBe(false);
});

test("語彙にない追従を書いた子は動かない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 200,
        height: 100,
        children: [
          {
            name: "broken",
            type: "Box",
            props: {
              placement: "absolute",
              x: 150,
              y: 10,
              constraintX: "right",
            },
            children: [],
          },
        ],
      },
    ],
  });

  const widened = widen(document, "home");

  expect(Option.unwrap(propOf(widened, "broken", "x"))).toBe(150);
});
