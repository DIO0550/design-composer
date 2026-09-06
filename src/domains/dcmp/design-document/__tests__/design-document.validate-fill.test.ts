import { expect, test } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import { DesignDocument } from "../index";

/**
 * artboard 直下に Box を 2 つ持つドキュメント。
 *
 * 対照を必ず 1 つ置くのは、`fill` を集める側と集めすぎる側のどちらを壊しても
 * 落ちるようにするため（`rules/testing.md`「assert は落ちうるか」）。
 *
 * @param artboardProps artboard に設定する props。親の配置モードをここで変える
 * @param childProps 1 つ目の Box に設定する props
 * @returns その 2 つの Box を持つドキュメント
 */
function documentWithChildren(
  artboardProps: Props,
  childProps: Props,
): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: artboardProps,
        children: [
          { name: "target", type: "Box", props: childProps },
          { name: "control", type: "Box", props: { widthMode: "hug" } },
        ],
      },
    ],
  });
}

test("自由配置の親の子に widthMode: fill を書くとエラーになる", () => {
  const document = documentWithChildren(
    { layout: "free" },
    { widthMode: "fill" },
  );

  expect(DesignDocument.collectErrors(document)).toEqual([
    {
      kind: "fill-in-free-parent",
      nodeName: "target",
      prop: "widthMode",
      message: expect.stringContaining("widthMode"),
    },
  ]);
});

test("自由配置の親の子に heightMode: fill を書くとエラーになる", () => {
  const document = documentWithChildren(
    { layout: "free" },
    { heightMode: "fill" },
  );

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "fill-in-free-parent",
      nodeName: "target",
      prop: "heightMode",
    }),
  ]);
});

test("子を並べる親の子の fill はエラーにならない", () => {
  const document = documentWithChildren(
    { layout: "row" },
    { widthMode: "fill" },
  );

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("自由配置の親でも fill 以外のサイズ指定はエラーにならない", () => {
  const document = documentWithChildren(
    { layout: "free" },
    { widthMode: "fixed", width: 120 },
  );

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("自由配置の Box の孫にあたるノードの fill もエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "free-box",
            type: "Box",
            props: { layout: "free" },
            children: [
              { name: "target", type: "Box", props: { widthMode: "fill" } },
            ],
          },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "fill-in-free-parent",
      nodeName: "target",
    }),
  ]);
});

test("部品のルート自身の fill は検査の対象外になる", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", props: { widthMode: "fill" } },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("自由配置の部品ルートの子に fill を書くとエラーになる", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        props: { layout: "free" },
        children: [
          { name: "target", type: "Box", props: { widthMode: "fill" } },
        ],
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "fill-in-free-parent",
      nodeName: "target",
    }),
  ]);
});
