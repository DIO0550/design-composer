import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

const Gray900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を、参照のしかたが違う 6 通りから指すドキュメント。
 *
 * `TokenReferrer` の 4 つの target をすべて含めるためで、欠けるとその経路を丸ごと消しても
 * 一致テストが通ってしまう。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { "gray-900": "#111827", "gray-500": "#6b7280" },
      typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
    },
    components: {
      panel: {
        type: "Box",
        props: { background: "gray-900" },
        publicProps: { tone: { node: "panel-body", prop: "background" } },
        children: [
          { name: "panel-body", type: "Box", children: [] },
          { name: "panel-caption", type: "Text" },
        ],
      },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        props: { background: "gray-900" },
        children: [
          { name: "home-title", type: "Text", props: { color: "gray-900" } },
          { name: "home-caption", type: "Text" },
          { name: "home-note", type: "Text", props: { color: "gray-500" } },
          { name: "home-panel", ref: "panel", overrides: { tone: "gray-900" } },
        ],
      },
    ],
  });
}

/** 参照元・dangling のどちらからも取り出せる、どのノードのどの prop か。 */
type ReferringLocation = Readonly<{ name: string; prop: string | undefined }>;

/**
 * 位置だけを取り出して並べ替え、出どころによる順序の違いと位置以外のフィールドを落とす。
 *
 * 参照元はキャンバスが先・部品定義が後、検証は部品定義が先・artboard が後、と並びの規則が
 * 違う。
 *
 * @param locations 並べ替える位置の並び（位置以外のフィールドを持っていてもよい）
 * @returns 名前 → prop 名の順で並べ替えた、位置だけの並び
 */
function sortedLocations(
  locations: readonly ReferringLocation[],
): readonly ReferringLocation[] {
  const onlyLocations = locations.map(({ name, prop }) => ({ name, prop }));
  return onlyLocations.sort((a, b) =>
    a.name === b.name
      ? (a.prop ?? "").localeCompare(b.prop ?? "")
      : a.name.localeCompare(b.name),
  );
}

test("参照元の集合は、そのトークンを消したときに dangling になる箇所の集合と一致する", () => {
  /*
   * 各層のテストは参照元と検証のどちらか片方しか見ない。同じ土台で両辺を突き合わせるのは
   * ここだけなので、2 つの走査が別々に正しく見えるまま離れた場合はここが受け止める。
   */
  const document = setupDocument();

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);
  const removed = Result.unwrap(DesignDocument.removeToken(document, Gray900));
  const danglingLocations = DesignDocument.collectErrors(removed)
    .filter((error) => error.kind === "dangling-token")
    .map((error) => ({ name: error.nodeName, prop: error.prop }));

  expect(sortedLocations(referrers)).toEqual(
    sortedLocations(danglingLocations),
  );
});

test("一致を見る土台は、参照のしかたが違う 6 通りをすべて含んでいる", () => {
  /*
   * 上のテストは両辺が同時に壊れると通ってしまう（どちらも空でも一致する）。
   * 土台が実際に 6 通りを含んでいることを別に固定して、空同士の一致で通らないようにする。
   */
  const referrers = DesignDocument.collectTokenReferrers(
    setupDocument(),
    Gray900,
  );

  expect(sortedLocations(referrers)).toEqual([
    { name: "home", prop: "background" },
    { name: "home-caption", prop: "color" },
    { name: "home-panel", prop: "tone" },
    { name: "home-title", prop: "color" },
    { name: "panel", prop: "background" },
    { name: "panel-caption", prop: "color" },
  ]);
});
