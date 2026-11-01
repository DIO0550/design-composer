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

test("artboard の props に書いた配置と追従は読み捨てられ、未知の prop のエラーにならない", () => {
  // 対照に未知の prop を 1 件置く。`[]` を期待すると何も検証しない実装でも通る
  const errors = collectSingleArtboardErrors({
    placement: "absolute",
    x: 10,
    y: 20,
    constraintX: "max",
    constraintY: "center",
    notAProp: true,
  });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "screen",
      prop: "notAProp",
    }),
  ]);
});

test("artboard の props に書いたロックは読み捨てられ、未知の prop のエラーにならない", () => {
  // 対照に未知の prop を 1 件置く。`[]` を期待すると何も検証しない実装でも通る
  const errors = collectSingleArtboardErrors({
    locking: "locked",
    notAProp: true,
  });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "screen",
      prop: "notAProp",
    }),
  ]);
});

test("artboard の props に書いた回転は読み捨てられ、未知の prop のエラーにならない", () => {
  // 対照に未知の prop を 1 件置く。`[]` を期待すると何も検証しない実装でも通る
  const errors = collectSingleArtboardErrors({ rotation: 30, notAProp: true });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "screen",
      prop: "notAProp",
    }),
  ]);
});

test("artboard の props に書いたサイズのモードと長さは読み捨てられ、未知の prop のエラーにならない", () => {
  // 対照に未知の prop を 1 件置く。`[]` を期待すると何も検証しない実装でも通る
  const errors = collectSingleArtboardErrors({
    widthMode: "hug",
    width: 100,
    heightMode: "fill",
    height: 50,
    notAProp: true,
  });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "screen",
      prop: "notAProp",
    }),
  ]);
});

test("artboard の props に書いた最小 / 最大は読み捨てられ、未知の prop のエラーにならない", () => {
  // 対照に未知の prop を 1 件置く。`[]` を期待すると何も検証しない実装でも通る
  const errors = collectSingleArtboardErrors({
    minWidth: 100,
    maxWidth: 200,
    minHeight: 10,
    maxHeight: 20,
    notAProp: true,
  });

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "screen",
      prop: "notAProp",
    }),
  ]);
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
