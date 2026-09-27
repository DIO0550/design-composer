import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("部品と artboard に名前の欠落と識別子違反が混ざっていると、部品から artboard の順に行きがけ順で報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      Card: {
        type: "Box",
        children: [
          { name: "", type: "Box", children: [{ name: "", type: "Text" }] },
          { name: "Title", type: "Text" },
        ],
      },
    },
    artboards: [
      { name: "screen", width: 375, height: 812, children: [] },
      {
        name: "",
        width: 375,
        height: 812,
        children: [
          {
            name: "Label",
            type: "Box",
            children: [{ name: "Icon", type: "Text" }],
          },
        ],
      },
    ],
  });

  // 空の名前どうしの duplicate-name は、名前 1 つで決まる不正の並びとは別の仕様なので外す
  const singleNameKinds: readonly string[] = [
    "missing-name",
    "invalid-identifier",
  ];
  const errors = DesignDocument.collectErrors(document).filter((error) =>
    singleNameKinds.includes(error.kind),
  );

  expect(
    errors.map(({ kind, nodeName, message }) => ({ kind, nodeName, message })),
  ).toEqual([
    {
      kind: "invalid-identifier",
      nodeName: "Card",
      message: 'name "Card" is not a valid identifier',
    },
    {
      kind: "missing-name",
      nodeName: "Card",
      message: 'child 0 of "Card" has no name',
    },
    {
      kind: "missing-name",
      nodeName: "Card",
      message: 'child 0 of "Card" has no name',
    },
    {
      kind: "invalid-identifier",
      nodeName: "Title",
      message: 'name "Title" is not a valid identifier',
    },
    {
      kind: "missing-name",
      nodeName: "artboards",
      message: 'artboard 1 of "artboards" has no name',
    },
    {
      kind: "invalid-identifier",
      nodeName: "Label",
      message: 'name "Label" is not a valid identifier',
    },
    {
      kind: "invalid-identifier",
      nodeName: "Icon",
      message: 'name "Icon" is not a valid identifier',
    },
  ]);
});
