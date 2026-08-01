import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("存在するノード名を指定して置き換えると新しいノードで置き換わった DesignDocument が Ok で返る", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });
  const replacement = { name: "box-1", type: "Text" };

  const result = DesignDocument.replaceNode(document, "box-1", replacement);

  expect(result).toEqual({
    ok: true,
    value: expect.objectContaining({
      artboards: [
        {
          name: "screen",
          width: 375,
          height: 812,
          children: [replacement],
        },
      ],
    }),
  });
});

test("存在しないノード名を指定して置き換えようとすると Err が返る", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.replaceNode(document, "missing", {
    name: "missing",
    type: "Box",
  });

  expect(result.ok).toBe(false);
});

test("replaceNode は元のドキュメントを変更しない", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  DesignDocument.replaceNode(document, "box-1", {
    name: "box-1",
    type: "Text",
  });

  expect(document.artboards[0].children).toEqual([box]);
});
