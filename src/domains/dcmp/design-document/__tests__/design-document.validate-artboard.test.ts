import { expect, test } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import { DesignDocument, type DesignDocumentValidationError } from "../index";

test("artboard の props も Box スキーマで検証され、enum 外の値はエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { layout: "diagonal" },
        children: [],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "enum-violation", nodeName: "screen" }),
  ]);
});

test("artboard の props が Box スキーマに適合する場合はエラーにならない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { layout: "row", overflow: "clip" },
        children: [],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("artboard に未知の prop を指定すると unknown-prop エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { notAProp: true },
        children: [],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "unknown-prop", nodeName: "screen" }),
  ]);
});

/**
 * artboard 1 枚だけのドキュメントを検証する。
 *
 * @param props artboard に設定する props
 * @returns そのドキュメントのバリデーションエラー
 */
function collectSingleArtboardErrors(
  props: Props,
): readonly DesignDocumentValidationError[] {
  return DesignDocument.collectErrors(
    DesignDocument.create({
      artboards: [
        { name: "screen", width: 375, height: 812, props, children: [] },
      ],
    }),
  );
}

/**
 * 対照の未知の prop を 1 件足した artboard 1 枚だけのドキュメントを検証する。
 *
 * 対照を置くのは、`[]` を期待すると何も検証しない実装でも通るため。読み捨てが効いていれば、
 * エラーは対照の 1 件({@link UnknownPropErrorOnly})だけになる。
 *
 * @param props 対照と並べて artboard に設定する props
 * @returns そのドキュメントのバリデーションエラー
 */
function collectErrorsBesideUnknownProp(
  props: Props,
): readonly DesignDocumentValidationError[] {
  return collectSingleArtboardErrors({ ...props, notAProp: true });
}

/** {@link collectErrorsBesideUnknownProp} が足した対照だけがエラーになったときの期待値。 */
const UnknownPropErrorOnly = [
  expect.objectContaining({
    kind: "unknown-prop",
    nodeName: "screen",
    prop: "notAProp",
  }),
];

test("artboard の props に書いた配置と追従は読み捨てられ、未知の prop のエラーにならない", () => {
  const errors = collectErrorsBesideUnknownProp({
    placement: "absolute",
    x: 10,
    y: 20,
    constraintX: "max",
    constraintY: "center",
  });

  expect(errors).toEqual(UnknownPropErrorOnly);
});

test("artboard の props に書いたロックは読み捨てられ、未知の prop のエラーにならない", () => {
  const errors = collectErrorsBesideUnknownProp({ locking: "locked" });

  expect(errors).toEqual(UnknownPropErrorOnly);
});

test("artboard の props に書いた回転は読み捨てられ、未知の prop のエラーにならない", () => {
  const errors = collectErrorsBesideUnknownProp({ rotation: 30 });

  expect(errors).toEqual(UnknownPropErrorOnly);
});

test("artboard の props に書いたサイズのモードと長さは読み捨てられ、未知の prop のエラーにならない", () => {
  const errors = collectErrorsBesideUnknownProp({
    widthMode: "hug",
    width: 100,
    heightMode: "fill",
    height: 50,
  });

  expect(errors).toEqual(UnknownPropErrorOnly);
});

test("artboard の props に書いた最小 / 最大は読み捨てられ、未知の prop のエラーにならない", () => {
  const errors = collectErrorsBesideUnknownProp({
    minWidth: 100,
    maxWidth: 200,
    minHeight: 10,
    maxHeight: 20,
  });

  expect(errors).toEqual(UnknownPropErrorOnly);
});

test("読み捨てる prop でも、artboard の props に数値でない回転を書くと型の不一致のエラーになる", () => {
  const errors = collectSingleArtboardErrors({ rotation: "abc" });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "screen",
      prop: "rotation",
    }),
  ]);
});

test("読み捨てる prop でも、artboard の props に枠外のロックを書くと値域違反のエラーになる", () => {
  const errors = collectSingleArtboardErrors({ locking: "bogus" });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "screen",
      prop: "locking",
    }),
  ]);
});

test("読み捨てる prop でも、artboard の props に数値でない最小幅を書くと型の不一致のエラーになる", () => {
  const errors = collectSingleArtboardErrors({ minWidth: "abc" });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "screen",
      prop: "minWidth",
    }),
  ]);
});
