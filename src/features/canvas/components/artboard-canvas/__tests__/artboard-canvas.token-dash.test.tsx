import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  canvasContent,
  tokenReferrerNames,
} from "@/features/canvas/__tests__/canvas-elements";
import { Option } from "@/utils/Option";
import { renderCanvas } from "./setup";

const Gray900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を `title` だけが指し、`caption` は別の色を指すドキュメント。
 * 参照しているノードだけが破線になる、を対照付きで確かめられる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { "gray-900": "#111827", "gray-500": "#6b7280" },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          { name: "caption", type: "Text", props: { color: "gray-500" } },
        ],
      },
    ],
  });
}

/** そのドキュメントで `gray-900` を選んでいる対。 */
function selectingGray900(document: DesignDocument): TokenSelection {
  return TokenSelection.create(document, Option.some(Gray900));
}

test("トークンを選ぶと、そのトークンを参照しているノードだけが破線になる", () => {
  const document = setupDocument();

  renderCanvas({
    selection: DocumentSelection.fromNames(document, []),
    tokenSelection: selectingGray900(document),
  });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title"]);
});

test("トークンを選んでいなければ、参照があるドキュメントでも破線は出ない", () => {
  renderCanvas({ selection: DocumentSelection.fromNames(setupDocument(), []) });

  expect(tokenReferrerNames(canvasContent())).toEqual([]);
});

test("2つのノードが同じトークンを指していると、その2つが破線になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          { name: "caption", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  renderCanvas({
    selection: DocumentSelection.fromNames(document, []),
    tokenSelection: selectingGray900(document),
  });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title", "caption"]);
});

test("部品定義の中だけで参照しているノードは破線にならない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      badge: {
        type: "Box",
        children: [
          {
            name: "badge-body",
            type: "Box",
            props: { background: "gray-900" },
          },
        ],
      },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        // キャンバス上からも 1 件指させ、集めすぎと集め漏れの両方で落ちるようにする
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  renderCanvas({
    selection: DocumentSelection.fromNames(document, []),
    tokenSelection: selectingGray900(document),
  });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title"]);
});

/**
 * 名前を指す規則のうち、その宣言を持つものが何番目に差し込まれたか。
 *
 * 同じ選択子・同じ詳細度の規則は後に書いたほうが勝つので、どちらが見えるかは
 * 差し込む順で決まる。happy-dom は CSS を解決しないため、順そのものを見る。
 *
 * @param name 規則が指している artboard / ノードの名前
 * @param declaration 探したい宣言の一部
 * @returns その規則の位置。見つからなければ -1
 */
function ruleIndexOf(name: string, declaration: string): number {
  const styles = [...canvasContent().querySelectorAll("style")];
  return styles.findIndex((style) => {
    const text = style.textContent ?? "";
    return text.includes(`"${name}"`) && text.includes(declaration);
  });
}

test("選択中のノードがそのトークンを参照していても、選択の枠が破線に負けない", () => {
  const document = setupDocument();

  renderCanvas({
    selection: DocumentSelection.fromNames(document, ["title"]),
    tokenSelection: selectingGray900(document),
  });

  expect(ruleIndexOf("title", "dashed #0d99ff")).toBeGreaterThanOrEqual(0);
  expect(ruleIndexOf("title", "solid #3b82f6")).toBeGreaterThan(
    ruleIndexOf("title", "dashed #0d99ff"),
  );
});
