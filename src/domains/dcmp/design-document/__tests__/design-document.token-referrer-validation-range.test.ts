import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { Result } from "@/utils/Result";
import { DesignDocument, TokenReferrer } from "../index";

const Gray900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を、参照のしかたが違う 6 通りから指すドキュメント。
 *
 * artboard 自身の props / 明示設定した prop / 未設定でデフォルトが効く prop /
 * 部品定義のルート自身の props / 部品定義の中のデフォルト / インスタンスの上書き、を
 * 1 つずつ持たせる。`TokenReferrer` の 4 つの target をすべて含めるためで、欠けると
 * その経路を丸ごと消しても一致テストが通ってしまう。
 *
 * `home-note` だけ `gray-500` を指しているのは、集めすぎ方向でも落ちるようにするため。
 * 一致だけを見ると、両辺が同じように増えても通る。
 *
 * `typography` の既定（`body`）が指す先も揃えてあるのは、揃えないと Text ごとに
 * `typography` の dangling が出て、比べたい `gray-900` の分と混ざるため。
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

/**
 * 並べ替えて、出どころによる順序の違いを落とす。
 *
 * 参照元はキャンバスが先・部品定義が後、検証は部品定義が先・artboard が後、と並びの規則が
 * 違う。ここで見たいのは集合が一致することなので、順序は落として比べる
 * （順序そのものは `design-document.token-referrer.test.ts` が固定している）。
 */
function sortedTexts(texts: readonly string[]): readonly string[] {
  return [...texts].sort();
}

test("参照元の集合は、そのトークンを消したときに dangling になる箇所の集合と一致する", () => {
  /*
   * 各層のテストは参照元と検証のどちらか片方しか見ない。同じ土台で両辺を突き合わせるのは
   * ここだけなので、2 つの走査が別々に正しく見えるまま離れた場合はここが受け止める。
   */
  const document = setupDocument();

  const referrerTexts = DesignDocument.collectTokenReferrers(
    document,
    Gray900,
  ).map(TokenReferrer.toText);
  const removed = Result.unwrap(DesignDocument.removeToken(document, Gray900));
  const danglingTexts = DesignDocument.collectErrors(removed)
    .filter((error) => error.kind === "dangling-token")
    .map((error) => `${error.nodeName}.${String(error.prop)}`);

  expect(sortedTexts(referrerTexts)).toEqual(sortedTexts(danglingTexts));
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

  expect(sortedTexts(referrers.map(TokenReferrer.toText))).toEqual([
    "home-caption.color",
    "home-panel.tone",
    "home-title.color",
    "home.background",
    "panel-caption.color",
    "panel.background",
  ]);
});
